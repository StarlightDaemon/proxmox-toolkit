// #if SCOPED
function scopedConsole(term, mode, count) {
    const b = term?.buffer?.active || term?.buffer?.normal;
    if (!b || !Number.isSafeInteger(b.length)) return null;
    if (mode === 'viewport') {
        if (!Number.isSafeInteger(b.viewportY) || !Number.isSafeInteger(term.rows)) return null;
        const start = Math.max(0, b.viewportY), end = Math.min(b.length, start + term.rows);
        const result = extractBuffer({ length: end - start, getLine: y => y >= 0 && start + y < end ? b.getLine(start + y) : undefined }, term.cols);
        return result && { ...result, scope: 'visible viewport; wrapped edges may be partial' };
    }
    const result = extractFullConsole(term);
    if (!result || !Number.isSafeInteger(count) || count < 1 || count > 10000) return null;
    const lines = result.text.split('\n').slice(-count);
    return { text: lines.join('\n'), logicalLines: lines.length, scope: `last ${count} retained logical lines` };
}
function openScopedCopy(state) {
    if (!resolveConsole(state.anchor)) return;
    const panel = openPanel(state, 'Scoped Copy', 'Viewport copies only visible physical rows, joining wraps within those edges. Last N uses retained logical lines. The current buffer is captured when you choose Copy.');
    if (!panel) return;
    const count = page.Ext.create('Ext.form.field.Number', pageOptions({ fieldLabel: 'Last N lines', value: 100, minValue: 1, maxValue: 10000, allowDecimals: false }));
    panel.children.push(count); panel.footer.add(count);
    for (const [label, mode] of [['Copy viewport', 'viewport'], ['Copy last N lines', 'last']]) panelButton(panel, label, async action => {
        const current = resolveConsole(state.anchor);
        if (!current || current.toolbar !== state.toolbar) return;
        const result = scopedConsole(current.term, mode, Number(count.getValue()));
        if (!result?.text) { feedback(action, 'Scope unavailable or empty', 'fa fa-exclamation-triangle'); return; }
        await copyText(action, result.text, `${result.logicalLines} lines (${result.scope})`);
    }, true);
}
// #endif
// #if FIND
function findConsoleLines(text, query, matchCase = false) {
    if (!query || query.length > 1024) return [];
    const needle = matchCase ? query : query.toLocaleLowerCase();
    const matches = [];
    for (const [index, line] of text.split('\n').entries()) {
        if ((matchCase ? line : line.toLocaleLowerCase()).includes(needle)) matches.push({ line: index + 1, text: line });
        if (matches.length === 500) break;
    }
    return matches;
}
function openFind(state) {
    const current = resolveConsole(state.anchor), snapshot = current && extractFullConsole(current.term);
    if (!snapshot) return;
    let text = snapshot.text, found = [], index = 0;
    const panel = openPanel(state, 'Find in Scrollback', 'Search a retained-output snapshot. Literal text search; up to 500 matching logical lines. Reopen to capture newer output.');
    if (!panel) return;
    const query = page.Ext.create('Ext.form.field.Text', pageOptions({ fieldLabel: 'Find', maxLength: 1024, enforceMaxLength: true }));
    panel.children.push(query); panel.footer.add(query);
    const show = () => panel.body.setValue(found.length ? `${index + 1} of ${found.length} matches (maximum 500)\nLogical line ${found[index].line}\n\n${found[index].text}` : 'No matches in this snapshot.');
    panelButton(panel, 'Find', () => { found = findConsoleLines(text, String(query.getValue() || '')); index = 0; show(); });
    panelButton(panel, 'Previous', () => { if (found.length) index = (index + found.length - 1) % found.length; show(); });
    panelButton(panel, 'Next', () => { if (found.length) index = (index + 1) % found.length; show(); });
    panel.dispose = () => { text = ''; found = []; };
}
// #endif
// #if REVIEW
function reviewSessionMatches(state, captured) {
    const current = inputSession(state);
    return !!current && current.frame === captured.frame && current.term === captured.term && current.socket === captured.socket && current.href === captured.href;
}
function openReview(state, text, captured) {
    const panel = openPanel(state, 'Review & Paste — no Enter appended', text);
    if (!panel) return;
    panel.body.setReadOnly(false);
    const hideEvents = page.Ext.GlobalEvents;
    panel.valid = () => reviewSessionMatches(state, captured);
    const onHide = pageOptions({ handler: () => { if (!panel.valid()) closePanel(panel); } }).handler;
    hideEvents.on('hide', onHide);
    const expiry = setTimeout(() => closePanel(panel), 300000);
    panel.dispose = () => { clearTimeout(expiry); hideEvents.un('hide', onHide); text = ''; captured = null; };
    panelButton(panel, 'Paste reviewed text', action => {
        if (!panel.valid()) { closePanel(panel); return; }
        return pasteClipboard(action, { text: panel.body.getValue(), captured });
    }, true);
}
// #endif
