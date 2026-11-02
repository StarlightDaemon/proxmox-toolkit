# Editions and shared development

[Overview](../README.md) · [Installation](INSTALL.md) · [Catalog and settings](CATALOG.md)

## Choose an edition

Stable **0.7.0** has exactly two installable files:

| Edition | File | Features |
| --- | --- | --- |
| Proxmox Toolkit | [proxmox-toolkit.user.js](../proxmox-toolkit.user.js) | All 22 independently toggleable capabilities. Only Copy, Paste Only and Paste & Execute default on; other tools default off. |
| Proxmox Copy & Paste | [proxmox-copy-paste.user.js](../proxmox-copy-paste.user.js) | Copy, Paste & Execute and Paste Only, each toggleable and initially enabled. No management API client, export, diagnostic/recipe panels, search/review tools, serial or proxy extension. |

On 2026-11-02 the maintainer replaced the individual-feature edition plan with
this consolidated model. Individual development userscripts have been removed.
All utility and management features belong to Toolkit. Shared code and a single
manifest version remain; both files are independently installable with no runtime
dependencies or user build step. The maintainer approved the tested dev.8 runtime
for stable 0.7.0; detailed per-edition and scenario qualification remains in
[Testing](TESTING.md).

## Migration

Both generated names include their shared version from dev.5 onward. Replace
the code in the existing manager entry when updating, preserving its settings
and trusted-host rules. Installing a changed name separately can create a
duplicate with separate settings. See the [namespace and grant audit](INSTALL.md#namespace-and-permission-audit).

Install one edition in one manager. Disable all old individual scripts, including
Copy Console, Paste & Execute, Paste Only, Console Export, Diagnostics and Recipes.
Do not install Toolkit and Copy & Paste together, even if their toggles differ.
Conflict detection is a fallback, not a supported mixed-install configuration.

Click the edition button beside global Documentation to toggle the native Toolkit
workspace without recreating the underlying console, or use the
manager's Toolkit settings command. Settings
are local to each edition and origin and are not automatically transferred from
an old individual entry. Reapply exact trusted-host include rules on updates.

The historical stable 0.5.0 asset `proxmox-copy-console.user.js` remains the
all-in-one Toolkit at its tag/release. Its published identity is unchanged even
though that filename is no longer generated. To roll
back, disable both new editions and restore the exact
[v0.5.0 script](https://github.com/StarlightDaemon/proxmox-toolkit/blob/v0.5.0/proxmox-copy-console.user.js).

## Build and verification

Edit `src/toolkit.js` and its build-time fragments `src/settings.js`,
`src/console-extras.js`, `src/catalog-model.js`, and `src/catalog-ui.js`.
`tools/features.cjs` defines feature IDs, names, groups and Toolkit defaults;
`tools/editions.json` owns the synchronized version and the two selections.
Never hand-edit generated userscripts. Excluded utility/management capabilities
are physically absent from Copy & Paste; disabling a toggle only stops runtime
activity and does not remove code or revoke grants.

```sh
node tools/build.cjs
node tools/build.cjs --check
node tools/check.cjs
node tools/fetch-xterm.cjs
node --test --test-isolation=none tests/*.test.cjs
node tools/browser-smoke.cjs
```

The optional browser fixture takes a Chrome/Edge executable path as its first
argument and uses an isolated headless profile with synthetic PVE data. It is not
live Proxmox or userscript-manager acceptance. See [Testing](TESTING.md) and the
[live campaign](CATALOG-ACCEPTANCE.md).
