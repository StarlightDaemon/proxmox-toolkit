const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../src/drift-firewall.js');

function fixture(overrides = {}, options = {}) {
    const guests = [{ type: 'qemu', node: 'one', vmid: 101 }, { type: 'lxc', node: 'two', vmid: 102 }];
    const map = {
        '/nodes/one/qemu/101/config': { name: 'guest-one', memory: 2048, cores: 2, startup: 'order=1,up=30', net0: 'virtio=AA:BB:CC:DD:EE:FF,bridge=vmbr0,firewall=1', cipassword: 'SECRET', args: 'SECRET', description: 'SECRET' },
        '/nodes/two/lxc/102/config': { hostname: 'guest-two', memory: 512, rootfs: 'local:root', net0: 'name=eth0,bridge=vmbr0,firewall=0' },
        '/nodes/one/network': [{ iface: 'vmbr0', mtu: 1500, bridge_ports: 'eno1', comments: 'SECRET' }],
        '/nodes/two/network': [{ iface: 'vmbr0', mtu: 1500 }],
        '/storage': [{ storage: 'shared', type: 'nfs', server: '192.0.2.1', password: 'SECRET' }, { storage: 'only-two', type: 'dir', nodes: 'two' }],
        '/cluster/firewall/options': { enable: 1, policy_in: 'DROP', comments: 'SECRET' },
        '/cluster/firewall/rules': [{ pos: 0, type: 'in', action: 'ACCEPT', source: 'dc/admin', enable: 1, comment: 'SECRET' }],
        '/cluster/firewall/aliases': [{ name: 'admin', cidr: '192.0.2.1', comment: 'SECRET' }],
        '/cluster/firewall/ipset': [{ name: 'trusted', comment: 'SECRET' }],
        '/cluster/firewall/ipset/trusted': [{ cidr: '192.0.2.0/24', nomatch: 0, comment: 'SECRET' }],
        '/cluster/firewall/groups': [{ group: 'web' }],
        '/cluster/firewall/groups/web': [{ pos: 1, type: 'in', action: 'DROP', enable: 0 }, { pos: 0, type: 'in', action: 'ACCEPT', proto: 'tcp', dport: '443', enable: 1 }],
        '/nodes/one/firewall/options': { enable: 1, nftables: 1 }, '/nodes/two/firewall/options': {},
        '/nodes/one/firewall/rules': [], '/nodes/two/firewall/rules': [],
        '/nodes/one/qemu/101/firewall/options': { enable: 1, policy_in: 'DROP' },
        '/nodes/two/lxc/102/firewall/options': { enable: 0 },
        '/nodes/one/qemu/101/firewall/rules': [{ pos: 0, type: 'group', action: 'web', enable: 1 }],
        '/nodes/two/lxc/102/firewall/rules': [{ pos: 0, type: 'group', action: 'web', enable: 0 }],
        '/nodes/one/qemu/101/firewall/aliases': [], '/nodes/two/lxc/102/firewall/aliases': [],
        '/nodes/one/qemu/101/firewall/ipset': [], '/nodes/two/lxc/102/firewall/ipset': [],
        ...overrides,
    };
    const calls = [];
    const report = { schema: 'proxmox-toolkit-report/1', feature: 'DRIFT', collectedAt: '2026-11-02T12:00:00.000Z', rows: [], issues: [], notes: [] };
    const get = async (path, query, shape) => {
        calls.push({ path, query, shape });
        if (!Object.hasOwn(map, path) || map[path] === null) { report.issues.push({ path, reason: 'HTTP 403' }); return null; }
        return structuredClone(map[path]);
    };
    const guestPath = g => `/nodes/${encodeURIComponent(g.node)}/${g.type}/${g.vmid}`;
    const ctx = { report, get, guests, nodes: ['one', 'two'], options: { origin: 'https://pve.example:8006', ...options }, part: encodeURIComponent,
        guestPath, config: g => get(`${guestPath(g)}/config`), each: async (items, fn) => { for (const item of items) await fn(item); },
        fields: value => Object.fromEntries(String(value).split(',').map((entry, i) => { const at = entry.indexOf('='); return at < 0 ? [i === 0 ? 'volume' : entry, i === 0 ? entry : true] : [entry.slice(0, at), entry.slice(at + 1)]; })) };
    return { ctx, calls, report };
}
async function baseline() { const f = fixture(); await M.drift(f.ctx); return f.report.baseline; }

test('drift captures sorted, allowlisted guest/network/storage baseline without secrets', async () => {
    const f = fixture(); await M.drift(f.ctx);
    assert.equal(f.report.baseline.schema, 'proxmox-toolkit-baseline/1');
    assert.equal(f.report.baseline.guests.length, 2);
    assert.doesNotMatch(JSON.stringify(f.report.baseline), /SECRET|cipassword|comments/);
    assert.deepEqual(M.validateBaseline(f.report), f.report.baseline);
    assert.equal(f.calls.filter(c => c.path === '/storage').length, 1);
});
test('drift detects settings, network and storage changes; ignores expected guest names and MACs', async () => {
    const old = await baseline();
    const f = fixture({
        '/nodes/one/qemu/101/config': { name: 'renamed', memory: 4096, cores: 2, startup: 'order=1,up=30', net0: 'virtio=11:22:33:44:55:66,bridge=vmbr0,firewall=1' },
        '/nodes/one/network': [{ iface: 'vmbr0', mtu: 9000, bridge_ports: 'eno1' }],
        '/storage': [{ storage: 'shared', type: 'nfs', server: '192.0.2.2' }, { storage: 'only-two', type: 'dir', nodes: 'two' }],
    }, { baseline: old });
    await M.drift(f.ctx);
    assert.deepEqual(f.report.rows.map(r => r.setting).sort(), ['memory', 'mtu', 'server']);
    assert.equal(f.report.rows.find(r => r.setting === 'memory').before, 2048);
    assert.equal(f.report.rows.find(r => r.setting === 'memory').after, 4096);
    assert.equal(f.report.comparison.previousCollectedAt, old.collectedAt);
});
test('drift can include identity differences and distinguishes settings removed from unknown configs', async () => {
    const f = fixture({ '/nodes/one/qemu/101/config': { name: 'new', memory: 2048 }, '/nodes/two/lxc/102/config': null }, { baseline: await baseline(), ignoreIdentity: false });
    await M.drift(f.ctx);
    assert.ok(f.report.rows.some(r => r.setting === 'name' && r.state === 'changed'));
    assert.ok(f.report.rows.some(r => r.setting === 'startup' && r.state === 'setting removed'));
    assert.ok(f.report.rows.some(r => r.resource === 'lxc/102' && r.state === 'comparison unavailable'));
    assert.equal(f.report.rows.filter(r => r.resource === 'lxc/102').length, 1);
});
test('guest migration matches type/VMID across nodes and explicitly leaves continuity uncertain', async () => {
    const old = await baseline(), f = fixture({ '/nodes/two/qemu/101/config': old.guests.find(g => g.vmid === 101).configuration }, { baseline: old });
    f.ctx.guests[0].node = 'two';
    await M.drift(f.ctx);
    assert.equal(f.report.rows.length, 1);
    assert.equal(f.report.rows[0].setting, 'node');
    assert.match(f.report.rows[0].state, /identity continuity not established/);
});
test('absent guests and storage never imply deletion and new guests are only newly visible', async () => {
    const f = fixture({ '/storage': [], '/nodes/one/qemu/103/config': {} }, { baseline: await baseline() });
    f.ctx.guests = [{ node: 'one', type: 'qemu', vmid: 103 }];
    await M.drift(f.ctx);
    assert.ok(f.report.rows.some(r => r.resource === 'qemu/101' && /deletion not established/.test(r.state)));
    assert.ok(f.report.rows.some(r => r.resource === 'qemu/103' && r.state === 'newly visible'));
    assert.ok(f.report.rows.some(r => r.resource === 'storage/shared' && /deletion not established/.test(r.state)));
});
test('unavailable list comparisons remain unknown and an identical baseline has no changes', async () => {
    const old = await baseline(), f = fixture({}, { baseline: old });
    await M.drift(f.ctx); assert.equal(f.report.rows.length, 0);
    const denied = fixture({ '/storage': null, '/nodes/one/network': null }, { baseline: old });
    await M.drift(denied.ctx);
    assert.equal(denied.report.rows.filter(r => r.state === 'comparison unavailable').length, 2);
});
test('node scope filters storage applicability and records exact comparison scope', async () => {
    const f = fixture({}, { node: 'one', vmids: '101' }); f.ctx.nodes = ['one']; f.ctx.guests = [f.ctx.guests[0]];
    await M.drift(f.ctx);
    assert.deepEqual(f.report.baseline.scope, { node: 'one', vmids: ['101'] });
    assert.deepEqual(f.report.baseline.storage.map(s => s.storage), ['shared']);
    assert.ok(!f.calls.some(c => c.path.includes('/nodes/two/')));
});
test('baseline validator rejects foreign origins, credentials, mismatched scopes and unknown schema before collection', async () => {
    const b = await baseline();
    for (const bad of [{ ...b, schema: 'other/1' }, { ...b, origin: 'https://foreign:8006' }, { ...b, origin: 'https://user:password@pve.example:8006' }, { ...b, scope: { node: 'one', vmids: [] } }]) {
        const f = fixture({}, { baseline: bad });
        await assert.rejects(M.drift(f.ctx), /valid Toolkit configuration baseline/);
        assert.equal(f.calls.length, 0);
    }
});
test('baseline identity includes proxy prefix; missing legacy prefix means root only', async () => {
    const f = fixture({}, { apiPrefix: '/pve/' }); await M.drift(f.ctx);
    assert.equal(f.report.baseline.apiPrefix, '/pve/');
    const other = fixture({}, { baseline: f.report.baseline, apiPrefix: '/other/' });
    await assert.rejects(M.drift(other.ctx), /valid Toolkit/); assert.equal(other.calls.length, 0);
    const legacy = await baseline(); delete legacy.apiPrefix;
    assert.equal(M.validateBaseline(legacy, { apiPrefix: '/' }).apiPrefix, '/');
    assert.throws(() => M.validateBaseline(legacy, { apiPrefix: '/pve/' }), /valid Toolkit/);
    assert.throws(() => M.validateBaseline({ ...legacy, apiPrefix: '/../' }), /valid Toolkit/);
});
test('baseline validator rejects duplicates, malformed records, excessive depth, cycles, oversized input and prototype keys', async () => {
    const b = await baseline();
    assert.throws(() => M.validateBaseline({ ...b, guests: [b.guests[0], b.guests[0]] }), /valid Toolkit/);
    assert.throws(() => M.validateBaseline({ ...b, guests: [{ ...b.guests[0], vmid: '101' }, { ...b.guests[0], vmid: '0101' }] }), /valid Toolkit/);
    assert.throws(() => M.validateBaseline({ ...b, nodes: [{ node: 'one', network: [null] }] }), /valid Toolkit/);
    assert.throws(() => M.validateBaseline({ ...b, collectedAt: 'invalid' }), /valid Toolkit/);
    const deep = {}; let next = deep; for (let i = 0; i < 15; i++) next = next.more = {};
    assert.throws(() => M.validateBaseline({ ...b, extra: deep }), /valid Toolkit/);
    const cyclic = { ...b }; cyclic.self = cyclic;
    assert.throws(() => M.validateBaseline(cyclic), /valid Toolkit/);
    assert.throws(() => M.validateBaseline({ ...b, extra: 'x'.repeat(4200000) }), /valid Toolkit/);
    assert.throws(() => M.validateBaseline({ ...b, extra: JSON.parse('{"__proto__": {"polluted":true}}') }), /valid Toolkit/);
    assert.equal({}.polluted, undefined);
});
test('oversized collected baselines cannot be offered as reusable imports', async () => {
    const f = fixture({ '/nodes/one/qemu/101/config': { name: 'x'.repeat(4200000) } });
    await M.drift(f.ctx);
    assert.equal(f.report.baseline, null);
    assert.ok(f.report.issues.some(i => i.path === 'baseline'));
    assert.match(f.report.notes.join(' '), /Narrow the scope/);
});
test('baseline import sanitizes extra fields and secret-bearing configurations', async () => {
    const b = await baseline(); b.guests[0].configuration.cipassword = 'SECRET'; b.storage[0].password = 'SECRET';
    b.nodes[0].network[0].comments = 'SECRET'; b.extra = 'SECRET';
    assert.doesNotMatch(JSON.stringify(M.validateBaseline(b)), /SECRET/);
});
test('firewall captures rule order, requested backend, explicit flags and NIC differences', async () => {
    const f = fixture(); await M.firewall(f.ctx);
    assert.equal(f.report.firewall.nodes[0].backend, 'nftables requested');
    assert.equal(f.report.firewall.nodes[1].backend, 'unspecified / unknown');
    assert.deepEqual(f.report.firewall.groups[0].rules.map(r => r.pos), [0, 1]);
    assert.equal(f.report.firewall.guests.find(g => g.vmid === 101).nics[0].firewall, true);
    assert.equal(f.report.firewall.guests.find(g => g.vmid === 102).nics[0].firewall, false);
    assert.ok(f.report.rows.some(r => r.scope === 'node/two' && r.item === 'Firewall flag' && r.value === 'unspecified / unknown'));
    assert.doesNotMatch(JSON.stringify(f.report), /SECRET/);
    assert.match(f.report.notes.join(' '), /actual packet outcomes/);
});
test('firewall shared group is read once and records disabled references too', async () => {
    const f = fixture(); await M.firewall(f.ctx);
    assert.equal(f.calls.filter(c => c.path === '/cluster/firewall/groups/web').length, 1);
    assert.deepEqual(f.report.firewall.groups[0].usedBy, ['lxc/102', 'qemu/101']);
    assert.deepEqual(f.report.firewall.cluster.ipsets, [{ name: 'trusted', members: [{ cidr: '192.0.2.0/24', nomatch: 0 }] }]);
});
test('firewall guest aliases and IP sets are opt-in; default guest cost is three reads', async () => {
    const perGuest = calls => ['qemu/101', 'lxc/102'].map(g => calls.filter(c => c.path.includes(`/${g}/`)).map(c => c.path.replace(/^.*\/(?:qemu|lxc)\/\d+/, '')).sort());
    const f = fixture(); await M.firewall(f.ctx);
    assert.deepEqual(perGuest(f.calls), [['/config', '/firewall/options', '/firewall/rules'], ['/config', '/firewall/options', '/firewall/rules']]);
    const g = f.report.firewall.guests.find(g => g.vmid === 101);
    assert.equal(f.report.firewall.guestSetsRequested, false);
    assert.equal(g.sets, 'not requested');
    assert.equal(g.aliases, null);
    assert.ok(!Object.hasOwn(f.report.firewall.nodes[0], 'sets'), 'nodes have no set endpoints to request');
    assert.deepEqual(f.report.firewall.cluster.ipsets, [{ name: 'trusted', members: [{ cidr: '192.0.2.0/24', nomatch: 0 }] }], 'cluster sets stay collected');
    assert.match(f.report.notes.join(' '), /not requested/);
    const sets = { '/nodes/one/qemu/101/firewall/ipset': [{ name: 'own' }], '/nodes/one/qemu/101/firewall/ipset/own': [{ cidr: '198.51.100.7' }],
        '/nodes/one/qemu/101/firewall/aliases': [{ name: 'gw', cidr: '198.51.100.1' }] };
    const o = fixture(sets, { includeGuestSets: true }); await M.firewall(o.ctx);
    assert.deepEqual(perGuest(o.calls)[0], ['/config', '/firewall/aliases', '/firewall/ipset', '/firewall/ipset/own', '/firewall/options', '/firewall/rules']);
    const og = o.report.firewall.guests.find(g => g.vmid === 101);
    assert.equal(o.report.firewall.guestSetsRequested, true);
    assert.ok(!Object.hasOwn(og, 'sets'));
    assert.deepEqual(og.aliases, [{ name: 'gw', cidr: '198.51.100.1' }]);
    assert.deepEqual(og.ipsets, [{ name: 'own', members: [{ cidr: '198.51.100.7' }] }]);
    assert.equal(o.calls.length - f.calls.length, 5, 'opting in adds aliases, ipset list and one member read for 101, plus two list reads for 102');
});
test('firewall graph cycles terminate without duplicate reads or recursive expansion', async () => {
    const f = fixture({ '/cluster/firewall/groups/web': [{ type: 'group', action: 'other' }], '/cluster/firewall/groups/other': [{ type: 'group', action: 'web' }] });
    await M.firewall(f.ctx);
    assert.equal(f.report.firewall.groups.length, 2);
    assert.equal(f.report.firewall.groups.every(g => g.cycle), true);
    assert.equal(f.calls.filter(c => c.path === '/cluster/firewall/groups/web').length, 1);
    assert.equal(f.calls.filter(c => c.path === '/cluster/firewall/groups/other').length, 1);
});
test('firewall denied data stays unavailable rather than an empty successful ruleset', async () => {
    const f = fixture({ '/cluster/firewall/options': null, '/cluster/firewall/groups': null, '/cluster/firewall/groups/web': null, '/nodes/one/qemu/101/firewall/rules': null, '/nodes/one/qemu/101/config': null });
    await M.firewall(f.ctx);
    assert.equal(f.report.firewall.cluster.options, null);
    assert.equal(f.report.firewall.groupListAvailable, false);
    assert.equal(f.report.firewall.groups[0].rules, null);
    assert.equal(f.report.firewall.guests.find(g => g.vmid === 101).rules, null);
    assert.equal(f.report.firewall.guests.find(g => g.vmid === 101).nics, null);
    assert.ok(f.report.rows.some(r => r.kind === 'security group' && r.value === 'unavailable'));
});
test('firewall malformed top-level lists are issues, and invalid group names cannot become API paths', async () => {
    const f = fixture({ '/cluster/firewall/rules': {}, '/nodes/one/qemu/101/firewall/rules': [{ type: 'group', action: '../../bad' }], '/nodes/two/lxc/102/firewall/rules': [] });
    await M.firewall(f.ctx);
    assert.equal(f.report.firewall.cluster.rules, null);
    assert.ok(f.report.issues.some(i => i.reason === 'Unexpected list shape'));
    assert.ok(!f.calls.some(c => c.path.includes('bad')));
});
test('malformed network/storage list entries retain unknown evidence rather than clean empty baselines', async () => {
    const f = fixture({ '/nodes/one/network': [null], '/storage': [42] });
    await M.drift(f.ctx);
    assert.equal(f.report.baseline.nodes.find(n => n.node === 'one').network, null);
    assert.equal(f.report.baseline.storage, null);
    assert.equal(f.report.issues.filter(i => /Malformed list entry/.test(i.reason)).length, 2);
    const missingKeys = fixture({ '/nodes/one/network': [{ mtu: 1500 }], '/storage': [{ type: 'nfs' }] });
    await M.drift(missingKeys.ctx);
    assert.equal(missingKeys.report.baseline.nodes.find(n => n.node === 'one').network, null);
    assert.equal(missingKeys.report.baseline.storage, null);
    assert.equal(missingKeys.report.issues.filter(i => /Malformed or duplicate/.test(i.reason)).length, 2);
});
test('firewall malformed object records produce unknown groups/rules/sets instead of clean empty evidence', async () => {
    const f = fixture({ '/cluster/firewall/groups': [{}], '/cluster/firewall/rules': [{}], '/cluster/firewall/ipset': [{}] });
    await M.firewall(f.ctx);
    assert.equal(f.report.firewall.groupListAvailable, false);
    assert.equal(f.report.firewall.cluster.rules, null);
    assert.equal(f.report.firewall.cluster.ipsets, null);
    assert.ok(f.report.issues.length >= 3);
});
test('firewall limits IP-set detail requests and rule rows with visible incomplete evidence', async () => {
    const sets = Array.from({ length: 60 }, (_, i) => ({ name: `set${i}` }));
    const f = fixture({ '/cluster/firewall/ipset': sets, '/cluster/firewall/rules': Array.from({ length: 1001 }, (_, pos) => ({ pos, type: 'in', action: 'DROP' })) });
    await M.firewall(f.ctx);
    assert.equal(f.calls.filter(c => /^\/cluster\/firewall\/ipset\//.test(c.path)).length, 50);
    assert.equal(f.report.firewall.cluster.rules.length, 1000);
    assert.ok(f.report.issues.some(i => /50-entry/.test(i.reason)));
    assert.ok(f.report.issues.some(i => /1000-entry/.test(i.reason)));
});
test('aborting before referenced-group collection terminates even when the shared scheduler skips work', async () => {
    const f = fixture(), controller = new AbortController(); f.ctx.options.signal = controller.signal;
    f.ctx.each = async (items, fn) => {
        for (const item of items) {
            if (controller.signal.aborted) break;
            await fn(item);
            if (typeof item === 'object' && item.vmid === 102) controller.abort();
        }
    };
    await M.firewall(f.ctx);
    assert.equal(controller.signal.aborted, true);
    assert.equal(f.calls.filter(c => c.path === '/cluster/firewall/groups/web').length, 0);
});
