# Proxmox Toolkit

[![Version](https://img.shields.io/badge/version-0.5.0-0969da)](https://github.com/StarlightDaemon/proxmox-toolkit/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-2da44e)](LICENSE)

Native **Copy** and **Paste & Execute** buttons for Proxmox node shells and LXC consoles.

- **Copy** captures retained scrollback or the active alternate screen as plain text, joining wrapped lines.
- **Paste & Execute** reads clipboard text, pastes it into the current console, and sends Enter.

One userscript, with no build step, runtime dependencies, or server installation. It uses the console's existing connection and stores no transcripts or clipboard history.

**[Install](#install)** · [Usage guide](docs/USAGE.md) · [Release notes](https://github.com/StarlightDaemon/proxmox-toolkit/releases/tag/v0.5.0)

## Install

1. Open your userscript manager; **Firefox + Violentmonkey** is the primary tested combination.
2. Copy the complete [stable script file](https://github.com/StarlightDaemon/proxmox-toolkit/blob/v0.5.0/proxmox-copy-console.user.js), including its userscript header, into a new entry or replace your existing entry. Confirm `@version 0.5.0`.
3. **Replace** the supplied `https://*:8006/*` include rule with your trusted host, for example `https://pve.example.net:8006/*`. Adding a narrow rule beside the broad rule does not restrict access.
4. Save, keep one entry enabled in one manager, reload Proxmox, and open a node **Shell** or LXC **Console**. Disable the old **Proxmox Copy Console** entry if you created a separate Toolkit entry.

See the [installation guide](docs/INSTALL.md) for manager setup, updates, migration, rollback, and custom ports.

## Use

Click **Copy**, then paste into your editor. Check copied output before sharing; retained scrollback can contain sensitive text.

**Paste & Execute sends Enter immediately after pasting.** It acts on the current terminal program and any existing command-line input. Check both before activating it. If Firefox shows its **Paste** prompt, approve within 15 seconds.

The [usage guide](docs/USAGE.md) explains text handling, feedback, cancellation, and troubleshooting. After uncertain or partial input, inspect the console before retrying.

## Compatibility

Targets current stable **Proxmox VE** through its main HTTPS interface on port **8006**, with embedded node Shell and LXC xterm consoles. Firefox + Violentmonkey has maintainer-reported practical acceptance for Toolkit 0.5.0; see [compatibility and test evidence](docs/TESTING.md) for other combinations and coverage limits.

Standalone windows, noVNC/SPICE, PDM remote consoles, and custom proxy ports are outside supported scope.

## Documentation

The repository is now **proxmox-toolkit**; the old repository address redirects here. Three synchronized editions—Toolkit, Copy Console, and Paste & Execute—are being developed on [the editions branch](https://github.com/StarlightDaemon/proxmox-toolkit/tree/codex/standalone-editions). The 0.5.0 release remains the accepted stable all-in-one script.

See the [documentation index](docs/README.md) for the guides, design, test records, and contributor references.
