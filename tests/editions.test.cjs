const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { host, consoleView, terminal } = require('./helpers.cjs');
const { manifest, buildEdition } = require('../tools/build.cjs');
const flush = () => new Promise(resolve => setImmediate(resolve));

test('exactly two installable editions are generated at the shared version', () => {
    assert.deepEqual(fs.readdirSync('.').filter(f => f.endsWith('.user.js')).sort(),
        ['proxmox-copy-paste.user.js','proxmox-toolkit.user.js']);
    for (const edition of manifest.editions) {
        const text=fs.readFileSync(edition.file,'utf8').replace(/\r\n/g,'\n');
        assert.equal(text,buildEdition(edition));
        assert.equal(text.match(/^\/\/ @version\s+(\S+)$/m)[1],manifest.version);
        assert.equal(text.match(/^\/\/ @name\s+(.+)$/m)[1], `${edition.name} ${manifest.version}`);
    }
});
test('Copy & Paste physically omits management, utility panels, exports and extra console features', () => {
    const text=buildEdition(manifest.editions.find(e=>e.id==='copy-paste'));
    assert.doesNotMatch(text,/fetch\(|CatalogModel|openExport|openDiagnostics|openRecipes|openReview|openScopedCopy|openFind|function localDownload/);
    assert.match(text,/GM_getValue/);assert.match(text,/GM_setClipboard/);assert.match(text,/navigator.clipboard.readText/);
    assert.match(text,/\['shell', 'lxc'\]/);assert.doesNotMatch(text,/allowed.push\('kvm'\)/);
});
test('version changes stamp both editions without changing their runtime bodies', () => {
    const version=manifest.version,before=manifest.editions.map(buildEdition);
    try {
        manifest.version='99.0.0-test';
        for(const [i,e] of manifest.editions.entries()) {
            const text=buildEdition(e);assert.equal(text.match(/^\/\/ @version\s+(\S+)$/m)[1],manifest.version);
            assert.equal(text.match(/^\/\/ @name\s+(.+)$/m)[1], `${e.name} ${manifest.version}`);
            assert.equal(text.slice(text.indexOf('(() => {')).replaceAll(manifest.version,version),before[i].slice(before[i].indexOf('(() => {')));
        }
    } finally {manifest.version=version;}
});
test('editions preserve namespace and request only used clipboard, storage, menu and page grants', () => {
    for (const edition of manifest.editions) {
        const text = buildEdition(edition);
        assert.match(text, /^\/\/ @namespace\s+homelab$/m);
        assert.deepEqual([...text.matchAll(/^\/\/ @grant\s+(\S+)$/gm)].map(m => m[1]).sort(),
            ['GM_setClipboard', 'GM.setClipboard', 'unsafeWindow', 'GM_getValue', 'GM_setValue',
                'GM_registerMenuCommand', 'GM.getValue', 'GM.setValue', 'GM.registerMenuCommand'].sort());
        const body = text.slice(text.indexOf('(() => {'));
        assert.match(body, /GM_info/); // Still used for clipboard completion; automatically exposed by managers.
        assert.doesNotMatch(text, /^\/\/ @(?:connect|require|resource)\b/m);
    }
});
test('Copy & Paste defaults to three actions and permits each to be disabled', async () => {
    const h=host({views:[consoleView()],edition:'copy-paste'});
    assert.deepEqual(h.created.map(b=>b.text),['Copy','Paste Only','Paste & Execute']);
    await h.click();await h.paste();assert.deepEqual(h.copied,['retained output']);
    for(const feature of ['COPY','PASTE_ONLY','PASTE']) {
        const one=host({views:[consoleView()],edition:'copy-paste',enabledFeatures:[feature]});
        assert.equal(one.created.length,1);
    }
});
test('disabled input needs no navigator and enabled Copy still works', async () => {
    const view=consoleView();delete view.term.paste;delete view.term.input;
    const h=host({views:[view],edition:'copy-paste',enabledFeatures:['COPY'],globals:{navigator:undefined}});
    h.Ext.GlobalEvents=undefined;await h.click();assert.deepEqual(h.copied,['retained output']);
});
for(const order of [['toolkit','copy-paste'],['copy-paste','toolkit']]) test(`overlapping editions refuse duplicate console groups: ${order}`,()=>{
    const view=consoleView(),h=host({views:[view],edition:order[0]});h.installEdition(order[1]);
    for(let n=0;n<10;n++)h.scan();
    for(const label of ['Copy','Paste Only','Paste & Execute'])assert.equal(h.created.filter(b=>b.text===label&&!b.destroyed).length,1);
});
for(const edition of ['toolkit','copy-paste']) {
    test(`${edition} duplicate and teardown recover without leaking`,()=>{
        const h=host({views:[consoleView()],edition});h.installEdition(edition);const count=h.created.length;
        h.created[0].destroy();h.scan();assert.equal(h.created.length,count*2);assert.equal(h.timers.size,0);
    });
    for(const [name,invalidate] of [
        ['terminal',v=>{v.frame.contentWindow.term=terminal();}],
        ['socket',v=>{v.frame.contentWindow.socket={readyState:1};}],
        ['hide/show',(v,h)=>{v.frame.visible=false;h.Ext.GlobalEvents.fireHide();v.frame.visible=true;}],
        ['page hide',(_,h)=>h.events.pagehide()],
        ['missing discovery',(_,h)=>{h.anchors.length=0;h.scan();}],
        ['timeout',(_,h)=>h.advance(15000)],
    ])test(`${edition} cancels stale input after ${name}`,async()=>{
        let resolve;const view=consoleView(),h=host({views:[view],edition,readClipboard:()=>new Promise(r=>{resolve=r;})});
        const pending=h.paste();invalidate(view,h);resolve('late');await pending;
        assert.deepEqual(view.term.sent,[]);assert.equal(h.Ext.GlobalEvents.listeners.size,0);
        assert.equal(h.document.documentElement.hasAttribute('data-proxmox-toolkit-clipboard'),false);
    });
}
for(const action of ['copy','paste'])test(`shared lease blocks a second enabled action during ${action}`,async()=>{
    let resolve,reads=0,writes=0;const h=host({views:[consoleView()],edition:'copy-paste',
        clipboard:()=>{writes++;return action==='copy'?new Promise(r=>{resolve=r;}):undefined;},
        readClipboard:()=>{reads++;return action==='paste'?new Promise(r=>{resolve=r;}):Promise.resolve('text');}});
    const pending=action==='copy'?h.click():h.paste();await(action==='copy'?h.paste():h.click());
    assert.deepEqual({reads,writes},action==='copy'?{reads:0,writes:1}:{reads:1,writes:0});
    resolve('text');await pending;await(action==='copy'?h.paste():h.click());assert.deepEqual({reads,writes},{reads:1,writes:1});
});
test('clipboard ownership cannot be released by an obsolete operation',async()=>{
    let resolve;const view=consoleView(),h=host({views:[view],edition:'copy-paste',readClipboard:()=>new Promise(r=>{resolve=r;})});
    const pending=h.paste();h.document.documentElement.setAttribute('data-proxmox-toolkit-clipboard','replacement');resolve('late');await pending;
    assert.equal(h.document.documentElement.getAttribute('data-proxmox-toolkit-clipboard'),'replacement');assert.deepEqual(view.term.sent,[]);
});
test('Copy & Paste denial, partial input and late rejection release resources without retry',async()=>{
    for(const stage of ['denial','paste','input','late']) {
        let reject,calls=0;const view=consoleView();if(['paste','input'].includes(stage))view.term[stage]=()=>{calls++;throw Error('PRIVATE');};
        const h=host({views:[view],edition:'copy-paste',readClipboard:()=>stage==='denial'?Promise.reject(Error('PRIVATE')):stage==='late'?new Promise((_,r)=>{reject=r;}):Promise.resolve('text')});
        const pending=h.paste();if(stage==='late')h.events.hashchange();await pending;if(stage==='late'){reject(Error('PRIVATE'));await flush();}
        assert.equal(h.Ext.GlobalEvents.listeners.size,0);assert.equal(h.document.documentElement.hasAttribute('data-proxmox-toolkit-clipboard'),false);
        assert.equal(calls,['paste','input'].includes(stage)?1:0);assert.doesNotMatch(JSON.stringify(h.warnings),/PRIVATE/);
    }
});
test('Copy & Paste has one recovery interval, zero hidden discovery and no idle extraction',()=>{
    let rows=0;const views=[consoleView(),consoleView({node:'other'})];for(const v of views)v.term.buffer.normal.getLine=()=>{rows++;throw Error();};
    const h=host({views,edition:'copy-paste'}),before=h.Ext.queries;for(let i=0;i<100;i++)h.scan();
    assert.equal(h.Ext.queries-before,100);assert.equal(h.intervals.length,1);assert.equal(rows,0);
    h.document.hidden=true;const hidden=h.Ext.queries;for(let i=0;i<100;i++)h.scan();assert.equal(h.Ext.queries,hidden);
});
