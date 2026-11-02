// Development fixture only. Shipped userscripts never fetch these assets.
// ExtJS 7.0.0.168 and Crisp theme, fetched from the public Proxmox API viewer.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const assets = [
    {
        "file": "ext-all.js",
        "url": "https://pve.proxmox.com/pve-docs/api-viewer/extjs/ext-all.js",
        "sha256": "720bef043bc84ac847b19b7fb5002b21d51691f8925635e9c04646f25d815881"
    },
    {
        "file": "theme.css",
        "url": "https://pve.proxmox.com/pve-docs/api-viewer/extjs/theme-crisp/resources/theme-crisp-all.css",
        "sha256": "e1204689cd9993a7395e7e65feabe3bcef5beaf1a8982e3e857fa06eb1878cc6"
    },
    {
        "file": "theme-crisp-all_1.css",
        "url": "https://pve.proxmox.com/pve-docs/api-viewer/extjs/theme-crisp/resources/theme-crisp-all_1.css",
        "sha256": "2789267e7621f84607d10fd1256035b962bd00bce8a9b0dac1c50c4c246b4a99"
    },
    {
        "file": "theme-crisp-all_2.css",
        "url": "https://pve.proxmox.com/pve-docs/api-viewer/extjs/theme-crisp/resources/theme-crisp-all_2.css",
        "sha256": "2b8fd9122edcc649a1c6c65feb2b11024b014150514465ba03f1a58d2cc26f56"
    },
    {
        "file": "theme-crisp.js",
        "url": "https://pve.proxmox.com/pve-docs/api-viewer/extjs/theme-crisp/theme-crisp.js",
        "sha256": "dcde34c03163a81ba5e57d489ffa06f42f123e7e5d1f3491c9b4a64a779ee58d"
    },
    {
        "file": "images/form/checkbox.png",
        "url": "https://pve.proxmox.com/pve-docs/api-viewer/extjs/theme-crisp/resources/images/form/checkbox.png",
        "sha256": "3b99bdb5df590f32e12ecb3a14580f934e269c23efcc00fd84059813a2ae0004"
    },
    {
        "file": "images/tools/tool-sprites.png",
        "url": "https://pve.proxmox.com/pve-docs/api-viewer/extjs/theme-crisp/resources/images/tools/tool-sprites.png",
        "sha256": "6b76e92792137a9cd56293e071d536db7f0aea742e8f1adc4e91f16bc9c877a5"
    },
    {
        "file": "images/tools/tool-sprites-dark.png",
        "url": "https://pve.proxmox.com/pve-docs/api-viewer/extjs/theme-crisp/resources/images/tools/tool-sprites-dark.png",
        "sha256": "7d9f188e974d3be1081700daf0480c5d6321be520572fc798657a620aa8ca58e"
    }
];
const directory = path.join(__dirname, '..', '.cache', 'catalog-browser');
function verify(data, asset) {
    if (createHash('sha256').update(data).digest('hex') !== asset.sha256) throw Error('Fixture hash mismatch: ' + asset.file);
}
async function main() {
    for (const asset of assets) {
        const destination = path.join(directory, asset.file);
        if (fs.existsSync(destination)) { verify(fs.readFileSync(destination), asset); continue; }
        const response = await fetch(asset.url, { signal: AbortSignal.timeout(30000) });
        if (!response.ok) throw Error('Fixture HTTP ' + response.status + ': ' + asset.file);
        const data = Buffer.from(await response.arrayBuffer());
        verify(data, asset);
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.writeFileSync(destination, data);
    }
    console.log('Verified ' + assets.length + ' pinned ExtJS fixture assets.');
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { assets, directory, verify };
