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
function baselineScope(baseline) {
    const { node, vmids } = baseline.scope;
    return `${node ? `node ${node}` : 'all visible nodes'}; ${vmids.length ? `guest IDs ${vmids.join(', ')}` : 'all visible guests'}`;
}
function openCatalogReport(id, initial = {}) {
    if (!featureEnabled(id) || !REPORT_IDS.includes(id)) return;
    if ((location.port !== '8006' || runtimeSettings.apiPrefix !== '/') && !featureEnabled('CUSTOM_PORT')) {
        openToolkitSettings(); return;
    }
    const feature = FEATURE_CATALOG.find(f => f.id === id);
    const panel = openToolkitDialog(feature.name, feature.group);
    if (!panel) return;
    let controller, report, baseline = null, baselineRead = 0, baselineState = 'empty';
    dialogDispose = () => { controller?.abort(); baselineRead++; report = baseline = null; };
    nodeElement('p', id === 'COMPARE' ? 'Compare two selected guests, or one guest against an uploaded baseline. A comparison needs explicit targets.' :
        id === 'TASK_REPORT' ? 'Enter one complete task UPID. Its node is detected automatically; you can also open a task from Task Failure Investigator.' :
        'Leave scope fields blank to report on all visible resources. Optional filters narrow the report. Closing, navigating or hiding the tab cancels collection.', panel);
    const node = localField(id === 'TASK_REPORT' ? 'Node (optional; detected from UPID)' : 'Node (blank = all visible nodes)', panel, initial.node || '');
    const guests = localField(id === 'COMPARE' ? 'Guest IDs (two required; one with a baseline)' : 'Guest IDs (comma-separated; blank = all)', panel, initial.vmids || '');
    guests.parentNode.hidden = ['TASK_REPORT', 'STORAGE', 'UPDATES'].includes(id);
    node.dataset.field = 'node'; guests.dataset.field = 'vmids';
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
    upid.parentNode.hidden = !['TASK_REPORT', 'SUPPORT'].includes(id);
    upid.dataset.field = 'upid';
    const checkAgent = localField('Check running guest-agent responsiveness', panel, '', 'checkbox');
    checkAgent.parentNode.hidden = id !== 'GUEST_HEALTH';
    const ignore = localField('Ignore expected name / MAC differences', panel, '', 'checkbox');
    ignore.checked = true;
    ignore.parentNode.hidden = !['COMPARE', 'DRIFT'].includes(id);
    const guestSets = localField('Include guest aliases and IP sets (two or more extra requests per guest)', panel, '', 'checkbox');
    guestSets.dataset.field = 'includeGuestSets';
    guestSets.parentNode.hidden = id !== 'FIREWALL';
    const timeframe = nodeElement('select', undefined, nodeElement('label', 'Historical period', panel), { 'data-field': 'timeframe' });
    for (const value of ['day', 'week', 'month', 'year']) nodeElement('option', value, timeframe, { value });
    timeframe.value = 'week'; timeframe.parentNode.hidden = id !== 'CAPACITY';
    const reserve = localField('Host memory reserve (%) — planning assumption', panel, '20', 'number');
    reserve.min = '0'; reserve.max = '90'; reserve.parentNode.hidden = id !== 'CAPACITY';
    const supportSections = new Map();
    if (id === 'SUPPORT') {
        nodeElement('p', 'Select evidence sections. Task logs are optional and may contain sensitive text. Prepare and edit a preview before downloading; nothing is uploaded.', panel);
        for (const [key, label] of [['versions', 'Package versions'], ['configurations', 'Guest configurations'], ['network', 'Node networking'],
            ['storage', 'Storage definitions'], ['diagnostics', 'Toolkit capabilities'], ['task', 'Selected task status and log']]) {
            const box = localField(label, panel, '', 'checkbox'); box.checked = ['versions', 'configurations', 'diagnostics'].includes(key);
            box.dataset.section = key; supportSections.set(key, box);
        }
    }
    if (id === 'COMPARE' || id === 'DRIFT') {
        const file = localField(id === 'DRIFT' ? 'Optional Toolkit cluster baseline JSON (4 MiB maximum)' : 'Optional exported configuration JSON baseline', panel, '', 'file');
        file.accept = '.json,application/json';
        file.dataset.field = 'baseline';
        file.addEventListener('change', async () => {
            const readId = ++baselineRead;
            baseline = null;
            baselineState = file.files[0] ? 'loading' : 'empty';
            try {
                if (!file.files[0]) return;
                if (file.files[0].size > (id === 'DRIFT' ? 4 : 1) * 1024 * 1024) throw Error();
                const value = JSON.parse(await file.files[0].text());
                if (!panel.isConnected || readId !== baselineRead) return;
                if (id === 'DRIFT') {
                    // Scope is checked when the report runs, so the file and the
                    // Node/Guest fields can be set in either order.
                    baseline = DriftFirewall.validateBaseline(value, { origin: location.origin, apiPrefix: runtimeSettings.apiPrefix });
                    baselineState = 'ready';
                    const filled = !node.value.trim() && !guests.value.trim() && (baseline.scope.node || baseline.scope.vmids.length);
                    if (filled) { node.value = baseline.scope.node || ''; guests.value = baseline.scope.vmids.join(', '); }
                    status.textContent = `Cluster baseline loaded: ${baselineScope(baseline)}.${filled ? ' Node and Guest IDs were filled from the baseline.' : ''} Run report with the same scope to compare.`;
                    return;
                }
                if (!value?.currentConfiguration || typeof value.currentConfiguration !== 'object' || Array.isArray(value.currentConfiguration)) throw Error();
                baseline = CatalogModel.safeConfig(value.currentConfiguration);
                baselineState = 'ready';
                status.textContent = 'Baseline loaded. Select one guest ID for comparison.';
            } catch { if (panel.isConnected && readId === baselineRead) { baselineState = 'invalid'; status.textContent = id === 'DRIFT' ? 'Choose a valid Toolkit cluster baseline under 4 MiB from this origin and the same node/guest scope.' : 'Choose a Toolkit configuration export under 1 MiB.'; } }
        });
        if (id === 'DRIFT') nodeElement('p', 'Run without a baseline to capture the current scope, then Download baseline JSON. Import it later to compare. Baselines are local files; no history is saved by Toolkit.', panel);
    }
    const status = nodeElement('p', 'No data collected yet.', panel, { role: 'status', 'aria-live': 'polite' });
    const actions = nodeElement('div', undefined, panel);
    const result = nodeElement('div', undefined, panel);
    const run = localButton('Run report', actions, async () => {
        if (!panel.isConnected || document.hidden) return;
        if (['loading', 'invalid'].includes(baselineState)) { status.textContent = 'Wait for a valid baseline, choose another file, or clear the file selection.'; return; }
        if (guests.value.trim() && !/^\d+(?:[\s,;]+\d+)*$/.test(guests.value.trim())) { status.textContent = 'Use numeric guest IDs separated by commas.'; return; }
        if (id === 'DRIFT' && baseline) {
            try { DriftFirewall.validateBaseline(baseline, { node: node.value.trim(), vmids: guests.value.trim() }); }
            catch { status.textContent = `This baseline covers ${baselineScope(baseline)}. Set Node and Guest IDs to match, or clear the file to capture a new baseline.`; return; }
        }
        if (!Number.isInteger(Number(days.value)) || Number(days.value) < 1 || Number(days.value) > 3650) { status.textContent = 'Choose 1–3650 days.'; return; }
        const options = { node: node.value.trim(), vmids: guests.value.trim(), days: Number(days.value), ageDays: Number(days.value),
            taskType: taskType.value.trim(), failuresOnly: failures.checked, upid: upid.value.trim(), checkAgent: checkAgent.checked, ignoreIdentity: ignore.checked, includeGuestSets: guestSets.checked, baseline,
            origin: location.origin, apiPrefix: runtimeSettings.apiPrefix, timeframe: timeframe.value, reservePercent: Number(reserve.value),
            supportSections: [...supportSections].filter(([, box]) => box.checked).map(([key]) => key) };
        if (id === 'SUPPORT') {
            if (!options.supportSections.length) { status.textContent = 'Choose at least one evidence section.'; return; }
            const info = typeof GM_info !== 'undefined' ? GM_info : typeof GM !== 'undefined' ? GM.info : undefined;
            options.toolkit = { version: '__VERSION__', edition: '__EDITION_ID__',
                manager: ['Violentmonkey', 'Tampermonkey', 'Greasemonkey', 'FireMonkey'].includes(info?.scriptHandler) ? info.scriptHandler : null,
                clipboardRead: typeof navigator?.clipboard?.readText === 'function',
                clipboardWrite: typeof GM_setClipboard === 'function' || (typeof GM !== 'undefined' && typeof GM.setClipboard === 'function'),
                secureContext: typeof isSecureContext === 'boolean' ? isSecureContext : null };
        }
        const invalidScope = CatalogModel.scopeError(id, options);
        if (invalidScope) { status.textContent = invalidScope; return; }
        controller?.abort(); controller = new AbortController();
        options.signal = controller.signal;
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
    if (id === 'SUPPORT') { renderSupportBundle(report, parent, status); return; }
    const expanded = ['CAPACITY', 'DRIFT', 'FIREWALL', 'UPDATES'].includes(id);
    nodeElement('p', report.scope, parent);
    const notes = expanded ? nodeElement('details', undefined, parent) : parent;
    if (expanded) nodeElement('summary', 'Interpretation and evidence limits', notes);
    for (const note of report.notes) nodeElement('p', note, notes);
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
    if (id === 'DRIFT' && report.baseline) localButton('Download baseline JSON', parent, () => {
        try { localDownload(JSON.stringify(report.baseline, null, 2), 'json', 'application/json;charset=utf-8'); status.textContent = 'Baseline download requested; inspect the saved file.'; }
        catch { status.textContent = 'Baseline download failed.'; }
    });
    if (id === 'UPDATES' && featureEnabled('MAINTENANCE')) localButton('Open Maintenance Preflight', parent,
        () => openCatalogReport('MAINTENANCE', { node: report.selection.node || '' }));
    const columns = [...new Set(report.rows.flatMap(r => Object.keys(r)))];
    const choices = nodeElement('details', undefined, parent);
    nodeElement('summary', 'Columns shown / exported to CSV', choices);
    const checked = new Map();
    const primary = id === 'CAPACITY' ? ['kind', 'node', 'vmid', 'name', 'storage', 'configuredMemoryBytes', 'hostMemoryBytes', 'observedMemoryBytes', 'configuredVCPUs', 'allocationBalanceAfterReserveBytes', 'utilizationRatio', 'historical'] :
        id === 'UPDATES' ? ['node', 'installedManagerVersion', 'runningKernel', 'availableUpdateCount', 'packageIndexFreshness', 'kernelReview'] : columns;
    const heading = name => expanded ? name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase())
        .replace(/ Bytes$/, id === 'CAPACITY' ? ' (GiB)' : ' Bytes') : name;
    const cellText = (key, value) => {
        if (value === null || value === undefined) return 'unknown';
        if (id === 'CAPACITY' && typeof value === 'number') {
            if (key.endsWith('Bytes')) return `${(value / 1073741824).toFixed(2)} GiB`;
            if (key.endsWith('Ratio') || key === 'observedCPUFraction') return `${(value * 100).toFixed(1)}%`;
        }
        if (id === 'CAPACITY' && key === 'historical') return Object.entries(value).map(([metric, data]) => {
            const format = n => n === null ? 'unknown' : metric === 'cpu' ? `${(n * 100).toFixed(1)}%` : `${(n / 1073741824).toFixed(2)} GiB`;
            return `${metric}: average ${format(data.average)}, sampled peak ${format(data.peak)} (${data.averageSamples}/${data.maximumSamples} samples)`;
        }).join('\n');
        return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    };
    for (const name of columns) { const box = localField(heading(name), choices, '', 'checkbox'); box.checked = primary.includes(name); checked.set(name, box); }
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
        for (const c of cols) nodeElement('th', heading(c), head, { scope: 'col' });
        const navigable = report.rows.some(r => r.node && (r.type === 'qemu' || r.type === 'lxc'));
        if (navigable) nodeElement('th', 'Open in PVE', head, { scope: 'col' });
        if (id === 'TASKS' && featureEnabled('TASK_REPORT')) nodeElement('th', 'Inspect', head, { scope: 'col' });
        const body = nodeElement('tbody', undefined, table);
        // Bounded rendering; exports retain all filtered collected rows.
        for (const row of visible.slice(0, 500)) {
            const tr = nodeElement('tr', undefined, body);
            for (const c of cols) nodeElement('td', cellText(c, row[c]), tr);
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

function renderSupportBundle(report, parent, status) {
    const area = (label, field, maxLength) => {
        const input = nodeElement('textarea', undefined, nodeElement('label', label, parent),
            { rows: 3, 'data-field': field, maxlength: maxLength, class: 'x-form-field x-form-text x-form-text-default' });
        input.style.width = '100%'; input.value = ''; return input;
    };
    nodeElement('p', `${report.rows.length} evidence sections collected; ${report.issues.length} collection issues. Review the preview for sensitive information before sharing.`, parent);
    const symptoms = area('Symptoms', 'symptoms', 32768), steps = area('Reproduction steps', 'steps', 32768);
    const redact = localField('Assist redaction of names, addresses and common credential patterns', parent, '', 'checkbox');
    redact.checked = true;
    const replacements = area('Additional literal values to redact (one per line; up to 100)', 'replacements', 25700);
    const format = nodeElement('select', undefined, nodeElement('label', 'Preview format', parent), { 'data-field': 'format' });
    nodeElement('option', 'Markdown', format, { value: 'markdown' }); nodeElement('option', 'JSON', format, { value: 'json' });
    format.value = 'markdown';
    const preview = area('Editable export preview — only this text is downloaded', 'preview', 32 * 1024 * 1024);
    preview.rows = 18;
    let preparedFormat = null;
    const prepare = () => {
        try {
            const value = SupportBundle.prepare(report, { symptoms: symptoms.value, steps: steps.value, replacements: replacements.value, redact: redact.checked });
            preparedFormat = format.value; preview.value = value[preparedFormat];
            download.setDisabled(false);
            status.textContent = `Preview prepared; ${value.replacements} identifiers replaced. Inspect and edit before downloading. Redaction is not guaranteed complete.`;
        } catch (error) { status.textContent = error.message; }
    };
    localButton('Prepare preview', parent, prepare);
    const download = localButton('Download reviewed preview', parent, () => {
        try {
            if (!preparedFormat) return;
            if (preparedFormat === 'json') JSON.parse(preview.value);
            localDownload(preview.value, preparedFormat === 'json' ? 'json' : 'md', preparedFormat === 'json' ? 'application/json;charset=utf-8' : 'text/markdown;charset=utf-8');
            status.textContent = 'Reviewed preview download requested; inspect the saved file.';
        } catch { status.textContent = 'Download failed. For JSON, check that your edited preview is valid JSON.'; }
    });
    download.setDisabled(true);
    for (const input of [symptoms, steps, replacements, redact, format]) {
        input.addEventListener('change', () => { preparedFormat = null; download.setDisabled(true); status.textContent = 'Options changed. Prepare a new preview before downloading.'; });
        if (input.tagName === 'TEXTAREA') input.addEventListener('input', () => { preparedFormat = null; download.setDisabled(true); });
    }
    prepare();
}
