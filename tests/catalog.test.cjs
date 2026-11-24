const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../src/catalog-model.js');
const { features, reports } = require('../tools/features.cjs');
const { manifest, buildEdition } = require('../tools/build.cjs');
const { host, consoleView, row, buffer } = require('./helpers.cjs');
const flush = () => new Promise(r => setImmediate(r));
const settings = (ids, extra = {}) => ({ schema: 1, features: Object.fromEntries(features.map(f => [f.id, ids.includes(f.id)])), ...extra });
function fixture(overrides = {}) {
    const resources = [{ type: 'node', node: 'pve', maxmem: 1000, mem: 100 },
        { type: 'node', node: 'other', maxmem: 2000, mem: 500 },
        { type: 'qemu', vmid: 101, name: '=cmd', node: 'pve', status: 'running', mem: 30, cpu: .2 },
        { type: 'lxc', vmid: 102, name: 'container', node: 'other', status: 'running' }];
    const map = {
        '/cluster/resources': resources,
        '/nodes/pve/qemu/101/config': { name: 'one', memory: 2048, cores: 2, scsi0: 'shared:vm-101-disk-0,backup=0', unused0: 'shared:vm-101-disk-1', net0: 'virtio=AA:BB:CC:DD:EE:FF,bridge=vmbr0,tag=10', agent: '1', cipassword: 'SEEDED_SECRET', args: 'SEEDED_SECRET' },
        '/nodes/other/lxc/102/config': { hostname: 'two', memory: 512, cores: 1, rootfs: 'local:subvol-102-disk-0', mp0: '/srv/data,mp=/data', mp1: 'local:subvol-102-disk-1,mp=/files,backup=1' },
        '/cluster/backup': [{ all: 1, enabled: 1 }],
        '/nodes/pve/storage': [{ storage: 'shared', active: 1, shared: 1 }],
        '/nodes/other/storage': [{ storage: 'local', active: 1, shared: 0 }],
        '/nodes/pve/storage/shared/content': [ { content: 'backup', vmid: 101, ctime: Math.floor(Date.now()/1000), volid: 'shared:backup/file' },
            { content: 'images', volid: 'shared:vm-101-disk-0', size: 100 }, { content: 'images', volid: 'shared:vm-101-disk-1', size: 100 },
            { content: 'images', volid: 'shared:vm-999-disk-0', size: 100, parent: 'shared:base-99' } ],
        '/nodes/other/storage/local/content': [],
        '/nodes/pve/tasks': [{ id: '101', upid: 'UPID:pve:a', starttime: 3, status: 'ERROR', type: 'vzdump' }],
        '/nodes/other/tasks': [{ id: '101', upid: 'UPID:other:b', starttime: 2, status: 'OK', type: 'qmigrate' }],
        '/nodes/pve/qemu/101/snapshot': [{ name: 'current' }, { name: 'old', snaptime: 1, parent: 'base' }],
        '/nodes/other/lxc/102/snapshot': [],
        '/nodes/pve/network': [{ iface: 'vmbr0', type: 'bridge', bridge_ports: 'bond0', mtu: 1500 }, { iface: 'bond0', type: 'bond', bond_slaves: 'eno1 eno2' }, { iface: 'eno1', type: 'eth' }, { iface: 'eno2', type: 'eth' }],
        '/nodes/other/network': [],
        '/nodes/pve/qemu/101/pending': [{ key: 'agent', value: '1', pending: '0' }],
        '/nodes/other/lxc/102/pending': [],
        '/nodes/pve/qemu/101/agent/network-get-interfaces': { result: [] },
        '/cluster/ha/resources': [{ sid: 'vm:101', state: 'started' }],
        '/cluster/status': [{ type: 'cluster', quorate: 1 }],
        '/cluster/ha/status/current': [], '/cluster/mapping/pci': [], '/cluster/mapping/usb': [],
        '/storage': [{ storage: 'shared', type: 'nfs', password: 'SEEDED_SECRET' }],
        '/nodes/pve/tasks/UPID%3Apve%3Aa/log': [{ n: 1, t: 'TASK ERROR: failed' }],
        '/nodes/pve/tasks/UPID%3Apve%3Aa/status': { status: 'stopped', exitstatus: 'failed' },
        ...overrides,
    };
    const calls = [];
    return { calls, read: async (path, query) => { calls.push({ path, query }); return Object.hasOwn(map, path) ? map[path]?.error ? map[path] : { data: map[path] } : { error: 'HTTP 403' }; } };
}
test('all 27 features belong to Toolkit; only Copy & Paste remains as a second edition', () => {
    assert.equal(features.length, 27);
    assert.deepEqual(manifest.editions[0].features, features.map(f => f.id));
    assert.deepEqual(manifest.editions.map(e => e.id), ['toolkit', 'copy-paste']);
    assert.deepEqual(manifest.editions[1].features, ['COPY','PASTE_ONLY','PASTE']);
    for (const e of manifest.editions.filter(e => e.configurable)) {
        const source = buildEdition(e);
        assert.match(source, /GM_getValue/);
        if (!e.features.some(f => reports.includes(f))) assert.doesNotMatch(source, /fetch\(/);
        if (!e.features.includes('TASK_REPORT') && e.features.some(f => reports.includes(f))) assert.doesNotMatch(source, /GM_setClipboard|clipboard\.readText|\.term\.paste\(/);
    }
});
test('fresh Toolkit enables only the three clipboard actions with no background reports', () => {
    let fetched = 0;
    const h = host({ freshSettings: true, views: [consoleView()], globals: { fetch() { fetched++; } } });
    for (let i=0; i<100; i++) h.scan();
    assert.equal(fetched, 0);
    assert.equal(h.api.featureEnabled('INVENTORY'), false);
    assert.equal(h.api.featureEnabled('COPY'), true);
    assert.deepEqual(features.filter(f => h.api.featureEnabled(f.id)).map(f => f.id), ['COPY', 'PASTE_ONLY', 'PASTE']);
    assert.deepEqual(h.created.map(b => b.text), ['Copy', 'Paste Only', 'Paste & Execute']);
});
test('all-off settings stop console discovery and interval installation; settings entry remains registered', () => {
    let menu;
    const h = host({ views: [consoleView()], globals: { GM_getValue: () => settings([]), GM_registerMenuCommand: (_name, fn) => { menu=fn; } } });
    assert.equal(h.intervals.length, 0); assert.equal(h.Ext.queries, 0); assert.equal(h.created.length, 0);
    assert.equal(typeof menu, 'function');
});
test('settings are origin scoped, preserve false, ignore unknown IDs, and default new features off', () => {
    let key;
    const h = host({ globals: { GM_getValue(k) { key=k; return { schema: 1, features: { COPY:false, INVENTORY:true, EXPORT:true, EVIL:true } }; } } });
    assert.match(key, /https:\/\/pve.example:8006$/);
    assert.equal(h.api.featureEnabled('COPY'), false); assert.equal(h.api.featureEnabled('INVENTORY'), true);
    assert.equal(h.api.featureEnabled('NETWORK'), false); assert.equal(h.api.featureEnabled('EVIL'), false);
    assert.equal(h.api.featureEnabled('EXPORT'), true, 'saved opt-in survives the new off default');
});
test('failed storage and unknown schema keep runtime inactive', () => {
    for (const read of [() => { throw Error(); }, () => ({ schema: 99, features: { COPY:true } })]) {
        const h = host({ views:[consoleView()], globals: { GM_getValue: read } });
        assert.equal(h.created.length,0); assert.equal(h.intervals.length,0);
    }
});
test('modern settings load before runtime begins', async () => {
    let done;
    const h=host({views:[consoleView()],globals:{GM:{getValue(){return new Promise(r=>{done=r;});}}}});
    assert.equal(h.created.length,0); done(settings(['COPY'])); await flush();
    assert.deepEqual(h.created.map(b=>b.text),['Copy']);
});
test('custom HTTPS support is explicit, same-origin frame ownership still required', async () => {
    const v=consoleView(); v.frame.contentWindow.location.href='https://pve.example/pve/?console=shell&node=pve&xtermjs=1';
    const h=host({views:[v],url:'https://pve.example/pve/',globals:{GM_getValue:()=>settings(['COPY','CUSTOM_PORT'],{apiPrefix:'/pve/'})}});
    await h.click(); assert.deepEqual(h.copied,['retained output']);
    v.frame.contentWindow.location.href='https://evil.example/?console=shell&node=pve&xtermjs=1';
    assert.equal(h.api.resolveConsole(v.anchor),null);
});
test('serial support only recognizes exact owned kvm xterm with VMID; noVNC excluded', () => {
    const v=consoleView({type:'kvm'});
    const h=host({views:[v],globals:{GM_getValue:()=>settings(['COPY','SERIAL'])}});
    assert.ok(h.api.resolveConsole(v.anchor));
    v.frame.contentWindow.location.href=v.frame.contentWindow.location.href.replace('xtermjs=1','novnc=1');
    assert.equal(h.api.resolveConsole(v.anchor),null);
});
test('viewport clipping joins only internal wraps and last N preserves logical boundaries', () => {
    const v=consoleView(); const h=host({views:[v]});
    const b=buffer([row('before'),row('start',true),row('end',true),row('last')]); b.viewportY=1;
    v.term.buffer.normal=b;v.term.buffer.active=b;v.term.rows=2;
    assert.equal(h.api.scopedConsole(v.term,'viewport',0).text,'startend');
    assert.equal(h.api.scopedConsole(v.term,'last',1).text,'last');
    assert.equal(h.api.scopedConsole(v.term,'last',-1),null);
});
test('scrollback search is literal, case-insensitive, bounded, and uses logical line numbers', () => {
    const h=host(); assert.equal(h.api.findConsoleLines('ABC\nfoo.*\nabc','abc').length,2);
    assert.equal(h.api.findConsoleLines('ABC\nfoo.*\nabc','.*')[0].line,2);
    assert.equal(h.api.findConsoleLines('a\n'.repeat(1000),'a').length,500);
});
test('review reads once, edits before dispatch, and never appends Enter', async () => {
    let reads=0; const v=consoleView();
    const h=host({views:[v],readClipboard:()=>{reads++;return Promise.resolve('original');},globals:{GM_getValue:()=>settings(['REVIEW'])}});
    await h.action('Review & Paste').handler();
    assert.equal(reads,1);assert.equal(v.term.sent.length,0);
    const editor=h.components.find(c=>c.type==='Ext.form.field.TextArea'); editor.setValue('edited');
    await h.action('Paste reviewed text').handler();
    assert.deepEqual(v.term.sent,[{paste:'edited'}]);assert.equal(reads,1);
    assert.equal(h.Ext.GlobalEvents.listeners.size,0);
});
test('review expires and hides cancel staged text; reconnect cannot retarget it', async () => {
    for (const change of ['expire','hide','reconnect']) {
        const v=consoleView(); const h=host({views:[v],globals:{GM_getValue:()=>settings(['REVIEW'])}});
        await h.action('Review & Paste').handler(); const action=h.action('Paste reviewed text');
        if(change==='expire')h.advance(300000);
        if(change==='hide'){v.anchor.visible=false;h.Ext.GlobalEvents.fireHide();v.anchor.visible=true;}
        if(change==='reconnect'){v.frame.contentWindow.socket={readyState:1};}
        await action.handler();assert.equal(v.term.sent.length,0);assert.equal(h.Ext.GlobalEvents.listeners.size,0);
    }
});
test('inventory separates configured and observed resources and filters selection', async () => {
    const f=fixture();const r=await M.run('INVENTORY',f.read,{vmids:'101'});
    assert.equal(r.rows.length,1);assert.equal(r.rows[0].configuredMemoryMiB,2048);assert.equal(r.rows[0].observedMemoryBytes,30);
    assert.equal(f.calls.some(c=>c.path.includes('/102/')),false);
});
test('comparison preserves unknown differences while omitting credential fields and matching expected identities', async () => {
    const d=M.configDiff({name:'a',net0:'virtio=AA:BB:CC:DD:EE:FF,bridge=vmbr0',newOption:1,cipassword:'SECRET'},
        {name:'b',net0:'virtio=00:11:22:33:44:55,bridge=vmbr0',newOption:2,cipassword:'OTHER'});
    assert.deepEqual(d,[{setting:'newOption',left:1,right:2}]);
    const r=await M.run('COMPARE',fixture().read,{vmids:'101,102'});
    assert.equal(r.pending.length,2);assert.doesNotMatch(JSON.stringify(r),/SEEDED_SECRET/);
    await assert.rejects(M.run('COMPARE',fixture().read,{vmids:'101'}),/two visible/);
});
test('backup report distinguishes jobs, found artifacts, excluded mounts and unproven restore', async () => {
    const r=await M.run('BACKUPS',fixture().read);
    const vm=r.rows.find(r=>r.vmid===101), ct=r.rows.find(r=>r.vmid===102);
    assert.equal(vm.coverage,'scheduled');assert.ok(vm.newestVisibleBackup);assert.equal(vm.restoreTested,'unknown');
    assert.equal(ct.excludedAttachments[0].reason,'External bind/device mount');
    assert.equal(ct.newestVisibleBackup,null);assert.equal(vm.latestVisibleGuestBackupTask.status,'ERROR');
});
test('coverage treats inaccessible jobs and unknown pool selection as unknown', () => {
    assert.equal(M.coverage({vmid:101},null),'unknown');
    assert.equal(M.coverage({vmid:101},[{pool:'hidden'}]),'unknown selection');
    assert.equal(M.coverage({vmid:101},[{all:1,exclude:'101'}]),'no matching visible job');
});
test('missing permissions remain report issues and null data, not successful empty checks', async () => {
    const r=await M.run('INVENTORY',fixture({'/nodes/pve/qemu/101/config':{error:'HTTP 403'}}).read);
    assert.equal(r.issues.length,1);assert.equal(r.rows.find(r=>r.vmid===101).disks,null);
});
test('snapshots exclude current pseudo-entry and flag age without deletion advice', async () => {
    const r=await M.run('SNAPSHOTS',fixture().read);assert.equal(r.rows.length,1);assert.equal(r.rows[0].snapshot,'old');assert.equal(r.rows[0].review,true);
});
test('task history follows a guest across nodes and selected log lines mark explicit errors', async () => {
    const r=await M.run('TASKS',fixture().read,{vmids:'101',failuresOnly:true});assert.equal(r.rows.length,2);
    const log=await M.run('TASK_REPORT',fixture().read,{node:'pve',upid:'UPID:pve:a'});assert.equal(log.rows[0].errorLine,true);
    await assert.rejects(M.run('TASK_REPORT',fixture().read,{node:'other',upid:'UPID:pve:a'}),/owning node/);
});
test('storage distinguishes attached, unused and unreferenced without claiming safe deletion', async () => {
    const r=await M.run('STORAGE',fixture().read);assert.deepEqual(r.rows.map(r=>r.state),['attached','marked unused','no visible current-config reference']);
    assert.ok(r.rows.every(r=>r.safeToDelete==='not determined'));assert.equal(r.rows[2].parentVolume,'shared:base-99');
});
test('maintenance separates HA membership and current spare memory', async () => {
    const r=await M.run('MAINTENANCE',fixture().read,{node:'pve'});assert.equal(r.rows[0].ha,'started');assert.equal(r.otherNodes[0].observedFreeMemoryBytes,1500);
});

for (const id of reports.filter(id => !['COMPARE', 'TASK_REPORT'].includes(id)))
    test(`${id} accepts an empty scope and selects all visible nodes/guests`, async () => {
        const r = await M.run(id, fixture().read, { node: '  ', vmids: '  ', origin: 'https://pve.example:8006' });
        assert.deepEqual(r.selection.nodes, ['pve', 'other']);
        assert.equal(r.selection.selectedGuests, 2);
        assert.match(r.scope, /All visible nodes; all visible guests/);
        assert.ok(Array.isArray(r.rows));
    });

test('cluster preflight separates each node storage/task evidence and fetches shared evidence once', async () => {
    const f = fixture();
    const r = await M.run('MAINTENANCE', f.read);
    assert.deepEqual(r.nodePreflights.map(n => n.node), ['pve', 'other']);
    assert.deepEqual(r.rows.find(g => g.vmid === 101).localOrUnknownVolumes, []);
    assert.ok(r.rows.find(g => g.vmid === 102).localOrUnknownVolumes.length > 0);
    for (const node of r.nodePreflights) {
        assert.equal(node.selectedGuests, 1);
        assert.equal(node.otherNodes.some(n => n.node === node.node), false);
        assert.ok(Array.isArray(node.activeTasks));
    }
    assert.equal(f.calls.filter(c => c.path === '/cluster/status').length, 1);
    assert.equal(f.calls.filter(c => c.path === '/nodes/pve/storage/shared/content').length, 1);
    assert.match(r.notes.join(' '), /not a plan to take every node offline together/);
});

test('preflight retains a guestless node and distinguishes inaccessible checks from empty lists', async () => {
    const r = await M.run('MAINTENANCE', fixture({
        '/cluster/resources': [{ type: 'node', node: 'pve' }, { type: 'node', node: 'empty' }],
        '/nodes/pve/tasks': { error: 'HTTP 403' }, '/nodes/pve/storage': { error: 'HTTP 403' },
        '/nodes/empty/tasks': [], '/nodes/empty/storage': [],
    }).read);
    assert.equal(r.rows.length, 0);
    assert.equal(r.nodePreflights.length, 2);
    assert.equal(r.nodePreflights[0].activeTasks, null);
    assert.equal(r.nodePreflights[0].storageAvailable, false);
    assert.deepEqual(r.nodePreflights[1].activeTasks, []);
    assert.equal(r.nodePreflights[1].storageAvailable, true);
    assert.equal(r.nodePreflights[1].selectedGuests, 0);
    assert.ok(r.issues.some(i => i.reason === 'HTTP 403'));
});

test('single-node preflight narrows checks without losing cluster backup/capacity context', async () => {
    const f = fixture();
    const r = await M.run('MAINTENANCE', f.read, { node: 'other' });
    assert.deepEqual(r.selection.nodes, ['other']);
    assert.deepEqual(r.nodePreflights.map(n => n.node), ['other']);
    assert.deepEqual(r.rows.map(g => g.vmid), [102]);
    assert.equal(f.calls.some(c => c.path === '/nodes/pve/tasks'), false);
    assert.equal(r.otherNodes[0].node, 'pve');
});

test('network includes guestless nodes and recovery respects the node filter', async () => {
    const f = fixture({ '/cluster/resources': [{ type: 'node', node: 'pve' }, { type: 'node', node: 'other' }] });
    const network = await M.run('NETWORK', f.read);
    assert.deepEqual(network.interfaces.map(n => n.node).sort(), ['other', 'pve']);
    assert.ok(network.interfaceComparison.length > 0);
    const r = await M.run('RECOVERY', fixture().read, { node: 'other' });
    assert.deepEqual(r.networks.map(n => n.node), ['other']);
});

test('explicit unknown node fails clearly instead of silently broadening the scope', async () => {
    const f = fixture();
    await assert.rejects(M.run('MAINTENANCE', f.read, { node: 'typo' }), /not visible/);
    assert.deepEqual(f.calls.map(c => c.path), ['/cluster/resources']);
});

test('task detail derives its node from UPID; compare/task requirements fail before requests', async () => {
    const f = fixture();
    const r = await M.run('TASK_REPORT', f.read, { upid: ' UPID:pve:a ' });
    assert.equal(r.selection.node, 'pve');
    assert.equal(r.rows[0].errorLine, true);
    let requests = 0;
    const read = async () => { requests++; throw Error('Unexpected request'); };
    await assert.rejects(M.run('TASK_REPORT', read), /complete UPID/);
    await assert.rejects(M.run('COMPARE', read), /two visible/);
    await assert.rejects(M.run('COMPARE', read, { vmids: '101,101' }), /two visible/);
    assert.equal(requests, 0);
});

test('failed or empty discovery is explicit and never reports a completed node check', async () => {
    const failed = await M.run('MAINTENANCE', fixture({ '/cluster/resources': { error: 'HTTP 403' } }).read);
    assert.match(failed.notes.join(' '), /discovery failed/);
    assert.equal(failed.issues[0].reason, 'HTTP 403');
    assert.equal(failed.nodePreflights, undefined);
    const empty = await M.run('MAINTENANCE', fixture({ '/cluster/resources': [] }).read);
    assert.deepEqual(empty.nodePreflights, []);
    assert.match(empty.notes.join(' '), /No nodes are visible/);
});
test('network paths trace bridges and bonds and terminate cycles', async () => {
    const r=await M.run('NETWORK',fixture().read);assert.equal(r.rows[0].configuredPath[0].upstream[0][0].iface,'bond0');
    const paths=M.networkPaths({vmid:1},{net0:'virtio=x,bridge=a'},[{iface:'a',bridge_ports:'a'}]);
    assert.equal(paths[0].configuredPath[0].upstream[0][0].state,'cycle');
});
test('guest responsiveness is opt-in and failures never claim not installed', async () => {
    const f=fixture();let r=await M.run('GUEST_HEALTH',f.read);assert.equal(f.calls.some(c=>c.path.includes('/agent/')),false);
    assert.equal(r.rows[0].configured,true);assert.equal(r.rows[0].responsiveness,'not checked');
    r=await M.run('GUEST_HEALTH',fixture({'/nodes/pve/qemu/101/agent/network-get-interfaces':{error:'timeout'}}).read,{checkAgent:true});
    assert.match(r.rows[0].responsiveness,/not established/);
});
test('recovery manifest excludes seeded secrets and states external recovery requirements', async () => {
    const r=await M.run('RECOVERY',fixture().read);assert.doesNotMatch(JSON.stringify(r),/SEEDED_SECRET/);assert.equal(r.rows.length,2);assert.ok(r.checklist.length>=5);
});
test('CSV quotes embedded data and neutralizes spreadsheet formulas', () => {
    const csv=M.csv([{name:'=HYPERLINK("x")',value:'a,b\nline'}],['name','value']);
    assert.match(csv,/"'=HYPERLINK\(""x""\)"/);assert.match(csv,/"a,b\nline"/);
});
test('API client uses only bounded same-origin GETs with a custom path and no redirects', async () => {
    const calls=[]; const h=host({globals:{fetch:async(url,opts)=>{calls.push({url,opts});return {ok:true,headers:{get:()=>null},text:async()=>'{"data":[]}'};}}});
    const client=h.api.createReportClient('/pve/',new AbortController());
    await client.read('/cluster/resources',{type:'vm'});
    assert.equal(calls[0].url,'https://pve.example:8006/pve/api2/json/cluster/resources?type=vm');
    assert.equal(calls[0].opts.method,'GET');assert.equal(calls[0].opts.credentials,'same-origin');assert.equal(calls[0].opts.redirect,'error');
    for(const p of ['https://evil','/nodes/../evil','/nodes/%2e%2e/evil','/nodes/a%2Fb/config','/nodes/pve?x=1'])assert.match((await client.read(p)).error,/Invalid/);
    assert.equal(calls.length,1);assert.equal(h.timers.size,0);
});
test('API concurrency never exceeds three and cancellation stops queued fetches', async () => {
    let active=0,max=0,calls=0;const finish=[];
    const h=host({globals:{fetch:(_url,opts)=>{calls++;active++;max=Math.max(max,active);return new Promise((resolve,reject)=>{finish.push(()=>{active--;resolve({ok:true,headers:{get:()=>null},text:async()=>'{"data":[]}'});});opts.signal.addEventListener('abort',()=>{active--;reject(Error());},{once:true});});}}});
    const controller=new AbortController(),client=h.api.createReportClient('/',controller);
    const pending=Array.from({length:12},()=>client.read('/cluster/resources'));
    assert.equal(calls,3);controller.abort();const r=await Promise.all(pending);
    assert.equal(max,3);assert.equal(calls,3);assert.ok(r.every(r=>r.error==='Cancelled'));assert.equal(h.timers.size,0);
});
test('API transport rejects excessive response size and enforces request budget', async () => {
    let count=0;const h=host({globals:{fetch:async()=>{count++;return {ok:true,headers:{get:()=>String(9*1024*1024)}};}}});
    const client=h.api.createReportClient('/',new AbortController());
    assert.match((await client.read('/cluster/resources')).error,/8 MiB/);
    for(let i=0;i<399;i++)await client.read('/cluster/resources');
    assert.match((await client.read('/cluster/resources')).error,/budget/);assert.equal(count,400);
});
test('malformed API shapes are unknown rather than empty successful reports',async()=>{
    const r=await M.run('INVENTORY',fixture({'/nodes/pve/qemu/101/config':[]}).read);
    assert.equal(r.rows.find(r=>r.vmid===101).configurationAvailable,false);
    assert.match(r.issues[0].reason,/data shape/);
});
test('streaming response budget is bounded across a whole report',async()=>{
    let calls=0;
    const payload=JSON.stringify({data:'x'.repeat(7*1024*1024)});
    const h=host({globals:{fetch:async()=>{calls++;return new Response(payload);}}});
    const client=h.api.createReportClient('/',new AbortController());
    for(let i=0;i<4;i++)assert.equal((await client.read('/cluster/resources')).error,undefined);
    assert.match((await client.read('/cluster/resources')).error,/byte limit/);
    assert.match((await client.read('/cluster/resources')).error,/budget/);
    assert.equal(calls,5);assert.equal(h.timers.size,0);
});
test('request deadline aborts transport and removes watchdog',async()=>{
    const h=host({globals:{fetch:(_url,options)=>new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(Error())))}});
    const client=h.api.createReportClient('/',new AbortController()),pending=client.read('/cluster/resources');
    h.advance(15000);assert.equal((await pending).error,'Request timed out');assert.equal(h.timers.size,0);
});
test('explicit file properties retain disk references',()=>{
    assert.equal(M.mounts({scsi0:'file=local:vm-101-disk-0,backup=1'},'qemu')[0].volume,'local:vm-101-disk-0');
});
