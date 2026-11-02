# Proxmox Toolkit

[![Version](https://img.shields.io/badge/release_candidate-0.5.0--rc.1-0969da)](proxmox-copy-console.user.js)
[![License](https://img.shields.io/badge/license-MIT-2da44e)](LICENSE)

Native **Copy** and **Paste & Execute** buttons for Proxmox node shells and LXC consoles. Copy captures retained scrollback and joins wrapped lines. Paste & Execute reads clipboard text and sends it followed by Enter to the current console.

**0.5.0-rc.1 is a release candidate.** It preserves the runtime of 0.5.0-dev.1, which the maintainer reports working well after extensive live testing in Firefox 159.0 (64-bit) with Violentmonkey 2.50.0 on Windows 11. This is practical workflow acceptance; full compatibility qualification remains open. **Proxmox Copy Console 0.4.1** remains the stable release. The repository URL and script filename retain their original names.

**[Install the candidate](#install)** · [Candidate release](https://github.com/StarlightDaemon/proxmox-copy-console/releases/tag/v0.5.0-rc.1) · [Candidate source](proxmox-copy-console.user.js) · [Stable 0.4.1](https://github.com/StarlightDaemon/proxmox-copy-console/releases/tag/v0.4.1) · [Testing](docs/TESTING.md)

## What it copies

- The full retained shell buffer, including output above the visible screen.
- The active alternate screen when using applications such as `top`, `nano`, or `less`.
- Plain text with wrapped lines joined and interior blank lines preserved.

Discarded scrollback cannot be recovered. Trailing ASCII spaces and blank rows at the end are trimmed.

One JavaScript file, with no build step or runtime dependencies. The script stores no transcripts or clipboard history. Paste uses the console's existing authenticated connection; no extra connection or server installation is needed.

## Install

Copy and paste directly into your chosen manager. This avoids raw-script links being opened by another extension, such as AdGuard.

1. Use **Firefox + Violentmonkey** as the primary candidate target.
2. Open [the candidate file](proxmox-copy-console.user.js) on `main`, or download `proxmox-copy-console.user.js` from the [v0.5.0-rc.1 prerelease](https://github.com/StarlightDaemon/proxmox-copy-console/releases/tag/v0.5.0-rc.1), and copy the entire file, including its `// ==UserScript==` header. Confirm `@version 0.5.0-rc.1`. The stable 0.4.1 tag/release still provides the copy-only version.
3. Replace the code in your existing userscript entry, or create one using the manager instructions below. When using a separate candidate entry, disable the old **Proxmox Copy Console** entry first. Changing `@name` to **Proxmox Toolkit** can be treated as a different installation by managers; do not leave both enabled.
4. **Replace** the supplied `https://*:8006/*` include rule with your trusted Proxmox host, for example `https://pve.example.net:8006/*`. Adding a narrow rule alongside the broad one does not restrict access.
5. Save, keep one copy enabled in one manager, reload Proxmox, and open a node **Shell** or LXC **Console**.

| Manager | Open its script editor |
| --- | --- |
| [Violentmonkey](https://violentmonkey.github.io/guide/creating-a-userscript/) | Click its toolbar icon, then **+** to create a new script. |
| [Tampermonkey](https://www.tampermonkey.net/faq.php?locale=en&q=Q102) | Open its dashboard and choose **Add a new script**. |

For updates, replace the code in your existing script entry and reapply your trusted-host include rule before saving.

The script needs access to the Proxmox page, clipboard writing for Copy, and browser clipboard reading on Paste & Execute activation. Firefox may display its own **Paste** prompt; approve it within 15 seconds or the operation expires. Only enable the script on hosts you trust. Copied scrollback may contain sensitive output; check it before sharing.

To return to stable behavior, replace the candidate with the [0.4.1 source](https://github.com/StarlightDaemon/proxmox-copy-console/blob/v0.4.1/proxmox-copy-console.user.js), reapply the trusted-host rule, and reload Proxmox. Keep one enabled entry.

## Use

Click **Copy** beside the native Shell or Console control, then paste into your preferred editor. The button's icon and tooltip show the result:

| Feedback | Meaning |
| --- | --- |
| Check icon / `Copied …` | The clipboard API reported completion. |
| Information icon / `Sent …; clipboard unconfirmed` | The write returned without a completion signal; check the pasted text. |
| Warning icon | Copying failed, the buffer is unavailable, or confirmation timed out. Check the tooltip. |
| Disabled button | The console is unavailable or ambiguous, or another clipboard action is pending. |

Copy does not read the clipboard back or retry writes automatically. After a copy timeout, check the clipboard before retrying.

Click **Paste & Execute** to paste text into the active terminal program and send Enter. This also acts on any command-line text already present; it does not detect an empty shell prompt or replace existing input. It sends to editors and other terminal programs as well as shells.

- Trailing line breaks are removed so the action adds one final Enter. Other spaces and Unicode text are preserved; CRLF/CR line endings become terminal line endings.
- Multiline text and tabs require the terminal's bracketed-paste mode. Otherwise nothing is sent. How the current shell/program interprets the pasted block remains its behavior.
- Empty/whitespace-only text, terminal control characters other than tabs/newlines, malformed Unicode, and text over 65,536 UTF-16 code units are refused.
- Switching views/tabs, changing connections, destroying controls, or waiting over 15 seconds cancels a pending read. Copy and Paste & Execute cannot overlap.
- `Text and Enter sent` reports dispatch, not successful command execution. After a partial-send warning, inspect the console before retrying. No execution is retried automatically.

Use the [candidate acceptance steps](docs/TESTING.md#toolkit-candidate-acceptance) to verify the action in your environment.

## Compatibility

Targets current stable **Proxmox VE** through its main HTTPS interface on port **8006**, using embedded node Shell and LXC xterm consoles.

**Custom port?** Update both the `@include` rule and the script's `location.port` check to match your browser URL; changing the include rule alone is not enough. Custom-port setups remain untested.

The released **0.4.1 copy-only runtime** has reported practical passes in Firefox and Chrome, each with Violentmonkey and Tampermonkey. The Toolkit candidate has its own maintainer-reported practical pass in Firefox 159.0 (64-bit) with Violentmonkey 2.50.0 on Windows 11. Proxmox/package versions, cross-browser qualification, and detailed per-scenario observations remain open. See [test coverage](docs/TESTING.md).

Standalone console windows, noVNC/SPICE, PDM remote consoles, and custom proxy ports are outside the supported scope. Other browsers and managers are outside the current testing focus; see [compatibility details](docs/TESTING.md#current-status).

## Documentation

- [Testing and troubleshooting](docs/TESTING.md) — local checks, diagnostic probes, and live test results.
- [Design](docs/DESIGN.md) — console matching, text extraction, and clipboard handling.
- [Open loops](docs/OPEN-LOOPS.md) — remaining evidence gaps and conditional follow-ups.
- [Documentation index](docs/README.md) — decisions, changelog, and historical records.

[MIT License](LICENSE).
