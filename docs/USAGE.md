# Using Proxmox Toolkit

[Project overview](../README.md) · [Installation and updates](INSTALL.md)

Stable 0.7.0 provides clipboard actions and a configurable catalog. See [catalog and settings](CATALOG.md) for all 22 toggles and report workflows. The sections below describe the existing six actions; Toolkit settings choose which appear. Copy & Paste includes only the three clipboard actions.

Click **Toolkit** immediately left of global
**Documentation** to toggle the native workspace. It fills the main content area;
the server tree, top bar and task log remain usable. Toggle again or choose
**Return to Proxmox** to restore the preserved view/console. Selecting another
resource follows normal Proxmox navigation; Save & Reload explicitly reloads.
Console actions appear left to right as
**Copy → Paste Only → Paste & Execute**, with disabled actions omitted.
Enabled management reports have **Open report** buttons alongside their settings in the six category tabs. Back to Toolkit returns to the report's category with the unsaved settings draft intact.

## Copy

Click **Copy**, then paste into your preferred editor. It captures the full retained normal buffer, including scrollback above the visible screen. When an alternate-screen application such as `top`, `nano`, or `less` is active, it copies that screen instead.

Wrapped rows are joined into logical lines. Interior blank lines and Unicode whitespace are preserved; trailing ASCII spaces and blank rows at the end are trimmed. Discarded scrollback cannot be recovered.

Check copied output before sharing; retained scrollback can contain sensitive text. Copy does not read the clipboard back or retry writes automatically. After an unconfirmed write or timeout, check the clipboard before retrying: a late extension write may still complete.

## Paste & Execute

Copy the intended text, check the current console and any existing input, then click **Paste & Execute**. It pastes into the active terminal program and sends Enter. It does not detect an empty shell prompt, clear existing input, or distinguish shells from editors and other terminal programs.

Firefox may display its own **Paste** prompt. Approve within 15 seconds; denial or expiry sends nothing. A canceled read may leave the browser's prompt visible, but approving it later cannot restart that operation.

### Text handling

- Trailing line breaks are removed, then one final Enter is sent. CRLF/CR line endings are normalized; other spaces and Unicode text are preserved.
- Multiline text and tabs require effective bracketed-paste mode. Otherwise the action refuses the text. The current shell/program determines how it interprets a pasted block.
- Empty or whitespace-only text, malformed Unicode, unsupported terminal control characters, and text over 65,536 UTF-16 code units are refused. Tabs and line endings are permitted subject to the rules above.
- `Text and Enter sent` reports dispatch, not successful command execution. Read the result in the console. After a partial-send warning, inspect the console before retrying; input is never retried automatically.

### Pending reads and cancellation

Clipboard reads and writes cannot overlap, including report/recipe copying across active script instances. Opening panels and requesting exports do not hold the clipboard lease. Repeated activation while an action is pending does not start another clipboard operation.

A pending paste expires after 15 seconds. Page hiding, navigation, control teardown, and observed console/session invalidation cancel it. The target and connection are checked again after reading the clipboard and after pasting, before Enter is sent. A session change after paste can therefore leave pasted text without Enter; inspect the console before retrying.

Console hiding reported by ExtJS is observed even if the console returns between polling ticks. Brief CSS-only visibility or connection changes that produce neither an event nor a polling observation cannot be reconstructed afterward. Browser prompt focus loss alone does not cancel a pending read, but focus is required again before sending. See [Design](DESIGN.md#paste-and-input-lifecycle) for the exact checks and limits.

## Paste Only (development candidate)

**Paste Only** reads the clipboard on activation and calls the terminal paste
API once. It never calls the Enter API or appends a submission character, and
works when the terminal lacks that API. Feedback is **Text sent; no Enter
appended**. This does not guarantee that execution was prevented: multiline
text and the active terminal program can still cause behavior. It does not
recognize a shell prompt or clear existing input.

The same 15-second deadline, focus/visibility/connection checks, normalization,
65,536 UTF-16-unit limit, Unicode/control rejection, and multiline/tab bracketed
paste requirement apply. CRLF/CR become LF and all trailing LF characters are
removed; other spaces and Unicode are retained. Cancellation, possible partial
send and no-retry rules are identical. Recheck the current program and input.

## Export Console (development candidate)

Open **Tools → Export Console** . This captures one
snapshot. Choose **Download plain text** (default) or **Download Markdown** in
the native panel. Reopen to capture newer output. Plain-text UTF-8 bytes equal
Copy's extraction without metadata or an extra newline. Markdown places the
same literal text inside a fence longer than every backtick run. HTML-like
strings remain text. Normal scrollback/alternate-screen and whitespace rules
are the same as Copy; retained readable output can be exported after disconnect.

Empty, unavailable and ambiguous buffers produce feedback without a download.
Names are generic UTC timestamps, such as proxmox-console-20261102T183000Z.txt.
The browser may prompt, rename or cancel. **Download requested** proves only
that a browser request was made; inspect the actual saved file. Exports can
contain sensitive information. There is no clipboard change or server request.

## Diagnostics (development candidate)

Open **Tools → Diagnostics** for a readable prerequisite snapshot. **Refresh**
re-evaluates it; **Copy diagnostic report** writes the displayed snapshot as
schema proxmox-toolkit-diagnostics/1 JSON. It includes script/edition version,
known manager identity, context type, capability booleans, observed counts,
buffer kind, connection/stdin/bracketed-paste state and fixed reason codes.
Unknown or unobserved values are null. No browser/PVE/package version is guessed.

Clipboard API presence does not establish permission. No test read/write, shell
probe, input or upload occurs. Bracketed paste is required only for multiline
text/tabs; a missing Enter API affects Paste & Execute, not Paste Only. The report
excludes transcript/command/clipboard text, host/node/guest identities, users,
URLs, cookies, tickets, socket addresses, raw page objects and error messages.
A snapshot is not a guarantee of later success. Reports are not persisted.

CONSOLE_MISSING / CONSOLE_AMBIGUOUS and ANCHOR_AMBIGUOUS identify ownership
problems; FRAME_INACCESSIBLE and TERMINAL_API_UNAVAILABLE identify integration
problems. SESSION_DISCONNECTED / SESSION_UNKNOWN, STDIN_DISABLED,
PASTE_API_UNAVAILABLE / ENTER_API_UNAVAILABLE, BUFFER_UNAVAILABLE,
CLIPBOARD_READ_UNAVAILABLE / CLIPBOARD_WRITE_UNAVAILABLE,
ACTIVATION_API_UNAVAILABLE, HIDE_LIFECYCLE_UNAVAILABLE and CLIPBOARD_BUSY name
specific prerequisites. DOCUMENT_HIDDEN, CONTEXT_INELIGIBLE, OWNER_UNAVAILABLE
and INSPECTION_FAILED report contained incomplete inspection. If ExtJS or a
unique native anchor is missing, use the existing optional probes in Testing.

## Diagnostic Recipes (development candidate)

Open **Tools → Recipes**, use **Previous/Next**, inspect the exact command and
explanation, then **Copy command**. It copies without a trailing newline. It
never reads the clipboard, probes a shell, stages text, or sends input. Use an
input action separately only after checking the destination and current program.
Reopen after changing consoles; stale or ambiguous targets are refused.

| Recipe | Exact command | Prerequisites and limits |
| --- | --- | --- |
| PVE package versions | `pveversion -v` | Node Shell only; requires PVE's utility and relevant access. Lists installed PVE package versions. |
| Filesystem capacity | `df -h` | Node or Linux LXC with GNU/coreutils-compatible df; mounted filesystem usage in powers of 1024. Other implementations differ. |
| Kernel and system identity | `uname -a` | Node or Linux LXC with uname; available fields vary and can disclose host identity. |
| Failed systemd units | `systemctl --failed --no-pager` | Node or systemd-based LXC; systemd 233+, a running accessible system manager and relevant access. Many containers do not use systemd. |

Context identifies the owned console, not the current program, installed tools,
distribution or privilege. Read-only commands can still disclose system details.
No automatic sudo, parameters, saved recipes or command history are provided.

Catalogue syntax/limits were checked on 2026-11-02 against the
[Proxmox pveversion reference](https://lists.proxmox.com/pipermail/pve-devel/2024-April/063253.html),
[GNU df manual](https://www.gnu.org/s/coreutils/manual/html_node/df-invocation.html),
[GNU uname manual](https://www.gnu.org/s/coreutils/manual/html_node/uname-invocation.html),
and [systemctl manual](https://www.freedesktop.org/software/systemd/man/latest/systemctl.html).
This documentation check does not prove those tools exist in a particular guest.

## Feedback

Button labels stay fixed; icons and tooltips show the result briefly.

| Feedback | Meaning |
| --- | --- |
| Check icon / `Copied …` | The clipboard API reported completion. |
| Information icon / `Sent …; clipboard unconfirmed` | The write returned without a completion signal; check the pasted text. |
| Check icon / `Text and Enter sent` | Terminal input was dispatched; inspect the console for the program's result. |
| Information icon / `Download requested` | Browser download intent; inspect the saved file. |
| Check icon / `Text sent; no Enter appended` | Paste Only dispatched text without appending Enter; not proof that execution was prevented. |
| Warning icon | The action failed, was refused/canceled, or has an uncertain result. Read the tooltip before retrying. |
| Disabled button | The console or required capability is unavailable or ambiguous, or another clipboard action is pending. |

## Troubleshooting

- **Missing buttons:** confirm the script is saved and enabled in the intended manager, only one entry is active, host rules match, and Proxmox has been reloaded. Use a supported embedded node Shell or LXC Console. Check the [port requirements](INSTALL.md#custom-ports).
- **Copy works but Paste is disabled:** native clipboard reading or the required connected-console/input checks are unavailable. Record the tooltip and installed versions rather than bypassing those checks.
- **Copy is unconfirmed or times out:** paste into a scratch editor and inspect the text before retrying.
- **Paste is refused:** check the tooltip, clipboard text restrictions, and bracketed-paste requirements above.
- **Input may be partially sent:** inspect the terminal and existing command line before retrying. The script does not undo or retry input.

For a concrete failure needing investigation, see [Testing and diagnostic probes](TESTING.md#troubleshooting-and-optional-probes). The [Toolkit acceptance steps](TESTING.md#toolkit-acceptance) provide checks for your environment; exact recorded compatibility evidence stays in Testing.
