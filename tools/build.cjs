// Development-only generation. Each output is independently installable.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const manifest = require('./editions.json');
const { features, reports } = require('./features.cjs');
const root = path.join(__dirname, '..');
let template = fs.readFileSync(path.join(root, 'src/toolkit.js'), 'utf8').replace(/\r\n/g, '\n');
for (const file of ['settings', 'console-extras', 'capacity-updates', 'drift-firewall', 'support-bundle', 'catalog-model', 'catalog-ui']) {
    const fragment = fs.readFileSync(path.join(root, `src/${file}.js`), 'utf8').replace(/\r\n/g, '\n')
        .replace(/^if \(typeof module.*$/m, '')
        .replace(/^const .* = require\(.*$/gm, '');
    template = template.replace(`/* @${file} */`, () => fragment);
}
const specs = {
    COPY: "{ text: 'Copy', icon: COPY_ICON, tooltip: COPY_TOOLTIP, unavailable: UNAVAILABLE, handler: copyConsole, marker: 'pveCopyConsoleButton' }",
    PASTE: "{ text: 'Paste & Execute', icon: 'fa fa-play', tooltip: PASTE_TOOLTIP, unavailable: PASTE_UNAVAILABLE, handler: pasteClipboard, marker: 'pveToolkitPasteButton', pasteAction: true, execute: true }",
    PASTE_ONLY: "{ text: 'Paste Only', icon: 'fa fa-paste', tooltip: 'Paste clipboard text without appending Enter', unavailable: PASTE_UNAVAILABLE, handler: pasteClipboard, marker: 'pveToolkitPasteOnlyButton', pasteAction: true }",
    EXPORT: "{ text: 'Export Console', icon: 'fa fa-download', tooltip: 'Download retained output as text or Markdown', unavailable: UNAVAILABLE, handler: openExport, marker: 'pveToolkitExportButton', utility: true, noClipboard: true }",
    DIAGNOSTICS: "{ text: 'Diagnostics', icon: 'fa fa-info-circle', tooltip: 'Inspect current integration prerequisites', unavailable: UNAVAILABLE, handler: openDiagnostics, marker: 'pveToolkitDiagnosticsButton', utility: true, noClipboard: true, withoutConsole: true }",
    RECIPES: "{ text: 'Recipes', icon: 'fa fa-list', tooltip: 'Review and copy a diagnostic command', unavailable: UNAVAILABLE, handler: openRecipes, marker: 'pveToolkitRecipesButton', utility: true, noClipboard: true }",
    SCOPED: "{ text: 'Scoped Copy', icon: 'fa fa-crop', tooltip: 'Copy viewport or last N lines', unavailable: UNAVAILABLE, handler: openScopedCopy, marker: 'pveToolkitScopedButton', utility: true, noClipboard: true }",
    FIND: "{ text: 'Find in Scrollback', icon: 'fa fa-search', tooltip: 'Search a retained output snapshot', unavailable: UNAVAILABLE, handler: openFind, marker: 'pveToolkitFindButton', utility: true, noClipboard: true }",
    REVIEW: "{ text: 'Review & Paste', icon: 'fa fa-edit', tooltip: 'Read, review and edit clipboard text before pasting', unavailable: PASTE_UNAVAILABLE, handler: pasteClipboard, marker: 'pveToolkitReviewButton', pasteAction: true, review: true, utility: true }",
};
function buildEdition(edition) {
    assert.match(manifest.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, 'One valid Toolkit version is required');
    assert.ok(edition.features.length > 0, 'An edition must select an action');
    assert.equal(new Set(edition.features).size, edition.features.length, 'Duplicate feature selection');
    for (const feature of edition.features) assert.ok(features.some(f => f.id === feature), `Unknown feature: ${feature}`);
    const enabled = new Set(edition.features);
    if (['PASTE', 'PASTE_ONLY', 'REVIEW'].some(f => enabled.has(f))) enabled.add('INPUT');
    if (['COPY', 'EXPORT', 'SCOPED', 'FIND'].some(f => enabled.has(f))) enabled.add('EXTRACT');
    if (['COPY', 'DIAGNOSTICS', 'RECIPES', 'SCOPED', 'TASK_REPORT'].some(feature => enabled.has(feature))) enabled.add('WRITE');
    if (['EXPORT', 'DIAGNOSTICS', 'RECIPES', 'SCOPED', 'FIND', 'REVIEW'].some(feature => enabled.has(feature))) enabled.add('PANELS');
    if (edition.id === 'toolkit') enabled.add('MENU');
    if (reports.some(f => enabled.has(f))) enabled.add('CATALOG');
    if (edition.id === 'toolkit' || edition.configurable) enabled.add('SETTINGS');
    else enabled.add('NO_SETTINGS');
    const stack = [];
    const lines = [];
    for (const line of template.split('\n')) {
        const directive = line.trim().match(/^\/\/ #(if ([A-Z_]+)|endif)$/);
        if (directive) {
            if (directive[2]) stack.push(enabled.has(directive[2]));
            else assert.ok(stack.length && stack.pop() !== undefined, 'Unbalanced feature block');
        } else if (stack.every(Boolean)) lines.push(line);
    }
    assert.equal(stack.length, 0, 'Unclosed feature block');
    const body = lines.join('\n').replaceAll('__EDITION_NAME__', edition.name)
        .replaceAll('__VERSION__', manifest.version).replaceAll('__EDITION_ID__', edition.id)
        .replace('/* @actions */ []', `[\n        ${edition.features.filter(f => specs[f]).map(feature => specs[feature].replace('{ ', `{ id: '${feature}', `)).join(',\n        ')}\n    ]`)
        .replace('/* @features */ []', JSON.stringify(features.filter(f => enabled.has(f.id)).map(f => ({ ...f,
            defaultOn: edition.id === 'toolkit' ? f.defaultOn : f.id !== 'CUSTOM_PORT' || edition.id === 'custom-origin' }))))
        .replace('/* @reports */ []', JSON.stringify(reports.filter(f => enabled.has(f))));
    // Manager information is provided automatically; only request privileged APIs.
    const grants = enabled.has('WRITE') ? ['GM_setClipboard', 'GM.setClipboard', 'unsafeWindow'] : ['unsafeWindow'];
    if (enabled.has('SETTINGS')) grants.push('GM_getValue', 'GM_setValue', 'GM_registerMenuCommand', 'GM.getValue', 'GM.setValue', 'GM.registerMenuCommand');
    const generated = [
        '// ==UserScript==',
        `// @name         ${edition.name} ${manifest.version}`,
        '// @namespace    homelab',
        `// @version      ${manifest.version}`,
        `// @description  ${manifest.version.includes('-') ? 'Development candidate: ' : ''}${edition.description}`,
        '// @include      https://*:8006/*',
        ...grants.map(grant => `// @grant        ${grant}`),
        '// @license      MIT',
        `// @homepageURL  ${manifest.repository}`,
        `// @supportURL   ${manifest.repository}/issues`,
        '// @run-at       document-idle',
        '// @noframes',
        '// ==/UserScript==',
        '',
        '// Generated by node tools/build.cjs; edit src/toolkit.js instead.',
        body,
    ].join('\n');
    // Refuse to emit a candidate that cannot parse, even when only building.
    new vm.Script(generated, { filename: edition.file });
    return generated;
}
function build(check = false) {
    for (const edition of manifest.editions) {
        const destination = path.join(root, edition.file);
        const generated = buildEdition(edition);
        if (check) assert.equal(fs.readFileSync(destination, 'utf8').replace(/\r\n/g, '\n'), generated, `Stale generated edition: ${edition.file}`);
        else fs.writeFileSync(destination, generated);
    }
    const probePath = path.join(root, 'tools/probe-manager.user.js');
    const probe = fs.readFileSync(probePath, 'utf8').replace(/\r\n/g, '\n');
    const toolkit = buildEdition(manifest.editions.find(e => e.id === 'toolkit'));
    const stamped = probe.replace(/^\/\/ @version\s+\S+$/m, `// @version      ${manifest.version}`)
        .replace(/(?:^\/\/ @grant[^\r\n]*\r?\n)+/m, toolkit.match(/^\/\/ @grant[^\r\n]*/gm).join('\n') + '\n');
    if (check) assert.equal(probe, stamped, 'Manager probe version must follow the manifest');
    else fs.writeFileSync(probePath, stamped);
    console.log(`${check ? 'Verified' : 'Generated'} ${manifest.editions.length} standalone editions at ${manifest.version}`);
}
if (require.main === module) build(process.argv.includes('--check'));
module.exports = { manifest, buildEdition, build };
