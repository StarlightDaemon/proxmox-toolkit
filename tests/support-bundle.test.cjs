const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../src/catalog-model.js');
const S = require('../src/support-bundle.js');
function fixture(extra = {}) {
    const calls = [];
    const data = {
        '/cluster/resources': [{ type: 'node', node: 'pve-a' }, { type: 'qemu', node: 'pve-a', vmid: 101, name: 'database-prod', status: 'running' }],
        '/nodes/pve-a/apt/versions': [{ Package: 'pve-manager', OldVersion: '9.1.0', Version: '9.2.0', password: 'SECRET' }],
        '/nodes/pve-a/qemu/101/config': { name: 'database-prod', memory: 4096, cores: 2, cipassword: 'SECRET', args: 'SECRET', description: 'SECRET', net0: 'virtio=AA:BB:CC:DD:EE:FF,bridge=vmbr0' },
        '/nodes/pve-a/network': [{ iface: 'vmbr0', address: '192.168.50.1', comments: 'SECRET' }],
        '/storage': [{ storage: 'nfs', type: 'nfs', server: 'storage.internal', password: 'SECRET', options: 'SECRET' }],
        '/nodes/pve-a/tasks/UPID%3Apve-a%3Atask/log': [{ n: 1, t: 'node pve-a 192.168.50.1 token=SEEDED_SECRET user root@pam' }],
        '/nodes/pve-a/tasks/UPID%3Apve-a%3Atask/status': { status: 'stopped', exitstatus: 'ERROR', user: 'SECRET' },
        ...extra,
    };
    return { calls, read: async (path, query) => { calls.push({ path, query }); return Object.hasOwn(data, path) ? { data: data[path] } : { error: 'HTTP 403' }; } };
}
const options = { origin: 'https://pve.example:8006', toolkit: { version: '0.8.0-dev.1', edition: 'toolkit', clipboardRead: true, private: 'SECRET' } };
test('support defaults collect only selected allowlisted evidence and never clipboard or shell data', async () => {
    const f = fixture(), r = await M.run('SUPPORT', f.read, options);
    assert.equal(f.calls.length, 3);
    assert.deepEqual(r.bundle.sections, ['versions', 'configurations', 'diagnostics']);
    assert.doesNotMatch(JSON.stringify(r), /SECRET/);
    assert.equal(r.bundle.evidence.versions[0].data[0].OldVersion, '9.1.0');
});
test('support sections are independent of other feature flags and omit unselected requests', async () => {
    const f = fixture(), r = await M.run('SUPPORT', f.read, { ...options, supportSections: ['storage'] });
    assert.deepEqual(f.calls.map(c => c.path), ['/cluster/resources', '/storage']);
    assert.deepEqual(Object.keys(r.bundle.evidence), ['storage']);
    assert.doesNotMatch(JSON.stringify(r), /SECRET/);
});
test('support missing data remains unavailable and collects issues', async () => {
    const f = fixture({ '/nodes/pve-a/apt/versions': null });
    const r = await M.run('SUPPORT', f.read, options);
    assert.equal(r.bundle.evidence.versions[0].data, null);
    assert.equal(r.rows.find(r => r.section === 'versions').state, 'unavailable');
    assert.ok(r.issues.length);
});
test('task evidence requires an explicit valid owning UPID before any request', async () => {
    const f = fixture();
    await assert.rejects(M.run('SUPPORT', f.read, { supportSections: ['task'] }), /complete UPID/);
    await assert.rejects(M.run('SUPPORT', f.read, { supportSections: ['task'], upid: 'UPID:other:task', node: 'pve-a' }), /selected node/);
    assert.equal(f.calls.length, 0);
});
test('task owner outside visible scope never supplies a request path', async () => {
    const f = fixture(), r = await M.run('SUPPORT', f.read, { supportSections: ['task'], upid: 'UPID:other:task' });
    assert.equal(f.calls.length, 1);
    assert.match(r.issues[0].reason, /not visible/);
});
test('task logs are bounded and redacted only in prepared preview', async () => {
    const f = fixture(), r = await M.run('SUPPORT', f.read, { ...options, supportSections: ['task'], upid: 'UPID:pve-a:task' });
    assert.equal(f.calls.find(c => c.path.endsWith('/log')).query.limit, 5000);
    assert.match(JSON.stringify(r), /SEEDED_SECRET/);
    const p = S.prepare(r);
    assert.doesNotMatch(p.json, /SEEDED_SECRET|pve-a|192\.168\.50\.1|root@pam/);
    assert.match(p.json, /REDACTED/);
});
test('preview redaction is consistent across names, addresses and manual replacements', async () => {
    const r = await M.run('SUPPORT', fixture().read, options);
    const p = S.prepare(r, { symptoms: 'database-prod 10.1.2.3 AA:BB:CC:DD:EE:FF 2001:db8::1 secret-value', steps: 'database-prod 10.1.2.3', replacements: 'secret-value' });
    const parsed = JSON.parse(p.json);
    assert.doesNotMatch(p.json, /database-prod|10\.1\.2\.3|AA:BB:CC:DD:EE:FF|2001:db8::1|secret-value/);
    const a = parsed.symptoms.match(/\[REDACTED-\d+\]/g), b = parsed.reproductionSteps.match(/\[REDACTED-\d+\]/g);
    assert.equal(a[0], b[0]); assert.equal(a[1], b[1]);
    assert.match(JSON.stringify(r), /database-prod/, 'preparing never changes collected evidence');
});
test('manual replacements work with automatic assistance disabled', async () => {
    const r = await M.run('SUPPORT', fixture().read, options);
    const p = S.prepare(r, { redact: false, replacements: 'database-prod' });
    assert.doesNotMatch(p.json, /database-prod/);
    assert.match(p.json, /pve-a/);
});
test('large narratives and replacement lists fail locally', () => {
    for (const extra of [{ symptoms: 'x'.repeat(65537) }, { replacements: Array(101).fill('x').join('\n') }, { replacements: 'x'.repeat(257) }])
        assert.throws(() => S.prepare({}, extra), /Keep the narrative/);
});
test('Markdown uses a fence longer than attacker-controlled backtick runs', async () => {
    const r = await M.run('SUPPORT', fixture().read, options), p = S.prepare(r, { symptoms: '``````\n<script>attack</script>' });
    assert.match(p.markdown, /`{7}json/);
    assert.ok(JSON.parse(p.json).symptoms.includes('<script>'));
});
test('cancelled support collection schedules no additional requests', async () => {
    const f = fixture(), controller = new AbortController();
    const r = await M.run('SUPPORT', async (...args) => { const result = await f.read(...args); controller.abort(); return result; }, { ...options, signal: controller.signal });
    assert.equal(f.calls.length, 1); assert.ok(r);
});
test('unavailable and partial task evidence are not labeled collected', async () => {
    for (const status of [null, { status: 'stopped' }]) {
        const r = await M.run('SUPPORT', fixture({ '/nodes/pve-a/tasks/UPID%3Apve-a%3Atask/status': status, '/nodes/pve-a/tasks/UPID%3Apve-a%3Atask/log': null }).read,
            { ...options, supportSections: ['task'], upid: 'UPID:pve-a:task' });
        assert.equal(r.rows[0].state, status === null ? 'unavailable' : 'partial');
    }
});
test('many backtick runs in a bounded task log cannot overflow preview construction', () => {
    const text = 'x`x'.repeat(200000);
    const p = S.prepare({ bundle: { evidence: { task: [{ log: text }] } } });
    assert.equal(JSON.parse(p.json).bundle.evidence.task[0].log.length, text.length);
});
test('header credentials and short identifiers cannot leak or corrupt generated labels', () => {
    const p = S.prepare({ collectedAt: '2026-11-02', bundle: { nodes: ['2'] } },
        { symptoms: 'host 10.1.2.3 and host 2\nAuthorization: Bearer SECRET_PAYLOAD\nAuthorization: Basic SECRET_BASIC\nCookie: auth=SECRET_COOKIE; session=SECRET_SESSION' });
    assert.doesNotMatch(p.json, /SECRET_PAYLOAD|SECRET_BASIC|SECRET_COOKIE|SECRET_SESSION|REDACTED-\[/);
    assert.equal(JSON.parse(p.json).collectedAt, '2026-11-02');
    assert.equal(JSON.parse(p.json).schema, 'proxmox-toolkit-support/1');
});
test('Proxmox-native credential formats are redacted in narratives and task logs', async () => {
    const leaks = [
        'curl -b "PVEAuthCookie=PVE:root@pam:65F1A2B3::LEAK_TICKET_SIG" https://pve.example:8006',
        'CSRFPreventionToken: 65F1A2B3:LEAK_CSRF',
        'Authorization: PVEAPIToken=root@pam!backup=0b3c1f9e-4d2a-4c8b-9f1e-2a3b4c5d6e7f',
        'PVEAPIToken=root@pam!ci=1b3c1f9e-4d2a-4c8b-9f1e-2a3b4c5d6e7f',
        'token id root@pam!other=2b3c1f9e-4d2a-4c8b-9f1e-2a3b4c5d6e7f',
        'api_key=LEAK_A apikey: LEAK_B client_secret=LEAK_C db.password=LEAK_D',
        '{"ticket":"PVE:root@pam:65F1A2B3::LEAK_JSON","password": "LEAK spaced"}',
        'bare PVE:root@pam:65F1A2B3::LEAK_BARE and ?token=LEAK_QUERY&next=1',
    ];
    const r = await M.run('SUPPORT', fixture({ '/nodes/pve-a/tasks/UPID%3Apve-a%3Atask/log': leaks.map((t, i) => ({ n: i + 1, t })) }).read,
        { ...options, supportSections: ['task'], upid: 'UPID:pve-a:task' });
    const p = S.prepare(r, { symptoms: leaks.join('\n'), steps: leaks.join('\n') });
    assert.doesNotMatch(p.json, /LEAK|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|65F1A2B3|root@pam/i);
    const parsed = JSON.parse(p.json);
    assert.match(parsed.symptoms, /CSRFPreventionToken: \[REDACTED-SECRET\]/, 'the key stays readable');
    assert.match(parsed.symptoms, /"password": "\[REDACTED-SECRET\]"/, 'quoted values keep their quotes');
    assert.match(parsed.symptoms, /&next=1/, 'query values end at the next parameter');
    assert.ok(parsed.redaction.secretValues >= 30);
    assert.equal(p.replacements, parsed.redaction.replacements + parsed.redaction.secretValues);
});
test('clock times are not treated as IPv6 addresses; real IPv6 forms still are', () => {
    const p = S.prepare({}, { symptoms: 'INFO: started 2026-11-08 01:02:03.456 after 00:12:01\nfe80::1 2001:db8:0:0:0:0:0:1 0:0:0:0:0:ffff:10.0.0.1 ::1' });
    const text = JSON.parse(p.json).symptoms;
    assert.match(text, /01:02:03\.456 after 00:12:01/);
    assert.doesNotMatch(text, /fe80|2001:db8|ffff|::1/);
});
test('redaction disabled leaves credentials to manual review and adds no secret placeholders', () => {
    const p = S.prepare({}, { redact: false, symptoms: 'CSRFPreventionToken: abc' });
    assert.equal(JSON.parse(p.json).symptoms, 'CSRFPreventionToken: abc');
    assert.equal(JSON.parse(p.json).redaction.secretValues, 0);
});
test('secret and identifier patterns stay linear on adversarial input', () => {
    const started = Date.now();
    for (const text of ['a-'.repeat(200000), 'a=a!'.repeat(100000), `${'x@'.repeat(50000)}!${'y'.repeat(50000)}=`, `token=${'z'.repeat(400000)}`, ':'.repeat(400000)])
        S.prepare({}, { symptoms: text.slice(0, 65536) }), S.prepare({ bundle: { evidence: { task: [{ log: text }] } } });
    assert.ok(Date.now() - started < 5000, 'redaction completes promptly');
});
