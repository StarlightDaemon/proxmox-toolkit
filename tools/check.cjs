const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { manifest, buildEdition } = require('./build.cjs');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'proxmox-toolkit.user.js'), 'utf8');
const version = source.match(/^\/\/ @version\s+(\S+)$/m)?.[1];
assert.equal(version, manifest.version, 'Toolkit follows the shared release manifest');
assert.match(source, /^\/\/ @name\s+Proxmox Toolkit$/m, 'Product name');
// Size/hash identify the candidate; efficiency is reviewed through runtime work
// and resource lifetimes, without a source-size threshold (see DECISIONS.md).
assert.deepEqual([...source.matchAll(/^\/\/ @grant\s+(\S+)$/gm)].map(m => m[1]).sort(),
    ['GM.info', 'GM.setClipboard', 'GM_info', 'GM_setClipboard', 'unsafeWindow']);
assert.ok(!/^\/\/ @(?:require|resource|connect|updateURL|downloadURL)\b/m.test(source), 'No implicit runtime dependencies or update channel');
const managerProbe = fs.readFileSync(path.join(root, 'tools', 'probe-manager.user.js'), 'utf8');
for (const edition of manifest.editions) {
    const text = fs.readFileSync(path.join(root, edition.file), 'utf8').replace(/\r\n/g, '\n');
    assert.equal(text, buildEdition(edition), `Regenerate ${edition.file} with node tools/build.cjs`);
    assert.equal(text.match(/^\/\/ @version\s+(\S+)$/m)?.[1], version, 'Every edition follows Toolkit, even if its runtime is unchanged');
    assert.ok(!/^\/\/ @(?:require|resource|connect|updateURL|downloadURL)\b/m.test(text));
    console.log(`${edition.file}: ${Buffer.byteLength(text)} bytes, SHA-256 ${createHash('sha256').update(text).digest('hex')}`);
}
for (const field of ['version', 'include', 'grant', 'run-at', 'noframes']) {
    const pattern = new RegExp(`^// @${field}\\b[^\\r\\n]*`, 'gm');
    assert.deepEqual(managerProbe.match(pattern), source.match(pattern), `Manager probe must mirror @${field}`);
}
let scripts = 0, links = 0;
function inspect(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (['.git', '.cache', 'node_modules'].includes(entry.name)) continue;
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) { inspect(file); continue; }
        const content = fs.readFileSync(file, 'utf8');
        if (/\.(?:c?js)$/.test(file)) {
            new vm.Script(content, { filename: file });
            scripts++;
        }
        if (file.endsWith('.md')) {
            for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
                const target = match[1];
                if (/^(?:https?:|#)/.test(target)) continue;
                assert.ok(fs.existsSync(path.resolve(path.dirname(file), target.split('#')[0])), `Broken link: ${file} -> ${target}`);
                links++;
            }
        }
    }
}
inspect(root);
for (const name of ['README.md', 'CHANGELOG.md', 'docs/DESIGN.md', 'docs/TESTING.md']) {
    assert.ok(fs.readFileSync(path.join(root, name), 'utf8').includes(version), `${name} must identify the current version`);
}
console.log(`Checked ${scripts} JavaScript files, ${links} local Markdown links, metadata, and version.`);
console.log(`Userscript: ${version}, ${Buffer.byteLength(source)} bytes, SHA-256 ${createHash('sha256').update(source).digest('hex')}`);
