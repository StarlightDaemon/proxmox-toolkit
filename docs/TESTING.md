# Testing and compatibility

## Current status

**0.7.0 is the maintainer-approved stable promotion of 0.7.0-dev.8.** On
2026-11-02 the maintainer reported the last tested version looked good and
explicitly requested it become the new stable. Promotion changes generated
version/name identity and descriptions, with no new runtime behavior. This
accepts the exercised workflow; detailed report/API permissions, actual clipboard
contents, migration/serial/proxy and full browser/manager qualification remain
open. The dev.N observations below retain their original evidence scope.

Stable promotion was locally verified with Node.js 24.18.0: all 375 tests pass,
with zero failures, cancellations or skips. Build/static checks, local links,
metadata, pinned-xterm integrity and whitespace pass. Shared-source hashes are
unchanged from dev.8, and both generated bodies differ only in generated version
identity and development-description metadata. The real ExtJS/Chrome fixture
passes again; desktop/narrow screenshots were inspected. Its sandbox launch
failed at Crashpad startup; an isolated elevated rerun passed. This does not add
live Firefox, userscript-manager, OS clipboard or Proxmox API observations.

Dev.8 implements the approved six-category layout, inline report launchers,
wrapped navigation and paginated settings. All 375 Node tests pass. The real
ExtJS fixture checks category ownership, every setting reachable through paging,
unclipped cards/tabs, fixed footer actions, unsaved draft round-trips, all eleven
report return routes and the preserved console connection. Viewports include
1280-class desktop, 800x844 and 640x700 with the server tree/task log present.
This is local synthetic evidence. The maintainer subsequently reports dev.8's
layout looks solid, the Toolkit toggle is correctly placed and functional, and
the main UI frame is replaced as intended in the continuing live environment.
This is scoped UI workflow feedback; detailed report, clipboard, console-session
and compatibility-matrix acceptance remains pending.

Dev.7 corrects the global launcher's sizing/spacing after the maintainer's dev.6
screenshot and positive report of the workspace/button/exercised tools. The
browser fixture now applies native north-container x-plain defaults and asserts
Toolkit's x-btn base, matching Documentation UI/scale, equal height/top and 5px
gap. This assertion reproduced the dev.6 defect before the fix and passes now.
The screenshot was inspected. Live Firefox/dark-theme confirmation of dev.7
remains pending; the positive dev.6 feedback does not certify every feature.

The maintainer reported no Toolkit button beside Help in the dev.1 handoff.
Source review found the selector targeted global Documentation instead. Dev.2
corrects that placement. The installed script hash and live browser were not
accessible during this review, so resolution on the maintainer's instance is
still pending at that review. The subsequent supplied dev.2 screenshot confirms
the native dark settings UI is rendered and displays the expected script identity.
It shows PVE 9.2.3, node daemon1 kernel 7.0.12-1-pve (PMX 7.0.12-1, x86_64),
Firefox 159.0 (64-bit) and Violentmonkey 2.50.0. It also shows Inventory enabled
as well as the three clipboard actions. This is limited screenshot evidence,
not an end-to-end action/report pass; dev.3 still requires a live recheck.
The maintainer subsequently confirmed these environment version numbers and
reported blank-scope report failures in live testing. Dev.4 fixes the contradictory
preflight scope requirement; live resolution remains pending.
Bulk Actions is native PVE functionality.

The current **0.7.0** catalog has only **Toolkit** and **Copy & Paste**.
Toolkit exposes 22 toggles; the lightweight edition exposes three clipboard
actions. All newly added features default off in Toolkit. See
[catalog acceptance](CATALOG-ACCEPTANCE.md) for current hashes and live scenarios.

The maintainer traced the dev.4 syntax-error report to a manual naming edit.
The generated artifact passed parsing. Dev.5 generates names with versions and
removes two redundant manager-info grants; live manager verification is pending.
It also adds a return footer to every report after the maintainer reported no
way back from Inventory and Maintenance.

The supplied dev.5 screenshot shows the native dark settings and Toolkit left
of resource Help. The maintainer then approved moving Toolkit to Documentation
and filling the central workspace while preserving the mounted console. Dev.6
implements that change; no live dev.6 acceptance has yet occurred.

Local Node.js 24.18.0 regression verification passes **375 tests**, zero failures
or skips. These include settings/feature inactivity, read-only API bounds,
report semantics, configuration/credential omissions, and new console tools.
Earlier individual-edition tests were replaced with consolidated-edition and
Toolkit-toggle scenarios; test counts are not a cross-version coverage score.

An isolated **Headless Chrome 155.0.8059.85** fixture uses real **ExtJS
7.0.0.168** and its Crisp theme, with mocked PVE workspace, GM storage and API
data. It distinguishes global Documentation from resource Help, checks global
launcher placement/toggling and versioned settings, 22 toggles/three defaults,
saved all-off state, origin scope, lazy inventory, blank-scope preflight including
guestless nodes, specific-target hints without requests, text-only values, narrow layout,
Escape and repeated-open/report-redraw component cleanup. Screenshots were
inspected. Pinned public Proxmox fixture assets are fetched only for development
using `node tools/fetch-ui-fixture.cjs`; run `node tools/browser-smoke.cjs` after
that. It verifies Back to Toolkit on all eleven reports, category-tab return with draft preservation,
active request cancellation, no component leaks and footer visibility after
scrolling at an 800px viewport with a 240px server tree. Dev.5's earlier fixture
used a 390px modal; that is historical evidence. Dev.6 serves pinned fixture
assets and an iframe on loopback HTTP, with a real local WebSocket. Ten repeated
toggle/return cycles preserve the exact iframe/document, terminal marker object,
native card and open socket with one connection and no reconnect. The same socket
survives the report campaign. Bounds follow viewport/tree/task-log resize; covered
content is inert while surrounding regions stay usable. Resource changes, tree
clicks, logout-style clearing, Escape and render failure clean up; there are no
uncaught browser exceptions. This is synthetic console evidence, not live xterm
input/session acceptance. Shipped scripts load no dependencies. This is real ExtJS rendering evidence,
not live PVE integration, actual installed light/dark themes, Firefox/manager
compartments, OS clipboard or API permission acceptance. No browser CPU/latency
claim is made.

Operation counts retain one scan interval and one component query per visible
console scan for each installed edition, zero console discovery when all actions
are disabled, and zero report requests during idle scans. API tests exercise at
most three concurrent GETs, 400 dispatched-request cap, 15-second cancellation,
8 MiB per-response and 32 MiB aggregate limits. Fixture integrity and deterministic
build/static checks are separate from execution and live acceptance.

### Historical 0.6.0-dev.2 seven-edition local verification — 2026-11-02

The development checkout contains synchronized **0.6.0-dev.2** Toolkit and
six individual editions. Paste Only, Console Export, Diagnostics and Recipes
are implemented locally. They remain unreleased and require new live acceptance;
stable 0.5.0 evidence below does not qualify these changed runtimes.

All **329 tests pass** under Node.js 24.18.0, with zero failures/skips.
The [feature review](FEATURE-REVIEW.md) records local checks, fixed findings,
capability boundaries and measured operation counts. The
[manual acceptance plan](FEATURE-ACCEPTANCE.md) identifies exact candidate hashes
and pending Firefox + Violentmonkey cases. No new OS clipboard, browser download,
rendered paste, native UI or live Proxmox acceptance is claimed.

### Historical 0.6.0-dev.1 three-edition local verification — 2026-11-02

All **221 tests passed**, zero failures/skips, under Node.js 24.18.0.
This includes the 180 existing regressions plus 41 edition/version/capability,
coexistence, shared-lock, standalone-input, and real-xterm integration checks.
Generated files match the shared source/manifest; all versions agree. Static
capability checks confirm Copy-only has no clipboard read/terminal input code
and Paste-only has no clipboard-write APIs/grants or buffer extraction.
Metadata, source parsing, local links, fixture integrity, and whitespace checks
are reported separately from runtime/live acceptance.

Mock counts: 100 scans of two visible consoles perform 100 component queries
and 200 frame/geometry reads in Toolkit. The two individuals perform 200
component queries across 100 paired ticks, using two bounded intervals. Shared
busy state is read once per edition scan. Hidden ticks do no discovery or busy
marker reads. Neither counts nor bytes establish browser timing gains.
New clipboard/toolbar/manager-boundary behavior still needs live acceptance.

| Edition | Bytes | SHA-256 |
| --- | --- | --- |
| Toolkit | 29,705 | `a40a14e2a05d5aef440374569d6bfbda62bfc7135830dda6f797c0f67158f429` |
| Copy-only | 20,881 | `2db5a72a5a961c52d3bcd0953c1537e2879430fc0200a8667f3374925b5f9beb` |
| Paste-only | 22,900 | `73ad841a01bd8723068c748542fbd67dc3d12c82e3e5e4b341b1cbc943c81d03` |

**Historical stable Proxmox Toolkit 0.5.0.** Firefox + Violentmonkey
remains the primary target. Its executable runtime is unchanged from
0.5.0-dev.1 and 0.5.0-rc.1; only userscript version/description metadata changed
for promotion. On 2026-11-01 the maintainer reconfirmed that the current version
works as intended within the accepted scope and authorized stable 0.5.0 as
the latest GitHub Release. This does not expand the live evidence below.

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
open. Stable promotion is based on this practical acceptance; 0.4.1 remains
available as the earlier copy-only release.

### Stable 0.5.0 local verification — 2026-11-01

All **180 tests passed**, zero failures/skips, under Node.js 24.18.0.
Source parsing for 13 JavaScript files, metadata/version alignment, 83 local
Markdown links, pinned cached xterm integrity, and `git diff --check` passed.
Stable source: 28,090 bytes; SHA-256
`8263ac0d60dcb9d08f1653c97cdfcdaa1960cdd0f404015c5a8beddedae523f8`.
Normalized executable-body SHA-256 remains
`8cd88a878b1dd61ca77603ab00350864841aaefa0ac7ddbdcea3a467160d0828`,
matching the maintainer-tested development candidate and published RC.
Only version/description metadata changed in the installable userscript.
These local results and the maintainer's report are separate from publication
CI, tag/ref verification, and release-asset integrity checks.

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
the maintainer's live report and from GitHub CI. The candidate branch's
[GitHub Checks run](https://github.com/StarlightDaemon/proxmox-copy-console/actions/runs/41397807086)
passed for commit `eff382dc4a7fb8b2e22cdfca215e798bfc047fa3`. Main promotion
and prerelease publication retain this userscript; the final publication commit
contains documentation changes only. CI is separate from live acceptance.

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
node tools/build.cjs --check
node tools/check.cjs
node --test --test-isolation=none tests/console.test.cjs tests/compatibility.test.cjs tests/baseline.test.cjs tests/probe.test.cjs tests/paste.test.cjs tests/editions.test.cjs
node tools/fetch-xterm.cjs
node --test --test-isolation=none tests/*.test.cjs
```

The first three commands work offline. The downloader fetches a pinned, integrity-checked Proxmox xterm bundle into ignored `.cache/` if missing. The full suite fails for a missing/corrupt fixture rather than skipping parser coverage.

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

<a id="toolkit-candidate-acceptance"></a>

## Toolkit acceptance

Install the chosen [edition source](EDITIONS.md#choose-an-edition) in Firefox
with Violentmonkey, following the [migration/rollback instructions](INSTALL.md).
Confirm the edition name, `0.6.0-dev.1`, and your trusted-host rule. Test Toolkit
alone, each standalone alone, and both individuals together in separate runs;
keep older entries disabled. Retain stable 0.5.0 for rollback. Record browser,
manager, PVE, and `pve-xtermjs` versions plus the actual
script hash. Numeric versions from earlier Copy reports are not candidate data.

Use an idle node Shell and a scratch LXC Console with an empty shell prompt.
These are manual test instructions. The practical acceptance report above does
not establish a pass for each individual step.

1. Confirm only the chosen action(s) beside the native control. Perform the
   following Copy/Paste steps where that action is installed. Re-run Copy on
   synthetic scrollback and verify the pasted result in an editor.
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

9. With both individuals active, start a delayed read and activate Copy from
   the other script; then reverse with a delayed Copy write and Paste. Expect
   no overlapping clipboard action. Verify completion, denial, timeout, and
   cancellation release the shared lock and controls recover. Check each
   standalone's own targeting, focus, teardown, and current name/version.

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

Start with the [usage troubleshooting guide](USAGE.md#troubleshooting) and [installation requirements](INSTALL.md), including the custom-port limitation. Use the diagnostics below for concrete failures that need investigation.

Use probes only when a failure needs investigation:

- [Manager probe](../tools/probe-manager.user.js): install as a separate temporary userscript in the same manager with the same trusted-host restrictions. Reload Proxmox with a console open; inspect the immediate API report and delayed integration report in browser developer tools, then disable/remove the probe. Do not paste it into page devtools: that loses the manager sandbox. Revision 2 deliberately exercises old callback paths, so failed callback checks alone do not demonstrate a regression in 0.4.1.
- [Console structure probe](../tools/probe-console.js): inspect it, then paste into developer tools with the top Proxmox page selected. A supported active console should show one anchor, one eligible same-origin frame, readable terminal access, and one Copy button when enabled.

Both probes avoid transcript extraction, clipboard writes, and network requests. Page-level discovery cannot prove manager-sandbox access.

For an unconfirmed write or timeout, paste into a scratch editor before retrying; a late extension write may still complete. For recurring UI errors, compare identical navigation in a clean profile before attributing them to the userscript. Earlier Firefox `fireFn/timerId` and `loadTags` errors also appeared in a scripts-disabled profile with other extensions present; no root cause was established. Chrome form/unload notices and Firefox font restrictions do not, by themselves, demonstrate a copying defect. Do not suppress them or patch unrelated Proxmox behavior here.
