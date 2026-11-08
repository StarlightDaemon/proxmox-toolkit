# Installation and updates

[Project overview](../README.md) · [Usage guide](USAGE.md)

Firefox + Violentmonkey is the primary target for Proxmox Toolkit 0.7.0, promoted from the maintainer-tested dev.8 runtime. Other browser/manager results and detailed qualification limits are recorded in [Testing](TESTING.md).

The working tree also contains an unreleased **0.8.0-dev.1** development
candidate. The release links below continue to install stable 0.7.0. For an
operator-requested candidate test, use the locally generated edition, confirm
its exact version/hash, retain the stable file for rollback and replace the
existing manager entry with the same trusted-host restrictions. New development
reports remain off until explicitly enabled. See [the expansion acceptance
plan](EXPANSION-0.8.md); installing a candidate does not publish it.

## Install

Copy and paste the script into your manager. This avoids raw-script links being opened by another extension, such as AdGuard.

1. Open your manager's script editor:

   | Manager | Open its script editor |
   | --- | --- |
   | [Violentmonkey](https://violentmonkey.github.io/guide/creating-a-userscript/) | Click its toolbar icon, then **+** to create a new script. |
   | [Tampermonkey](https://www.tampermonkey.net/faq.php?locale=en&q=Q102) | Open its dashboard and choose **Add a new script**. |

2. Open [the stable Toolkit source](https://github.com/StarlightDaemon/proxmox-toolkit/blob/v0.7.0/proxmox-toolkit.user.js), or choose `proxmox-copy-paste.user.js` for only the clipboard actions from the [0.7.0 release](https://github.com/StarlightDaemon/proxmox-toolkit/releases/tag/v0.7.0). Copy the entire file, including its `// ==UserScript==` header, into the editor. Confirm `@version 0.7.0` and `@name Proxmox Toolkit 0.7.0` or `Proxmox Copy & Paste 0.7.0`.
3. **Replace** the supplied `https://*:8006/*` include rule with your trusted Proxmox host, for example:

   ```javascript
   // @include      https://pve.example.net:8006/*
   ```

   Adding a narrow rule alongside the broad one does not restrict access. Only enable the script on hosts you trust.
4. Save and keep one edition enabled in one manager. Reload Proxmox and open an embedded node **Shell** or LXC **Console**. Fresh defaults show Copy, Paste Only and Paste & Execute. The edition button beside global Documentation opens feature settings; existing saved choices remain intact.

## Updates and migration

Replace the code in your existing entry, then reapply your trusted-host include rule before saving and reloading Proxmox.

From candidate dev.5, generated names include the version, for example
`Proxmox Toolkit 0.7.0`. The build stamps both `@name` and `@version`;
no manual rename is needed. Update the **existing manager entry** rather than
installing another entry. A versioned name can be treated as a new script by an
installer, with separate storage. Keep only the intended entry enabled.

## Namespace and permission audit

`@namespace homelab` is a historical script identifier. It does not select a
Proxmox cluster, limit use to home labs, grant access, or send data anywhere.
The manager uses name plus namespace to identify scripts; the namespace stays
unchanged. See [Violentmonkey metadata documentation](https://violentmonkey.github.io/api/metadata-block/).

Both editions retain nine grant declarations for five capabilities:

| Grant declarations | Purpose and necessity |
| --- | --- |
| `GM_setClipboard`, `GM.setClipboard` | Write Copy results to the clipboard. Legacy and modern alternatives support different managers; one is selected per operation. |
| `GM_getValue`, `GM.getValue` | Load this script's saved feature choices for the current origin. |
| `GM_setValue`, `GM.setValue` | Persist choices on Save & Reload. |
| `GM_registerMenuCommand`, `GM.registerMenuCommand` | Keep the manager's settings shortcut available, including when the page toolbar cannot be located. Optional for the in-page button, necessary for this retained fallback. |
| `unsafeWindow` | Access Proxmox's ExtJS components and console integration from the userscript sandbox. |

Dev.5 removes explicit `GM_info` and `GM.info` grants. Manager information remains
used for clipboard completion handling and diagnostics, but is provided
automatically. Reviewed against the
[Violentmonkey API wrapper](https://github.com/violentmonkey/violentmonkey/blob/master/src/injected/web/gm-api-wrapper.js),
[Greasemonkey injection source](https://github.com/greasemonkey/greasemonkey/blob/master/src/user-script-obj.js),
[Tampermonkey grant documentation](https://www.tampermonkey.net/documentation.php?locale=en&q=grant),
and [FireMonkey documentation](https://erosman.github.io/support/content/help.html).

Paste reads use the browser clipboard API following user activation, not a GM
read grant. Reports use same-origin authenticated GET requests under the current
Proxmox session's permissions. No cross-origin request, cookie, tab-management,
notification or privileged download API is requested. Feature toggles stop their
runtime work; they do not revoke the installed script's static grants.

## Historical migration

The name changed from **Proxmox Copy Console** to **Proxmox Toolkit** in 0.5.0. Managers may treat the new name as a separate installation. If you create a separate entry, disable the old one before enabling Toolkit.

The repository moved to **StarlightDaemon/proxmox-toolkit** on 2026-11-02. Old repository links redirect to the new address. The historical 0.5.0 release keeps its original `proxmox-copy-console.user.js` asset and namespace. Toolkit and Copy & Paste are the only current editions; use the [edition guide](EDITIONS.md) to choose one. Disable old individual entries when migrating.

## Clipboard access

Both 0.7.0 editions provide clipboard actions. Use the [edition selection and migration guide](EDITIONS.md) when replacing an older script.

The script needs access to the Proxmox page, clipboard writing for Copy, and browser clipboard reading when Paste & Execute is activated. Firefox may show its own **Paste** prompt; approve it within 15 seconds or the operation expires. See [usage](USAGE.md#paste--execute) for what gets sent.

## Custom ports

The default requires HTTPS on port **8006**. Toolkit has an explicit custom-origin toggle and proxy prefix; update the manager's trusted-host rule and follow [catalog setup](CATALOG.md). Do not edit generated runtime checks. Copy & Paste does not include this extension. Live proxy qualification remains environment-specific work.

## Rollback to 0.5.0

Replace the current edition with the historical [0.5.0 all-in-one source](https://github.com/StarlightDaemon/proxmox-toolkit/blob/v0.5.0/proxmox-copy-console.user.js), reapply your trusted-host rule, and keep only that entry enabled. It provides Copy and Paste & Execute without the configurable catalog.

## Rollback to copy-only

Replace Toolkit with the [0.4.1 source](https://github.com/StarlightDaemon/proxmox-toolkit/blob/v0.4.1/proxmox-copy-console.user.js), reapply your trusted-host rule, save, and reload Proxmox. Keep one entry enabled. This restores the earlier Copy-only behavior.

If the buttons do not appear, check [troubleshooting](USAGE.md#troubleshooting) before using diagnostic probes.

Both editions declare clipboard writing and settings-storage/menu grants. Clipboard reads occur only on activation. Toolkit additionally contains on-demand same-origin GET reports and local downloads. See [catalog](CATALOG.md) for custom HTTPS origin/proxy setup and all settings. Keep only one edition enabled. Disable old individual entries before migrating.
