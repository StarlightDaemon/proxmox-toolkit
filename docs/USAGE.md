# Using Proxmox Toolkit

[Project overview](../README.md) · [Installation and updates](INSTALL.md)

Open an embedded node Shell or LXC Console. Copy and Paste & Execute appear beside the native control and operate on that console.

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

Copy and Paste & Execute cannot overlap. Repeated activation while an action is pending does not start another clipboard operation.

A pending paste expires after 15 seconds. Page hiding, navigation, control teardown, and observed console/session invalidation cancel it. The target and connection are checked again after reading the clipboard and after pasting, before Enter is sent. A session change after paste can therefore leave pasted text without Enter; inspect the console before retrying.

Console hiding reported by ExtJS is observed even if the console returns between polling ticks. Brief CSS-only visibility or connection changes that produce neither an event nor a polling observation cannot be reconstructed afterward. Browser prompt focus loss alone does not cancel a pending read, but focus is required again before sending. See [Design](DESIGN.md#paste-and-input-lifecycle) for the exact checks and limits.

## Feedback

Button labels stay fixed; icons and tooltips show the result briefly.

| Feedback | Meaning |
| --- | --- |
| Check icon / `Copied …` | The clipboard API reported completion. |
| Information icon / `Sent …; clipboard unconfirmed` | The write returned without a completion signal; check the pasted text. |
| Check icon / `Text and Enter sent` | Terminal input was dispatched; inspect the console for the program's result. |
| Warning icon | The action failed, was refused/canceled, or has an uncertain result. Read the tooltip before retrying. |
| Disabled button | The console or required capability is unavailable or ambiguous, or another clipboard action is pending. |

## Troubleshooting

- **Missing buttons:** confirm the script is saved and enabled in the intended manager, only one entry is active, host rules match, and Proxmox has been reloaded. Use a supported embedded node Shell or LXC Console. Check the [port requirements](INSTALL.md#custom-ports).
- **Copy works but Paste is disabled:** native clipboard reading or the required connected-console/input checks are unavailable. Record the tooltip and installed versions rather than bypassing those checks.
- **Copy is unconfirmed or times out:** paste into a scratch editor and inspect the text before retrying.
- **Paste is refused:** check the tooltip, clipboard text restrictions, and bracketed-paste requirements above.
- **Input may be partially sent:** inspect the terminal and existing command line before retrying. The script does not undo or retry input.

For a concrete failure needing investigation, see [Testing and diagnostic probes](TESTING.md#troubleshooting-and-optional-probes). The [Toolkit acceptance steps](TESTING.md#toolkit-acceptance) provide checks for your environment; exact recorded compatibility evidence stays in Testing.
