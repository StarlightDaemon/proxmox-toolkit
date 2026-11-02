# Proxmox Toolkit development record

## Latest checkpoint — 2026-11-01: release candidate

### Main promotion and GitHub prerelease

After commit `eff382dc4a7fb8b2e22cdfca215e798bfc047fa3` was pushed to
`codex/toolkit-paste-execute` and its GitHub Checks run passed, the maintainer
explicitly requested promotion to main and publication under Releases.
Remote main was reverified at
`3726925562fe069a34984cc0c28c8f2f2719303f`; the candidate tag did not exist.
Prepare a documentation-only follow-up, fast-forward main, and publish
**v0.5.0-rc.1** as a GitHub prerelease with the exact userscript attached.
Stable 0.4.1 remains the latest stable release. No runtime or metadata changes
are needed beyond the candidate already tested. Recheck source identity,
documentation links, whitespace, the final remote refs, CI, and release asset.
The earlier branch-only authorization below is superseded by this request;
final stable promotion and remote renaming remain separate.

### Candidate branch preparation

The maintainer reports extensive successful live testing of the supplied
0.5.0-dev.1 source and authorizes preparing and pushing a release candidate
with documentation. The reported environment is Firefox 159.0 (64-bit),
Violentmonkey 2.50.0, and Windows 11. Proxmox/package versions and individual
scenario results were not supplied. [Testing](TESTING.md) records this as
maintainer-reported practical acceptance, not complete matrix qualification or
agent-operated Proxmox/OS clipboard evidence.

Repository identity, branch `codex/toolkit-paste-execute`, starting HEAD
`3726925562fe069a34984cc0c28c8f2f2719303f`, and all intentional pending files
were verified. Prepare **0.5.0-rc.1** by changing only version/description
metadata in the userscript; the tested executable runtime is preserved.
The manager probe and version check follow the candidate version. Current
README, changelog, design, decisions, instructions, index, testing, and open
loops are aligned; historical evidence and checkpoints below are preserved.

Verification: all **180 local tests passed**, zero failures/skips, under
Node.js 24.18.0. Source/metadata/version checks, 85 local Markdown links,
cached pinned xterm integrity, and `git diff --check` passed. RC source:
28,114 bytes; SHA-256
`689c95cd4e6a9d9e44bd7e92a1119929d02c5f03427422541a9f928a233ae8cc`.
Normalized executable-body SHA-256
`8cd88a878b1dd61ca77603ab00350864841aaefa0ac7ddbdcea3a467160d0828`
matches the tested development candidate. Review found no critical issue.
Local checks and the maintainer's report do not imply GitHub CI success.

At that stage the authorized remote target was the candidate branch;
main-branch promotion and tag/GitHub Release publication were separate actions,
subsequently authorized above. Deployment and remote renaming remain separate.
The earlier local-only holding instructions below describe their dated
checkpoints and no longer describe the current practical acceptance status.

## Previous checkpoint — 2026-10-16

**Status: holding for maintainer live testing.** The requested efficiency review
and local improvements are complete. The maintainer previously confirmed that
live testing is unavailable for now. No additional implementation or repeated
full-suite runs are queued while waiting.

The maintainer requested removal of source-size gates, documentation alignment,
and review of discovery, DOM work, and timers while keeping input safeguards.
Repository identity, `codex/toolkit-paste-execute`, starting
HEAD `3726925562fe069a34984cc0c28c8f2f2719303f`, and intentional pending changes
were reverified. The unreleased candidate remains **0.5.0-dev.1**. No commit,
remote update, PR, release, rename, or live installation was performed.

The earlier idle discovery, button-update, teardown, and transient-hide fixes
were present. One remaining duplication affected pending clipboard reads:
validation resolved the captured console before the polling scan resolved it
again. The scan now shares that synchronous result with pending validation.
Missing/failed discovery cancels input with no cached fallback. Hide-event,
post-read, and post-paste checks still resolve fresh; the hide callback still
ignores page arguments with or without the Firefox sharing bridge.

Confirmed `tools/check.cjs` already has no fixed source-size assertion and
AGENTS.md/current policy already requires efficiency review. Byte/hash reports
remain identifiers; the separate clipboard-input bound remains a safeguard.
Updated current design, decisions, changelog, test evidence, and open loops;
historical ceilings/evidence remain historical. The original implementation
plan's source-size instruction below now points to the superseding policy.

Verification: **180 local tests passed, zero failures/skips**, including seven
additional regressions for this review. Source/metadata/link checks, cached
xterm fixture integrity, and `git diff --check` passed under Node.js 24.18.0.
Runtime: 28,119
bytes; SHA-256
`51129dddf87cf048f05370903e7a16a0b294f083a4b878428cd573cdef4db2ed`.
Across 100 pending-read ticks with two visible consoles, component queries fell
from 200 to 100; frame searches, geometry reads, and style reads each fell from
300 to 200. Idle counts remain one query per tick, one search/geometry read per
console, and no unchanged button setters. Hidden-page ticks do no discovery.
One page-lifetime recovery interval remains; pending ticks add only one watchdog
and one temporary hide listener, both removed on completion. Feedback timers
expire or are cleared on destruction. No browser CPU/latency claim is made.

Next action remains maintainer [Firefox + Violentmonkey acceptance](TESTING.md#toolkit-candidate-acceptance),
including actual clipboard reads/input and the new hide listener. No candidate
browser rendering, OS clipboard test, CI, or live Proxmox execution is claimed.
Preserve all intentional pending files. The recorded resume heartbeat remains
paused; this turn did not inspect or change its state.

### Resume directly with live acceptance

1. Open this checkout at `E:\Citadel\proxmox-copy-console`. Verify origin is
   `https://github.com/StarlightDaemon/proxmox-copy-console.git`, branch is
   `codex/toolkit-paste-execute`, and HEAD is
   `3726925562fe069a34984cc0c28c8f2f2719303f`. Inspect current status before any
   edits. The intentional working-tree changes contain the candidate; HEAD
   alone does not contain this session's implementation.
2. Preserve the modified runtime, tests, tools, and documentation. In particular,
   `tests/paste.test.cjs` and this checkpoint are saved but **untracked**. Do not
   discard them or reset/clean the checkout. No commit or remote backup has been
   created for this work.
3. Confirm the candidate's `@version 0.5.0-dev.1` and SHA-256 above. If source
   changes have occurred since this checkpoint, inspect them and perform the
   checks appropriate to those changes before interpreting live results.
4. Follow [Toolkit candidate acceptance](TESTING.md#toolkit-candidate-acceptance)
   in Firefox + Violentmonkey. Replace the existing userscript entry or disable
   the old one; apply the exact trusted-host include rule and keep one entry
   enabled. Retain stable 0.4.1 for rollback. Record browser, manager, PVE, and
   installed `pve-xtermjs` versions and the tested script hash.
5. Use an idle node Shell and scratch LXC Console. Check actual clipboard text,
   permission prompts, intended submission, targeting, delayed/denied reads,
   navigation/hide/reconnect cancellation, and Copy regression. Record observed
   results and unexercised scenarios in Testing; icons or mock passes do not
   establish live success. Investigate concrete failures with bounded fixes.
   Chrome/Tampermonkey qualification follows primary acceptance. Commit, push,
   PR, merge, release, and deployment remain separate authority boundaries.

## Previous checkpoint — 2026-09-24

Local implementation and automated checks are complete. The uncommitted
**Proxmox Toolkit 0.5.0-dev.1** candidate is on `codex/toolkit-paste-execute` at
starting HEAD `3726925562fe069a34984cc0c28c8f2f2719303f`. Nothing was committed,
pushed, released, renamed remotely, or installed on a live Proxmox host.

Next action: maintainer Firefox + Violentmonkey acceptance using
[Testing](TESTING.md#toolkit-candidate-acceptance), including clipboard permission
behavior and actual input/output. Install by replacing the existing script or
disabling the old entry; reapply the trusted-host include rule. Do not treat
the stable release's Copy reports or local tests as candidate live acceptance.
After observations arrive, reproduce specific failures, apply bounded fixes,
record them here, and rerun relevant checks. Do not repeat development or tests
solely because a heartbeat resumes. The resume heartbeat is now **PAUSED**.

Verification: 161 local tests passed, zero failures/skips, plus source/metadata/
size/link/whitespace checks. Runtime: 26,787 bytes, SHA-256
`e6356c7df7ed9ec616e9a157bbc464e949325264f83e3db22af719c07e3d1e67`.
Modified tracked files and the untracked `tests/paste.test.cjs` and this record
are intentional deliverables. Preserve all of them.

## Initial checkpoint — 2026-09-23

Original checkpoint: scope accepted; implementation pending. The first usage check reported
99% weekly consumption, above the stay-within-limits skill's 95% threshold.
Save this checkpoint before starting implementation. Reported weekly reset:
2026-09-27 04:56:34 UTC (September 26, 10:56:34 p.m. America/Denver).
Recheck actual usage before resuming; a timestamp alone is not clearance.

Repository: `https://github.com/StarlightDaemon/proxmox-copy-console.git`.
Starting branch: `codex/readme-cleanup`, tracking `origin/main`.
Starting commit: `3726925562fe069a34984cc0c28c8f2f2719303f`.
Working tree was clean before this record and its documentation-index link.
No implementation, commit, remote update, PR, release, or deployment occurred
in that initial development turn. See the ordered entries below for resumed work.
Do not discard this uncommitted checkpoint.

## Ordered record

1. Reviewed stable 0.4.1 source, current design, decisions, testing, open loops,
   and relevant historical research. Its supported scope is embedded node Shell
   and LXC xterm consoles. Existing practical copy passes do not qualify input.
2. Investigated upstream xterm/Proxmox input APIs and browser clipboard reads.
   The existing console resolver and native toolbar integration are reusable.
   Clipboard-read permission and Firefox's potential Paste prompt require live
   Firefox + Violentmonkey evidence. Host-side JavaScript delivery does not
   remove browser clipboard restrictions.
3. Ran a small local Node 24.18.0 experiment against the integrity-checked cached
   Proxmox xterm fixture at `89075b05773a2b6c380175dde3f8a4472a5ab506`.
   `paste` and `input` exist; `input('probe')` followed by `input('\r')` emitted
   those strings through `onData`. This did not exercise `paste`, a renderer,
   the OS clipboard, a userscript sandbox, or a live Proxmox session.
4. Maintainer accepted the product name **Proxmox Toolkit**, deliberately
   dropping Console to allow modest future expansion. Primary development and
   acceptance target: **Firefox + Violentmonkey**. First feature: an additional
   toolbar **Paste & Execute** action; further features follow later.
5. Maintainer authorized starting development and requested ordered durable
   notes so work can resume after utilization caps. This authorizes local
   implementation and verification. Commit, push, PR, merge, release, remote
   repository rename, and deployment remain separate authority boundaries.
6. Verified repository, branch, commit, native instructions, and clean status.
   First usage check was already 99% weekly. Wrote this checkpoint and linked
   it from the documentation index. Runtime remains stable 0.4.1.

7. `git diff --check` and `node tools/check.cjs` passed after the documentation
   edits: 12 JavaScript files, 71 local Markdown links, metadata/version/size.
   Runtime remains 18,210 bytes with SHA-256
   `16dd12bbdf8a33e4336caee17f86ff1146bf183f57370abcd4632da553757b11`.
8. Created hourly task heartbeat `resume-proxmox-toolkit-development`. It checks
   real usage first, stays quiet above threshold, and resumes the authorized
   local development below threshold. It must pause once the tested local
   candidate/live acceptance handoff is ready, or if the user cancels/takes over.
   An initial create request failed validation without creating an automation;
   the corrected request with `destination: thread` succeeded.

9. Resumed at the September 24 08:20 UTC heartbeat: usage tool reported 0%
   weekly consumption with reset timestamp `1790842843`. No credit was consumed
   by this task. Verified the same remote/HEAD and only the checkpoint/index
   edits in the working tree. Created local `codex/toolkit-paste-execute` from
   that HEAD; the initial sandboxed branch creation was permission-denied, then
   the narrowly scoped escalated command succeeded. No commit was created.
10. Re-read current code/tests and pinned Proxmox `main.js`. Confirmed the page
    exposes `state`, `states.connected`, and `socket`; use these plus socket
    identity/readiness for input checks, without opening a connection or reading
    its credentials. This is source evidence, not installed-host verification.
11. Implemented the first local `0.5.0-dev.1` candidate under the Proxmox Toolkit
    @name, retaining the existing filename/namespace and grants. Shared toolbar
    lifecycle now creates Copy and Paste & Execute. Reads start directly in the
    activation stack; a 15-second expiry and navigation/session cancellation
    prevent late reads from submitting. There is no automatic retry.
12. Chose initial text semantics: normalize CRLF/CR to LF, remove terminal line
    breaks, preserve other spaces/Unicode, then paste and send one separate CR.
    Multiline text/tabs require effective bracketed-paste mode. Empty/whitespace
    text, other C0/C1 controls, malformed UTF-16, and more than 65,536 UTF-16 code
    units are refused before dispatch. Partial dispatch receives uncertainty
    feedback, never a claim of command success. Decisions/docs updates follow.
13. Updated the test harness for the second button, connection globals, and
    native clipboard reads. Ran the four existing offline test files: **73
    passed, zero failures/skips**. Added dedicated paste/input regressions.
    Next: run those regressions, inspect real-xterm behavior, finish current
    documentation/check metadata, perform final local checks, and hand off live
    Firefox + Violentmonkey acceptance. No live clipboard/session tests yet.
14. All **71 dedicated paste regressions passed**. Usage between waves was 1%
    weekly. Added a real-xterm experiment: without a renderer, `paste()` emits
    data and then throws while clearing an absent textarea. Added tests asserting
    the exact bracketed payload/separate Enter and the candidate's partial-send
    handling (no Enter/retry). No private xterm internals were patched. All **17
    xterm tests passed**, including those two new cases; cached fixture integrity
    was verified first with `node tools/fetch-xterm.cjs`.
15. Updated product scope, candidate version/metadata, migration/rollback
    instructions, current design, testing evidence, and OL-11. Reviewed a 28 KiB
    runtime ceiling for the authorized input/session/cancellation/UI additions.
    Stable and historical release evidence remains separately identified.
16. Ran `node tools/check.cjs`, the full `node --test --test-isolation=none
    tests/*.test.cjs` suite, and `git diff --check`: **161 passed, zero failures,
    cancellations, or skips**. Source checks covered 13 JavaScript files and 79
    local Markdown links at that checkpoint. Reviewed the runtime diff and
    recorded candidate bytes/hash above. No candidate CI or live tests occurred.
17. Finished the live acceptance handoff and corrected a Markdown line break in
    its installation paragraph. Remaining work requires actual maintainer
    browser/session observations. The automatic resume heartbeat is to be paused
    on delivery; no ongoing development is queued while waiting for acceptance.
18. Final documentation/source check passed with 13 JavaScript files and 81
    local links; `git diff --check` passed. The app confirmed automation
    `resume-proxmox-toolkit-development` is **PAUSED**, preserving its other
    fields. Candidate source opening is queued in this task's panel for when
    the task is shown. No additional live action was performed.

19. On October 15, performed the requested full audit without source mutation:
    all 161 existing tests passed. Identified button destructor reentry hidden
    by the mock's event order, duplicate idle discovery, redundant tooltip
    writes/presentation branches, and a transient-hide observation gap. Source
    review and supplemental mocks established these findings; no live failure
    or performance timing was claimed.
20. After explicit authorization, added regressions first. The focused initial
    run reproduced double destruction and duplicate discovery and rejected the
    missing hide integration. Fixed the runtime and corrected the shared mock
    to emit destroy while `destroying` is true and before `destroyed` is set.
21. Reused the scan's resolved context for availability, keeping fresh action
    and post-read checks. Centralized each action's default icon/tooltips and
    tracked the displayed tooltip separately because ExtJS rendered setters
    need not update their original configuration property.
22. Used documented `Ext.GlobalEvents.hide` during pending input only, with the
    existing Firefox callback adapter. Revalidate the captured console on hide,
    ignore callback arguments/unrelated hides, and unsubscribe in `finally`.
    Missing on/un APIs or bridge/subscription failure sends no input. Tests
    cover transient hides, cleanup, and setup failures. Arbitrary unobserved
    CSS/connection transitions remain an explicit evidence boundary.
23. Ran the affected console/compatibility/paste suites, then verified the pinned
    cached fixture and the full suite: **173 passed**, zero failures/skips.
    Source checks and whitespace validation passed; updated current design,
    changelog, test evidence, open loops, and this checkpoint. The mock operation
    counts qualify reduced calls only. Live acceptance is still pending.
24. The maintainer removed the fixed source-size limit and prioritized runtime
    efficiency. Removed its checker assertion and updated current policy;
    preserved historical records and the separate clipboard-input length bound.
    Source/documentation and whitespace checks passed. No runtime change or
    additional full-suite run was needed; live acceptance remains the next step.
25. At the maintainer's request, finalized the holding checkpoint and resume
    steps. Reverified repository identity/branch/HEAD, intentional working-tree
    files, candidate version/bytes/hash, documentation links, and whitespace.
    `node tools/check.cjs` and `git diff --check` passed. Runtime remains
    unchanged; 173 passing tests are the earlier full-suite result, not a new
    run in this documentation-only turn. All work is saved locally, including
    the two untracked deliverables; no commit, push, or live test occurred.
26. On October 16, reverified identity/branch/HEAD and intentional pending work
    for the efficiency request. The checker size gate had already been removed.
    Found duplicate pending-paste discovery and first added an operation-count
    regression: it failed with 200 component queries and 300 frame searches,
    geometry reads, and style reads over 100 pending ticks/two consoles.
27. Shared the captured console's resolved context within each synchronous scan
    only. Polling now validates with explicit null on missing/failed discovery;
    events and checks around input retain fresh resolution. Kept a no-argument
    hide callback so page event payloads cannot become resolved contexts.
28. The affected console/paste/compatibility suites passed (148 tests at that
    stage). Added four discovery-failure cancellation cases and raw callback
    argument-isolation coverage; the focused six cases passed. Timer assertions
    confirm one interval, one pending watchdog, one hide listener, and proper
    completion/feedback cleanup. Hidden idle ticks do no discovery. The earlier
    timeout, denial, partial-input, hide, and session tests remain in force.
29. `node tools/check.cjs` and `node tools/fetch-xterm.cjs` passed (cached fixture
    verified, no download). Ran the complete suite with
    `node --test --test-isolation=none --test-reporter=dot tests/*.test.cjs`:
    **180 passed**, zero failures/skips. `git diff --check` passed. Updated the
    current documentation to match actual policy and measured operations. No
    browser profiling, live clipboard/Proxmox testing, publication, or commit.

## Implementation sequence (original plan; completed steps recorded above)

1. Read this record and AGENTS.md; inspect status, branch, HEAD, current source,
   DECISIONS.md, docs/DESIGN.md, docs/TESTING.md, and relevant tests. Recheck usage
   with `mcp__codex_app__get_usage_limits`; do not start a substantial work wave
   while either reported window is at or above 95%. Do not consume a reset
   credit without explicit user confirmation. No delegation has been requested.
2. Isolate local development on a `codex/` feature branch if appropriate,
   preserving these pending documentation edits and any subsequent user work.
   Record the actual branch/commit here. Keep remote repository identity and
   script filename unchanged initially; distinguish product branding from
   userscript installation identity. Plan explicit migration when @name changes,
   since users should replace their existing entry and avoid two active copies.
3. Record the new Toolkit scope as a superseding decision for unreleased work;
   retain historical copying-only decisions and release evidence. Use an
   unreleased candidate version, for example `0.5.0-dev.1`, and identify which
   script must be enabled for testing. Keep one installable script and no
   runtime dependencies; do not create a general feature/plugin framework.
4. Implement clipboard-read feasibility and the Paste & Execute handler for
   Firefox + Violentmonkey using the existing native toolbar integration.
   Read only on explicit activation, never during discovery. Do not assume
   GM_setClipboard grants read access or invent a portable GM_getClipboard API.
   Preserve Copy's existing behavior, manager bridge, and targeting guarantees.
5. Capture console identity, frame, terminal, and connection/session identity
   before asynchronous clipboard access; revalidate before any input. Reject
   stale, disconnected, ambiguous, hidden, destroyed, or changed sessions.
   A retained terminal buffer alone does not prove the connection is active.
   Inspect the installed/pinned Proxmox connection surface before relying on it.
6. Paste with the public xterm paste API, then send Enter separately through its
   public input API. Respect bracketed-paste semantics. Define and document
   multiline and trailing-newline behavior before coding it; avoid accidental
   extra submissions. Do not silently trim meaningful spaces or rewrite shell
   commands. Explicitly handle empty/non-text input, control characters, repeated
   clicks, permission denial, delayed reads, and partial/uncertain dispatch.
   Never automatically retry a terminal submission. Do not claim command
   success merely because input was sent.
7. Keep the requested direct button action. Do not add routine confirmation
   dialogs without a demonstrated need. Browser permission UI may still occur.
   The operation is paste plus Enter in the current terminal program; it cannot
   guarantee an empty shell prompt or replace existing command-line text.
8. Add meaningful regressions for the new action and retain existing coverage.
   Update version/metadata/probe checks intentionally. The original plan's
   source-size ceilings were superseded on October 15: review repeated runtime
   work and resource lifetimes, preserve safeguards, and record operation-count
   or profiling evidence. Bytes/hash identify the candidate without a limit.
9. Run checks below. Record results and failures in order after each bounded
   wave, including exact commands and next action. Check utilization between
   waves. Save a fresh checkpoint before any utilization stop.
10. Prepare precise Firefox + Violentmonkey live acceptance instructions using
    harmless commands in a disposable/scratch context. Verify actual clipboard
    text, permission prompt behavior, input and exactly intended submission,
    navigation/reconnect cancellation, multiline behavior, and Copy regression.
    Do not execute commands on a live host without appropriate authorization.
    Chrome and Tampermonkey are subsequent compatibility checks; preserve the
    distinction between primary development focus and qualified support.

## Verification commands and evidence boundaries

From the repository root, using Node.js 24:

```powershell
node tools/check.cjs
node --test --test-isolation=none tests/console.test.cjs tests/compatibility.test.cjs tests/baseline.test.cjs tests/probe.test.cjs
node tools/fetch-xterm.cjs
node --test --test-isolation=none tests/*.test.cjs
git diff --check
```

The xterm fixture already exists in ignored `.cache/xterm.cjs`; verify integrity
before execution. The downloader validates an existing fixture without fetching.
Neither mock tests nor parser tests prove live clipboard or browser behavior.
The full suite was run in the resumed September 24 turn as recorded above; the
earlier release results in Testing remain historical evidence. No live
paste/execution acceptance has occurred.

## Research references

- [Proxmox xterm integration](https://raw.githubusercontent.com/proxmox/pve-xtermjs/master/xterm.js/src/main.js)
- [xterm public API](https://xtermjs.org/docs/api/terminal/classes/terminal/)
- [xterm paste transformations](https://raw.githubusercontent.com/xtermjs/xterm.js/master/src/browser/Clipboard.ts)
- [Browser clipboard requirements](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [Extension clipboard requirements](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard)
- [Proxmox GUI extensibility discussion](https://lore.proxmox.com/pve-devel/602291cb-edfa-4dc3-8e6c-33224de64318%40proxmox.com/)

Upstream master sources describe the inspected upstream implementation, not proof
of the locally installed Proxmox package. Keep installed-version checks separate.
