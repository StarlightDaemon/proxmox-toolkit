# Testing and compatibility

## Current status

**Proxmox Toolkit 0.5.0-rc.1 is a release candidate.** Firefox + Violentmonkey
remains the primary target. Its executable runtime is unchanged from
0.5.0-dev.1; only userscript version/description metadata changed for promotion.

### Maintainer-reported live acceptance — 2026-11-01

After receiving the complete current 0.5.0-dev.1 source in this chat, the
maintainer reported: "Latest version is working well. I've tested it backward
and forwards." The maintainer authorized preparing and pushing a release
candidate with documentation. Record this as successful practical workflow
acceptance of the candidate, independently of the earlier copy-only reports.

The maintainer identified Firefox 159.0 (64-bit), Violentmonkey 2.50.0, and
Windows 11 as the tested environment. Proxmox/package versions, exact scenarios,
clipboard comparisons, and individual cancellation observations were not given.
Do not mark every acceptance step or browser/manager combination passed by
inference. The agent did not operate the live console or OS clipboard; this
is a maintainer report. Detailed qualification and browser profiling remain
open, and 0.4.1 remains stable.

### Release-candidate local verification — 2026-11-01

All **180 tests passed** under Node.js 24.18.0, with zero failures/skips.
`node tools/check.cjs` passed source parsing for 13 JavaScript files, metadata,
version alignment, and 85 local Markdown links. The pinned cached Proxmox
xterm fixture passed integrity verification; `git diff --check` passed.

Candidate source: 28,114 bytes; SHA-256
`689c95cd4e6a9d9e44bd7e92a1119929d02c5f03427422541a9f928a233ae8cc`.
The executable IIFE, normalized to LF, has SHA-256
`8cd88a878b1dd61ca77603ab00350864841aaefa0ac7ddbdcea3a467160d0828`,
matching the supplied maintainer-tested 0.5.0-dev.1 body. Metadata promotion
adds no new runtime behavior. These checks are local execution, distinct from
the maintainer's live report and from GitHub CI. Candidate CI is verified
separately after the branch push; no result is implied by this record.

### Earlier local development verification

Local candidate verification on 2026-10-16 (Node.js 24.18.0): **180 tests
passed, zero failures/skips**. Added seven regressions for pending-paste polling,
hidden-page work, missing/failed discovery, and ignoring hide-event arguments
without a sharing bridge. The new operation-count test first reproduced the
duplicate pending validation, then passed with per-scan reuse. Across 100 scans
with two visible consoles and a pending read, component queries fell from 200
to 100; frame searches, geometry reads, and style reads each fell from 300 to
200. Existing idle coverage still asserts 100 queries, 200 frame/geometry reads,
and zero unchanged button setters. A hidden-page fixture performs zero queries
or frame searches across 100 ticks. These counts measure mocked operations,
not browser CPU time, layout cost, or clipboard latency.

Resource assertions confirm one 500 ms recovery interval, one pending watchdog,
and one temporary hide listener across 100 pending ticks; completion leaves only
the feedback timer, which expires, and removes the hide listener. Existing
timeout, denial, destruction, transient-hide, late-result, and session checks
pass. Source/metadata/link checks, cached fixture integrity, and
`git diff --check` passed. No fixed source-size assertion remains; the input
length guard remains. Runtime: 28,119 bytes; SHA-256
`51129dddf87cf048f05370903e7a16a0b294f083a4b878428cd573cdef4db2ed`.
At that checkpoint no candidate CI, live browser profiling, OS clipboard, or
Proxmox acceptance was performed. The later maintainer report is recorded above.

Earlier local candidate verification on 2026-10-15 (Node.js 24.18.0): **173 tests
passed, zero failures/skips**. Twelve audit regressions cover ExtJS destruction
ordering, per-scan discovery counts, unchanged button updates, transient console
hiding, listener cleanup, and unavailable/failed event integration. Across 100
mock idle scans with two visible consoles, component queries fell from 300 to
100 and frame searches/geometry reads from 400 to 200 each; unchanged tooltip
and disabled setters are no longer called. These are operation counts, not
browser CPU or latency measurements. Source/metadata/size/link checks, cached
fixture integrity, and `git diff --check` passed. Runtime: 27,554 bytes; SHA-256
`4361ac7ae44ffabcd00690af17814bcdd315aec45294c26899c221d2848973d8`.
The new ExtJS hide integration still requires Firefox + Violentmonkey live
acceptance. No candidate CI, browser rendering, OS clipboard, or live Proxmox
acceptance is claimed.

Earlier local candidate verification on 2026-09-24 (Node.js 24.18.0): **161 tests passed,
zero failures/skips**, including 71 new input tests and two new renderer-free
xterm checks. Syntax, metadata, version, size, local documentation links, and
`git diff --check` passed. The cached pinned fixture was integrity-verified.
Candidate size: 26,787 bytes; SHA-256
`e6356c7df7ed9ec616e9a157bbc464e949325264f83e3db22af719c07e3d1e67`.
These are local checks; no candidate CI, browser rendering, OS clipboard, or
live Proxmox acceptance is claimed.

## Stable 0.4.1 evidence

Stable **0.4.1** preserves the runtime of tested candidate `0.4.1-dev.1` at `6d803b0946af66c021bc9999cfdce292de750120`; promotion changed metadata only. [0.4.1](https://github.com/StarlightDaemon/proxmox-copy-console/releases/tag/v0.4.1) and [0.4.0](https://github.com/StarlightDaemon/proxmox-copy-console/releases/tag/v0.4.0) are published stable releases.

Target current stable Proxmox VE through its main HTTPS interface on port 8006, with embedded node Shell and LXC xterm consoles. Firefox + Violentmonkey is the primary combination; Chrome represents Chromium testing. Other Chromium browsers are unverified unless exercised. Additional-manager testing is deferred. Standalone windows, noVNC/SPICE, PDM remote consoles, and custom ports remain outside established support.

| Combination | Recorded practical result on 0.4.1-dev.1 |
| --- | --- |
| Firefox + Violentmonkey | Copying from shells and containers, including dynamic navigation, reported working. |
| Firefox + Tampermonkey | Final candidate follow-up reports all requested tests passed without issues. |
| Chrome + Violentmonkey | All requested workflow tests reported working without issues. |
| Chrome + Tampermonkey | Copy button, menu navigation, and leaving/returning to the site reported working. |

These are user-reported practical passes, not independently observed OS clipboard tests or complete per-scenario qualification. The earlier Firefox round established Firefox 156.0 (64-bit), Proxmox VE 9.2.3, Violentmonkey 2.49.0, and Tampermonkey 5.5.0; final candidate runs did not restate every version. Chrome was described as the latest official public-channel build; numeric browser/manager versions remain unrecorded.

FireMonkey 3.8 and Greasemonkey 4.14 have reported candidate copying success, with fuller qualification deferred. Preserve their diagnostic context in the [test history](historicals/TESTING.md); the [archived manager survey](historicals/COMPATIBILITY.md) is not an active test queue.

At 0.4.1 preparation, **88 local tests passed with zero failures/skips**. Syntax, metadata, version, size, links, and whitespace checks passed. [Promotion CI also passed](https://github.com/StarlightDaemon/proxmox-copy-console/actions/runs/35490151762). Stable source: 18,210 bytes; SHA-256 `16dd12bbdf8a33e4336caee17f86ff1146bf183f57370abcd4632da553757b11`. These are recorded release checks, not a claim of a new run whenever this document changes.

The [original evidence record](historicals/TESTING.md) retains exact commits, earlier counts/hashes, 0.4.0 acceptance limits, logs, and the promotion decisions. The historical 0.3.0 baseline remains at `27a83d2ac836ef35c2f7e6644b6e448355631be0`.

## Local checks

Use Node.js 24 from the repository root. No npm install or build step is needed.
The source checker reports bytes/hash for candidate identity; it enforces no
source-size limit. Efficiency is assessed through targeted operation counts and,
when needed, browser profiling.

```sh
node tools/check.cjs
node --test --test-isolation=none tests/console.test.cjs tests/compatibility.test.cjs tests/baseline.test.cjs tests/probe.test.cjs tests/paste.test.cjs
node tools/fetch-xterm.cjs
node --test --test-isolation=none tests/*.test.cjs
```

The first two commands work offline. The downloader fetches a pinned, integrity-checked Proxmox xterm bundle into ignored `.cache/` if missing. The full suite fails for a missing/corrupt fixture rather than skipping parser coverage.

Mocks exercise targeting, clipboard contracts, errors, lifecycle, focus, and
sandbox-adapter behavior. Input cases include console/socket replacement,
navigation, hidden tabs, denial, timeout/late completion, Unicode/line endings,
bracketed-paste requirements, serialization, and partial-send handling. The
real xterm fixture exercises its parser and public APIs without a renderer.
In this fixture `paste()` emits onData and then throws when clearing the absent
textarea; dedicated tests explicitly assert that limitation, payload framing,
and the candidate's refusal to send Enter after that partial failure. They do
not demonstrate a successful rendered paste. Neither mocks nor parser tests
prove native Firefox compartment behavior, permissions, real clipboard
contents, or live Proxmox compatibility.

## Toolkit candidate acceptance

Install the local [candidate source](../proxmox-copy-console.user.js) in Firefox
with Violentmonkey, following the [migration/rollback instructions](../README.md#install).
Confirm `Proxmox Toolkit`, `0.5.0-rc.1`, your exact trusted-host include rule,
and only one enabled installation. Keep the released 0.4.1 source available for
rollback. Record browser, manager, PVE, and `pve-xtermjs` versions plus the actual
script hash. Numeric versions from earlier Copy reports are not candidate data.

Use an idle node Shell and a scratch LXC Console with an empty shell prompt.
These are manual test instructions. The practical acceptance report above does
not establish a pass for each individual step.

1. Confirm exactly one Copy and one Paste & Execute beside the native control.
   Re-run Copy on synthetic scrollback and verify the pasted result in an editor.
2. Copy `printf '%s\n' 'toolkit-one'` from a local editor with no trailing newline.
   Click Paste & Execute. If Firefox shows its Paste prompt, approve within 15
   seconds. Expect `toolkit-one` once, followed by the shell prompt. Record the
   browser prompt and actual text/output, not just a check icon. Repeat with a
   trailing newline and with CRLF text; expect one final submission.
3. Copy the two lines below (with and without a trailing newline) and activate
   the button. With bracketed paste enabled, expect each printed marker once.
   Without it, expect a refusal and no pasted text. Preserve internal spaces.

   ```sh
   printf '%s\n' 'toolkit-first'
   printf '%s\n' 'toolkit-second'
   ```

4. Repeat node/LXC targeting while changing selected guests and reconnecting.
   Hold the browser Paste prompt open, switch views/tabs if the browser allows,
   then approve it. Expect cancellation and no input on either console. Also
   wait beyond 15 seconds before approving: nothing should be sent. If the
   browser does not expose a delayable prompt, record those scenarios as not
   exercised rather than passing them from mock results.
   Where the browser permits, also quickly leave and return to the console
   view while the read is pending, so the hide/show occurs between scan ticks.
   Expect cancellation. Closing an unrelated Proxmox dropdown while the target
   console stays visible should still allow the intended paste. Record actual
   observations; transient CSS-only or connection changes that produce neither
   an event nor a polling observation remain outside the cancellation evidence.
5. Dismiss/deny the browser prompt; try empty and whitespace-only clipboard
   content. Expect no terminal input. If the browser remembers a permission,
   record that behavior. Do not weaken browser clipboard security preferences.
6. Activate repeatedly while a read is pending, and try Copy from another
   visible console. Expect one read/submission and no overlapping clipboard
   action. After completion/denial/expiry, both eligible controls recover.
7. Confirm input acts on the current program and existing command-line text:
   at a scratch shell prompt type `printf '%s\n' ` without Enter, then copy
   `'toolkit-existing'` and activate Paste & Execute. Expect that combined
   command to print once. This action never clears existing input. Inspect any
   uncertain/partial-send result before retrying; do not automate the retry.
8. Recheck reload, leaving/returning to the page, button focus, and Copy after
   the input tests. Record precise failures and whether disabling the candidate
   restores the old behavior. Secondary Chrome/Tampermonkey qualification follows
   primary acceptance, and is not yet established.

If Paste is disabled while Copy works, the clipboard-read capability or exact
connection/input checks (including ExtJS hide subscription/removal) are
unavailable. Record the tooltip and installed
versions. A missing connection surface warrants a bounded read-only diagnostic,
not a fallback to a different console or a direct socket send.

## Live regression check

Use one enabled manager/script, trusted-host restrictions, harmless synthetic output, and a scratch text editor.

1. Open a node Shell and LXC Console. Confirm one native Copy button beside the correct control.
2. Copy output with scrollback, blank lines, a wrapped line, and Unicode text; paste and compare the actual text.
3. Switch nodes/containers, reconnect, reload, leave the browser tab, and return. Confirm the intended current console is copied without duplicate buttons.
4. Enter/exit an alternate-screen application such as `less` with harmless content; verify the active buffer is copied.
5. Repeat Copy, change focus, and navigate away during a write. Check feedback and that focus is not stolen.

For complete edge-case qualification, also test resizing, wide-character wrap boundaries, localization, hidden/ambiguous consoles, teardown, and denied/late clipboard completion. The [detailed scenario checklist](historicals/TESTING.md#remaining-live-acceptance-plan) preserves the original exercises; its wider nine-combination campaign is superseded by the four primary targets above. No new probes or repeated acceptance campaign are required without a failure or relevant change.

Record date, script version/hash, browser/manager versions, Proxmox and `pve-xtermjs` versions, effective host rules, scenario, expected/actual pasted text, and limitations. Keep synthetic text only; do not publish credentials or real console transcripts. A success icon alone does not prove the pasted content.

## Troubleshooting and optional probes

If the button is missing, first confirm the script is saved/enabled in the intended manager, its host rules match, the page has been reloaded, and the view is a supported embedded console. See [installation](../README.md#install), including the custom-port limitation.

Use probes only when a failure needs investigation:

- [Manager probe](../tools/probe-manager.user.js): install as a separate temporary userscript in the same manager with the same trusted-host restrictions. Reload Proxmox with a console open; inspect the immediate API report and delayed integration report in browser developer tools, then disable/remove the probe. Do not paste it into page devtools: that loses the manager sandbox. Revision 2 deliberately exercises old callback paths, so failed callback checks alone do not demonstrate a regression in 0.4.1.
- [Console structure probe](../tools/probe-console.js): inspect it, then paste into developer tools with the top Proxmox page selected. A supported active console should show one anchor, one eligible same-origin frame, readable terminal access, and one Copy button when enabled.

Both probes avoid transcript extraction, clipboard writes, and network requests. Page-level discovery cannot prove manager-sandbox access.

For an unconfirmed write or timeout, paste into a scratch editor before retrying; a late extension write may still complete. For recurring UI errors, compare identical navigation in a clean profile before attributing them to the userscript. Earlier Firefox `fireFn/timerId` and `loadTags` errors also appeared in a scripts-disabled profile with other extensions present; no root cause was established. Chrome form/unload notices and Firefox font restrictions do not, by themselves, demonstrate a copying defect. Do not suppress them or patch unrelated Proxmox behavior here.
