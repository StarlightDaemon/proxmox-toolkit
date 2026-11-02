# Editions and shared development

[Overview](../README.md) · [Installation](INSTALL.md) · [Usage](USAGE.md)

## Choose an edition

These are **0.6.0-dev.1 development candidates**, not stable 0.5.0. Changed installation, toolbar lifecycle, and cross-script clipboard coordination require new Firefox + Violentmonkey live acceptance.

| Edition | Installable file | Capabilities |
| --- | --- | --- |
| Proxmox Toolkit | [proxmox-toolkit.user.js](../proxmox-toolkit.user.js) | Copy and Paste & Execute; default all-in-one edition. |
| Proxmox Copy Console | [proxmox-copy-console.user.js](../proxmox-copy-console.user.js) | Copy only; no clipboard-reading or terminal-input code. |
| Proxmox Paste & Execute | [proxmox-paste-execute.user.js](../proxmox-paste-execute.user.js) | Paste only; no buffer extraction or clipboard-write APIs/grants. |

Install **either Toolkit or one/both standalone editions**. Do not combine Toolkit with individual editions. Use the same version and one manager for all active editions. Each file runs independently, with no runtime dependencies or user build step.

Follow [installation](INSTALL.md), substituting the chosen candidate file and confirming its name and `@version 0.6.0-dev.1`. Replace the broad host rule, disable old entries, save, and reload Proxmox. Expect only the selected controls; Copy remains before Paste when both individual editions are active.

## Migration and filenames

The historical v0.5.0 asset `proxmox-copy-console.user.js` is the **all-in-one Toolkit**. In this development line that filename means **Copy only**. Identify installations by `@name`, version, and capabilities, not filename alone.

To keep both actions, replace the existing Toolkit entry with `proxmox-toolkit.user.js`. To switch to individual editions, disable Toolkit first, then install the selected files. Copy keeps `@name Proxmox Copy Console`; Paste uses `@name Proxmox Paste & Execute`. The `homelab` namespace is retained. Keep older entries disabled. To roll back, use the exact [v0.5.0 Toolkit source](https://github.com/StarlightDaemon/proxmox-toolkit/blob/v0.5.0/proxmox-copy-console.user.js), restore your host rule, and disable candidates.

## Coexistence and efficiency

Each edition recognizes the requested action's existing toolbar marker and refuses overlapping installation. This prevents duplicates; mixing overlapping editions is not a supported way to choose which implementation wins. Reload after changing enabled entries.

Individual editions coordinate clipboard actions through one DOM attribute containing a random ownership token. No command/clipboard text or privileged callbacks are shared. Only the owner releases its token. Paste rechecks ownership before input; losing it cancels the operation. Page code can interfere with the marker, so it is coordination on a trusted host, not a security boundary. If an extension is terminated while holding it, reload to recover.

Toolkit has one 500 ms scan interval; running both individuals has two. Each script resolves consoles once per synchronous scan and reads the shared busy marker once per scan; hidden ticks do no discovery. Mock operation counts establish work and bounded lifetimes, not browser CPU or latency gains. Toolkit is the more efficient choice when both capabilities are wanted.

## Build and synchronized versions

Edit [src/toolkit.js](../src/toolkit.js), not generated files. [tools/editions.json](../tools/editions.json) owns the version, repository URL, edition names, and feature selection. Feature blocks are removed during generation: excluded capability code is absent, rather than hidden behind runtime settings.

```sh
node tools/build.cjs
node tools/build.cjs --check
node tools/check.cjs
node tools/fetch-xterm.cjs
node --test --test-isolation=none tests/*.test.cjs
```

Toolkit owns the complete release version. Change the manifest once and regenerate **all** editions on every release, including editions with unchanged runtime. The manager probe's version header is stamped too. Never version/release an edition independently. CI rejects stale files and version mismatches; tests check capability boundaries. Record runtime identity separately from version when describing changes and acceptance.

Future accepted features follow the same pattern: shared implementation, an optional standalone edition, and inclusion in Toolkit. Adding an edition does not authorize a feature, release, or compatibility claim.
