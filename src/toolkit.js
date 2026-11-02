// Shared source for generated standalone editions; see tools/build.cjs.
(() => {
    'use strict';

    const TAG = '[__EDITION_NAME__]';
    const SCAN_INTERVAL_MS = 500;
    const FEEDBACK_DURATION_MS = 1500;
    // #if WRITE
    const CLIPBOARD_TIMEOUT_MS = 5000;
    // #endif
    // #if INPUT
    const PASTE_TIMEOUT_MS = 15000;
    const MAX_PASTE_LENGTH = 65536;
    // #endif
    // #if COPY
    const COPY_ICON = 'fa fa-copy';
    const COPY_TOOLTIP = 'Copy the full retained console buffer to the clipboard';
    // #endif
    // #if INPUT
    const PASTE_TOOLTIP = 'Paste clipboard text, remove trailing line breaks, then send Enter to this console';
    const PASTE_UNAVAILABLE = 'Paste unavailable: a connected console and browser clipboard reading are required';
    // #endif
    const UNAVAILABLE = 'Console unavailable or ambiguous';
    let ACTIONS = /* @actions */ [];
    const ACTION_ORDER = ['pveCopyConsoleButton', 'pveToolkitPasteOnlyButton', 'pveToolkitPasteButton',
        'pveToolkitToolsButton', 'pveToolkitExportButton', 'pveToolkitDiagnosticsButton', 'pveToolkitRecipesButton',
        'pveToolkitScopedButton', 'pveToolkitFindButton', 'pveToolkitReviewButton'];
    const CLIPBOARD_LOCK = 'data-proxmox-toolkit-clipboard';
    const controls = new Map();
    // #if PANELS
    const panels = new Set();
    // #endif
    // #if EXPORT
    const downloads = new Set();
    // #endif
    let clipboardLease = null;
    let clipboardPending = false;
    // #if WRITE
    let pendingWrite = null;
    // #endif
    // #if INPUT
    let pendingPaste = null;
    // #endif
    let lastWarning = -Infinity;

    // Include globs vary between managers; validate the actual URL as well.
    if (window.top !== window.self || location.protocol !== 'https:') return;
    const page = typeof unsafeWindow !== 'undefined' ? unsafeWindow : (window.wrappedJSObject || window);

    function pageOptions(options) {
        if (typeof cloneInto !== 'function') return options;
        const shared = { ...options };
        const callbacks = {};
        for (const key of Object.keys(shared)) {
            if (typeof shared[key] === 'function') {
                // These callbacks take no page arguments and return no sandbox
                // objects (including privileged promises) to the page.
                callbacks[key] = () => { void options[key](); };
                delete shared[key];
            }
        }
        // FireMonkey's function-cloning bridge differs from plain cloneInto.
        // Export functions separately when the manager exposes Firefox's API.
        if (typeof exportFunction === 'function') {
            const result = cloneInto(shared, page);
            for (const key of Object.keys(callbacks)) result[key] = exportFunction(callbacks[key], page);
            return result;
        }
        return cloneInto({ ...shared, ...callbacks }, page, { cloneFunctions: true });
    }

    // Restrict installation to trusted hosts in the userscript manager. Page
    // globals are integration points, not authentication or a security boundary.
    function warnInstall() {
        if (Date.now() - lastWarning >= 30000) {
            console.warn(TAG, 'Console integration unavailable; retrying automatically');
            lastWarning = Date.now();
        }
    }

    function isVisibleElement(element) {
        if (!element?.isConnected) return false;
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
    }

    // Firefox may expose iframe globals directly or through wrappedJSObject.
    function getTerminalFromFrame(frame) {
        for (const wrapped of [false, true]) {
            try {
                const win = frame.contentWindow;
                const term = (wrapped ? win?.wrappedJSObject : win)?.term;
                if (term?.buffer && typeof term.buffer === 'object') return term;
            } catch {
                // Inaccessible, initializing, or disposed frame: try the next path.
            }
        }
        return null;
    }

    function consoleIdentity(anchor) {
        if (!anchor || anchor.destroyed || !anchor.isVisible(true)) return null;
        const type = anchor.consoleType;
        const node = anchor.nodename;
        const allowed = ['shell', 'lxc'];
        // #if SERIAL
        if (featureEnabled('SERIAL')) allowed.push('kvm');
        // #endif
        if (!allowed.includes(type) || typeof node !== 'string' || !node) return null;
        const vmid = type !== 'shell' ? anchor.vmid : undefined;
        if (type !== 'shell' && (!vmid || !['string', 'number'].includes(typeof vmid))) return null;
        return { type, node, vmid: String(vmid) };
    }

    function matchesIdentity(frame, identity, observation) {
        try {
            // Read the loaded URL, not a stale src attribute after migration/reload.
            const url = new URL(frame.contentWindow.location.href);
            const params = url.searchParams;
            return url.origin === location.origin &&
                params.get('xtermjs') === '1' &&
                params.get('console') === identity.type &&
                params.get('node') === identity.node &&
                !params.has('remote') &&
                (identity.type === 'shell' || params.get('vmid') === identity.vmid);
        } catch {
            if (observation) observation.inaccessibleFrames++;
            return false;
        }
    }

    function resolveConsole(anchor, anchors, observation) {
        const fail = reason => { if (observation) observation.reason = reason; return null; };
        if (observation) Object.assign(observation, { anchorCount: null, matchingFrames: null, inaccessibleFrames: null, reason: null });
        // #if SETTINGS
        if (toolkitDialog) return fail('TOOLKIT_OPEN');
        // #endif
        if (document.hidden) return fail('DOCUMENT_HIDDEN');
        const identity = consoleIdentity(anchor);
        if (!identity) return fail('CONTEXT_INELIGIBLE');
        const toolbar = anchor.up('toolbar');
        if (!toolbar?.items?.items.includes(anchor)) return fail('OWNER_UNAVAILABLE');
        const candidates = anchors || page.Ext.ComponentQuery.query('pveConsoleButton');
        let anchorCount = 0;
        // Iterate locally: page-array methods cannot invoke sandbox callbacks
        // in managers with strict Firefox compartment boundaries.
        for (const item of candidates) {
            if (!item.destroyed && item.up('toolbar') === toolbar) anchorCount++;
        }
        if (observation) observation.anchorCount = anchorCount;
        if (anchorCount !== 1) return fail(anchorCount > 1 ? 'ANCHOR_AMBIGUOUS' : 'CONSOLE_MISSING');
        const owner = toolbar?.ownerCt;
        const root = owner?.getEl()?.dom;
        if (!root || owner.destroyed || toolbar.destroyed) return fail('OWNER_UNAVAILABLE');
        const matches = [];
        if (observation) observation.inaccessibleFrames = 0;
        for (const frame of root.querySelectorAll('iframe')) {
            if (!isVisibleElement(frame) || !matchesIdentity(frame, identity, observation)) continue;
            matches.push(frame);
        }
        // Even an initializing second frame makes ownership ambiguous.
        if (observation) observation.matchingFrames = matches.length;
        if (matches.length !== 1) return fail(matches.length > 1 ? 'CONSOLE_AMBIGUOUS' :
            observation?.inaccessibleFrames ? 'FRAME_INACCESSIBLE' : 'CONSOLE_MISSING');
        const frame = matches[0];
        const term = getTerminalFromFrame(frame);
        return term ? { frame, term, toolbar } : fail('TERMINAL_API_UNAVAILABLE');
    }

    // #if INPUT
    function canReadClipboard() {
        return typeof navigator !== 'undefined' &&
            typeof navigator.clipboard?.readText === 'function' && !!navigator.userActivation;
    }

    function inputSession(state, current = resolveConsole(state.anchor)) {
        const events = page.Ext?.GlobalEvents;
        if (!current || current.toolbar !== state.toolbar ||
            typeof events?.on !== 'function' || typeof events.un !== 'function' ||
            typeof current.term.paste !== 'function' ||
            (state.execute && typeof current.term.input !== 'function') ||
            current.term.options?.disableStdin) return null;
        for (const wrapped of [false, true]) {
            try {
                const win = current.frame.contentWindow;
                const globals = wrapped ? win?.wrappedJSObject : win;
                // Proxmox's connection state and socket are page integration points.
                // A readable retained buffer alone does not establish a live session.
                const socket = globals?.socket;
                if (globals?.term !== current.term || typeof globals.states?.connected !== 'number' ||
                    globals.state !== globals.states.connected || socket?.readyState !== 1) continue;
                return { ...current, socket, href: win.location.href };
            } catch { /* Initializing, disconnected, or inaccessible frame. */ }
        }
        return null;
    }

    function sameInputSession(operation, requireFocus = false, resolvedConsole) {
        if (operation.cancelled || !clipboardOwned() || operation.state.button.destroyed || document.hidden ||
            (requireFocus && !document.hasFocus()) || location.href !== operation.pageHref ||
            Date.now() >= operation.deadline) return false;
        const current = inputSession(operation.state, resolvedConsole);
        const original = operation.current;
        return !!current && current.frame === original.frame && current.term === original.term &&
            current.socket === original.socket && current.href === original.href;
    }

    function cancelPaste() {
        if (pendingPaste) {
            pendingPaste.cancelled = true;
            pendingPaste.cancel();
        }
    }

    function validatePendingPaste(resolvedConsole) {
        if (pendingPaste) {
            try { if (!sameInputSession(pendingPaste, false, resolvedConsole)) cancelPaste(); } catch { cancelPaste(); }
        }
    }

    function preparePaste(text, term) {
        if (typeof text !== 'string' || !text.length) return { error: 'Clipboard has no text; nothing sent' };
        if (text.length > MAX_PASTE_LENGTH) return { error: 'Clipboard exceeds 65,536 characters; nothing sent' };
        // Preserve spaces/Unicode. Reject terminal control bytes and malformed UTF-16
        // rather than silently changing commands or failing in Proxmox's UTF-8 encoder.
        if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/u.test(text) || !text.isWellFormed()) {
            return { error: 'Clipboard contains unsupported control characters or Unicode; nothing sent' };
        }
        text = text.replace(/\r\n?/g, '\n').replace(/\n+$/u, '');
        if (!text.trim()) return { error: 'Clipboard has no command text; nothing sent' };
        if (/[\n\t]/u.test(text) && !(term.modes?.bracketedPasteMode === true &&
            term.options?.ignoreBracketedPasteMode !== true)) {
            return { error: 'Multiline text and tabs require bracketed paste mode; nothing sent' };
        }
        return { text };
    }

    // #endif
    // #if EXTRACT
    function extractBuffer(buffer, cols) {
        if (!buffer || typeof buffer.getLine !== 'function' ||
            !Number.isSafeInteger(buffer.length) || buffer.length < 0) return null;
        const lines = [];
        const length = buffer.length;
        let logicalLine = null;
        function finishLine() {
            if (logicalLine === null) return;
            // Preserve Unicode whitespace; terminal ASCII padding is intentionally
            // trimmed only once the complete logical line has been reconstructed.
            lines.push(logicalLine.replace(/ +$/u, ''));
            logicalLine = null;
        }
        for (let y = 0; y < length; y++) {
            const line = buffer.getLine(y);
            if (!line) {
                finishLine();
                lines.push('');
                continue;
            }
            let end = Number.isSafeInteger(cols) ? Math.min(cols, line.length) : line.length;
            const next = buffer.getLine(y + 1);
            // A wide glyph wrapping from the last column leaves an empty cell,
            // not a literal space. Omit only that specific placeholder.
            if (next?.isWrapped && end > 0 && line.getCell && next.getCell &&
                line.getCell(end - 1)?.getChars() === '' &&
                line.getCell(end - 1)?.getWidth() === 1 &&
                next.getCell(0)?.getWidth() === 2) end--;
            const text = line.translateToString(false, 0, end);
            if (line.isWrapped && logicalLine !== null) logicalLine += text;
            else {
                finishLine();
                logicalLine = text;
            }
        }
        finishLine();
        while (lines.length && lines[lines.length - 1] === '') lines.pop();
        return { text: lines.join('\n'), logicalLines: lines.length, physicalLines: length };
    }

    function extractFullConsole(term) {
        const buffers = term?.buffer;
        if (!buffers) return null;
        const alternateScreen = !!buffers.alternate && buffers.active === buffers.alternate;
        const result = extractBuffer(alternateScreen ? buffers.active :
            (buffers.normal || buffers.active), term.cols);
        return result && { ...result, alternateScreen };
    }

    // #endif
    // #if WRITE
    function writeClipboard(text, state) {
        return new Promise((resolve, reject) => {
            let settled = false;
            const finish = (result, error) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                if (pendingWrite === operation) pendingWrite = null;
                if (error) reject(error);
                else resolve(result);
            };
            const operation = { state, href: location.href, cancel: () => finish({ cancelled: true }) };
            pendingWrite = operation;
            const timer = setTimeout(() => finish({ timedOut: true }), CLIPBOARD_TIMEOUT_MS);
            try {
                const legacy = typeof GM_setClipboard === 'function';
                const modern = typeof GM !== 'undefined' ? GM : undefined;
                const info = typeof GM_info !== 'undefined' ? GM_info : modern?.info;
                const callbackSupported = legacy && info?.scriptHandler === 'Tampermonkey';
                // Select by availability, never retry another API after a write.
                // Preserve the modern method's receiver; not all GM.* calls
                // return promises (Greasemonkey documents a void return here).
                const written = legacy
                    ? (callbackSupported
                        ? GM_setClipboard(text, undefined, () => finish({ confirmed: true }))
                        : GM_setClipboard(text))
                    : modern.setClipboard(text);
                if (written && typeof written.then === 'function') {
                    Promise.resolve(written).then(
                        () => finish({ confirmed: true }), error => finish(null, error));
                } else if (!callbackSupported) {
                    // A void return has no completion signal, for either API style.
                    finish({ confirmed: false });
                }
            } catch (error) {
                finish(null, error);
            }
        });
    }

    // #endif
    // A DOM attribute coordinates separate manager sandboxes without exporting
    // privileged functions or clipboard text. Page tampering can block actions;
    // this is coordination on a trusted page, not an authentication boundary.
    function clipboardBusy() {
        return clipboardPending || document.documentElement.hasAttribute(CLIPBOARD_LOCK);
    }

    function acquireClipboard() {
        if (clipboardBusy()) return false;
        clipboardLease = crypto.randomUUID();
        document.documentElement.setAttribute(CLIPBOARD_LOCK, clipboardLease);
        clipboardPending = true;
        return true;
    }

    function clipboardOwned() {
        return !!clipboardLease && document.documentElement.getAttribute(CLIPBOARD_LOCK) === clipboardLease;
    }

    function releaseClipboard() {
        if (clipboardLease && document.documentElement.getAttribute(CLIPBOARD_LOCK) === clipboardLease) {
            document.documentElement.removeAttribute(CLIPBOARD_LOCK);
        }
        clipboardLease = null;
        clipboardPending = false;
    }

    function setTooltip(state, message) {
        if (state.lastTooltip === message) return;
        state.button.setTooltip(message);
        state.lastTooltip = message;
    }

    function updateAction(state, available, busy = clipboardBusy()) {
        state.available = available;
        const button = state.button;
        if (button.destroyed) return;
        const disabled = !available || (busy && !state.busy && !state.noClipboard);
        if (button.disabled !== disabled) button.setDisabled(disabled);
        if (!state.feedbackTimer && !state.busy) {
            setTooltip(state, available ? state.tooltip : state.unavailable);
        }
    }

    function updateAvailability(group, available, current, busy = clipboardBusy()) {
        group.available = available;
        for (const action of group.actions) {
            let ready = action.withoutConsole ? !document.hidden && !!consoleIdentity(action.anchor) : available;
            // #if INPUT
            if (action.pasteAction) {
                try { ready = available && canReadClipboard() && !!inputSession(action, current); } catch { ready = false; }
            }
            // #endif
            updateAction(action, ready, busy);
        }
    }

    function showClipboardBusy() {
        // This transition only changes presentation. Do not rediscover every
        // input action to disable it; action dispatch and scans validate freshly.
        for (const group of controls.values()) {
            for (const action of group.actions) updateAction(action, action.available, true);
        }
        // #if PANELS
        for (const panel of panels) {
            for (const action of panel.actions) updateAction(action, action.available, true);
        }
        // #endif
    }

    function feedback(state, message, icon) {
        clearTimeout(state.feedbackTimer);
        state.feedbackTimer = null;
        if (state.button.destroyed) return;
        state.button.setIconCls(icon);
        setTooltip(state, message);
        state.feedbackTimer = setTimeout(() => {
            state.feedbackTimer = null;
            if (state.button.destroyed) return;
            try {
                state.button.setIconCls(state.icon);
                setTooltip(state, state.available ? state.tooltip : state.unavailable);
            } catch {
                // ExtJS may have torn down the view during navigation.
            }
        }, FEEDBACK_DURATION_MS);
    }

    function restoreFocus(state, original, focusedElement) {
        try {
            const buttonElement = state.button.getEl()?.dom;
            if (state.button.destroyed || !document.hasFocus() || document.hidden ||
                !focusedElement || document.activeElement !== focusedElement ||
                !buttonElement?.contains(focusedElement)) return;
            const current = resolveConsole(state.anchor);
            if (current?.frame === original.frame && current.term === original.term) {
                current.term.focus?.();
            }
        } catch {
            // Focus is a convenience; it must not turn a completed copy into an error.
        }
    }

    // #if WRITE
    async function copyText(state, text, label, current, focusedElement) {
        if (state.button.destroyed || document.hidden || !acquireClipboard()) return;
        try {
            state.busy = true;
            clearTimeout(state.feedbackTimer);
            state.feedbackTimer = null;
            showClipboardBusy();
            state.button.setIconCls('fa fa-spinner');
            setTooltip(state, current ? 'Copying console buffer' : 'Copying');
            const status = await writeClipboard(text, state);
            if (status.cancelled || !clipboardOwned()) {
                feedback(state, 'Clipboard operation cancelled; write may still complete', 'fa fa-exclamation-triangle');
            } else if (status.timedOut) {
                feedback(state, 'Clipboard completion not confirmed; inspect clipboard before retrying',
                    'fa fa-exclamation-triangle');
            } else {
                const message = status.confirmed
                    ? `Copied ${label}`
                    : `Sent ${label}; clipboard unconfirmed`;
                feedback(state, message, status.confirmed ? 'fa fa-check' : 'fa fa-info-circle');
                if (current) restoreFocus(state, current, focusedElement);
            }
        } catch {
            // Never log terminal text or page-supplied exception messages.
            try { feedback(state, 'Clipboard write failed', 'fa fa-exclamation-triangle'); } catch { /* Destroyed UI. */ }
        } finally {
            state.busy = false;
            releaseClipboard();
            installForCurrentConsole();
        }
    }

    // #endif
    // #if COPY
    async function copyConsole(state) {
        if (clipboardBusy() || state.button.destroyed) return;
        try {
            const current = resolveConsole(state.anchor);
            if (!current || current.toolbar !== state.toolbar) {
                updateAction(state, false);
                feedback(state, UNAVAILABLE, 'fa fa-exclamation-triangle');
                return;
            }
            const result = extractFullConsole(current.term);
            if (!result?.text) {
                feedback(state, result ? 'Console buffer is empty' : 'Console buffer unavailable', 'fa fa-exclamation-triangle');
                return;
            }
            const scope = result.alternateScreen ? 'alternate screen' : 'retained buffer';
            await copyText(state, result.text, `${result.logicalLines} lines (${scope})`, current, document.activeElement);
        } catch {
            feedback(state, 'Console extraction failed', 'fa fa-exclamation-triangle');
        }
    }
    // #endif
    // #if INPUT
    async function pasteClipboard(state, staged) {
        if (clipboardBusy() || state.button.destroyed) return;
        let operation, timer, hideEvents, hideHandler;
        let failure = 'Paste unavailable; nothing sent';
        try {
            // A page-callable ExtJS callback is not itself proof of a user gesture.
            if ((!staged && !canReadClipboard()) || !navigator.userActivation?.isActive ||
                document.hidden || !document.hasFocus()) {
                feedback(state, 'Activate paste in the active tab; nothing sent', 'fa fa-exclamation-triangle');
                return;
            }
            const current = inputSession(state);
            if (!current) {
                feedback(state, PASTE_UNAVAILABLE, 'fa fa-exclamation-triangle');
                return;
            }
            // #if REVIEW
            if (staged && !reviewSessionMatches(state, staged.captured)) return;
            // #endif
            if (!acquireClipboard()) return;
            const focusedElement = document.activeElement;
            const cancelled = new Promise(resolve => {
                operation = { state, current, pageHref: location.href,
                    deadline: Date.now() + PASTE_TIMEOUT_MS, cancelled: false,
                    cancel: () => resolve({ cancelled: true }) };
            });
            pendingPaste = operation;
            // Latch even a hide/show between polling ticks. Ignore page arguments;
            // an unrelated component hiding leaves the captured session valid.
            hideHandler = pageOptions({ handler: () => validatePendingPaste() }).handler;
            hideEvents = page.Ext.GlobalEvents;
            hideEvents.on('hide', hideHandler);
            state.busy = true;
            clearTimeout(state.feedbackTimer);
            state.feedbackTimer = null;
            showClipboardBusy();
            state.button.setIconCls('fa fa-spinner');
            setTooltip(state, 'Reading clipboard; approve the browser Paste prompt if shown');
            timer = setTimeout(cancelPaste, PASTE_TIMEOUT_MS);
            failure = 'Clipboard read failed or permission denied; nothing sent';
            // Start the read in the activation call stack. Never read during polling,
            // retry through another API, or export the clipboard promise to the page.
            const reading = staged ? Promise.resolve({ text: staged.text }) : Promise.resolve(navigator.clipboard.readText()).then(text => ({ text }));
            const result = await Promise.race([reading, cancelled]);
            if (result.cancelled || !sameInputSession(operation, true)) {
                feedback(state, 'Paste cancelled or expired; nothing sent', 'fa fa-exclamation-triangle');
                return;
            }
            const prepared = preparePaste(result.text, current.term);
            if (prepared.error) {
                feedback(state, prepared.error, 'fa fa-exclamation-triangle');
                return;
            }
            // #if REVIEW
            if (state.review && !staged) {
                openReview(state, prepared.text, current);
                feedback(state, 'Review text before pasting; nothing sent', 'fa fa-info-circle');
                return;
            }
            // #endif
            // There is no await between the final checks, paste, and Enter. Once
            // dispatch starts, failure is uncertainty: never automatically retry.
            failure = 'Input may be partially sent; inspect console before retrying';
            if (!sameInputSession(operation, true)) {
                feedback(state, 'Paste cancelled or expired; nothing sent', 'fa fa-exclamation-triangle');
                return;
            }
            current.term.paste(prepared.text);
            if (!sameInputSession(operation, true)) {
                feedback(state, state.execute ? 'Session changed after paste; Enter not sent' :
                    'Session changed after paste; text may be sent; no Enter appended', 'fa fa-exclamation-triangle');
                return;
            }
            // #if PASTE
            if (state.execute) current.term.input('\r');
            // #endif
            feedback(state, state.execute ? 'Text and Enter sent; command result is shown in the console' :
                'Text sent; no Enter appended', 'fa fa-check');
            restoreFocus(state, current, focusedElement);
            // #if REVIEW
            if (staged) closePanel(state.panel);
            // #endif
        } catch {
            try { feedback(state, failure, 'fa fa-exclamation-triangle'); } catch { /* Destroyed UI. */ }
        } finally {
            clearTimeout(timer);
            try { if (hideEvents && hideHandler) hideEvents.un('hide', hideHandler); } catch { /* Page teardown. */ }
            if (pendingPaste === operation) pendingPaste = null;
            state.busy = false;
            releaseClipboard();
            installForCurrentConsole();
        }
    }

    // #endif
    // #if PANELS
    // Build native children separately: never clone native objects through Firefox.
    function openPanel(state, title, text) {
        if (state.button.destroyed || document.hidden) return null;
        closePanel(state.panel);
        const Ext = page.Ext;
        const panel = { state, children: [], actions: [], href: location.href };
        panels.add(panel);
        state.panel = panel;
        try {
            panel.window = Ext.create('Ext.window.Window', pageOptions({
                title, width: Math.min(620, Math.max(240, window.innerWidth - 32)),
                height: Math.min(460, Math.max(200, window.innerHeight - 32)),
                layout: 'fit', modal: true, closeAction: 'destroy', constrain: true,
            }));
            panel.window.on('destroy', pageOptions({ handler: () => closePanel(panel) }).handler);
            panel.body = Ext.create('Ext.form.field.TextArea', pageOptions({
                readOnly: true, value: text, fieldLabel: title, hideLabel: true,
                ariaLabel: title, selectOnFocus: false,
            }));
            panel.children.push(panel.body);
            panel.window.add(panel.body);
            panel.footer = Ext.create('Ext.toolbar.Toolbar', pageOptions({ dock: 'bottom', enableOverflow: true }));
            panel.children.push(panel.footer);
            panel.window.addDocked(panel.footer);
            panel.window.show();
            return panel;
        } catch {
            closePanel(panel);
            feedback(state, 'Panel unavailable', 'fa fa-exclamation-triangle');
            return null;
        }
    }

    function panelButton(panel, text, handler, clipboard = false) {
        const action = { anchor: panel.state.anchor, toolbar: panel.state.toolbar,
            text, tooltip: text, unavailable: 'Clipboard unavailable', icon: 'fa fa-copy',
            available: true, panel, noClipboard: !clipboard };
        action.button = page.Ext.create('Ext.button.Button', pageOptions({
            text, tooltip: text, handler: () => {
                if (panel.closed || action.button.destroyed) return;
                if (panel.href !== location.href || document.hidden) { closePanel(panel); return; }
                try { return handler(action); }
                catch { feedback(action, 'Action unavailable', 'fa fa-exclamation-triangle'); }
            },
        }));
        panel.children.push(action.button);
        panel.actions.push(action);
        action.lastTooltip = text;
        panel.footer.add(action.button);
        return action;
    }

    function closePanel(panel) {
        if (!panel || panel.closed) return;
        panel.closed = true;
        panels.delete(panel);
        if (panel.state.panel === panel) panel.state.panel = null;
        // #if WRITE
        if (pendingWrite?.state.panel === panel) pendingWrite.cancel();
        // #endif
        // #if EXPORT
        for (const download of [...downloads]) if (download.state.panel === panel) cleanDownload(download);
        // #endif
        for (const action of panel.actions) clearTimeout(action.feedbackTimer);
        // ExtJS owns attached children. Destroy only survivors after their owner.
        if (panel.window && !panel.window.destroyed && !panel.window.destroying) panel.window.destroy();
        for (const child of panel.children) {
            if (!child.destroyed && !child.destroying) child.destroy();
        }
        try { panel.dispose?.(); } catch { /* Disposed native controls. */ }
    }

    function closePanels() { for (const panel of [...panels]) closePanel(panel); }
    // #endif

    // #if EXPORT
    function exportContent(text, markdown) {
        if (!markdown) return text;
        let longest = 2;
        for (const run of text.matchAll(/`+/g)) longest = Math.max(longest, run[0].length);
        const fence = '`'.repeat(longest + 1);
        return `${fence}\n${text}\n${fence}\n`;
    }

    function cleanDownload(download) {
        clearTimeout(download.timer);
        downloads.delete(download);
        try { download.anchor?.remove(); } catch { /* Detached document. */ }
        try { if (download.url) URL.revokeObjectURL(download.url); } catch { /* Teardown. */ }
    }

    function requestDownload(state, text, markdown) {
        const download = { state };
        downloads.add(download);
        try {
            const data = exportContent(text, markdown);
            download.url = URL.createObjectURL(new Blob([data], { type: markdown ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8' }));
            download.anchor = document.createElement('a');
            download.anchor.href = download.url;
            const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
            download.anchor.download = `proxmox-console-${stamp}.${markdown ? 'md' : 'txt'}`;
            download.anchor.hidden = true;
            document.body.appendChild(download.anchor);
            download.anchor.click();
            // Retain the URL briefly for asynchronous browser consumption.
            download.anchor.remove();
            download.timer = setTimeout(() => cleanDownload(download), 1000);
            feedback(state, 'Download requested', 'fa fa-info-circle');
        } catch {
            cleanDownload(download);
            feedback(state, 'Download request failed', 'fa fa-exclamation-triangle');
        }
    }

    function openExport(state) {
        if (state.button.destroyed || document.hidden) return;
        try {
            const current = resolveConsole(state.anchor);
            if (!current || current.toolbar !== state.toolbar) {
                feedback(state, UNAVAILABLE, 'fa fa-exclamation-triangle');
                return;
            }
            let snapshot = extractFullConsole(current.term);
            if (!snapshot?.text) {
                feedback(state, snapshot ? 'Console buffer is empty' : 'Console buffer unavailable', 'fa fa-exclamation-triangle');
                return;
            }
            const panel = openPanel(state, 'Export Console',
                'Snapshot captured from the retained console output.\nPlain text is the default format. Markdown uses a literal code block.\nOutput may contain sensitive information.\nDownload requested does not confirm saving to disk.');
            if (!panel) return;
            panel.dispose = () => { snapshot = null; };
            panelButton(panel, 'Download plain text', action => requestDownload(action, snapshot.text, false));
            panelButton(panel, 'Download Markdown', action => requestDownload(action, snapshot.text, true));
        } catch {
            closePanel(state.panel);
            feedback(state, 'Console export unavailable', 'fa fa-exclamation-triangle');
        }
    }
    // #endif

    // #if DIAGNOSTICS
    // Never serialize page objects. Each field below is a fixed primitive or an
    // allowlisted constant; exceptions are deliberately discarded.
    function diagnosticReport(state) {
        const report = {
            schema: 'proxmox-toolkit-diagnostics/1', version: '__VERSION__', edition: '__EDITION_ID__',
            manager: null, context: null, eligible: null,
            counts: { anchors: null, frames: null, inaccessibleFrames: null },
            capabilities: { clipboardRead: null, clipboardWrite: null, activationApi: null,
                hideLifecycle: null, paste: null, input: null, bufferReadable: null },
            buffer: null, connected: null, stdinEnabled: null, bracketedPaste: null,
            clipboardBusy: null, reasons: [],
        };
        try {
            const info = typeof GM_info !== 'undefined' ? GM_info : typeof GM !== 'undefined' ? GM.info : undefined;
            const manager = info?.scriptHandler;
            if (['Violentmonkey', 'Tampermonkey', 'Greasemonkey', 'FireMonkey'].includes(manager)) report.manager = manager;
            const nav = typeof navigator !== 'undefined' ? navigator : undefined;
            report.capabilities.clipboardRead = typeof nav?.clipboard?.readText === 'function';
            report.capabilities.clipboardWrite = typeof GM_setClipboard === 'function' ||
                (typeof GM !== 'undefined' && typeof GM.setClipboard === 'function');
            report.capabilities.activationApi = !!nav?.userActivation;
            report.capabilities.hideLifecycle = typeof page.Ext?.GlobalEvents?.on === 'function' &&
                typeof page.Ext?.GlobalEvents?.un === 'function';
            report.clipboardBusy = clipboardBusy();
            const identity = consoleIdentity(state.anchor);
            report.eligible = !!identity;
            report.context = identity?.type || null;
            const observation = {};
            const current = resolveConsole(state.anchor, undefined, observation);
            report.counts = { anchors: observation.anchorCount, frames: observation.matchingFrames,
                inaccessibleFrames: observation.inaccessibleFrames };
            if (observation.reason) report.reasons.push(observation.reason);
            if (current) {
                const term = current.term;
                report.capabilities.paste = typeof term.paste === 'function';
                report.capabilities.input = typeof term.input === 'function';
                const buffers = term.buffer;
                const alternate = !!buffers?.alternate && buffers.active === buffers.alternate;
                const buffer = alternate ? buffers.active : buffers?.normal || buffers?.active;
                report.buffer = buffer ? (alternate ? 'alternate' : 'normal') : null;
                report.capabilities.bufferReadable = !!buffer && typeof buffer.getLine === 'function' &&
                    Number.isSafeInteger(buffer.length) && buffer.length >= 0;
                report.stdinEnabled = term.options && typeof term.options.disableStdin === 'boolean' ?
                    !term.options.disableStdin : term.options ? true : null;
                report.bracketedPaste = typeof term.modes?.bracketedPasteMode === 'boolean' ?
                    term.modes.bracketedPasteMode && term.options?.ignoreBracketedPasteMode !== true : null;
                for (const wrapped of [false, true]) {
                    try {
                        const win = current.frame.contentWindow;
                        const globals = wrapped ? win?.wrappedJSObject : win;
                        if (globals?.term === term && typeof globals.states?.connected === 'number') {
                            report.connected = globals.state === globals.states.connected && globals.socket?.readyState === 1;
                            if (report.connected) break;
                        }
                    } catch { /* Try the wrapped compartment; unknown if neither is accessible. */ }
                }
                if (!report.capabilities.bufferReadable) report.reasons.push('BUFFER_UNAVAILABLE');
                if (!report.capabilities.paste) report.reasons.push('PASTE_API_UNAVAILABLE');
                if (!report.capabilities.input) report.reasons.push('ENTER_API_UNAVAILABLE');
                if (report.connected === false) report.reasons.push('SESSION_DISCONNECTED');
                if (report.connected === null) report.reasons.push('SESSION_UNKNOWN');
                if (report.stdinEnabled === false) report.reasons.push('STDIN_DISABLED');
            }
            if (!report.capabilities.clipboardRead) report.reasons.push('CLIPBOARD_READ_UNAVAILABLE');
            if (!report.capabilities.clipboardWrite) report.reasons.push('CLIPBOARD_WRITE_UNAVAILABLE');
            if (!report.capabilities.activationApi) report.reasons.push('ACTIVATION_API_UNAVAILABLE');
            if (!report.capabilities.hideLifecycle) report.reasons.push('HIDE_LIFECYCLE_UNAVAILABLE');
            if (report.clipboardBusy) report.reasons.push('CLIPBOARD_BUSY');
        } catch { report.reasons.push('INSPECTION_FAILED'); }
        return report;
    }

    function diagnosticSummary(report) {
        const value = item => item === null ? 'unknown' : String(item);
        return ['Readiness snapshot; refresh to evaluate again. API presence is not permission approval.',
            `Context: ${report.context || 'unknown'}; eligible: ${value(report.eligible)}`,
            `Retained buffer: ${report.buffer || 'unknown'}; readable: ${value(report.capabilities.bufferReadable)}`,
            `Connected: ${value(report.connected)}; stdin enabled: ${value(report.stdinEnabled)}`,
            `Paste API: ${value(report.capabilities.paste)}; Enter API: ${value(report.capabilities.input)} (Paste & Execute only)`,
            `Clipboard read API: ${value(report.capabilities.clipboardRead)}; write API: ${value(report.capabilities.clipboardWrite)}`,
            `User activation API: ${value(report.capabilities.activationApi)}; hide lifecycle: ${value(report.capabilities.hideLifecycle)}`,
            `Bracketed paste: ${value(report.bracketedPaste)} (required only for multiline text/tabs)`,
            `Reasons: ${report.reasons.join(', ') || 'none observed'}`,
            'No permission test, command, buffer extraction, or upload is performed.'].join('\n\n');
    }

    function openDiagnostics(state) {
        try {
            let report = diagnosticReport(state);
            const panel = openPanel(state, 'Diagnostics', diagnosticSummary(report));
            if (!panel) return;
            panel.dispose = () => { report = null; };
            panelButton(panel, 'Refresh', () => {
                report = diagnosticReport(state);
                panel.body.setValue(diagnosticSummary(report));
            });
            panelButton(panel, 'Copy diagnostic report', action => copyText(action, JSON.stringify(report, null, 2), 'diagnostic report'), true);
        } catch {
            closePanel(state.panel);
            feedback(state, 'Diagnostics unavailable', 'fa fa-exclamation-triangle');
        }
    }
    // #endif

    // #if RECIPES
    const RECIPES = [
        { name: 'PVE package versions', command: 'pveversion -v', nodeOnly: true,
            explanation: 'Node Shell only. Lists installed PVE package versions. Requires the PVE pveversion utility and relevant access.' },
        { name: 'Filesystem capacity', command: 'df -h',
            explanation: 'Node or Linux LXC. Human-readable mounted filesystem usage (powers of 1024). Requires a GNU/coreutils-compatible df; other implementations may differ.' },
        { name: 'Kernel and system identity', command: 'uname -a',
            explanation: 'Node or Linux LXC. Kernel and system identity. Requires uname; available fields vary. Output can disclose host details.' },
        { name: 'Failed systemd units', command: 'systemctl --failed --no-pager',
            explanation: 'Node or systemd-based Linux LXC. Lists failed units without a pager. Requires systemd 233 or later, a running accessible system manager and relevant access; many containers do not use systemd.' },
    ];

    function openRecipes(state) {
        try {
            let original = resolveConsole(state.anchor);
            let identity = consoleIdentity(state.anchor);
            if (!original || original.toolbar !== state.toolbar || !identity) {
                feedback(state, UNAVAILABLE, 'fa fa-exclamation-triangle');
                return;
            }
            const href = original.frame.contentWindow.location.href;
            let selected = 0;
            const describe = () => {
                const recipe = RECIPES[selected];
                return `${selected + 1} / ${RECIPES.length}: ${recipe.name}\n\n${recipe.command}\n\n${recipe.explanation}\n\n` +
                    (recipe.nodeOnly && identity.type !== 'shell' ? 'Unavailable in LXC.\n\n' : '') +
                    'Context identifies the owned console, not its active program, distribution or privilege. No tool is probed. Inspect the destination and command yourself. Read-only commands can disclose system information. Copy does not send input.';
            };
            const panel = openPanel(state, 'Diagnostic Recipes', describe());
            if (!panel) return;
            panel.dispose = () => { original = null; identity = null; };
            let copy;
            const select = delta => {
                selected = (selected + delta + RECIPES.length) % RECIPES.length;
                panel.body.setValue(describe());
                updateAction(copy, !RECIPES[selected].nodeOnly || identity.type === 'shell');
            };
            panelButton(panel, 'Previous', () => select(-1));
            panelButton(panel, 'Next', () => select(1));
            copy = panelButton(panel, 'Copy command', action => {
                try {
                    const current = resolveConsole(state.anchor);
                    const liveIdentity = consoleIdentity(state.anchor);
                    if (!current || !liveIdentity || current.frame !== original.frame || current.term !== original.term ||
                        current.toolbar !== original.toolbar || current.frame.contentWindow.location.href !== href ||
                        liveIdentity.type !== identity.type || liveIdentity.node !== identity.node || liveIdentity.vmid !== identity.vmid ||
                        (RECIPES[selected].nodeOnly && liveIdentity.type !== 'shell')) {
                        feedback(action, 'Recipe context changed or unavailable; reopen Recipes', 'fa fa-exclamation-triangle');
                        return;
                    }
                    return copyText(action, RECIPES[selected].command, 'command');
                } catch { feedback(action, 'Recipe context unavailable', 'fa fa-exclamation-triangle'); }
            }, true);
            updateAction(copy, identity.type === 'shell');
        } catch {
            closePanel(state.panel);
            feedback(state, 'Recipes unavailable', 'fa fa-exclamation-triangle');
        }
    }
    // #endif

    function removeControl(group) {
        if (group.removing) return;
        group.removing = true;
        // #if WRITE
        if (pendingWrite && group.actions.includes(pendingWrite.state)) pendingWrite.cancel();
        // #endif
        // #if INPUT
        if (pendingPaste && group.actions.includes(pendingPaste.state)) cancelPaste();
        // #endif
        if (controls.get(group.toolbar) === group) controls.delete(group.toolbar);
        for (const action of group.actions) {
            // #if PANELS
            closePanel(action.panel);
            // #endif
            clearTimeout(action.feedbackTimer);
            action.feedbackTimer = null;
            if (action.button && !action.button.destroyed && !action.button.destroying) action.button.destroy();
        }
        // #if MENU
        for (const component of [group.toolsButton, group.menu]) {
            if (component && !component.destroyed && !component.destroying) component.destroy();
        }
        // #endif
    }

    function hasConflict(toolbar) {
        for (const item of toolbar.items.items) {
            for (const spec of ACTIONS) {
                if (!item.destroyed && item[spec.marker]) return true;
            }
        }
        return false;
    }

    function createControl(Ext, anchor, toolbar, current) {
        const group = { anchor, toolbar, actions: [] };
        try {
            for (const spec of ACTIONS) {
                const action = { anchor, toolbar, ...spec };
                group.actions.push(action);
                let menu = false;
                // #if MENU
                menu = !!spec.utility;
                if (menu && !group.menu) {
                    group.menu = Ext.create('Ext.menu.Menu', pageOptions({}));
                    group.toolsButton = Ext.create('Ext.button.Button', pageOptions({
                        text: 'Tools', iconCls: 'fa fa-wrench', tooltip: 'Console utilities',
                    }));
                    group.toolsButton.pveToolkitToolsButton = true;
                    group.toolsButton.setMenu(group.menu);
                    group.toolsButton.on('destroy', pageOptions({ handler: () => removeControl(group) }).handler);
                    toolbar.insert(toolbar.items.items.indexOf(anchor) + 1 + group.actions.length - 1, group.toolsButton);
                }
                // #endif
                action.button = Ext.create(menu ? 'Ext.menu.Item' : 'Ext.button.Button', pageOptions({
                    text: spec.text, iconCls: spec.icon, tooltip: spec.tooltip,
                    handler: () => spec.handler(action),
                }));
                action.lastTooltip = action.tooltip;
                action.button[spec.marker] = true;
                // Menu markers live on their owning toolbar button too; another
                // sandbox need not traverse page menu objects to detect overlap.
                if (menu) group.toolsButton[spec.marker] = true;
                action.button.on('destroy', pageOptions({ handler: () => removeControl(group) }).handler);
                if (menu) { group.menu.add(action.button); continue; }
                let index = toolbar.items.items.indexOf(anchor) + 1;
                for (const item of toolbar.items.items.slice(index)) {
                    if (!item.destroyed && ACTION_ORDER.some((marker, rank) =>
                        rank < ACTION_ORDER.indexOf(spec.marker) && item[marker])) index++;
                }
                toolbar.insert(index, action.button);
            }
            controls.set(toolbar, group);
            updateAvailability(group, !!current, current);
        } catch (error) {
            removeControl(group);
            throw error;
        }
        try { toolbar.updateLayout?.(); } catch { /* The next ExtJS layout pass recovers. */ }
    }

    function installForCurrentConsole() {
        if (!ACTIONS.length) return;
        if (document.hidden) {
            // #if PANELS
            closePanels();
            // #endif
            // #if WRITE
            pendingWrite?.cancel();
            // #endif
            // #if INPUT
            cancelPaste();
            // #endif
            return;
        }
        // This snapshot lives for this synchronous scan only. Hide events and
        // checks around input still resolve afresh; null fails closed if the
        // captured anchor disappears or discovery cannot establish ownership.
        let pendingConsole = null;
        const busy = clipboardBusy();
        try {
            const Ext = page.Ext;
            if (!page.PVE || !Ext?.ComponentQuery?.query || !Ext.create) return;
            const anchors = Ext.ComponentQuery.query('pveConsoleButton');
            const seen = new Set();
            for (const anchor of anchors) {
                let toolbar;
                try {
                    if (!consoleIdentity(anchor)) continue;
                    toolbar = anchor.up('toolbar');
                    if (!toolbar || toolbar.destroyed || !toolbar.items?.items.includes(anchor)) continue;
                    seen.add(toolbar);
                    let state = controls.get(toolbar);
                    if (state && (state.anchor !== anchor || state.actions.some(action => action.button.destroyed))) {
                        removeControl(state);
                        state = null;
                    }
                    const observation = {};
                    const current = resolveConsole(anchor, anchors, observation);
                    // #if INPUT
                    if (pendingPaste?.state.anchor === anchor) pendingConsole = current;
                    // #endif
                    if (state) updateAvailability(state, !!current, current, busy);
                    else if (current || (observation.anchorCount === 1 && ACTIONS.some(action => action.withoutConsole))) {
                        if (!hasConflict(toolbar)) createControl(Ext, anchor, toolbar, current);
                    }
                } catch {
                    const state = controls.get(toolbar);
                    if (state) updateAvailability(state, false, null, busy);
                    warnInstall();
                }
            }
            for (const state of controls.values()) {
                if (state.toolbar.destroyed || state.anchor.destroyed || state.actions.some(action => action.button.destroyed)) removeControl(state);
                else if (!seen.has(state.toolbar)) updateAvailability(state, false, null, busy);
            }
        } catch {
            pendingConsole = null;
            for (const state of controls.values()) {
                try { updateAvailability(state, false, null, busy); } catch { /* Destroyed UI. */ }
            }
            warnInstall();
        } finally {
            // #if WRITE
            if (pendingWrite && (!clipboardOwned() || pendingWrite.state.button.destroyed ||
                pendingWrite.href !== location.href)) pendingWrite.cancel();
            // #endif
            // #if PANELS
            for (const panel of [...panels]) {
                try {
                    if (panel.href !== location.href || panel.state.button.destroyed || (panel.valid && !panel.valid()) ||
                        !panel.state.anchor.isVisible(true)) closePanel(panel);
                    else for (const action of panel.actions) updateAction(action, action.available, busy);
                } catch { closePanel(panel); }
            }
            // #endif
            // #if INPUT
            validatePendingPaste(pendingConsole);
            // #endif
        }
    }

    /* @console-extras */
    // #if SETTINGS
    /* @settings */
    // #endif
    // #if CATALOG
    /* @catalog-model */
    /* @catalog-ui */
    // #endif

    function startRuntime() {
    let allowedOrigin = location.port === '8006';
    // #if SETTINGS
    allowedOrigin = allowedOrigin || featureEnabled('CUSTOM_PORT');
    ACTIONS = ACTIONS.filter(action => featureEnabled(action.id));
    // #endif
    if (!allowedOrigin) return;
    if (!ACTIONS.length) return;
    // Periodic recovery avoids private router hooks and terminal-output observers.
    setInterval(installForCurrentConsole, SCAN_INTERVAL_MS);
    document.addEventListener('visibilitychange', installForCurrentConsole);
    // #if PANELS
    window.addEventListener('hashchange', closePanels);
    window.addEventListener('pagehide', closePanels);
    // #endif
    // #if EXPORT
    window.addEventListener('pagehide', () => { for (const download of [...downloads]) cleanDownload(download); });
    // #endif
    // #if WRITE
    window.addEventListener('hashchange', () => pendingWrite?.cancel());
    window.addEventListener('pagehide', () => pendingWrite?.cancel());
    // #endif
    // #if INPUT
    window.addEventListener('hashchange', cancelPaste);
    window.addEventListener('pagehide', cancelPaste);
    // #endif
    installForCurrentConsole();
    }
    // #if SETTINGS
    initializeSettings(startRuntime);
    // #endif
    // #if NO_SETTINGS
    startRuntime();
    // #endif
})();
