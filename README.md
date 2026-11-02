# Proxmox Toolkit

[![Version](https://img.shields.io/badge/version-0.7.0-0969da)](https://github.com/StarlightDaemon/proxmox-toolkit/releases/latest)
[![Checks](https://github.com/StarlightDaemon/proxmox-toolkit/actions/workflows/checks.yml/badge.svg?branch=main)](https://github.com/StarlightDaemon/proxmox-toolkit/actions/workflows/checks.yml)
[![Platform: Proxmox VE](https://img.shields.io/badge/platform-Proxmox_VE-e57000)](docs/COMPATIBILITY.md)
[![License](https://img.shields.io/badge/license-MIT-2da44e)](LICENSE)

Native clipboard tools and configurable read-only management reports for Proxmox VE.

- **Copy** captures retained scrollback or the active alternate screen as plain text, joining wrapped lines.
- **Paste Only** pastes clipboard text without appending Enter.
- **Paste & Execute** reads clipboard text, pastes it into the current console, and sends Enter.
- **Toolkit** provides 22 feature toggles across six categories, including console utilities and management reports. Only the three clipboard actions default on.

Choose one edition: **Toolkit** for all features, or **Copy & Paste** for the three clipboard actions. Each is one userscript with no user build step, runtime dependencies, or server installation. Settings are saved locally by the manager; transcripts and clipboard history are not stored by the script.

**[Install](#install)** · [Usage guide](docs/USAGE.md) · [GitHub repository](https://github.com/StarlightDaemon/proxmox-toolkit) · [Release notes](https://github.com/StarlightDaemon/proxmox-toolkit/releases/tag/v0.7.0)

## Install

1. Open your userscript manager; **Firefox + Violentmonkey** is the primary tested combination.
2. Copy the complete [Toolkit script](https://github.com/StarlightDaemon/proxmox-toolkit/blob/v0.7.0/proxmox-toolkit.user.js) or [Copy & Paste script](https://github.com/StarlightDaemon/proxmox-toolkit/blob/v0.7.0/proxmox-copy-paste.user.js), including its userscript header, into your manager entry. When updating, replace the code in the existing entry to retain its settings. Confirm `@version 0.7.0`.
3. **Replace** the supplied `https://*:8006/*` include rule with your trusted host, for example `https://pve.example.net:8006/*`. Adding a narrow rule beside the broad rule does not restrict access.
4. Save, keep one entry enabled in one manager, reload Proxmox, and open a node **Shell** or LXC **Console**. Disable the old **Proxmox Copy Console** entry if you created a separate Toolkit entry.

See the [installation guide](docs/INSTALL.md) for manager setup, updates, migration, rollback, and custom ports.

## Use

Click **Copy**, then paste into your editor. Check copied output before sharing; retained scrollback can contain sensitive text.

**Paste & Execute sends Enter immediately after pasting.** It acts on the current terminal program and any existing command-line input. Check both before activating it. If Firefox shows its **Paste** prompt, approve within 15 seconds.

The [usage guide](docs/USAGE.md) explains text handling, feedback, cancellation, and troubleshooting. After uncertain or partial input, inspect the console before retrying.

Click **Toolkit** immediately left of global **Documentation** to select features or open reports. Toggle again or choose **Return to Proxmox** to restore the preserved console. **Save & Reload** explicitly reloads the page.

## Compatibility

See the [compatibility guide](docs/COMPATIBILITY.md) for supported console types, browser and userscript-manager guidance, and optional integration requirements.

## Documentation

The old **proxmox-copy-console** GitHub address redirects to **proxmox-toolkit**. See the [catalog guide](docs/CATALOG.md), [edition selection](docs/EDITIONS.md), [remaining live checks](docs/CATALOG-ACCEPTANCE.md), and [maintenance register](docs/OPEN-LOOPS.md). Historical 0.5.0 remains available for rollback with its original filename and release assets.

See the [documentation index](docs/README.md) for the guides, design, test records, and contributor references.
