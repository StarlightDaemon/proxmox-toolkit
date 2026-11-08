const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../src/capacity-updates.js');
const MiB = 1048576;
function fixture(overrides = {}, options = {}) {
    const report = { rows: [], issues: [], notes: [] }, calls = [];
    const guests = [
        { type: 'qemu', vmid: 101, node: 'pve', status: 'running', name: 'VM', mem: 100 * MiB, cpu: 0.1 },
        { type: 'lxc', vmid: 102, node: 'other', status: 'stopped', name: 'CT' },
    ];
    const data = {
        '/nodes/pve/status': { memory: { total: 1024 * MiB, used: 512 * MiB, available: 600 * MiB }, cpuinfo: { cpus: 8 }, 'current-kernel': { release: '6.8.12-9-pve' } },
        '/nodes/other/status': { memory: { total: 2048 * MiB, used: 1024 * MiB }, cpuinfo: { cpus: 16 } },
        '/nodes/pve/rrddata': query => query.cf === 'AVERAGE' ? [{ time: 1, cpu: 0.1, memused: 100 }, { time: 2 }, { time: 3, cpu: 0.3, memused: 300 }] : [{ time: 1, cpu: 0.8, memused: 900 }],
        '/nodes/other/rrddata': [],
        '/nodes/pve/storage': [{ storage: 'shared', shared: 1, active: 1, enabled: 1, total: 1000, used: 200, avail: 800 }],
        '/nodes/other/storage': [{ storage: 'shared', shared: 1, active: 1, enabled: 1, total: 1000, used: 250, avail: 750 }],
        '/nodes/pve/storage/shared/rrddata': [{ time: 1, used: 10, total: 1000 }, { time: 2, used: 200, total: 1000 }],
        '/nodes/other/storage/shared/rrddata': [],
        '/nodes/pve/qemu/101/config': { memory: 512, cores: 2, sockets: 2, cipassword: 'SECRET' },
        '/nodes/other/lxc/102/config': { memory: 256, cores: 1 },
        '/nodes/pve/apt/versions': [
            { Package: 'pve-manager', OldVersion: '8.3.1', Version: '8.4.1', CurrentState: 'Installed', ManagerVersion: '8.3.1/hash' },
            { Package: 'proxmox-ve', OldVersion: '8.3', Version: '8.4', CurrentState: 'Installed', RunningKernel: '6.8.12-9-pve' },
            { Package: 'proxmox-kernel-6.8.12-9-pve-signed', OldVersion: '6.8.12-9', Version: '6.8.12-9', CurrentState: 'Installed' },
            { Package: 'proxmox-kernel-6.8.12-10-pve-signed', OldVersion: '6.8.12-10', Version: '6.8.12-10', CurrentState: 'Installed' },
        ],
        '/nodes/other/apt/versions': [ { Package: 'pve-manager', OldVersion: '8.2.1', Version: '8.4.1', CurrentState: 'Installed' } ],
        '/nodes/pve/apt/update': [ { Package: 'pve-manager', OldVersion: '8.3.1', Version: '8.4.1', Description: 'SECRET' } ],
        '/nodes/other/apt/update': [],
        '/nodes/pve/apt/repositories': { files: [{ path: '/SECRET/file', repositories: [{ Enabled: true, Types: ['deb'], Suites: ['bookworm'], Components: ['pve-no-subscription'], URIs: ['https://user:SECRET@repo.example/private/SECRET?token=SECRET'], Options: [{ Key: 'SECRET' }] }] }], errors: [{ error: 'SECRET' }] },
        '/nodes/other/apt/repositories': { files: [], errors: [] },
        ...overrides,
    };
    const get = async (path, query = {}, shape) => {
        calls.push({ path, query, shape });
        const value = typeof data[path] === 'function' ? data[path](query) : data[path];
        if (value === undefined || value === null || value?.error) { report.issues.push({ path, reason: 'Unavailable' }); return null; }
        if (shape === 'object' ? typeof value !== 'object' || Array.isArray(value) : !Array.isArray(value)) { report.issues.push({ path, reason: 'Malformed' }); return null; }
        return value;
    };
    return { report, calls, get, guests, nodes: ['pve', 'other'], options,
        resources: [{ type: 'node', node: 'pve', maxmem: 1024 * MiB, mem: 512 * MiB, maxcpu: 8 }],
        identity: g => ({ node: g.node, vmid: g.vmid, type: g.type, name: g.name, status: g.status }),
        config: g => get(`/nodes/${g.node}/${g.type}/${g.vmid}/config`, {}, 'object'),
        each: async (items, action) => { for (let i = 0; i < items.length; i += 3) await Promise.all(items.slice(i, i + 3).map(action)); },
    };
}
test('capacity separates guest allocation from host observation and preserves actual CPU topology', async () => {
    const c = fixture(); await M.capacity(c);
    const node = c.report.rows.find(r => r.kind === 'node' && r.node === 'pve');
    assert.equal(node.configuredMemoryBytes, 512 * MiB);
    assert.equal(node.configuredVCPUs, 4);
    assert.equal(node.hostLogicalCPUs, 8);
    assert.equal(node.selectedCPUAllocationRatio, 0.5);
    assert.equal(node.allocationBalanceAfterReserveBytes, 1024 * MiB * 0.8 - 512 * MiB);
    assert.equal(c.report.rows.filter(r => r.kind === 'guest').length, 2);
    assert.doesNotMatch(JSON.stringify(c.report), /SECRET/);
});
test('capacity uses AVERAGE and MAX independently, missing intervals never count as zeros', async () => {
    const c = fixture({}, { timeframe: 'month', reservePercent: 10 }); await M.capacity(c);
    const n = c.report.rows[0];
    assert.equal(n.historical.cpu.average, 0.2);
    assert.equal(n.historical.cpu.peak, 0.8);
    assert.equal(n.historical.cpu.averageSamples, 2);
    assert.equal(n.historical.memused.observedChange, 200);
    assert.equal(c.report.rows[1].historical.cpu.average, null);
    assert.ok(c.calls.filter(c => c.path.endsWith('/rrddata')).every(c => c.query.timeframe === 'month'));
    assert.deepEqual(c.calls.filter(c => c.path === '/nodes/pve/rrddata').map(c => c.query.cf), ['AVERAGE', 'MAX']);
});
test('capacity does not double-sum shared storage or infer growth forecasts', async () => {
    const c = fixture(); await M.capacity(c);
    const storage = c.report.rows.filter(r => r.kind === 'storage');
    assert.equal(storage.length, 2);
    assert.deepEqual(storage.map(s => s.usedBytes), [250, 200]);
    assert.equal(storage.find(s => s.node === 'pve').historical.used.observedChange, 190);
    assert.equal(c.report.totalStorageBytes, undefined);
    assert.equal(storage[0].daysUntilFull, undefined);
    assert.match(storage[0].aggregation, /not summed/);
});
test('unknown guest config or invalid topology stay unknown instead of underestimating allocation', async () => {
    const c = fixture({ '/nodes/pve/qemu/101/config': null, '/nodes/other/lxc/102/config': { memory: NaN, cores: -2 } }); await M.capacity(c);
    for (const row of c.report.rows.filter(r => r.kind === 'node')) {
        assert.equal(row.configuredMemoryBytes, null);
        assert.equal(row.configuredVCPUs, null);
        assert.equal(row.allocationBalanceAfterReserveBytes, null);
    }
});
test('QEMU allocation supports documented absent defaults and reports provenance', async () => {
    const c = fixture({ '/nodes/pve/qemu/101/config': {} }); await M.capacity(c);
    const guest = c.report.rows.find(r => r.kind === 'guest' && r.vmid === 101);
    assert.equal(guest.configuredMemoryBytes, 512 * MiB);
    assert.equal(guest.configuredVCPUs, 1);
    assert.match(guest.memoryConfigurationSource, /documented QEMU default/);
    assert.match(guest.cpuConfigurationSource, /default to 1/);
});
test('QEMU memory current property and online CPUs remain distinct from maximum topology', async () => {
    for (const memory of ['4096', 'current=4096']) {
        const c = fixture({ '/nodes/pve/qemu/101/config': { memory, cores: 4, sockets: 2, vcpus: 3 } }); await M.capacity(c);
        const guest = c.report.rows.find(r => r.kind === 'guest' && r.vmid === 101);
        assert.equal(guest.configuredMemoryBytes, 4096 * MiB);
        assert.equal(guest.configuredVCPUs, 3);
        assert.equal(guest.maximumTopologyVCPUs, 8);
        assert.equal(c.report.rows[0].configuredVCPUs, 3);
    }
});
test('unknown memory extensions and invalid or missing container CPU allocations remain unknown', async () => {
    const c = fixture({ '/nodes/pve/qemu/101/config': { memory: 'current=1024,max=4096', cores: 1, sockets: null }, '/nodes/other/lxc/102/config': { memory: 512 } });
    await M.capacity(c);
    assert.equal(c.report.rows[0].configuredMemoryBytes, null);
    assert.equal(c.report.rows[0].configuredVCPUs, null);
    assert.equal(c.report.rows[1].configuredVCPUs, null);
});
test('memory provenance never claims explicit configuration for a missing or invalid value', async () => {
    for (const [config, source] of [[{ cores: 1 }, /memory not configured/], [{ memory: -1, cores: 1 }, /unsupported memory value/], [{ memory: 256, cores: 1 }, /^explicit configuration$/]]) {
        const c = fixture({ '/nodes/other/lxc/102/config': config }); await M.capacity(c);
        const guest = c.report.rows.find(r => r.kind === 'guest' && r.vmid === 102);
        assert.match(guest.memoryConfigurationSource, source);
        if (!source.test('explicit configuration')) assert.equal(guest.configuredMemoryBytes, null);
    }
    const q = fixture({ '/nodes/pve/qemu/101/config': { memory: 'max=4096', cores: 1 } }); await M.capacity(q);
    assert.equal(q.report.rows.find(r => r.kind === 'guest' && r.vmid === 101).memoryConfigurationSource, 'unsupported memory property');
});
test('capacity scope retains guestless nodes and ignores disabled storage histories', async () => {
    const c = fixture({ '/nodes/pve/storage': [{ storage: 'offline', active: 0, enabled: 0 }], '/nodes/other/storage': null });
    c.guests = [];
    await M.capacity(c);
    assert.equal(c.report.rows.filter(r => r.kind === 'node').length, 2);
    assert.equal(c.report.rows[0].selectedVisibleGuests, 0);
    assert.equal(c.report.rows[0].configuredMemoryBytes, 0);
    assert.ok(!c.calls.some(c => /offline\/rrddata$/.test(c.path)));
    assert.ok(c.report.rows.some(r => r.state === 'Storage list unavailable'));
});
test('capacity rejects invalid planning options before collecting', async () => {
    for (const options of [{ timeframe: 'forever' }, { reservePercent: NaN }, { reservePercent: -1 }, { reservePercent: 91 }, { reservePercent: '20' }]) {
        const c = fixture({}, options);
        await assert.rejects(M.capacity(c)); assert.equal(c.calls.length, 0);
    }
});
test('malformed storage records produce explicit incomplete evidence instead of an empty success', async () => {
    const c = fixture({ '/nodes/pve/storage': [null, { type: 'nfs' }] }); await M.capacity(c);
    assert.ok(c.report.issues.some(i => i.path === '/nodes/pve/storage'));
    assert.ok(c.report.rows.some(r => r.state === 'Malformed storage entries; coverage incomplete'));
});
test('nonfinite and negative history values do not create false capacity evidence', async () => {
    const c = fixture({ '/nodes/pve/rrddata': [{ time: 1, cpu: NaN, memused: -1 }, { time: null, cpu: 0.2 }, { time: 2, cpu: Infinity }] });
    await M.capacity(c);
    assert.equal(c.report.rows[0].historical.cpu.average, null);
    assert.equal(c.report.rows[0].historical.memused.peak, null);
});
test('overflowing configuration values stay unknown through allocation calculations', async () => {
    const c = fixture({ '/nodes/pve/qemu/101/config': { memory: Number.MAX_VALUE, cores: Number.MAX_VALUE, sockets: 2 } });
    await M.capacity(c);
    const row = c.report.rows[0];
    assert.equal(row.configuredMemoryBytes, null);
    assert.equal(row.configuredVCPUs, null);
    assert.equal(row.selectedMemoryAllocationRatio, null);
    assert.equal(row.selectedCPUAllocationRatio, null);
});
test('updates compare installed OldVersion rather than common candidate Version', async () => {
    const c = fixture(); await M.updates(c);
    assert.equal(c.report.rows[0].installedManagerVersion, '8.3.1');
    assert.equal(c.report.rows[0].availableUpdateCount, 1);
    assert.deepEqual(c.report.versionDifferences.find(p => p.package === 'pve-manager').nodes.map(n => n.installedVersion), ['8.3.1', '8.2.1']);
    assert.equal(c.report.nodePackages[0].packages.find(p => p.package === 'pve-manager').candidateVersion, '8.4.1');
    assert.equal(c.report.rows[1].availableUpdateCount, 0);
    assert.match(c.report.rows[1].packageIndexFreshness, /Unknown/);
});
test('update repository evidence omits credentials and arbitrary raw messages', async () => {
    const c = fixture(); await M.updates(c);
    assert.doesNotMatch(JSON.stringify(c.report), /SECRET|private\/|token=|user:/);
    assert.deepEqual(c.report.nodePackages[0].repositories.entries[0].origins, ['https://repo.example']);
    assert.equal(c.report.rows[0].repositoryParserErrors, 1);
    assert.equal(c.report.rows[0].repositoryCount, 1);
});
test('kernel review handles fallback installations without asserting a reboot', async () => {
    const c = fixture(); await M.updates(c);
    assert.equal(c.report.rows[0].runningKernel, '6.8.12-9-pve');
    assert.match(c.report.rows[0].kernelReview, /Other installed kernels/);
    assert.match(c.report.rows[1].kernelReview, /Unknown/);
    assert.doesNotMatch(JSON.stringify(c.report.rows), /reboot required/i);
});
test('denied and malformed update collections remain unknown', async () => {
    const c = fixture({ '/nodes/pve/apt/versions': null, '/nodes/pve/apt/update': [{ bad: 1 }], '/nodes/pve/apt/repositories': { files: 'bad' } });
    await M.updates(c);
    assert.equal(c.report.rows[0].availableUpdateCount, null);
    assert.equal(c.report.rows[0].installedManagerVersion, null);
    assert.equal(c.report.rows[0].repositoryCount, null);
    assert.deepEqual(c.report.versionDifferences, []);
    assert.ok(c.report.issues.some(i => i.path === '/nodes/pve/apt/update'));
});
test('uninstalled package candidates cannot masquerade as installed or running kernels', async () => {
    const c = fixture({ '/nodes/pve/status': {}, '/nodes/pve/apt/versions': [
        { Package: 'pve-manager', Version: '9.0', CurrentState: 'NotInstalled' },
        { Package: 'proxmox-kernel-7.0.1-1-pve-signed', Version: '7.0.1-1', CurrentState: 'NotInstalled' },
    ] });
    await M.updates(c);
    assert.equal(c.report.rows[0].installedManagerVersion, null);
    assert.deepEqual(c.report.rows[0].installedKernelReleases, []);
    assert.equal(c.report.rows[0].runningKernel, null);
});
test('updates use only intended bounded GET paths and stable node order', async () => {
    const c = fixture(); await M.updates(c);
    assert.deepEqual(c.report.rows.map(r => r.node), ['pve', 'other']);
    assert.equal(c.calls.length, 8);
    assert.ok(c.calls.every(c => /^\/nodes\/(pve|other)\/(status|apt\/(versions|update|repositories))$/.test(c.path)));
    assert.ok(c.calls.every(c => Object.keys(c.query).length === 0));
});
test('cancelled work waves cannot emit undefined rows or throw when later nodes were skipped', async () => {
    for (const run of [M.capacity, M.updates]) {
        const controller = new AbortController();
        const c = fixture({}, { signal: controller.signal });
        c.each = async (items, action) => {
            if (controller.signal.aborted || !items.length) return;
            await action(items[0]); controller.abort();
        };
        await run(c);
        assert.equal(controller.signal.aborted, true);
        assert.deepEqual(c.report.rows, []);
        assert.equal(c.report.nodePackages, undefined);
    }
});
