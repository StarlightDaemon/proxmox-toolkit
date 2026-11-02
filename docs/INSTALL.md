# Installation and updates

[Project overview](../README.md) · [Usage guide](USAGE.md)

Firefox + Violentmonkey is the primary tested combination for Proxmox Toolkit 0.5.0. Other browser/manager results and their limits are recorded in [Testing](TESTING.md).

## Install

Copy and paste the script into your manager. This avoids raw-script links being opened by another extension, such as AdGuard.

1. Open your manager's script editor:

   | Manager | Open its script editor |
   | --- | --- |
   | [Violentmonkey](https://violentmonkey.github.io/guide/creating-a-userscript/) | Click its toolbar icon, then **+** to create a new script. |
   | [Tampermonkey](https://www.tampermonkey.net/faq.php?locale=en&q=Q102) | Open its dashboard and choose **Add a new script**. |

2. Open [the stable source](https://github.com/StarlightDaemon/proxmox-toolkit/blob/v0.5.0/proxmox-copy-console.user.js), or download `proxmox-copy-console.user.js` from the [0.5.0 release](https://github.com/StarlightDaemon/proxmox-toolkit/releases/tag/v0.5.0). Copy the entire file, including its `// ==UserScript==` header, into the editor. Confirm `@name Proxmox Toolkit` and `@version 0.5.0`.
3. **Replace** the supplied `https://*:8006/*` include rule with your trusted Proxmox host, for example:

   ```javascript
   // @include      https://pve.example.net:8006/*
   ```

   Adding a narrow rule alongside the broad one does not restrict access. Only enable the script on hosts you trust.
4. Save and keep one script entry enabled in one manager. Reload Proxmox and open an embedded node **Shell** or LXC **Console**. Expect one Copy and one Paste & Execute button beside the native control.

## Updates and migration

Replace the code in your existing entry, then reapply your trusted-host include rule before saving and reloading Proxmox.

The name changed from **Proxmox Copy Console** to **Proxmox Toolkit** in 0.5.0. Managers may treat the new name as a separate installation. If you create a separate entry, disable the old one before enabling Toolkit.

The repository moved to **StarlightDaemon/proxmox-toolkit** on 2026-11-02. Old repository links redirect to the new address. The historical 0.5.0 release keeps its original `proxmox-copy-console.user.js` asset and namespace. Three synchronized editions and a new Toolkit filename are under development; follow the [editions branch](https://github.com/StarlightDaemon/proxmox-toolkit/tree/codex/standalone-editions) for candidate instructions. Do not replace the stable script with a different edition just because its filename matches.

## Clipboard access

For **0.6.0-dev.1** candidate installation, use the [edition selection and migration guide](EDITIONS.md). The stable instructions above link to v0.5.0; its historical filename identifies the all-in-one script, while the development file with that name is Copy-only.

The script needs access to the Proxmox page, clipboard writing for Copy, and browser clipboard reading when Paste & Execute is activated. Firefox may show its own **Paste** prompt; approve it within 15 seconds or the operation expires. See [usage](USAGE.md#paste--execute) for what gets sent.

## Custom ports

The default requires HTTPS on port **8006**. For a custom port, change both the `@include` rule and the script's `location.port` check to match the browser URL. Changing the include rule alone is not enough. These setups remain untested and outside supported scope.

## Rollback to copy-only

Replace Toolkit with the [0.4.1 source](https://github.com/StarlightDaemon/proxmox-toolkit/blob/v0.4.1/proxmox-copy-console.user.js), reapply your trusted-host rule, save, and reload Proxmox. Keep one entry enabled. This restores the earlier Copy-only behavior.

If the buttons do not appear, check [troubleshooting](USAGE.md#troubleshooting) before using diagnostic probes.
