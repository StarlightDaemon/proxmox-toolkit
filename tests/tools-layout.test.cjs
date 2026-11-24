const { test } = require('node:test');
const assert = require('node:assert/strict');
const { host, consoleView } = require('./helpers.cjs');
const { features } = require('../tools/features.cjs');

// OL-13: the three clipboard actions stay inline; other console utilities sit
// under Tools by default, or inline when the one persisted preference says so.
const CLIPBOARD = ['Copy', 'Paste Only', 'Paste & Execute'];
const UTILITIES = ['Export Console', 'Diagnostics', 'Recipes', 'Scoped Copy', 'Find in Scrollback', 'Review & Paste'];
const ENABLED = ['COPY', 'PASTE_ONLY', 'PASTE', 'EXPORT', 'DIAGNOSTICS', 'RECIPES', 'SCOPED', 'FIND', 'REVIEW'];
const KEY = 'proxmox-toolkit:toolkit:settings:1:https://pve.example:8006';

function toolbarLabels(view) {
    return view.toolbar.items.items.filter(item => !item.destroyed).map(item => item.text);
}
function utilityTypes(h) {
    return UTILITIES.map(text => h.action(text)?.type);
}
function stored(toolsLayout) {
    const value = { schema: 1, apiPrefix: '/',
        features: Object.fromEntries(features.map(f => [f.id, ENABLED.includes(f.id)])) };
    if (toolsLayout !== undefined) value.toolsLayout = toolsLayout;
    return value;
}
function reloadingLocation(counter) {
    return Object.assign(new URL('https://pve.example:8006/'), { reload() { counter.reloads++; } });
}

for (const [name, toolsLayout] of [['absent (existing saved settings)', undefined], ['grouped', 'grouped'],
    ['unknown value', 'menu'], ['non-string value', true]]) {
    test(`Tools layout ${name}: clipboard inline, utilities grouped under Tools`, () => {
        const view = consoleView();
        const h = host({ views: [view], enabledFeatures: ENABLED, toolsLayout });
        assert.deepEqual(toolbarLabels(view), ['Shell', ...CLIPBOARD, 'Tools']);
        for (const text of CLIPBOARD) assert.equal(h.action(text).type, 'Ext.button.Button', text);
        assert.deepEqual(utilityTypes(h), UTILITIES.map(() => 'Ext.menu.Item'));
        const tools = h.action('Tools');
        assert.equal(tools.pveToolkitToolsButton, true);
        assert.deepEqual(tools.menu.items.items.map(item => item.text), UTILITIES);
    });
}

test('fresh install defaults to the grouped layout with only clipboard actions on', () => {
    const view = consoleView();
    const h = host({ views: [view], freshSettings: true });
    assert.equal(h.api.normalizeSettings(null).toolsLayout, 'grouped');
    assert.deepEqual(toolbarLabels(view), ['Shell', ...CLIPBOARD]);
    assert.equal(h.action('Tools'), undefined);
});

test('inline layout puts enabled utilities on the toolbar in a stable order with no Tools menu', () => {
    const view = consoleView();
    const h = host({ views: [view], enabledFeatures: ENABLED, toolsLayout: 'inline' });
    assert.deepEqual(toolbarLabels(view), ['Shell', ...CLIPBOARD, ...UTILITIES]);
    assert.equal(h.action('Tools'), undefined);
    assert.equal(h.components.some(c => c.type === 'Ext.menu.Menu'), false);
    assert.deepEqual(utilityTypes(h), UTILITIES.map(() => 'Ext.button.Button'));
    // Markers stay on the inline buttons, so overlap detection still works.
    assert.equal(h.action('Export Console').pveToolkitExportButton, true);
    // A second scan neither duplicates nor reorders controls.
    h.scan();
    assert.deepEqual(toolbarLabels(view), ['Shell', ...CLIPBOARD, ...UTILITIES]);
});

test('inline layout keeps a subset of utilities ordered and leaves disabled ones out', () => {
    const view = consoleView();
    host({ views: [view], enabledFeatures: ['COPY', 'FIND', 'DIAGNOSTICS'], toolsLayout: 'inline' });
    assert.deepEqual(toolbarLabels(view), ['Shell', 'Copy', 'Diagnostics', 'Find in Scrollback']);
});

test('inline utilities run their handlers and tear down with the group', () => {
    const view = consoleView();
    const h = host({ views: [view], enabledFeatures: ENABLED, toolsLayout: 'inline' });
    h.action('Export Console').handler();
    const win = h.components.find(c => c.type === 'Ext.window.Window' && !c.destroyed);
    assert.ok(win, 'Export panel opened from an inline button');
    h.action('Diagnostics').destroy();
    assert.equal(win.destroyed, true, 'owner teardown closes the open panel');
    for (const text of [...CLIPBOARD, ...UTILITIES]) assert.equal(h.action(text), undefined, text);
    assert.deepEqual(toolbarLabels(view), ['Shell']);
    // The next scan rebuilds the same inline layout.
    h.scan();
    assert.deepEqual(toolbarLabels(view), ['Shell', ...CLIPBOARD, ...UTILITIES]);
});

test('Console settings show one layout preference, not a 28th feature toggle', () => {
    const h = host({ enabledFeatures: [] });
    h.api.openToolkitSettings();
    const tabs = h.components.find(c => c.type === 'Ext.tab.Panel');
    const consoleTab = tabs.items.items.find(c => c.title === 'Console');
    const cards = consoleTab.items.items.filter(c => c.pveToolkitPreference === 'toolsLayout');
    assert.equal(cards.length, 1);
    const layout = cards[0].children.find(c => c.name === 'toolsLayout');
    assert.equal(layout.type, 'Ext.form.field.ComboBox');
    assert.equal(layout.getValue(), 'grouped');
    assert.deepEqual(Array.from(layout.store, ([value]) => value), ['grouped', 'inline']);
    assert.equal(h.components.filter(c => c.type === 'Ext.form.field.Checkbox').length, 27);
    for (const title of ['Inventory', 'Recovery', 'Troubleshooting', 'Maintenance', 'Integration']) {
        const tab = tabs.items.items.find(c => c.title === title);
        assert.equal(tab.items.items.some(c => c.pveToolkitPreference), false, title);
    }
});

test('the layout preference saves under the unchanged settings key and round-trips', async () => {
    const store = new Map(), counter = { reloads: 0 };
    const h = host({ globals: { GM_getValue: key => store.get(key) ?? null,
        GM_setValue: (key, value) => { store.set(key, structuredClone(value)); },
        location: reloadingLocation(counter) } });
    h.api.openToolkitSettings();
    for (const id of ENABLED) h.components.find(c => !c.destroyed && c.name === id).setValue(true);
    h.components.find(c => !c.destroyed && c.name === 'toolsLayout').setValue('inline');
    await h.action('Save & Reload').handler();
    assert.equal(counter.reloads, 1);
    assert.deepEqual([...store.keys()], [KEY]);
    assert.deepEqual(store.get(KEY), stored('inline'));
    assert.deepEqual(Object.keys(store.get(KEY)).sort(), ['apiPrefix', 'features', 'schema', 'toolsLayout']);

    // A new page load reads the same key and builds the inline toolbar.
    const view = consoleView();
    const after = host({ views: [view], globals: { GM_getValue: key => store.get(key) ?? null } });
    assert.deepEqual(toolbarLabels(view), ['Shell', ...CLIPBOARD, ...UTILITIES]);
    after.api.openToolkitSettings();
    assert.equal(after.components.find(c => !c.destroyed && c.name === 'toolsLayout').getValue(), 'inline');
});

test('Restore defaults returns the layout to grouped and the draft survives internal navigation', async () => {
    const store = new Map([[KEY, stored('inline')]]), counter = { reloads: 0 };
    const h = host({ globals: { GM_getValue: key => store.get(key) ?? null,
        GM_setValue: (key, value) => { store.set(key, structuredClone(value)); },
        location: reloadingLocation(counter) } });
    h.api.openToolkitSettings();
    const layout = () => h.components.find(c => !c.destroyed && c.name === 'toolsLayout');
    assert.equal(layout().getValue(), 'inline');
    h.action('Restore defaults').handler();
    assert.equal(layout().getValue(), 'grouped');
    layout().setValue('inline');
    h.api.openToolkitSettings('Inventory');
    assert.equal(layout().getValue(), 'inline', 'draft preserved across workspace replacement');
    h.action('Restore defaults').handler();
    await h.action('Save & Reload').handler();
    assert.equal(store.get(KEY).toolsLayout, 'grouped');
    assert.deepEqual(store.get(KEY).features, Object.fromEntries(features.map(f => [f.id, f.defaultOn])));
});

test('Copy & Paste edition has no Tools menu, layout preference or extra stored field', async () => {
    const store = new Map(), counter = { reloads: 0 };
    const view = consoleView();
    const h = host({ views: [view], edition: 'copy-paste', globals: { GM_getValue: () => null,
        GM_setValue: (key, value) => { store.set(key, structuredClone(value)); },
        location: reloadingLocation(counter) } });
    assert.deepEqual(toolbarLabels(view), ['Shell', ...CLIPBOARD]);
    assert.equal(h.api.normalizeSettings({ schema: 1, features: {}, toolsLayout: 'inline' }).toolsLayout, undefined);
    h.api.openToolkitSettings();
    assert.equal(h.components.some(c => c.name === 'toolsLayout' || c.pveToolkitPreference), false);
    await h.action('Save & Reload').handler();
    const [[key, value]] = [...store];
    assert.equal(key, 'proxmox-toolkit:copy-paste:settings:1:https://pve.example:8006');
    assert.deepEqual(Object.keys(value).sort(), ['apiPrefix', 'features', 'schema']);
});
