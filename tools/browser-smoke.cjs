// Real ExtJS UI fixture; mocked PVE workspace, storage and API. Not live acceptance.
// Prepare pinned assets first: node tools/fetch-ui-fixture.cjs
// Usage: node tools/browser-smoke.cjs [path-to-Chrome-or-Edge]
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const cache = path.join(root, '.cache', 'catalog-browser');
fs.mkdirSync(cache, { recursive: true });
for (const asset of require('./fetch-ui-fixture.cjs').assets) {
    const file = path.join(cache, asset.file);
    assert.ok(fs.existsSync(file), 'Run node tools/fetch-ui-fixture.cjs first');
    require('./fetch-ui-fixture.cjs').verify(fs.readFileSync(file), asset);
}
const binary = process.argv[2] || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const fixture = path.join(cache, 'fixture.html');
fs.writeFileSync(fixture, '<!doctype html><meta charset="utf-8"><title>Toolkit native UI fixture</title><link rel="stylesheet" href="theme.css"><script src="ext-all.js"></script><script src="theme-crisp.js"></script><body>');
const profile = path.join(cache, `profile-${process.pid}`);
const child = spawn(binary, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-extensions', '--window-size=1280,900', 'about:blank'], { windowsHide: true, stdio: ['ignore','ignore','pipe'] });
let browserError = '';
child.stderr.on('data', chunk => { browserError += chunk.toString(); });
child.on('error', error => { browserError += error.message; });
const pause = ms => new Promise(r => setTimeout(r, ms));
const connections = new Set();
let acceptedSockets = 0;
const servedFiles = new Set(['fixture.html', 'console.html', ...require('./fetch-ui-fixture.cjs').assets.map(a => a.file)]);
const socketServer = http.createServer((request, response) => {
    const file = new URL(request.url, 'http://localhost').pathname.slice(1);
    if (!servedFiles.has(file)) { response.writeHead(404); response.end(); return; }
    response.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.png') ? 'image/png' : 'text/html');
    response.end(fs.readFileSync(path.join(cache, file)));
});
socketServer.on('upgrade', (request, socket) => {
    const accept = createHash('sha1').update(request.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
    connections.add(socket); acceptedSockets++;
    socket.on('close', () => connections.delete(socket)); socket.on('error', () => {});
});
async function main() {
    await new Promise(resolve => socketServer.listen(0, '127.0.0.1', resolve));
    fs.writeFileSync(path.join(cache, 'console.html'), `<!doctype html><body style="background:#111;color:white">Preserved console fixture<script>
        window.term = { buffer: 'retained output', marker: Math.random() };
        window.socket = new WebSocket('ws://127.0.0.1:${socketServer.address().port}');
        </script>`);
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let n=0; n<100 && !fs.existsSync(portFile); n++) await pause(100);
    assert.ok(fs.existsSync(portFile), `Headless browser started: ${browserError.slice(-2000)}`);
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const target = targets.find(t => t.type === 'page');
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve,reject) => { socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true}); });
    let serial=0;const pending=new Map(), runtimeErrors=[];
    socket.addEventListener('message', e => { const r=JSON.parse(e.data); if(r.method === 'Runtime.exceptionThrown')runtimeErrors.push(r.params.exceptionDetails);if(r.id){const p=pending.get(r.id);pending.delete(r.id);r.error?p.reject(Error(JSON.stringify(r.error))):p.resolve(r.result);} });
    const call = (method,params={}) => new Promise((resolve,reject) => {const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
    const evaluate = async expression => { const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value; };
    const fixtureURL = `http://127.0.0.1:${socketServer.address().port}/fixture.html`;
    await call('Runtime.enable');
    await call('Page.navigate', { url: fixtureURL });
    const script = fs.readFileSync(path.join(root,'proxmox-toolkit.user.js'),'utf8');
    const setupFor = script => `(() => {
        const location = new URL('https://fixture.example:8006/'); location.reload = () => window.reloadRequested = true;
        const unsafeWindow = { PVE: {}, Ext: window.Ext };
        Ext.define('Fixture.Workspace', {extend:'Ext.container.Viewport',alias:'widget.pveStdWorkspace'});
        Ext.define('Fixture.Help', {extend:'Ext.button.Button',alias:'widget.proxmoxHelpButton'});
        Ext.define('Fixture.Tree', {extend:'Ext.tree.Panel',alias:'widget.pveResourceTree'});
        Ext.define('Fixture.Config', {extend:'Ext.panel.Panel',alias:'widget.pvePanelConfig',
            initComponent: function() {
                this.helpButton = Ext.create('Fixture.Help',{text:'Help'});
                this.dockedItems = [{xtype:'toolbar',dock:'top',itemId:'toolbar',overflowHandler:'scroller',
                    items:[{xtype:'tbtext',text:'Node pve'},'->',{xtype:'button',text:'Shell'},
                        {xtype:'button',text:'Bulk Actions'},this.helpButton]}];
                this.callParent();
            }
        });
        window.workspace = Ext.create('Fixture.Workspace', {layout:'border',items:[
            {region:'north',height:40,baseCls:'x-plain',defaults:{baseCls:'x-plain'},layout:{type:'hbox',align:'middle'},items:[
                {xtype:'component',html:'Proxmox VE — local fixture',flex:1},
                {xtype:'proxmoxHelpButton',text:'Documentation',baseCls:'x-btn',margin:'0 5 0 0'}, {xtype:'button',text:'Create VM',baseCls:'x-btn',margin:'3 5 0 0'}]},
            {xtype:'pveResourceTree',region:'west',width:190,split:true,rootVisible:false,
                root:{expanded:true,children:[{text:'Datacenter',leaf:true},{text:'daemon1',leaf:true},{text:'daemon2',leaf:true}]}},
            {xtype:'container',region:'center',itemId:'content',layout:'card',items:[
                {xtype:'pvePanelConfig',html:'<iframe title="Console fixture" src="console.html" style="width:100%;height:100%;border:0"></iframe>'}]},
            {xtype:'panel',region:'south',height:100,split:true,title:'Tasks / Cluster log',html:'Native task log stays visible.'}
        ]});
        const GM_getValue = () => null;
        const GM_setValue = async (key, value) => { window.savedSettings = { key, value }; };
        const GM_registerMenuCommand = (name, handler) => { window.menuSettings = handler; };
        let calls = 0; window.fixtureRequests = () => calls;
        const fetch = async (url, options) => { calls++; if(options.method !== 'GET')throw Error('Not GET');
            if (window.holdFixtureRequest) return new Promise((resolve, reject) => {
                window.heldFixtureSignal = options.signal;
                options.signal.addEventListener('abort', () => reject(new Error('Aborted fixture request')), { once: true });
            });
            const pathname = new URL(url).pathname;
            const data = pathname.endsWith('/cluster/resources') ? [{type:'node',node:'pve'},{type:'node',node:'empty'},{type:'qemu',vmid:101,name:'<img src=x onerror=alert(1)>',node:'pve',status:'running',mem:1024}] :
                pathname.endsWith('/config') ? {memory:2048,cores:2,net0:'virtio=AA:BB:CC:DD:EE:FF,bridge=vmbr0',scsi0:'local:vm-101-disk-0'} : [];
            return new Response(JSON.stringify({data}),{status:200,headers:{'content-type':'application/json'}}); };
        ${script.replace(/\}\)\(\);\s*$/, "window.fixtureAPI = { openToolkitSettings, openCatalogReport: typeof openCatalogReport === 'function' ? openCatalogReport : undefined, enable: id => runtimeSettings.features[id] = true };\n})();")}

    })()`;
    for(let n=0;n<100;n++){if(await evaluate('!!window.Ext?.isReady'))break;await pause(50);}
    await evaluate(setupFor(script));
    const query = selector => 'Ext.ComponentQuery.query('+JSON.stringify(selector)+')'+(selector === 'window' ? '.filter(w=>w.isVisible())' : '');
    const click = async text => evaluate('Ext.ComponentQuery.query("button").find(b=>b.text==='+JSON.stringify(text)+').handler()');
    const checks = async (value, expected, message) => assert.equal(await evaluate(value),expected,message);
    await checks('fixtureRequests()',0);
    await checks('workspace.down("[region=north]").items.items.map(c=>c.text).join("|")','|Toolkit|Documentation|Create VM','Toolkit precedes global Documentation');
    await checks('(()=>{const b=Ext.ComponentQuery.query("button").find(b=>b.text==="Toolkit"),d=workspace.down("[region=north]").down("proxmoxHelpButton"),a=b.el.dom.getBoundingClientRect(),r=d.el.dom.getBoundingClientRect();return b.baseCls==="x-btn" && b.ui===d.ui && b.scale===d.scale && Math.abs(a.height-r.height)<1 && Math.abs(a.top-r.top)<1 && Math.abs(r.left-a.right-5)<1;})()',true,'Toolkit matches Documentation height, alignment, native styling and 5px spacing despite north-region x-plain defaults');
    await checks('workspace.down("pvePanelConfig").down("#toolbar").items.items.map(c=>c.text||"").join("|")','Node pve||Shell|Bulk Actions|Help','resource toolbar remains native');
    for(let n=0;n<100;n++){if(await evaluate('document.querySelector("iframe").contentWindow.socket?.readyState === 1'))break;await pause(20);}
    await evaluate('window.preservedFrame=document.querySelector("iframe");window.preservedDocument=preservedFrame.contentDocument;window.preservedTerm=preservedFrame.contentWindow.term;window.preservedSocket=preservedFrame.contentWindow.socket;window.preservedView=workspace.down("pvePanelConfig");void 0');
    await checks('preservedSocket.readyState',1,'fixture has a real open WebSocket');
    // Ext creates its shared form-validation tooltip on the first form.
    await click('Toolkit'); await click('Toolkit');
    const baseComponents = await evaluate('Ext.ComponentManager.getCount()');
    const workspaceQuery = 'Ext.ComponentQuery.query("[pveToolkitWorkspace]")';
    for(let n=0;n<10;n++) {
        await click('Toolkit');
        await checks(workspaceQuery+'.length',1);
        await checks('preservedView.el.dom.inert',true,'covered native view cannot receive input');
        await checks('workspace.child("#content").getLayout().getActiveItem() === preservedView',true,'native card remains active');
        await checks('preservedView.isVisible(true) && preservedFrame.getBoundingClientRect().width > 0',true,'console is covered without native hide or zero-size layout');
        await click(n % 2 ? 'Return to Proxmox' : 'Toolkit');
        await checks(workspaceQuery+'.length',0);
        await checks('preservedView.el.dom.inert',false);
        await checks('document.querySelector("iframe") === preservedFrame && preservedFrame.contentDocument === preservedDocument && preservedFrame.contentWindow.term === preservedTerm && preservedFrame.contentWindow.socket === preservedSocket && preservedSocket.readyState === 1',true,'iframe document, terminal and open connection survive toggles');
        await checks('Ext.ComponentManager.getCount()',baseComponents,'toggling does not leak components');
    }
    assert.equal(acceptedSockets,1,'no console reconnect');
    assert.equal(connections.size,1,'original connection stays open');
    await click('Toolkit');
    await checks(query('window')+'.length',0,'workspace is not a modal window');
    await checks(workspaceQuery+'[0].title','Proxmox Toolkit '+require('./editions.json').version+' settings','versioned workspace');
    const fillsContent = '(()=>{const a=workspace.child("#content").el.dom.getBoundingClientRect(),b=Ext.ComponentQuery.query("[pveToolkitWorkspace]")[0].el.dom.getBoundingClientRect();return ["top","left","width","height"].every(k=>Math.abs(a[k]-b[k])<2);})()';
    await checks(fillsContent,true,'fills precisely the main content region');
    await checks('(()=>{const el=Ext.ComponentQuery.query("[pveToolkitWorkspace]")[0].el.dom,r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));})()',true,'workspace intercepts clicks over the console');
    await checks('["north","west","south"].every(region=>{const el=workspace.down("[region="+region+"]").el.dom;return !el.inert && el.getBoundingClientRect().width>0;})',true,'surrounding PVE regions remain usable');
    await checks(query('checkbox')+'.length',22);
    await checks(query('checkbox')+'.filter(c=>c.getValue()).length',3);
    assert.deepEqual(await evaluate('Ext.ComponentQuery.query("tabpanel")[0].items.items.map(c=>c.title)'),
        ['Console','Inventory','Recovery','Troubleshooting','Maintenance','Integration']);
    const checkCategories = async () => {
        for (const group of ['Console','Inventory','Recovery','Troubleshooting','Maintenance','Integration']) {
            await evaluate(`(()=>{const t=Ext.ComponentQuery.query('tabpanel')[0];t.items.items.find(c=>c.title===${JSON.stringify(group)}).tab.el.dom.click();})()`);
            await checks('Ext.ComponentQuery.query("tabpanel")[0].getActiveTab().title',group,'native tab click selects category');
            await checks('(()=>{const t=Ext.ComponentQuery.query("tabpanel")[0],r=t.el.dom.getBoundingClientRect();return t.items.items.every(c=>{const b=c.tab.el.dom.getBoundingClientRect();return b.width>0&&b.left>=r.left&&b.right<=r.right&&b.top>=r.top;});})()',true,'all category tabs fit without horizontal scrolling');
            const seen = new Set();
            for (let p = 0; p < 22; p++) {
                const ids = await evaluate('Ext.ComponentQuery.query("[pveToolkitFeature]").filter(c=>c.isVisible(true)).map(c=>c.pveToolkitFeature)');
                ids.forEach(id => seen.add(id));
                await checks('(()=>{const f=Ext.ComponentQuery.query("tabpanel")[0].getActiveTab(),r=f.body.dom.getBoundingClientRect();return f.items.items.filter(c=>c.pveToolkitFeature&&c.isVisible(true)).every(c=>{const b=c.el.dom.getBoundingClientRect();return b.top>=r.top&&b.bottom<=r.bottom+1&&b.right<=r.right+1;});})()',true,'settings cards fit without scrolling');
                await checks('Ext.ComponentQuery.query("[pveToolkitFeature]").filter(c=>c.isVisible(true)).every(c=>c.body.dom.scrollHeight<=c.body.dom.clientHeight+1)',true,'card controls and descriptions are not clipped');
                await checks('(()=>{const w=Ext.ComponentQuery.query("[pveToolkitWorkspace]")[0].el.dom.getBoundingClientRect();return ["Restore defaults","Return to Proxmox","Save & Reload"].every(text=>{const r=Ext.ComponentQuery.query("button").find(b=>b.text===text).el.dom.getBoundingClientRect();return r.width>0&&r.top>=w.top&&r.bottom<=w.bottom&&r.right<=w.right;});})()',true,'all footer actions remain visible');
                if (await evaluate('Ext.ComponentQuery.query("tabpanel")[0].getActiveTab().down("button[text=Next]").disabled')) break;
                await evaluate('Ext.ComponentQuery.query("tabpanel")[0].getActiveTab().down("button[text=Next]").handler()');
            }
            assert.deepEqual([...seen].sort(),require('./features.cjs').features.filter(f=>f.group===group).map(f=>f.id).sort(),'every option is reachable through pagination');
            for (let p = 0; p < 22; p++) {
                if (await evaluate('Ext.ComponentQuery.query("tabpanel")[0].getActiveTab().down("button[text=Previous]").disabled')) break;
                await evaluate('Ext.ComponentQuery.query("tabpanel")[0].getActiveTab().down("button[text=Previous]").handler()');
            }
        }
        await evaluate('Ext.ComponentQuery.query("tabpanel")[0].setActiveTab(0);void 0');
    };
    await checkCategories();
    await checks('!!document.querySelector("#proxmox-toolkit-launchers")',false,'no floating launcher');
    await pause(50);
    for(let n=0;n<35;n++) {
        await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
        await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
        await checks('!preservedView.el.dom.contains(document.activeElement)',true,'Tab cannot reach the covered console');
    }
    await evaluate('Ext.ComponentQuery.query("checkbox")[0].focus();void 0');
    const shot = await call('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(cache,'settings.png'),Buffer.from(shot.data,'base64'));
    await evaluate('Ext.ComponentQuery.query("checkbox").forEach(c=>c.setValue(false))');
    await click('Save & Reload');
    await evaluate('Promise.resolve()');
    await checks('reloadRequested',true);
    await checks('Object.values(savedSettings.value.features).some(Boolean)',false);
    assert.match(await evaluate('savedSettings.key'),/https:\/\/fixture.example:8006$/);
    await evaluate('fixtureAPI.enable("INVENTORY");fixtureAPI.openToolkitSettings();Ext.ComponentQuery.query("tabpanel")[0].setActiveTab(1);void 0');
    await evaluate('Ext.ComponentQuery.query("checkbox").find(c=>c.name==="EXPORT").setValue(true);Ext.ComponentQuery.query("textfield").find(c=>c.fieldLabel==="Proxy path prefix").setValue("/unfinished");void 0');
    await checks('Ext.ComponentQuery.query("button").find(b=>b.pveToolkitReport==="INVENTORY").disabled',false);
    await evaluate('Ext.ComponentQuery.query("button").find(b=>b.pveToolkitReport==="INVENTORY").handler()');
    await checks('fixtureRequests()',0,'opening does not fetch');
    await checks('[...document.querySelectorAll(".pve-toolkit-report label[hidden]")].every(el=>getComputedStyle(el).display === "none")',true);
    await checks('document.querySelector(".pve-toolkit-report").getBoundingClientRect().top < innerHeight',true,'report content is visible inside native window');
    await click('Run report');
    for(let n=0;n<100;n++){if(await evaluate('!!document.querySelector(".pve-toolkit-report tbody tr")'))break;await pause(20);}
    await checks('document.querySelectorAll(".pve-toolkit-report tbody tr").length',1);
    await checks('fixtureRequests()',2);
    await checks('document.querySelectorAll(".pve-toolkit-report img").length',0);
    assert.ok((await evaluate('document.querySelector(".pve-toolkit-report").textContent')).includes('<img src=x onerror=alert(1)>'));
    const reportComponents = await evaluate('Ext.ComponentManager.getCount()');
    await click('Run report');
    for(let n=0;n<100;n++){if(await evaluate('!!document.querySelector(".pve-toolkit-report tbody tr")'))break;await pause(20);}
    await checks('Ext.ComponentManager.getCount()',reportComponents,'repeated collection destroys old native row/download buttons');
    for(let n=0;n<10;n++) await evaluate('document.querySelector(".pve-toolkit-report table").parentNode.querySelector("input").dispatchEvent(new Event("input"));void 0');
    await checks('Ext.ComponentManager.getCount()',reportComponents,'filter redraw destroys old native row buttons');
    const reportShot = await call('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(cache,'inventory.png'),Buffer.from(reportShot.data,'base64'));
    await click('Back to Toolkit');
    await checks('Ext.ComponentQuery.query("tabpanel")[0].getActiveTab().title','Inventory','Inventory returns to its category');
    await checks('Ext.ComponentQuery.query("checkbox").find(c=>c.name==="EXPORT").getValue()',true,'report round-trip preserves unsaved toggle');
    await checks('Ext.ComponentQuery.query("textfield").find(c=>c.fieldLabel==="Proxy path prefix").getValue()','/unfinished','report round-trip preserves even an incomplete draft prefix');
    await evaluate('Ext.ComponentQuery.query("textfield").find(c=>c.fieldLabel==="Proxy path prefix").setValue("/");void 0');
    await checks('document.querySelectorAll(".pve-toolkit-report").length',0,'old report DOM is destroyed');
    await evaluate('fixtureAPI.enable("MAINTENANCE");fixtureAPI.openCatalogReport("MAINTENANCE")');
    await checks('[...document.querySelectorAll(".pve-toolkit-report input[type=text]")].every(i=>i.value === "")',true,'preflight opens with blank scope');
    await click('Run report');
    await checks('document.querySelectorAll("[data-node-preflights] tbody tr").length',2,'blank preflight includes guestless node');
    assert.ok((await evaluate('document.querySelector(".pve-toolkit-report").textContent')).includes('All visible nodes'));
    await checks('document.querySelector(".pve-toolkit-report [role=status]").textContent.includes("2 nodes in scope")',true);
    const maintenanceShot = await call('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(cache,'maintenance.png'),Buffer.from(maintenanceShot.data,'base64'));
    await click('Back to Toolkit');
    await checks('Ext.ComponentQuery.query("tabpanel")[0].getActiveTab().title','Maintenance','Maintenance returns to its category');
    const chooserComponents = await evaluate('Ext.ComponentManager.getCount()');
    for (const id of ['INVENTORY','COMPARE','BACKUPS','TASKS','TASK_REPORT','SNAPSHOTS','STORAGE','MAINTENANCE','NETWORK','GUEST_HEALTH','RECOVERY']) {
        await evaluate(`fixtureAPI.enable(${JSON.stringify(id)});fixtureAPI.openCatalogReport(${JSON.stringify(id)});void 0`);
        await checks('Ext.ComponentQuery.query("button").find(b=>b.text==="Back to Toolkit").ownerCt.dock','bottom','every report has a docked return button');
        await click('Back to Toolkit');
        await checks('Ext.ComponentQuery.query("tabpanel")[0].getActiveTab().title',require('./features.cjs').features.find(f=>f.id===id).group);
        await checks('Ext.ComponentManager.getCount()',chooserComponents,'report navigation does not leak components');
    }
    await evaluate('window.holdFixtureRequest = true;fixtureAPI.openCatalogReport("INVENTORY");Ext.ComponentQuery.query("button").find(b=>b.text==="Run report").handler();void 0');
    await checks('heldFixtureSignal.aborted',false);
    await click('Back to Toolkit');
    await checks('heldFixtureSignal.aborted',true,'Back cancels in-flight collection');
    await checks('Ext.ComponentQuery.query("tabpanel")[0].getActiveTab().title','Inventory','late response cannot replace category');
    await evaluate('window.holdFixtureRequest = false;void 0');
    const beforeRequired = await evaluate('fixtureRequests()');
    await evaluate('fixtureAPI.enable("COMPARE");fixtureAPI.openCatalogReport("COMPARE")');
    await click('Run report');
    await checks('fixtureRequests()',beforeRequired,'missing comparison targets do not fetch');
    assert.match(await evaluate('document.querySelector(".pve-toolkit-report [role=status]").textContent'),/two visible/);
    await evaluate('fixtureAPI.enable("TASK_REPORT");fixtureAPI.openCatalogReport("TASK_REPORT")');
    await click('Run report');
    await checks('fixtureRequests()',beforeRequired,'missing task ID does not fetch');
    assert.match(await evaluate('document.querySelector(".pve-toolkit-report [role=status]").textContent'),/complete UPID/);
    await evaluate('fixtureAPI.openToolkitSettings()');
    const componentCount=await evaluate('Ext.ComponentManager.getCount()');
    for(let n=0;n<10;n++) await evaluate('fixtureAPI.openToolkitSettings()');
    await checks('Ext.ComponentManager.getCount()',componentCount,'reopening does not leak native components');
    await call('Emulation.setDeviceMetricsOverride',{width:800,height:844,deviceScaleFactor:1,mobile:false});
    await pause(250);
    await checks(fillsContent,true,'open workspace follows viewport resize');
    await evaluate('workspace.down("[region=west]").setWidth(240);workspace.down("[region=south]").setHeight(160);void 0');
    await checks(fillsContent,true,'open workspace follows tree and task-log resizing');
    await checkCategories();
    const narrow = await call('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(cache,'settings-narrow.png'),Buffer.from(narrow.data,'base64'));
    await evaluate('Ext.ComponentQuery.query("tabpanel")[0].setActiveTab(1);void 0');
    const categoryShot = await call('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(cache,'inventory-settings.png'),Buffer.from(categoryShot.data,'base64'));
    await call('Emulation.setDeviceMetricsOverride',{width:640,height:700,deviceScaleFactor:1,mobile:false});
    await pause(100);
    await checkCategories();
    await call('Emulation.setDeviceMetricsOverride',{width:800,height:844,deviceScaleFactor:1,mobile:false});
    await pause(100);
    await evaluate('fixtureAPI.openCatalogReport("INVENTORY")');
    await click('Run report');
    await evaluate('for(let el=document.querySelector(".pve-toolkit-report");el;el=el.parentElement)el.scrollTop=el.scrollHeight;void 0');
    await checks('(()=>{const r=Ext.ComponentQuery.query("button").find(b=>b.text==="Back to Toolkit").el.dom.getBoundingClientRect();return r.width>0 && r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=innerHeight;})()',true,'Back remains visible on a narrow scrolled report');
    const navigationShot = await call('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(cache,'report-navigation-narrow.png'),Buffer.from(navigationShot.data,'base64'));
    await click('Back to Toolkit');
    await checks('Ext.ComponentQuery.query("tabpanel")[0].getActiveTab().title','Inventory');
    await evaluate('Ext.ComponentQuery.query("button").find(b=>b.text==="Return to Proxmox").focus();void 0');
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await checks(workspaceQuery+'.length',0,'Escape returns to native view');
    await checks('preservedSocket.readyState',1,'connection survives settings and all report navigation');
    await click('Toolkit');
    await evaluate('workspace.down("pveResourceTree").fireEvent("itemclick");void 0');
    await checks(workspaceQuery+'.length',0,'tree click exits Toolkit including the already-selected resource');
    await click('Toolkit');
    await evaluate('workspace.child("#content").removeAll();workspace.child("#content").add({xtype:"pvePanelConfig",html:"Next resource"});void 0');
    await checks(workspaceQuery+'.length',0,'native resource navigation tears down Toolkit');
    await checks('Ext.ComponentQuery.query("button").filter(b=>b.text==="Toolkit").length',1,'global launcher persists through resource changes');
    await click('Toolkit');
    await evaluate('workspace.child("#content").removeAll();void 0');
    await checks(workspaceQuery+'.length',0,'logout-style content clearing exits Toolkit');
    await click('Toolkit');
    await checks(workspaceQuery+'.length',0,'empty logged-out content cannot open Toolkit');
    await call('Page.navigate',{url:fixtureURL});
    for(let n=0;n<100;n++){try{if(await evaluate('window.Ext?.isReady && !window.fixtureAPI'))break;}catch{}await pause(50);}
    await evaluate(setupFor(fs.readFileSync(path.join(root,'proxmox-copy-paste.user.js'),'utf8')));
    await click('Copy & Paste');
    await checks(query('checkbox')+'.length',3);
    await checks(query('checkbox')+'.every(c=>c.getValue())',true);
    await checks('typeof fixtureAPI.openCatalogReport','undefined');
    await checks('fixtureRequests()',0);
    assert.deepEqual(runtimeErrors, [], 'no uncaught browser exceptions');
    console.log(JSON.stringify({browser:await call('Browser.getVersion'),extjs:await evaluate('Ext.getVersion().toString()'),checks:'Global Documentation toggle; main-region bounds; native view, iframe document, terminal and real local WebSocket preserved through repeated toggles; surrounding regions usable; resize and cleanup; navigation/logout exit; 22 toggles / three defaults; all report return routes and active-request cancellation; narrow scrolled layout; Escape; three-toggle companion; no uncaught browser exceptions.',screenshots:cache},null,2));
    await call('Browser.close'); socket.close();
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{child.kill();for(const socket of connections)socket.destroy();socketServer.close();});
