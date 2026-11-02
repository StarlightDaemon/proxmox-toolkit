const { test } = require('node:test');
const assert = require('node:assert/strict');
const { host, consoleView } = require('./helpers.cjs');

test('six categories own every setting and each report launcher sits beside its toggle', () => {
    const h = host({ enabledFeatures: ['INVENTORY'] });
    h.api.openToolkitSettings();
    const tabs = h.components.find(c => c.type === 'Ext.tab.Panel');
    assert.deepEqual(tabs.items.items.map(c => c.title),
        ['Console', 'Inventory', 'Recovery', 'Troubleshooting', 'Maintenance', 'Integration']);
    assert.equal(tabs.activeTab.title, 'Console');
    const { features, reports } = require('../tools/features.cjs');
    for (const f of features) {
        const category = tabs.items.items.find(c => c.title === f.group);
        const card = category.items.items.find(c => c.pveToolkitFeature === f.id);
        assert.ok(card.children.some(c => c.name === f.id), f.id);
        if (reports.includes(f.id)) {
            const button = card.children.find(c => c.pveToolkitReport === f.id);
            assert.equal(button.text, 'Open report');
            assert.equal(button.disabled, f.id !== 'INVENTORY');
        }
    }
    assert.equal(h.action('Save & Reload').destroyed, undefined);
});

test('draft survives internal settings replacement, but returning to Proxmox discards it', () => {
    const h = host({ enabledFeatures: [] });
    h.api.openToolkitSettings();
    h.components.find(c => c.name === 'INVENTORY').setValue(true);
    h.components.find(c => c.fieldLabel === 'Proxy path prefix').setValue('/unfinished');
    h.api.openToolkitSettings('Inventory');
    assert.equal(h.components.find(c => !c.destroyed && c.name === 'INVENTORY').getValue(), true);
    assert.equal(h.components.find(c => !c.destroyed && c.fieldLabel === 'Proxy path prefix').getValue(), '/unfinished');
    assert.equal(h.components.find(c => !c.destroyed && c.pveToolkitReport === 'INVENTORY').disabled, true,
        'draft enablement cannot activate a report');
    h.components.find(c => !c.destroyed && c.text === 'Return to Proxmox').handler();
    h.api.openToolkitSettings();
    assert.equal(h.components.find(c => !c.destroyed && c.name === 'INVENTORY').getValue(), false);
    assert.equal(h.components.find(c => !c.destroyed && c.fieldLabel === 'Proxy path prefix').getValue(), '/');
});

test('invalid proxy settings select Integration and never write or reload', async () => {
    let writes = 0;
    const h = host({ globals: { GM_setValue() { writes++; } } });
    h.api.openToolkitSettings();
    const tabs = h.components.find(c => c.type === 'Ext.tab.Panel');
    const prefix = h.components.find(c => c.fieldLabel === 'Proxy path prefix');
    prefix.setValue('/unfinished');
    await h.action('Save & Reload').handler();
    assert.equal(tabs.activeTab.title, 'Integration');
    prefix.setValue('/pve/');
    await h.action('Save & Reload').handler();
    assert.equal(writes, 0);
    assert.ok(h.components.some(c => c.value === 'Enable custom origin / proxy support for a non-root prefix.'));
});

test('native header entry precedes translated Documentation and opens workspace with all features off', () => {
    const h = host({ enabledFeatures: [] });
    assert.deepEqual(h.header.items.items.map(b => b.text), ['Toolkit', 'Dokumentation']);
    assert.equal(h.intervals.length, 0);
    assert.equal(h.timers.size, 0);
    h.header.items.items[0].handler();
    const win = h.components.find(c => c.pveToolkitWorkspace);
    assert.equal(win.title, `Proxmox Toolkit ${require('../tools/editions.json').version} settings`);
    assert.equal(win.modal, undefined);
    assert.equal(win.width, 800);
    assert.equal(win.height, 600);
    assert.equal(h.nativeRoot.getAttribute('inert'), '');
    assert.equal(win.visible, true);
    const boxes = h.components.filter(c => c.type === 'Ext.form.field.Checkbox');
    assert.equal(boxes.length, 22);
    assert.equal(boxes.some(c => c.getValue()), false);
    h.action('Return to Proxmox').handler();
    assert.equal(h.nativeRoot.getAttribute('inert'), null);
    assert.equal(h.contentListeners.size, 0);
    assert.equal(win.destroyed, true);
    assert.equal(boxes.every(c => c.destroyed), true);
    assert.equal(h.header.items.items[0].destroyed, undefined);
});

test('header discovery recovers late startup without console polling; mounted header has no retry timer', () => {
    const h = host({ enabledFeatures: [], headerReady: false });
    assert.equal(h.header.items.items.length, 1);
    assert.equal(h.timers.size, 1);
    h.advance(250);
    assert.equal(h.timers.size, 1);
    h.helpButtons.push(h.help);
    h.advance(500);
    assert.equal(h.header.items.items[0].text, 'Toolkit');
    assert.equal(h.timers.size, 0);
    assert.equal(h.Ext.queries, 0, 'no console discovery');
    h.header.items.items[0].destroy();
    h.advance(250);
    assert.equal(h.header.items.items.length, 2, 'one replacement after native header control destruction');
    assert.equal(h.timers.size, 0);
});

test('ambiguous and modal Help buttons never receive Toolkit; hidden/unloaded page stops retries', () => {
    const h = host({ enabledFeatures: [], headerReady: false });
    h.helpButtons.push({ ownerCt: { region: 'center' } });
    h.advance(250);
    assert.equal(h.header.items.items.length, 1);
    const second = host({ enabledFeatures: [], headerReady: false });
    h.helpButtons.push(h.help, second.help);
    h.advance(500);
    assert.equal(h.header.items.items.length, 1, 'ambiguous resource Help is not guessed');
    h.document.hidden = true; h.events.visibilitychange();
    assert.equal(h.timers.size, 0);
    h.helpButtons.splice(2); h.header.items.items.splice(1);
    h.document.hidden = false; h.events.visibilitychange();
    assert.equal(h.header.items.items[0].text, 'Toolkit');
    h.events.pagehide();
    h.header.items.items[0].destroy();
    assert.equal(h.timers.size, 0);
    h.events.pageshow();
    assert.equal(h.header.items.items[0].text, 'Toolkit');
});

test('duplicate edition does not add another header entry', () => {
    const h = host({ enabledFeatures: [] });
    h.installEdition('toolkit');
    assert.equal(h.header.items.items.length, 2);
    assert.equal(h.timers.size, 0);
});

test('resource Help sharing the Documentation xtype is never the settings anchor', () => {
    const h = host({ enabledFeatures: [], headerReady: false });
    const globalHeader = { dock: 'top', items: { items: [] },
        insert(i, b) { this.items.items.splice(i, 0, b); } };
    const documentation = { ownerCt: globalHeader, text: 'Documentation', isVisible: () => true,
        up: selector => selector === 'pveStdWorkspace' ? {} : null };
    globalHeader.items.items.push(documentation);
    h.helpButtons.push(documentation);
    h.advance(250);
    assert.equal(globalHeader.items.items.length, 1, 'resource Help remains untouched');
    assert.equal(h.header.items.items.length, 1);
    h.helpButtons.push(h.help);
    h.advance(500);
    assert.equal(h.header.items.items[0].text, 'Toolkit');
    assert.equal(globalHeader.items.items.length, 1);
    assert.equal(h.timers.size, 0);
});

test('hidden Documentation and modal Help are excluded until the global header is visible', () => {
    const h = host({ enabledFeatures: [], headerReady: false });
    h.help.isVisible = () => false;
    h.helpButtons.push(h.help);
    h.advance(250);
    assert.equal(h.header.items.items.length, 1);
    h.help.isVisible = () => true;
    const up = h.help.up;
    h.help.up = selector => selector === 'window' ? {} : up(selector);
    h.advance(500);
    assert.equal(h.header.items.items.length, 1);
    h.help.up = up;
    h.advance(1000);
    assert.equal(h.header.items.items[0].text, 'Toolkit');
});

test('manager menu and settings title expose the same manifest version', () => {
    let label, open;
    const h = host({ enabledFeatures: [], globals: {
        GM_registerMenuCommand(text, handler) { label = text; open = handler; },
    } });
    const version = require('../tools/editions.json').version;
    assert.equal(label, `Toolkit settings (${version})`);
    open();
    assert.equal(h.components.find(c => c.pveToolkitWorkspace).title, `Proxmox Toolkit ${version} settings`);
});

test('header toggles without modifying native content and restores existing accessibility attributes', () => {
    const h = host({ enabledFeatures: [] });
    const original = h.content.items.items[0];
    h.nativeRoot.setAttribute('aria-hidden', 'false');
    h.nativeRoot.setAttribute('inert', 'original');
    for (let n = 0; n < 5; n++) {
        h.header.items.items[0].handler();
        assert.equal(h.content.items.items[0], original);
        assert.equal(h.contentListeners.size, 4);
        h.header.items.items[0].handler();
        assert.equal(h.contentListeners.size, 0);
        assert.equal(h.nativeRoot.getAttribute('aria-hidden'), 'false');
        assert.equal(h.nativeRoot.getAttribute('inert'), 'original');
    }
    assert.ok(h.components.filter(c => c.pveToolkitWorkspace).every(c => c.destroyed));
});

for (const event of ['beforeadd', 'beforeremove', 'beforedestroy']) test(`native content ${event} closes workspace and removes listeners`, () => {
    const h = host({ enabledFeatures: [] });
    h.api.openToolkitSettings();
    h.content.fire(event);
    assert.equal(h.components.find(c => c.pveToolkitWorkspace).destroyed, true);
    assert.equal(h.contentListeners.size, 0);
    assert.equal(h.nativeRoot.getAttribute('inert'), null);
});

test('opening Toolkit cancels pending clipboard input and preserves the console objects', async () => {
    let resolve;
    const view = consoleView();
    const h = host({ views: [view], readClipboard: () => new Promise(r => { resolve = r; }) });
    const frame = view.frame, term = view.term, socket = frame.contentWindow.socket;
    const pending = h.paste();
    h.api.openToolkitSettings();
    resolve('must not send'); await pending;
    assert.deepEqual(term.sent, []);
    assert.equal(h.api.resolveConsole(view.anchor), null);
    h.action('Return to Proxmox').handler();
    assert.equal(view.frame, frame); assert.equal(view.term, term); assert.equal(frame.contentWindow.socket, socket);
    assert.ok(h.api.resolveConsole(view.anchor));
});

test('workspace follows content resize without a polling timer', () => {
    const h = host({ enabledFeatures: [] });
    h.api.openToolkitSettings();
    h.content.getWidth = () => 510; h.content.getHeight = () => 430;
    h.content.fire('resize');
    const panel = h.components.find(c => c.pveToolkitWorkspace);
    assert.equal(panel.width, 510); assert.equal(panel.height, 430);
    assert.equal(h.intervals.length, 0); assert.equal(h.timers.size, 0);
});

test('partial workspace setup failure restores native accessibility and destroys owned panel', () => {
    const h = host({ enabledFeatures: [] });
    const original = h.Ext.create;
    h.Ext.create = (type, config) => {
        const panel = original(type, config);
        if (config.pveToolkitWorkspace) panel.el.addEventListener = () => { throw Error('fixture render failure'); };
        return panel;
    };
    h.api.openToolkitSettings();
    assert.equal(h.components.find(c => c.pveToolkitWorkspace).destroyed, true);
    assert.equal(h.nativeRoot.getAttribute('inert'), null);
    assert.equal(h.nativeRoot.getAttribute('aria-hidden'), null);
    assert.equal(h.contentListeners.size, 0);
});

for (const edition of ['toolkit', 'copy-paste']) test(`${edition} console order follows increasing action impact`, () => {
    for (const enabledFeatures of [undefined, ['COPY', 'PASTE'], ['PASTE_ONLY', 'PASTE']]) {
        const v = consoleView();
        host({ views: [v], edition, enabledFeatures });
        const labels = v.toolbar.items.items.slice(1).filter(b => b.pveCopyConsoleButton || b.pveToolkitPasteButton || b.pveToolkitPasteOnlyButton).map(b => b.text);
        assert.deepEqual(labels, enabledFeatures?.includes('COPY') ? ['Copy', 'Paste & Execute'] :
            enabledFeatures ? ['Paste Only', 'Paste & Execute'] : ['Copy', 'Paste Only', 'Paste & Execute']);
    }
});

test('native settings save failure retains draft and enables retry; restore defaults stays unsaved', async () => {
    let writes = 0;
    const h = host({ enabledFeatures: [], globals: { GM_setValue() { writes++; throw Error('private'); } } });
    h.api.openToolkitSettings();
    h.action('Restore defaults').handler();
    assert.equal(writes, 0);
    const boxes = h.components.filter(c => c.type === 'Ext.form.field.Checkbox');
    assert.equal(boxes.filter(b => b.getValue()).length, 3);
    await h.action('Save & Reload').handler();
    assert.equal(writes, 1);
    assert.equal(h.action('Save & Reload').disabled, false);
    assert.ok(h.components.some(c => c.value === 'Settings could not be saved. Current configuration is unchanged.'));
    h.events.hashchange();
    assert.equal(boxes.every(c => c.destroyed), true);
});
