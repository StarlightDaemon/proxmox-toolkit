const REPORT_IDS = /* @reports */ [];
// Each explicit report gets one cancellable client. No timers exist at idle.
function createReportClient(prefix, controller) {
    if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(prefix)) throw Error('Invalid API prefix');
    let used = 0, active = 0, bytesUsed = 0;
    const waiters = [];
    const began = Date.now();
    const maxBytes = 8 * 1024 * 1024;
    const maxTotalBytes = 32 * 1024 * 1024;
    async function read(path, query = {}) {
        if (controller.signal.aborted) return { error: 'Cancelled' };
        if (bytesUsed >= maxTotalBytes) return { error: '32 MiB report response budget reached' };
        if (used >= 400 || Date.now() - began > 120000) return { error: 'Report request/time budget reached; narrow the selection' };
        // Only internal absolute API paths. Never accept a remote URL or redirects.
        if (!/^\/(cluster|nodes|storage|pools)(?:\/|$)/.test(path) || /[?#\\]/.test(path) ||
            path.split('/').some(p => { try { return ['.', '..'].includes(decodeURIComponent(p)) || /[\/\\]/.test(decodeURIComponent(p)); } catch { return true; } })) return { error: 'Invalid API path' };
        if (active >= 3) await new Promise(resolve => waiters.push(resolve));
        if (controller.signal.aborted) { waiters.shift()?.(); return { error: 'Cancelled' }; }
        if (used >= 400 || Date.now() - began > 120000 || bytesUsed >= maxTotalBytes) {
            waiters.shift()?.(); return { error: 'Report request/time/byte budget reached; narrow the selection' };
        }
        used++;
        active++;
        const request = new AbortController();
        const abort = () => request.abort();
        controller.signal.addEventListener('abort', abort, { once: true });
        const timer = setTimeout(abort, 15000);
        try {
            const url = new URL(`${prefix}api2/json${path}`, location.origin);
            for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));
            const response = await fetch(url.href, { method: 'GET', credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: request.signal });
            if (!response.ok) return { error: `HTTP ${response.status}; data unavailable` };
            const size = Number(response.headers.get('content-length'));
            if (size > maxBytes) { request.abort(); return { error: 'Response exceeds 8 MiB limit' }; }
            let text = '';
            if (response.body?.getReader) {
                const reader = response.body.getReader(), decoder = new TextDecoder();
                let bytes = 0;
                try {
                    while (true) {
                        const chunk = await reader.read();
                        if (chunk.done) break;
                        bytes += chunk.value.byteLength;
                        bytesUsed += chunk.value.byteLength;
                        if (bytes > maxBytes || bytesUsed > maxTotalBytes) { request.abort(); await reader.cancel(); return { error: 'Response exceeds per-request or total byte limit' }; }
                        text += decoder.decode(chunk.value, { stream: true });
                    }
                    text += decoder.decode();
                } finally { reader.releaseLock(); }
            } else {
                text = await response.text();
                bytesUsed += text.length * 2; // Conservative bound on fallback UTF-16 memory.
                if (text.length > maxBytes) return { error: 'Response exceeds limit' };
                if (bytesUsed > maxTotalBytes) return { error: 'Report response budget reached' };
            }
            const json = JSON.parse(text);
            if (!json || !Object.hasOwn(json, 'data')) return { error: 'Unexpected API response' };
            return controller.signal.aborted ? { error: 'Cancelled' } : { data: json.data };
        } catch { return { error: controller.signal.aborted ? 'Cancelled' : request.signal.aborted ? 'Request timed out' : 'Request failed or invalid response' }; }
        finally { clearTimeout(timer); controller.signal.removeEventListener('abort', abort); active--; waiters.shift()?.(); }
    }
    return { read, get requests() { return used; } };
}
function openCatalogReport(id, initial = {}) {
    if (!featureEnabled(id) || !REPORT_IDS.includes(id)) return;
    if ((location.port !== '8006' || runtimeSettings.apiPrefix !== '/') && !featureEnabled('CUSTOM_PORT')) {
        openToolkitSettings(); return;
    }
    const feature = FEATURE_CATALOG.find(f => f.id === id);
    const panel = openToolkitDialog(feature.name, feature.group);
    if (!panel) return;
    let controller, report, baseline = null;
    dialogDispose = () => { controller?.abort(); report = baseline = null; };
    nodeElement('p', id === 'COMPARE' ? 'Compare two selected guests, or one guest against an uploaded baseline. A comparison needs explicit targets.' :
        id === 'TASK_REPORT' ? 'Enter one complete task UPID. Its node is detected automatically; you can also open a task from Task Failure Investigator.' :
        'Leave scope fields blank to report on all visible resources. Optional filters narrow the report. Closing, navigating or hiding the tab cancels collection.', panel);
    const node = localField(id === 'TASK_REPORT' ? 'Node (optional; detected from UPID)' : 'Node (blank = all visible nodes)', panel, initial.node || '');
    const guests = localField(id === 'COMPARE' ? 'Guest IDs (two required; one with a baseline)' : 'Guest IDs (comma-separated; blank = all)', panel, initial.vmids || '');
    guests.parentNode.hidden = ['TASK_REPORT', 'STORAGE'].includes(id);
    node.placeholder = id === 'TASK_REPORT' ? 'Detected from UPID' : 'All visible nodes';
    guests.placeholder = id === 'COMPARE' ? 'For example: 101, 102' : 'All visible guests';
    const days = localField(id === 'SNAPSHOTS' ? 'Review age in days' : 'Task history days', panel, '7', 'number');
    days.min = '1'; days.max = '3650';
    if (id === 'SNAPSHOTS') days.value = '30';
    days.parentNode.hidden = !['TASKS', 'SNAPSHOTS'].includes(id);
    const taskType = localField('Task type (optional)', panel);
    taskType.parentNode.hidden = id !== 'TASKS';
    const failures = localField('Failures only', panel, '', 'checkbox');
    failures.parentNode.hidden = id !== 'TASKS';
    const upid = localField('Complete UPID', panel, initial.upid || '');
    upid.parentNode.hidden = id !== 'TASK_REPORT';
    const checkAgent = localField('Check running guest-agent responsiveness', panel, '', 'checkbox');
    checkAgent.parentNode.hidden = id !== 'GUEST_HEALTH';
    const ignore = localField('Ignore expected name / MAC differences', panel, '', 'checkbox');
    ignore.checked = true;
    ignore.parentNode.hidden = id !== 'COMPARE';
    if (id === 'COMPARE') {
        const file = localField('Optional exported configuration JSON baseline', panel, '', 'file');
        file.accept = '.json,application/json';
        file.addEventListener('change', async () => {
            baseline = null;
            try {
                if (!file.files[0]) return;
                if (file.files[0].size > 1024 * 1024) throw Error();
                const value = JSON.parse(await file.files[0].text());
                if (!value || typeof value.currentConfiguration !== 'object' || Array.isArray(value.currentConfiguration)) throw Error();
                if (!panel.isConnected) return;
                baseline = CatalogModel.safeConfig(value.currentConfiguration);
                status.textContent = 'Baseline loaded. Select one guest ID for comparison.';
            } catch { status.textContent = 'Choose a Toolkit configuration export under 1 MiB.'; }
        });
    }
    const status = nodeElement('p', 'No data collected yet.', panel, { role: 'status', 'aria-live': 'polite' });
    const actions = nodeElement('div', undefined, panel);
    const result = nodeElement('div', undefined, panel);
    const run = localButton('Run report', actions, async () => {
        if (!panel.isConnected || document.hidden) return;
        if (guests.value.trim() && !/^\d+(?:[\s,;]+\d+)*$/.test(guests.value.trim())) { status.textContent = 'Use numeric guest IDs separated by commas.'; return; }
        if (!Number.isInteger(Number(days.value)) || Number(days.value) < 1 || Number(days.value) > 3650) { status.textContent = 'Choose 1–3650 days.'; return; }
        const options = { node: node.value.trim(), vmids: guests.value.trim(), days: Number(days.value), ageDays: Number(days.value),
            taskType: taskType.value.trim(), failuresOnly: failures.checked, upid: upid.value.trim(), checkAgent: checkAgent.checked, ignoreIdentity: ignore.checked, baseline };
        const invalidScope = CatalogModel.scopeError(id, options);
        if (invalidScope) { status.textContent = invalidScope; return; }
        controller?.abort(); controller = new AbortController();
        const thisController = controller;
        const client = createReportClient(runtimeSettings.apiPrefix, controller);
        run.setDisabled(true); report = null; clearLocalContent(result);
        status.textContent = 'Collecting…';
        try {
            const collected = await CatalogModel.run(id, client.read, options);
            if (thisController.signal.aborted || !panel.isConnected) return;
            report = collected;
            status.textContent = `${report.selection.nodes.length} nodes in scope; ${report.rows.length} rows; ${report.issues.length} collection issues; ${client.requests} requests. Collected ${report.collectedAt}.`;
            renderCatalogReport(report, result, id, status);
        } catch (error) {
            if (panel.isConnected && !thisController.signal.aborted) status.textContent = error.message;
        } finally { if (panel.isConnected && controller === thisController) run.setDisabled(false); }
    });
    localButton('Cancel collection', actions, () => { controller?.abort(); status.textContent = 'Collection cancelled. Run report to collect again.'; run.setDisabled(false); });
}
function renderCatalogReport(report, parent, id, status) {
    for (const note of [report.scope, ...report.notes]) nodeElement('p', note, parent);
    if (report.issues.length) nodeElement('pre', JSON.stringify(report.issues, null, 2), parent, { class: 'error' });
    if (id === 'MAINTENANCE') {
        nodeElement('h3', 'Per-node preflight', parent);
        const table = nodeElement('table', undefined, parent, { 'aria-label': 'Per-node preflight', 'data-node-preflights': '' });
        const head = nodeElement('tr', undefined, nodeElement('thead', undefined, table));
        for (const label of ['Node', 'Selected visible guests', 'Visible active tasks', 'Storage list']) nodeElement('th', label, head, { scope: 'col' });
        const body = nodeElement('tbody', undefined, table);
        for (const check of report.nodePreflights || []) {
            const row = nodeElement('tr', undefined, body);
            for (const value of [check.node, check.selectedGuests, check.activeTasks === null ? 'Unknown' : check.activeTasks.length,
                check.storageAvailable ? 'Collected' : 'Unknown']) nodeElement('td', String(value), row);
        }
        nodeElement('p', 'Guest findings follow below. Task details and other-node memory observations are in Additional evidence and the JSON export.', parent);
    }
    if (id === 'NETWORK') {
        nodeElement('h3', 'Configured network paths', parent);
        const branch = (nodes, owner) => {
            const list = nodeElement('ul', undefined, owner);
            for (const n of nodes) {
                const item = nodeElement('li', `${n.iface || n.interface} — ${n.type || n.state || 'unknown'}${n.mtu ? `; MTU ${n.mtu}` : ''}`, list);
                for (const upstream of n.upstream || []) branch(upstream, item);
            }
        };
        for (const path of report.rows.slice(0, 100)) {
            const details = nodeElement('details', undefined, parent);
            nodeElement('summary', `${path.node} / ${path.vmid} / ${path.nic} → ${path.bridge || 'unknown bridge'}; VLAN ${path.vlan ?? 'untagged / unspecified'}`, details);
            branch(path.configuredPath, details);
        }
        nodeElement('p', 'Expand a path to follow its configured upstream interfaces. First 100 paths shown here; the table and export include all collected paths.', parent);
    }
    const filter = localField('Filter rows', parent);
    const columns = [...new Set(report.rows.flatMap(r => Object.keys(r)))];
    const choices = nodeElement('details', undefined, parent);
    nodeElement('summary', 'Columns shown / exported to CSV', choices);
    const checked = new Map();
    for (const name of columns) { const box = localField(name, choices, '', 'checkbox'); box.checked = true; checked.set(name, box); }
    const rows = () => report.rows.filter(r => JSON.stringify(r).toLowerCase().includes(filter.value.toLowerCase()));
    const selectedColumns = () => columns.filter(c => checked.get(c).checked);
    localButton('Download JSON', parent, () => {
        try { localDownload(JSON.stringify(report, null, 2), 'json', 'application/json;charset=utf-8'); status.textContent = 'Download requested; inspect the saved file.'; }
        catch { status.textContent = 'Download failed.'; }
    });
    localButton('Download filtered CSV', parent, () => {
        try { localDownload(CatalogModel.csv(rows(), selectedColumns()), 'csv', 'text/csv;charset=utf-8'); status.textContent = 'Download requested; inspect the saved file.'; }
        catch { status.textContent = 'Download failed.'; }
    });
    // #if WRITE
    if (id === 'TASK_REPORT') localButton('Copy task report', parent, async () => {
        if (!parent.isConnected || document.hidden || !acquireClipboard()) return;
        const state = { button: { destroyed: false } };
        const previousDispose = dialogDispose;
        dialogDispose = () => { state.button.destroyed = true; pendingWrite?.cancel(); previousDispose?.(); };
        try {
            const outcome = await writeClipboard(JSON.stringify(report, null, 2), state);
            if (parent.isConnected) status.textContent = outcome.confirmed ? 'Copied task report.' : 'Clipboard unconfirmed; inspect before retrying.';
        } catch { if (parent.isConnected) status.textContent = 'Clipboard write failed.'; }
        finally { releaseClipboard(); if (parent.isConnected) dialogDispose = previousDispose; }
    });
    // #endif
    const table = nodeElement('table', undefined, parent);
    const countLabel = nodeElement('p', '', parent);
    const draw = () => {
        clearLocalContent(table);
        const cols = selectedColumns(), visible = rows();
        const head = nodeElement('tr', undefined, nodeElement('thead', undefined, table));
        for (const c of cols) nodeElement('th', c, head, { scope: 'col' });
        const navigable = report.rows.some(r => r.node && (r.type === 'qemu' || r.type === 'lxc'));
        if (navigable) nodeElement('th', 'Open in PVE', head, { scope: 'col' });
        if (id === 'TASKS' && featureEnabled('TASK_REPORT')) nodeElement('th', 'Inspect', head, { scope: 'col' });
        const body = nodeElement('tbody', undefined, table);
        // Bounded rendering; exports retain all filtered collected rows.
        for (const row of visible.slice(0, 500)) {
            const tr = nodeElement('tr', undefined, body);
            for (const c of cols) nodeElement('td', typeof row[c] === 'object' && row[c] !== null ? JSON.stringify(row[c], null, 2) : String(row[c] ?? 'unknown'), tr);
            if (navigable) {
                const cell = nodeElement('td', undefined, tr);
                if (['qemu', 'lxc'].includes(row.type) && row.vmid) localButton('Open guest', cell, () => {
                    try {
                        const workspaces = page.Ext.ComponentQuery.query('pveStdWorkspace');
                        if (workspaces.length !== 1 || typeof workspaces[0].selectById !== 'function') throw Error();
                        workspaces[0].selectById(`${row.type}/${row.vmid}`);
                        closeToolkitDialog();
                    } catch { status.textContent = 'Native navigation is unavailable; select this guest in the PVE resource tree.'; }
                });
            }
            if (id === 'TASKS' && featureEnabled('TASK_REPORT')) localButton('Inspect log', nodeElement('td', undefined, tr), () => openCatalogReport('TASK_REPORT', { node: row.node, upid: row.upid }));
        }
        table.setAttribute('aria-label', `${visible.length} matching rows; showing first ${Math.min(500, visible.length)}`);
        countLabel.textContent = `${visible.length} matching rows. Showing ${Math.min(500, visible.length)}; CSV includes all matching collected rows.`;
    };
    filter.addEventListener('input', draw);
    for (const box of checked.values()) box.addEventListener('change', draw);
    draw();
    const details = nodeElement('details', undefined, parent);
    nodeElement('summary', 'Additional evidence and checklist', details);
    const { rows: ignoredRows, ...metadata } = report;
    nodeElement('pre', JSON.stringify(metadata, null, 2), details);
}
