// ==UserScript==
// @name         Proxmox Toolkit - manager probe
// @namespace    homelab
// @version      0.5.0-rc.1
// @description  Temporary capability and integration checks. No UI changes, clipboard calls, or terminal text.
// @include      https://*:8006/*
// @grant        GM_setClipboard
// @grant        GM_info
// @grant        GM.setClipboard
// @grant        GM.info
// @grant        unsafeWindow
// @run-at       document-idle
// @noframes
// @license      MIT
// ==/UserScript==

(() => {
    'use strict';
    if (window.top !== window.self || location.protocol !== 'https:' || location.port !== '8006') return;
    const report = { probe: 'proxmox-copy-console/manager/0.4.0', diagnosticRevision: 2 };
    try {
        const modern = typeof GM !== 'undefined' ? GM : undefined;
        const info = typeof GM_info !== 'undefined' ? GM_info : modern?.info;
        const known = ['Tampermonkey', 'Violentmonkey', 'Greasemonkey', 'FireMonkey', 'ScriptCat', 'OrangeMonkey'];
        report.manager = known.includes(info?.scriptHandler) ? info.scriptHandler : 'Other/unknown';
        report.legacyClipboard = typeof GM_setClipboard === 'function';
        report.modernClipboard = typeof modern?.setClipboard === 'function';
        report.cloneInto = typeof cloneInto === 'function';
        report.pagePath = typeof unsafeWindow !== 'undefined' ? 'unsafeWindow' :
            (window.wrappedJSObject ? 'wrappedJSObject' : 'window');
        const page = typeof unsafeWindow !== 'undefined' ? unsafeWindow : (window.wrappedJSObject || window);
        report.proxmoxGlobal = !!page.PVE;
        report.extQuery = typeof page.Ext?.ComponentQuery?.query === 'function';
        report.extCreate = typeof page.Ext?.create === 'function';
        // Inspect availability only: do not query components, clone objects,
        // export callbacks, read buffer rows, or exercise clipboard permissions.
    } catch {
        report.error = 'Userscript integration unavailable';
    }
    console.log(JSON.stringify(report, null, 2));

    // One delayed pass gives Proxmox time to build its view. Run in the manager
    // sandbox: page devtools cannot reproduce these compartment boundaries.
    setTimeout(() => {
        const detail = { probe: 'proxmox-copy-console/integration/2', checks: {}, anchors: [] };
        function check(target, name, operation) {
            try {
                const value = operation();
                target[name] = { ok: true };
                return value;
            } catch (error) {
                // Never serialize page exceptions: messages may contain private data.
                let kind = 'Other';
                try {
                    const name = error?.name;
                    if (['Error', 'TypeError', 'SecurityError', 'PermissionDeniedError', 'DataCloneError']
                        .includes(name)) kind = name;
                } catch { /* The exception itself may be inaccessible. */ }
                target[name] = { ok: false, error: kind };
                return undefined;
            }
        }
        check(detail.checks, 'inspect', () => {
            const page = typeof unsafeWindow !== 'undefined' ? unsafeWindow : (window.wrappedJSObject || window);
            if (typeof cloneInto === 'function') {
                check(detail.checks, 'clonePlain', () => {
                    if (cloneInto({ marker: true }, page)?.marker !== true) throw new TypeError();
                });
                check(detail.checks, 'cloneCallback', () => {
                    const shared = cloneInto({ handler: () => {} }, page, { cloneFunctions: true });
                    if (typeof shared?.handler !== 'function') throw new TypeError();
                    shared.handler();
                });
            }
            const anchors = check(detail.checks, 'query', () => page.Ext.ComponentQuery.query('pveConsoleButton'));
            if (!anchors) return;
            check(detail.checks, 'iterate', () => {
                for (const anchor of anchors) {
                    if (detail.anchors.length >= 10) break;
                    const item = { checks: {} };
                    detail.anchors.push(item);
                    check(item.checks, 'identity', () => {
                        item.supported = !anchor.destroyed && anchor.isVisible(true) &&
                            ['shell', 'lxc'].includes(anchor.consoleType) && !!anchor.nodename &&
                            (anchor.consoleType !== 'lxc' || !!anchor.vmid);
                    });
                    if (!item.supported) continue;
                    const toolbar = check(item.checks, 'toolbar', () => anchor.up('toolbar'));
                    if (!toolbar) continue;
                    check(item.checks, 'membership', () => {
                        item.member = toolbar.items.items.includes(anchor);
                    });
                    // These mirror page-array callback calls in the production script.
                    check(item.checks, 'anchorFilter', () => {
                        item.singleAnchor = anchors.filter(candidate =>
                            !candidate.destroyed && candidate.up('toolbar') === toolbar).length === 1;
                    });
                    check(item.checks, 'buttonSome', () => {
                        item.existingButton = toolbar.items.items.some(candidate =>
                            !candidate.destroyed && candidate.pveCopyConsoleButton);
                    });
                    check(item.checks, 'ownerFrames', () => {
                        const root = toolbar.ownerCt?.getEl()?.dom;
                        item.ownerElement = !!root;
                        item.hasFrames = !!root?.querySelectorAll('iframe').length;
                    });
                }
            });
        });
        console.log(JSON.stringify(detail, null, 2));
    }, 5000);
})();
