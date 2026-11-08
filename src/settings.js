// Persistent settings and native Proxmox UI. Included in configurable editions.
const FEATURE_CATALOG = /* @features */ [];
const SETTINGS_KEY = `proxmox-toolkit:__EDITION_ID__:settings:1:${location.origin}`;
let runtimeSettings;
let settingsLoadError = false;
let toolkitDialog, toolkitLauncher, dialogDispose;
let settingsDraft;
let launcherTimer, launcherDelay = 250, launcherStopped = false;
const localDownloads = new Set();
function defaultSettings() {
    return { schema: 1, features: Object.fromEntries(FEATURE_CATALOG.map(f => [f.id, f.defaultOn])), apiPrefix: '/' };
}
function normalizeSettings(value) {
    const result = defaultSettings();
    if (!value || value.schema !== 1 || !value.features || typeof value.features !== 'object') return result;
    for (const f of FEATURE_CATALOG) if (typeof value.features[f.id] === 'boolean') result.features[f.id] = value.features[f.id];
    if (typeof value.apiPrefix === 'string' && /^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(value.apiPrefix)) result.apiPrefix = value.apiPrefix;
    return result;
}
function featureEnabled(id) { return runtimeSettings?.features[id] === true; }
function nodeElement(tag, text, parent, attributes = {}) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, String(value));
    if (parent) parent.appendChild(el);
    return el;
}
function nativeChild(parent, type, config) {
    const child = page.Ext.create(type, pageOptions(config));
    try { parent.add(child); } catch (error) { child.destroy(); throw error; }
    return child;
}
function localButton(text, parent, handler) {
    const button = page.Ext.create('Ext.button.Button', pageOptions({ text, margin: '4 6 4 0', handler }));
    toolkitDialog.children.push(button);
    button.render(parent);
    return button;
}
function clearLocalContent(parent) {
    for (const button of toolkitDialog?.children || []) {
        if (!button.destroyed && parent.contains(button.getEl()?.dom)) button.destroy();
    }
    if (toolkitDialog) toolkitDialog.children = toolkitDialog.children.filter(button => !button.destroyed);
    parent.replaceChildren();
}
function localField(label, parent, value = '', type = 'text') {
    const wrap = nodeElement('label', label, parent);
    const input = nodeElement('input', undefined, wrap, { type, class: 'x-form-field x-form-text x-form-text-default' });
    input.value = value;
    return input;
}
function closeToolkitDialog(restoreFocus = true, keepDraft = false) {
    if (!keepDraft) settingsDraft = null;
    const old = toolkitDialog;
    toolkitDialog = null;
    dialogDispose?.();
    dialogDispose = null;
    if (!old) return;
    for (const cleanup of old.cleanup) cleanup();
    for (const child of old.children) if (!child.destroyed && !child.destroying) child.destroy();
    if (!old.panel.destroyed && !old.panel.destroying) old.panel.destroy();
    if (restoreFocus && !document.hidden && !toolkitLauncher?.destroyed) toolkitLauncher?.focus();
}
function createToolkitWorkspace(title) {
    if (!page.PVE || !page.Ext?.create || document.hidden) return null;
    toolkitDialog?.captureDraft?.();
    closeToolkitDialog(false, true);
    // Opening settings/reports cancels console intent without undoing sent input.
    // #if INPUT
    cancelPaste();
    // #endif
    // #if WRITE
    pendingWrite?.cancel();
    // #endif
    // #if PANELS
    closePanels();
    // #endif
    try {
        const workspace = toolkitLauncher?.up('pveStdWorkspace');
        const content = workspace?.child('#content');
        if (!content || content.destroyed || !content.isVisible(true) || !content.items.items.length) return null;
        const win = page.Ext.create('Ext.panel.Panel', pageOptions({
            title, layout: 'fit', border: false, pveToolkitWorkspace: true,
            width: content.getWidth(), height: content.getHeight(),
            style: { position: 'absolute', top: '0', left: '0', zIndex: 10 },
        }));
        const session = { panel: win, children: [], cleanup: [] };
        toolkitDialog = session;
        // Render as an unmanaged sibling in #content. Never call setContent,
        // switch its card layout, hide a PVE component or reparent an iframe.
        win.render(content.getEl().dom);
        const listen = (target, event, callback) => {
            const handler = pageOptions({ handler: callback }).handler;
            target.on(event, handler);
            session.cleanup.push(() => { if (!target.destroyed) target.un(event, handler); });
        };
        const leave = () => { if (toolkitDialog === session) closeToolkitDialog(false); };
        for (const event of ['beforeadd', 'beforeremove', 'beforedestroy']) listen(content, event, leave);
        const tree = workspace.down('pveResourceTree');
        if (tree) listen(tree, 'itemclick', leave);
        listen(content, 'resize', () => win.setSize(content.getWidth(), content.getHeight()));
        for (const item of content.items.items) {
            const el = item.getEl()?.dom;
            if (!el) continue;
            const inert = el.getAttribute('inert'), aria = el.getAttribute('aria-hidden');
            // Move focus before marking the old view inaccessible. Inert does
            // not unload the iframe or stop its existing connection.
            win.focus();
            el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true');
            session.cleanup.push(() => {
                if (inert === null) el.removeAttribute('inert'); else el.setAttribute('inert', inert);
                if (aria === null) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', aria);
            });
        }
        const root = win.getEl().dom;
        const escape = event => {
            if (event.key === 'Escape' && !event.defaultPrevented) {
                event.preventDefault(); event.stopPropagation(); closeToolkitDialog();
            }
        };
        root.addEventListener('keydown', escape);
        session.cleanup.push(() => root.removeEventListener('keydown', escape));
        win.on('destroy', pageOptions({ handler: () => {
            if (toolkitDialog?.panel === win) closeToolkitDialog();
        } }).handler);
        return win;
    } catch { closeToolkitDialog(); return null; }
}
function openToolkitDialog(title, category) {
    const win = createToolkitWorkspace(title);
    if (!win) return null;
    let root;
    try {
        root = nodeElement('div', undefined, document.body, {
            id: 'pve-toolkit-report-__EDITION_ID__', class: 'pve-toolkit-report',
        });
        // contentEl lets ExtJS place DOM content inside its scrolling layout target.
        nativeChild(win, 'Ext.Component', { contentEl: root.id, padding: 12,
            cls: 'x-panel-body x-panel-body-default', scrollable: true });
        // Dock navigation outside report content so long results cannot hide it.
        const footer = page.Ext.create('Ext.toolbar.Toolbar', pageOptions({ dock: 'bottom', enableOverflow: true }));
        win.addDocked(footer);
        nativeChild(footer, 'Ext.button.Button', { text: 'Back to Toolkit', iconCls: 'fa fa-arrow-left',
            handler: () => openToolkitSettings(category) });
        nativeChild(footer, 'Ext.toolbar.Fill', {});
        nativeChild(footer, 'Ext.button.Button', { text: 'Return to Proxmox', handler: () => closeToolkitDialog() });
        win.show();
        // Scope layout rules only; colors/fonts come from the installed PVE theme.
        nodeElement('style', `.pve-toolkit-report [hidden]{display:none!important}
            .pve-toolkit-report label{display:inline-flex;align-items:center;gap:6px;margin:4px 12px 4px 0;flex-wrap:wrap}
            .pve-toolkit-report input,.pve-toolkit-report select,.pve-toolkit-report textarea{max-width:100%;padding:5px;min-width:0;border:1px solid currentColor;border-color:color-mix(in srgb,currentColor 35%,transparent)}
            .pve-toolkit-report label:has(textarea){display:flex;width:100%;box-sizing:border-box}
            .pve-toolkit-report textarea{box-sizing:border-box;resize:vertical}
            .pve-toolkit-report input[type=checkbox]{appearance:auto;width:auto}
            .pve-toolkit-report p{line-height:1.5;margin:8px 0}
            .pve-toolkit-report table{border-collapse:collapse;display:block;max-height:50vh;overflow:auto;width:100%;margin-top:12px}
            .pve-toolkit-report th,.pve-toolkit-report td{border:1px solid currentColor;border-color:color-mix(in srgb,currentColor 35%,transparent);padding:7px;text-align:left;vertical-align:top;min-width:110px;max-width:420px;overflow-wrap:anywhere;white-space:pre-wrap}
            .pve-toolkit-report pre{white-space:pre-wrap;overflow-wrap:anywhere}
            .pve-toolkit-report .status{font-weight:600}`, root);
        return root;
    } catch { root?.remove(); closeToolkitDialog(); return null; }
}
function scheduleToolkitLauncher() {
    if (launcherStopped || document.hidden || launcherTimer || (toolkitLauncher && !toolkitLauncher.destroyed)) return;
    launcherTimer = setTimeout(() => {
        launcherTimer = null;
        mountToolkitLauncher();
    }, launcherDelay);
    launcherDelay = Math.min(8000, launcherDelay * 2);
}
function mountToolkitLauncher() {
    if (launcherStopped || document.hidden || (toolkitLauncher && !toolkitLauncher.destroyed)) return;
    try {
        if (!page.PVE || !page.Ext?.ComponentQuery || !document.body) return;
        const candidates = [];
        // Identify global Documentation structurally, without translated labels.
        for (const help of page.Ext.ComponentQuery.query('proxmoxHelpButton')) {
            const owner = help.ownerCt;
            const workspace = help.up?.('pveStdWorkspace');
            if (!help.destroyed && !owner?.destroyed && !workspace?.destroyed && workspace &&
                owner?.region === 'north' && owner.ownerCt === workspace &&
                owner.items?.items.includes(help) && help.isVisible(true) &&
                !help.up('window')) candidates.push(help);
        }
        if (candidates.length !== 1) return;
        const help = candidates[0], header = help.ownerCt;
        for (const child of header.items.items) if (!child.destroyed && child.pveToolkitSettingsButton === '__EDITION_ID__') {
            toolkitLauncher = child; return;
        }
        const button = page.Ext.create('Ext.button.Button', pageOptions({
            text: '__EDITION_ID__' === 'toolkit' ? 'Toolkit' : 'Copy & Paste',
            iconCls: 'fa fa-cog x-btn-icon-el-default-toolbar-small', tooltip: '__EDITION_NAME__ settings',
            // The north container defaults children to x-plain. Explicitly
            // retain the native button base class, as Documentation does.
            baseCls: 'x-btn', ui: help.ui || 'default', scale: help.scale || 'small',
            margin: '0 5 0 0',
            handler: () => { if (toolkitDialog) closeToolkitDialog(); else openToolkitSettings(); },
        }));
        button.pveToolkitSettingsButton = '__EDITION_ID__';
        try {
            header.insert(header.items.items.indexOf(help), button);
            toolkitLauncher = button;
            button.on('destroy', pageOptions({ handler: () => {
                if (toolkitLauncher === button) { closeToolkitDialog(false); toolkitLauncher = null; launcherDelay = 250; scheduleToolkitLauncher(); }
            } }).handler);
            header.updateLayout?.();
            clearTimeout(launcherTimer); launcherTimer = null; launcherDelay = 250;
        } catch { button.destroy(); toolkitLauncher = null; }
    } catch { /* Recover after the workspace becomes available. */ }
    finally { scheduleToolkitLauncher(); }
}
// #if CATALOG
function localDownload(text, extension, mime = 'text/plain;charset=utf-8') {
    let url, anchor, timer;
    const cleanup = () => {
        clearTimeout(timer); anchor?.remove();
        if (url) URL.revokeObjectURL(url);
        localDownloads.delete(cleanup);
    };
    try {
        url = URL.createObjectURL(new Blob([text], { type: mime }));
        anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `proxmox-toolkit-${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`;
        document.body.appendChild(anchor);
        localDownloads.add(cleanup);
        anchor.click(); anchor.remove();
        timer = setTimeout(cleanup, 1000);
    } catch (error) { cleanup(); throw error; }
}
// #endif
function openToolkitSettings(section) {
    const win = createToolkitWorkspace('__EDITION_NAME__ __VERSION__ settings');
    if (!win) return;
    try {
        const draft = settingsDraft || normalizeSettings(runtimeSettings);
        const tabs = nativeChild(win, 'Ext.tab.Panel', { border: false, deferredRender: false,
            tabBar: { layout: { type: 'table', columns: 6 } } });
        const boxes = new Map();
        const categories = new Map();
        const pagers = [];
        let prefix;
        const order = ['Console', 'Inventory', 'Recovery', 'Troubleshooting', 'Maintenance', 'Integration'];
        for (const group of order.filter(name => FEATURE_CATALOG.some(f => f.group === name))) {
            const form = nativeChild(tabs, 'Ext.form.Panel', { title: group, bodyPadding: 8,
                border: false, layout: 'column', scrollable: false });
            categories.set(group, form);
            const cards = [];
            for (const f of FEATURE_CATALOG.filter(f => f.group === group)) {
                const card = nativeChild(form, 'Ext.panel.Panel', { layout: 'anchor', height: 104,
                    bodyPadding: 8, margin: '0 8 8 0', border: true, pveToolkitFeature: f.id });
                cards.push(card);
                boxes.set(f.id, nativeChild(card, 'Ext.form.field.Checkbox', {
                    boxLabel: f.name, checked: draft.features[f.id], name: f.id, anchor: '100%',
                    boxLabelStyle: 'white-space:normal', margin: '0 0 4 0',
                }));
                if (f.description) nativeChild(card, 'Ext.form.field.Display', {
                    hideLabel: true, margin: 0, value: f.description, anchor: '100%',
                });
                // #if CATALOG
                if (REPORT_IDS.includes(f.id)) {
                    nativeChild(card, 'Ext.button.Button', { text: 'Open report', tooltip: f.name,
                        pveToolkitReport: f.id, disabled: !featureEnabled(f.id), handler: () => openCatalogReport(f.id) });
                    nativeChild(card, 'Ext.form.field.Display', { hideLabel: true, margin: 0,
                        value: featureEnabled(f.id) ? 'Collects data only after Run report.' : 'Enable, then Save & Reload to open.' });
                }
                // #endif
                if (f.id === 'CUSTOM_PORT') prefix = nativeChild(card, 'Ext.form.field.Text', {
                    fieldLabel: 'Proxy path prefix', labelWidth: 110, anchor: '100%', value: draft.apiPrefix,
                    emptyText: '/', allowBlank: false,
                });
            }
            const pager = page.Ext.create('Ext.toolbar.Toolbar', pageOptions({ dock: 'bottom', enableOverflow: true }));
            form.addDocked(pager);
            let index = 0, size = 1, updating = false;
            const previous = nativeChild(pager, 'Ext.button.Button', { text: 'Previous',
                handler: () => { index--; arrange(); } });
            const position = nativeChild(pager, 'Ext.toolbar.TextItem', { text: '' });
            const next = nativeChild(pager, 'Ext.button.Button', { text: 'Next',
                handler: () => { index++; arrange(); } });
            // Resize-driven pagination: no timers, observers or repeated discovery.
            const arrange = () => {
                if (updating || !form.rendered || !form.isVisible(true)) return;
                updating = true;
                try {
                    const width = form.body.getWidth() - 16;
                    const columns = width >= 720 ? 2 : 1;
                    const available = form.body.getHeight() - 16;
                    let cardHeight = 104;
                    // Report descriptions add a second text block. Reserve room for
                    // wrapped titles and notes before calculating page capacity.
                    // #if CATALOG
                    if (FEATURE_CATALOG.some(f => f.group === group && f.description && REPORT_IDS.includes(f.id)))
                        cardHeight = width / columns < 420 ? 184 : 152;
                    // #endif
                    size = Math.max(1, Math.floor(available / (cardHeight + 8))) * columns;
                    const pages = Math.ceil(cards.length / size);
                    index = Math.max(0, Math.min(index, pages - 1));
                    page.Ext.suspendLayouts();
                    try {
                        cards.forEach((card, i) => {
                            card.setWidth(Math.floor(width / columns) - 8);
                            card.setHeight(cardHeight);
                            card.setHidden(i < index * size || i >= (index + 1) * size);
                        });
                        previous.setDisabled(index === 0); next.setDisabled(index === pages - 1);
                        position.setText(`Page ${index + 1} of ${pages}`);
                    } finally { page.Ext.resumeLayouts(true); }
                } finally { updating = false; }
            };
            for (const event of ['resize', 'activate']) form.on(event, pageOptions({ handler: arrange }).handler);
            pagers.push(arrange);
        }
        const readDraft = () => ({ schema: 1, apiPrefix: prefix ? prefix.getValue() : '/',
            features: Object.fromEntries([...boxes].map(([id, box]) => [id, !!box.getValue()])) });
        toolkitDialog.captureDraft = () => { settingsDraft = readDraft(); };
        const notices = page.Ext.create('Ext.panel.Panel', pageOptions({ dock: 'bottom', border: false, bodyPadding: '0 8' }));
        win.addDocked(notices);
        const status = nativeChild(notices, 'Ext.form.field.Display', { hideLabel: true, margin: 0, value: settingsLoadError ?
            'Stored settings could not be loaded. Features are inactive until you save a configuration.' :
            'Changes apply after Save & Reload. Only Copy, Paste Only and Paste & Execute default on.' });
        if (categories.has('Integration')) {
            const help = page.Ext.create('Ext.panel.Panel', pageOptions({ dock: 'top', border: false, bodyPadding: '0 8' }));
            categories.get('Integration').addDocked(help);
            nativeChild(help, 'Ext.form.field.Display', { hideLabel: true, margin: 0,
                value: 'Custom origins also need an exact HTTPS include rule in your userscript manager. Use / or /pve/. Disabling features does not remove bundled code or permissions.' });
        }
        const footer = page.Ext.create('Ext.toolbar.Toolbar', pageOptions({ dock: 'bottom', enableOverflow: true }));
        win.addDocked(footer);
        nativeChild(footer, 'Ext.button.Button', { text: 'Restore defaults', handler: () => {
            const defaults = defaultSettings();
            for (const [id, box] of boxes) box.setValue(defaults.features[id]);
            prefix?.setValue('/'); status.setValue('Defaults selected. Save & Reload to apply.');
        } });
        nativeChild(footer, 'Ext.toolbar.Fill', {});
        nativeChild(footer, 'Ext.button.Button', { text: 'Return to Proxmox', handler: () => closeToolkitDialog() });
        const save = nativeChild(footer, 'Ext.button.Button', { text: 'Save & Reload', iconCls: 'fa fa-check', handler: async () => {
            const value = readDraft(), { apiPrefix } = value;
            if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(apiPrefix)) { status.setValue('Use a path such as / or /pve/, with a trailing slash and no query, host or traversal.'); tabs.setActiveTab(categories.get('Integration')); return; }
            if (apiPrefix !== '/' && !value.features.CUSTOM_PORT) { status.setValue('Enable custom origin / proxy support for a non-root prefix.'); tabs.setActiveTab(categories.get('Integration')); return; }
            save.setDisabled(true);
            try {
                if (typeof GM_setValue === 'function') await GM_setValue(SETTINGS_KEY, value);
                else if (typeof GM !== 'undefined' && typeof GM.setValue === 'function') await GM.setValue(SETTINGS_KEY, value);
                else throw Error('storage unavailable');
                location.reload();
            } catch {
                if (!win.destroyed && !win.destroying) {
                    status.setValue('Settings could not be saved. Current configuration is unchanged.');
                    save.setDisabled(false);
                }
            }
        } });
        const resizeTabs = () => {
            if (!tabs.rendered) return;
            const bar = tabs.getTabBar(), layout = bar.getLayout();
            const columns = Math.max(1, Math.min(categories.size, Math.floor(tabs.getWidth() / 155)));
            if (layout.columns !== columns) { layout.columns = columns; bar.updateLayout(); }
            for (const arrange of pagers) arrange();
        };
        tabs.on('resize', pageOptions({ handler: resizeTabs }).handler);
        tabs.setActiveTab(categories.get(section) || categories.get('Console'));
        win.show();
        resizeTabs();
    } catch { closeToolkitDialog(); }
}
function initializeSettings(start) {
    const finish = value => {
        runtimeSettings = normalizeSettings(value);
        if (value && (value.schema !== 1 || !value.features || typeof value.features !== 'object')) settingsLoadError = true;
        if (settingsLoadError) for (const key of Object.keys(runtimeSettings.features)) runtimeSettings.features[key] = false;
        try {
            if (typeof GM_registerMenuCommand === 'function') GM_registerMenuCommand('Toolkit settings (__VERSION__)', openToolkitSettings);
            else if (typeof GM !== 'undefined' && typeof GM.registerMenuCommand === 'function')
                Promise.resolve(GM.registerMenuCommand('Toolkit settings (__VERSION__)', openToolkitSettings)).catch(() => {});
        } catch { /* The header entry works without a manager menu command. */ }
        mountToolkitLauncher();
        window.addEventListener('hashchange', () => { closeToolkitDialog(); mountToolkitLauncher(); });
        window.addEventListener('pagehide', () => {
            launcherStopped = true; clearTimeout(launcherTimer); launcherTimer = null;
            closeToolkitDialog(); for (const cleanup of [...localDownloads]) cleanup();
        });
        window.addEventListener('pageshow', () => { launcherStopped = false; mountToolkitLauncher(); });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) { closeToolkitDialog(); clearTimeout(launcherTimer); launcherTimer = null; }
            else mountToolkitLauncher();
        });
        start();
    };
    try {
        if (typeof GM_getValue === 'function') finish(GM_getValue(SETTINGS_KEY, null));
        else if (typeof GM !== 'undefined' && typeof GM.getValue === 'function')
            Promise.resolve(GM.getValue(SETTINGS_KEY, null)).then(finish, () => { settingsLoadError = true; finish(null); });
        else finish(null);
    } catch { settingsLoadError = true; finish(null); }
}
