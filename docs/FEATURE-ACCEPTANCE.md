# 0.6.0-dev.2 manual acceptance plan

**Historical 0.6.0 feature checkpoint.** Current packaging and runtime are the
0.7.0-dev.8 Toolkit and Copy & Paste candidates. See [catalog](CATALOG.md) and
[current acceptance](CATALOG-ACCEPTANCE.md). Earlier deferrals, filenames and hashes
below describe the previous assignment, not the current catalog.

Prepared 2026-11-02. **Every live case below is pending.** This plan is for the
maintainer to operate in a disposable scratch environment. The implementing agent
has not run any recipe or command in a live Proxmox console. Stable v0.5.0 remains
the accepted release; no commit, push, PR, merge, tag or publication is included.

## Exact local candidate

Repository: StarlightDaemon/proxmox-toolkit. Branch: codex/standalone-editions.
Starting HEAD: 5a245c95aa114ec8d4114808857517206f2d54ad. These files include
uncommitted implementation and preserved handoff work; HEAD alone is not their
identity. Verify these exact bytes before installation, then record any intended
trusted-host header customization separately.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| proxmox-toolkit.user.js | 53737 | 3899cad5a4f5b1e8ea2a5525a41dfdc58a1719bbeae830bafd69491dcfadee39 |
| proxmox-copy-console.user.js | 24193 | 720903e804ef9ab82c796998216d2b29e16b16b9cc939fa369de5745053f4eb6 |
| proxmox-paste-execute.user.js | 25437 | ec0579864b4b8cf994c93154b0d17ae929e2eeae8290869ce23a2c4962c73c6e |
| proxmox-paste-only.user.js | 25389 | c8787a83bdc0e02e680ea58a0a659449150b31eab9cb91afd37889325b564a0e |
| proxmox-export-console.user.js | 26345 | 2005825e3e49130535cbb2de6f61f01c7979c15372ff03590afa8aafb34cd688 |
| proxmox-toolkit-diagnostics.user.js | 32219 | 034f8faeac7774622bac0c888d79ee83aa0165b5b7d9ce280f10dfe6a237c986 |
| proxmox-diagnostic-recipes.user.js | 28973 | acf717cedee14d394650f67bb6ecb62027c6004cbbb3986996d441a20df5e0ee |

All seven metadata versions are 0.6.0-dev.2. Use the [edition guide](EDITIONS.md).
Run Get-FileHash -Algorithm SHA256 against the local files to verify identity.
Any source/runtime change requires new hashes and affected acceptance cases.

## Record the environment and each result

Record date/operator, OS version, Firefox exact version, Violentmonkey exact
version, PVE manager version, installed pve-xtermjs/xterm package/build versions,
node or LXC context, guest distribution/init system when relevant, selected
editions/hashes, host-rule customization, theme, zoom and toolbar width. Obtain
package information through your existing administration workflow; Toolkit
Diagnostics deliberately does not discover it. Do not assume the prior stable
Firefox 159.0 / Violentmonkey 2.50.0 / Windows 11 report describes this run.

For each numbered case record Pass/Fail/Pending/Not applicable, exact steps,
actual clipboard/file/console observations, and sanitized evidence. A success
icon alone proves neither clipboard contents, disk saving nor remote execution.
Never put credentials or actual host/guest identifiers into a shared report.
Chrome/Tampermonkey and other combinations need separate records, not inferred
passes. Mock tests do not qualify browser permission UI or ExtJS rendering.

## Installation combinations

Run the workflow cases for Toolkit alone, each of the six individual editions
alone, Copy + Paste & Execute + Paste Only, Export + Diagnostics + Recipes, and
all six individuals together. Check both forward and reverse installation order.
Use one manager and the same version. Separately test unsupported overlaps
Toolkit + each individual and repeated same-edition entries only to verify no
duplicate controls/actions; disable overlaps and reload afterward.

1. **Native layout and keyboard (pending).** Node Shell and Linux LXC Console:
   Toolkit shows Copy, Paste & Execute, Paste Only, Tools; Tools contains Export
   Console, Diagnostics, Recipes. Individuals follow the order in Editions.
   Tab/Shift-Tab, Enter/Space, menu arrows and Escape must reach and close controls.
   Test light/dark themes, narrow toolbar, zoom, footer overflow, dialog resize,
   close/reopen, and return from a hidden tab. No clipped/inaccessible action or
   persistent orphan menu/panel should remain. Clipboard completion must not
   steal focus from an editor or a dialog opened after the action.
2. **Copy and export equality (pending).** In a disposable shell, manually produce
   harmless synthetic output using the command below. Include enough repeated
   lines to scroll, resize to wrap wide glyphs, and leave interior blank lines.
   Compare actual Copy clipboard text with the downloaded UTF-8 plain-text file,
   including its last byte (no extra newline), Unicode and whitespace. Open the
   Markdown file as text and rendered Markdown: embedded fences/HTML must remain
   literal code, with an enclosing fence longer than all runs. Verify generic UTC
   filenames. Cancel one browser download and confirm feedback still claims only
   request intent. Reopen Export to capture new output; an already-open export
   panel keeps its prior snapshot. Repeat with retained disconnected output and
   an alternate screen (for example a scratch editor opened manually). Empty or
   ambiguous/unavailable console: no download. Close/navigate immediately after
   request and inspect saved-file behavior to qualify object-URL consumption.

~~~sh
printf '%s\n' 'Toolkit sample' '' 'abcd界 café 😀' 'literal <b>text</b>' 'fence `````' 'end'
~~~

3. **Separate input semantics (pending).** Start from an empty scratch shell prompt
   with no existing command. Copy the exact text below without a newline. Paste
   Only should stage it without an appended Enter; verify the console directly,
   then cancel the staged line manually with Ctrl-C. Paste & Execute should send
   text followed by one Enter; verify the one printed marker and resulting prompt.
   This is a controlled shell observation, not a guarantee for other programs.

~~~sh
printf '%s\n' toolkit-input-check
~~~

4. **Text safeguards (pending).** Repeat both actions with trailing LF, CRLF and
   blank lines; spaces/Unicode survive while trailing line breaks are removed.
   Test a two-line block of harmless printf commands and a tab in a disposable
   session with known effective bracketed-paste mode; test refusal with that mode
   off. Inspect actual input/program behavior. Test whitespace-only and malformed/
   unsupported control input in a controlled fixture; no input should be sent.
   Test exactly 65,536 and 65,537 UTF-16 units in the fixture, not a production
   shell. Paste Only must work without an Enter API in the controlled fixture.
5. **Permission and session lifetime (pending).** For both paste actions, deny the
   browser prompt; approve promptly; approve after 15 seconds; switch away/back;
   hide/show the console; hide/restore the tab; reconnect/replace the session;
   navigate and then approve a delayed prompt. Observe no input after cancellation.
   While pending, activate other clipboard actions/editions; only one operation
   may start. After denial/timeout, fresh actions recover. Partial-send warnings
   must never lead to an automatic retry; inspect before manually retrying.
6. **Diagnostics content (pending).** Open and refresh with connected/disconnected
   sessions, disabled stdin, missing clipboard capabilities, missing terminal,
   and ambiguous frame fixtures. Compare summary and actual copied JSON. Check
   schema/version/edition, null unknowns, reason codes and conditional bracketed
   paste. Copy must preserve the displayed snapshot until Refresh. Verify no
   transcript, command, host/guest/user identity, URL or ticket appears. No
   permission prompt, buffer extraction or command should occur merely on open.
   If native integration is absent, use the existing optional probes separately.
7. **Recipes (pending).** On Node and Linux LXC inspect all four descriptions and
   compare the actual clipboard to the four exact commands in Usage, with no
   trailing newline. The node-only entry must be unavailable in LXC. Open a
   selection, switch node/guest or replace the session, and try to copy: stale or
   ambiguous context must be refused. Reopen for a new target. Opening/browsing
   cannot acquire the clipboard lease or send input. No recipe needs to be run
   for this test. Optional later manual execution is the maintainer's decision.
8. **Write outcomes and cleanup (pending).** For Copy/report/recipe writes, compare
   actual clipboard contents after normal completion and void/unconfirmed APIs.
   Use a controlled manager fixture for denial, missing callback/promise timeout,
   late completion and lease replacement; no automatic retry, wrong-owner lease
   release or stale feedback. Close panels, destroy/navigate views and reopen;
   verify no accumulated timers, listeners, orphan native components or URLs.
   A write already dispatched may complete after cancellation/timeout.
9. **Migration/rollback (pending).** Confirm names/version/capabilities, especially
   historical all-in-one v0.5.0 proxmox-copy-console.user.js versus development
   Copy-only. Disable all candidates, restore the exact pinned stable source,
   reapply trusted-host rules, reload, and verify stable Copy/Paste & Execute.

## Acceptance decision

No live case is currently passed. Record any failed case with exact candidate
hash and reproducible steps. The maintainer's explicit acceptance applies only
to observed environments and cases. A subsequent publication decision remains
separate. [Local review](FEATURE-REVIEW.md) documents automated evidence.
