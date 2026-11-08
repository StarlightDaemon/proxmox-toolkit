# Proxmox Toolkit development record

## Latest checkpoint — 2026-11-02: local 0.8.0-dev.1 ready for operator review

Verified origin `https://github.com/StarlightDaemon/proxmox-toolkit.git`, branch
`main`, and clean starting commit `5dbe558f0857cc010a5f76d0987dc3aedeb6e7f8`
in `E:\Citadel\proxmox-toolkit`. The operator authorized all five additions,
planning, implementation and local verification, while reserving GitHub push
approval. Work remains uncommitted on the same branch/commit. No remote refs,
tags, release assets or live Proxmox systems were changed.

Checkout relocation, observed 2026-11-08: the checkout now lives at
`E:\Proxmox Toolkit`; `E:\Citadel\proxmox-toolkit` no longer exists. Origin,
`main` at `5dbe558`, and the uncommitted candidate are intact there, and
`node tools/build.cjs --check`, `node tools/check.cjs`, all 435 Node tests and
`git diff --check` pass from the new root. The browser fixture was not rerun.
The linked `.cache/ol-01-review` files moved with it, but its Git pointers
still referenced the old root, so Git listed it as prunable. Ran
`git worktree repair "E:/Proxmox Toolkit/.cache/ol-01-review"`; both pointers
now resolve under the new root, branch `codex/ol-01-review` remains at
`c921989`, and its short status is clean.
Paths in the earlier checkpoints below are historical.

Support redaction correction, 2026-11-08 (local, uncommitted): a review probe
showed Troubleshooting Bundle previews retained Proxmox-native credentials whose
names embed the keyword without a word boundary: `PVEAuthCookie` ticket
signatures, `CSRFPreventionToken` values, `PVEAPIToken`/`user@realm!id=` secret
UUIDs, `api_key`/`client_secret` values, dotted keys such as `db.password=`,
and bare or JSON `ticket` values. `src/support-bundle.js` now replaces secret
values in a first pass (keys and quotes stay readable; query values end at `&`)
before labelling identifiers, and reports `redaction.secretValues`. Clock times
such as `01:02:03` are no longer labelled as IPv6; compressed, eight-group and
IPv4-embedded forms still are. The email and hostname patterns were quadratic
on long hyphen/dot runs (pre-existing; a 400k-character task-log line could stall
preparation) and now anchor on lookbehinds. Four regression tests were added.

Same-day follow-ups: a Cluster Configuration Changes baseline chosen before the
Node/Guest fields matched its scope was marked invalid, and re-selecting the
same file need not fire `change`. Load now checks schema, origin and API prefix
only, fills blank scope fields from the baseline, and Run reports the baseline's
scope on mismatch (still before any request). Capacity no longer labels missing
or invalid container memory as `explicit configuration`. `.serena/` local tool
state is ignored by Git and by `tools/check.cjs`. One Node test and browser
fixture load-order checks were added.

Executed after both waves: `node tools/build.cjs`, `--check`,
`node tools/check.cjs`, `node tools/fetch-xterm.cjs`, all 440 Node tests,
`node tools/browser-smoke.cjs` (Chrome 155.0.8059.85, ExtJS 7.0.0.168
synthetic fixture) and `git diff --check` pass. No live PVE test was run.
Toolkit is now 197833 bytes, SHA-256
`bf1cf42ddce5345e89f8d353beddd7efb45be47be81dd459bf71585dcd790574`; Copy &
Paste is unchanged. The artifact table below records the earlier candidate.

Committed as `6cb5522` on `claude/expansion-0.8`, pushed with operator approval,
and opened as StarlightDaemon/proxmox-toolkit#1 (GitHub Checks: success). No
merge, tag or release.

Follow-up wave, 2026-11-08 (local, on the PR branch): Firewall guest aliases and
IP sets are now opt-in (`includeGuestSets`, unchecked by default). Default guest
cost drops from at least four reads plus one per guest IP set to three
(firewall options, rules, configuration). Guest entries say `not requested`;
cluster aliases/IP sets are unchanged. A request-count Node test and a browser
check that the option appears unchecked only for Firewall were added. The
operator live checklist for OL-16 is in `docs/CATALOG-ACCEPTANCE.md`. OL-15's
read-only comparison of the old checkout is recorded in `docs/OPEN-LOOPS.md`.
Executed: build/`--check`, `tools/check.cjs`, `fetch-xterm.cjs`, all 441 Node
tests, `browser-smoke.cjs` (Chrome 155.0.8059.85, ExtJS 7.0.0.168) and
`git diff --check` pass. Toolkit is 198673 bytes, SHA-256
`a1d6beca076e079db6f568659a718d9a4c2edf93262a5c60f663b310b036f156`; Copy & Paste
is unchanged. No live PVE test was run.

The refined catalog and acceptance criteria are in `docs/EXPANSION-0.8.md`.
Implemented Capacity & Headroom and Cluster Configuration Changes in Inventory;
Troubleshooting Bundle Builder and Firewall Visibility & Rule References in
Troubleshooting; Update Readiness & Version Consistency in Maintenance. Existing
categories suffice. Toolkit has 27 toggles with the same three defaults; Copy &
Paste retains three. Both generated editions are 0.8.0-dev.1. Stable 0.7.0 install
links and historical evidence remain preserved.

Three focused model fragments reuse the bounded GET client. Capacity separates
allocation, current consumption and sampled node/storage history. Allowlisted
baselines are local files bound to HTTPS origin, API prefix and selected scope,
with schema/size/depth/count/identity checks. Support sections produce an editable,
assisted-redaction preview; only its reviewed text is downloaded. Firewall
presents configured flags/rules and bounded shared references. Updates separates
installed/candidate versions and local-index evidence. No report adds idle
timers, grants, server installation, index refresh, configuration writes or reboot.

Independent subagent review and integration checks found and corrected partial
task sections labeled complete, overflowing Markdown fence calculation, credential
header redaction omissions, short identifiers corrupting replacement labels,
baseline normalized-VMID collisions/proxy ambiguity/oversized exports, malformed
entries, cancellation in reference expansion and node mapping, and QEMU default/
property-string allocations. Generated fragments now preserve literal replacement
tokens. Invalid/loading/late baseline imports cannot become a fresh capture;
null comparison imports are rejected. Settings pagination reserves space for
wrapped report descriptions, and new reports use compact interpretation notes.

Final local verification actually executed with Node.js 24.18.0:

| Surface | Result |
| --- | --- |
| `node tools/build.cjs --check` | Both editions match shared source and manifest |
| `node tools/check.cjs` | 33 JavaScript files, 195 local Markdown links, metadata and version pass |
| `node tools/fetch-xterm.cjs` | Existing pinned fixture integrity verified; no download |
| `node --test --test-isolation=none --test-reporter=tap tests/*.test.cjs` | 435 pass; zero failures, cancellations or skips |
| `node tools/browser-smoke.cjs` | Real ExtJS 7.0.0.168 / Chrome 155.0.8059.85 synthetic fixture passes |
| `git diff --check` | Pass |

Browser coverage includes all 27 options and three defaults, every report return
route, five new collections/cancellations, baseline export/import and changed-memory
comparison, invalid/scope-mismatched import refusal, edited support Blob bytes,
no unreviewed support export bypass, repository-secret omission, component cleanup,
preserved iframe/document/socket, narrow 640/800-pixel layouts and support preview,
Escape, and the companion. Desktop/narrow screenshots under ignored
`.cache/catalog-browser/` were inspected. Initial sandbox launch failed in
Crashpad; isolated elevated execution passed. Browser-fixture-only download
interception and async Blob checks were corrected during development. The final
run has no uncaught exceptions. These are synthetic results, not live PVE tests.

Efficiency evidence is operation-level: no collection on report open; default
one-node/one-guest Support uses three reads including discovery; two-node Update
model uses eight reads excluding discovery; shared firewall groups are fetched
once. Existing idle/resource-lifetime, three-concurrent-request and request/byte/
time-budget regressions pass. No production CPU/latency claim is made.

| Candidate artifact | Bytes (LF) | SHA-256 |
| --- | --- | --- |
| `proxmox-toolkit.user.js` | 194446 | `5bb3415b844d28c3c1d4444cc167d3a5f12fe78081fc50fec1e7bcaeba52b551` |
| `proxmox-copy-paste.user.js` | 56427 | `89855736b80a09424710380626914b2e0cd2094dd6da7a3a8f9d328f4f149ed6` |

Local implementation and verification are complete. Operator review/live Firefox
+ Violentmonkey acceptance is next. Actual API permissions/data, backend variants,
clipboard/file-save behavior and broad browser qualification remain separate.
Redaction is assisted; capacity is advisory; snapshots do not establish identity
continuity or authorship; firewall/kernel evidence does not establish operational
safety. Do not push or publish without explicit operator approval.

## Previous checkpoint — 2026-11-02: README and compatibility maintenance

Verified origin StarlightDaemon/proxmox-toolkit, branch main, clean starting
commit `01a616f8bb32b425145e0b9f72e5411b20a2c093` in the Toolkit checkout.
At the maintainer's request, moved the README's compatibility detail into
`docs/COMPATIBILITY.md`, leaving a short README link. The guide distinguishes
embedded xterm targets, optional serial/proxy integration, graphical VM consoles,
and separate console browser windows; Windows OS support is not excluded.
Detailed acceptance and historical evidence remain in Testing.

Added a live main-branch GitHub Checks badge and a Proxmox VE platform badge
linking to the new guide. Updated the documentation index and instructions.
This is documentation-only maintenance; stable 0.7.0 assets, runtime, tags and
release are unchanged. `node tools/check.cjs` passes (27 JavaScript files,
174 local Markdown links, metadata and version), and `git diff --check` passes.
Both new badge URLs return valid SVG. No runtime suite was rerun locally for
these documentation-only edits.

## Previous checkpoint — 2026-11-02: stable 0.7.0 promotion

The maintainer accepted the last tested 0.7.0-dev.8 runtime as the new stable and
explicitly authorized pushing/publishing it. Work proceeds in the verified
`E:\Citadel\proxmox-toolkit` checkout, origin
`https://github.com/StarlightDaemon/proxmox-toolkit.git`. Created local branch
`codex/release-0.7.0` from `codex/standalone-editions` at
`5a245c95aa114ec8d4114808857517206f2d54ad`, preserving all accumulated
implementation files and intentional deletions. Remote main was
`edfb35efa93c248daa6dcb22cc6709a779e264fa`, an ancestor of the release branch.
Both old and new folders still exist; the old folder was left untouched.

Verified the old GitHub repository URL returns 301 to proxmox-toolkit followed
by 200. GitHub reported no open issues or active repository rulesets at preflight.
Keep the old repository name unused to preserve the redirect.

Both editions and the probe now use 0.7.0. Shared source, registry and generator
hashes match the saved dev.8 baseline; generated outputs match dev.8 exactly
after version/name replacement and removal of the development-description
prefix. No runtime logic, defaults, grants, settings keys or host rules changed.
Current installation, edition, catalog, design, usage, testing and maintenance
documents now describe stable 0.7.0. Earlier release and development records
remain historical. Stable hashes are in CATALOG-ACCEPTANCE.md.

Local verification completed with Node.js 24.18.0:

- `node tools/build.cjs --check` and `node tools/check.cjs` pass.
- `node tools/fetch-xterm.cjs` verifies the pinned cached fixture.
- `node --test --test-isolation=none --test-reporter=tap tests/*.test.cjs`:
  375 pass, zero failures, cancellations or skips.
- `node tools/browser-smoke.cjs`: real ExtJS 7.0.0.168 / Chrome 155.0.8059.85
  passes category/report navigation, preserved console document/socket, cleanup,
  cancellation and narrow layouts. Desktop/narrow screenshots inspected. Initial
  sandbox launch failed at Crashpad startup; isolated elevated rerun passed.
- `git diff --check` passes. Logs and pre-promotion artifacts are retained under
  ignored `.cache/release-0.7.0`.

Published release commit `4e75f1919af091da72a9b01335f52fc329c795f8` to main
and annotated tag v0.7.0. The [v0.7.0 release](https://github.com/StarlightDaemon/proxmox-toolkit/releases/tag/v0.7.0)
is regular (not draft/prerelease), and the Latest API returns v0.7.0 with exactly
the Toolkit and Copy & Paste assets. Both GitHub-reported SHA-256 digests and
sizes match the locally tested and committed artifacts. The annotated tag peels
to the release commit. GitHub Checks passed on the
[release branch](https://github.com/StarlightDaemon/proxmox-toolkit/actions/runs/41437719112),
[main](https://github.com/StarlightDaemon/proxmox-toolkit/actions/runs/41437820821),
and [tag](https://github.com/StarlightDaemon/proxmox-toolkit/actions/runs/41437820664).
The old repository's releases/latest URL redirects 301 to the new repository,
then 302 to v0.7.0 and 200. The active checkout is now main; this publication
record is a documentation-only follow-up to the tagged release.

The maintainer's practical acceptance does not close detailed clipboard/report,
serial/proxy, migration, package-version or cross-browser checks. Open Loops now
also records Tools-menu grouping and versioned handoff copies as proposals, and
the duplicate-folder cleanup as separately authorized housekeeping.

## Previous checkpoint — 2026-11-02: new checkout path verified

Resumed in `E:\Citadel\proxmox-toolkit`. Origin remains
`https://github.com/StarlightDaemon/proxmox-toolkit.git`, branch
`codex/standalone-editions`, HEAD
`5a245c95aa114ec8d4114808857517206f2d54ad`. Before any repository mutation,
all 61 recorded file entries, origin, branch, HEAD and exact short status matched
`.cache/directory-rename-baseline.json`. The pasted handoff also matched this
record byte-for-byte. Existing modifications, untracked files and deletions were
preserved; neither candidate was regenerated.

The old `E:\Citadel\proxmox-copy-console` directory still exists with repository
contents, so a completed same-parent rename cannot be claimed. This session left
that directory intact and made the new checkout's linked worktree self-contained.
Ran `git worktree repair E:\Citadel\proxmox-toolkit\.cache\ol-01-review`;
the initial sandbox attempt could not write `.git`, and the approved elevated
retry succeeded. Both worktree paths and the linked tree's common Git directory
now resolve under the new root. The linked branch remains `codex/ol-01-review`
at `c9219895b259c91f934dcdc350f4a08db66ebae9`, with clean short status.
The old directory's worktree pointers still reference its own old root.

Verification from the new root with Node.js 24.18.0:

- `node tools/build.cjs --check`: both 0.7.0-dev.8 editions match generation.
- `node tools/check.cjs`: 27 JavaScript files, 158 local Markdown links,
  metadata and versions pass.
- `node tools/fetch-xterm.cjs`: cached pinned fixture integrity verified.
- `node --test --test-isolation=none --test-reporter=tap tests/*.test.cjs`:
  375 pass, zero failures, cancellations or skips. Local output is retained in
  `.cache/directory-rename-tests.tap`.

Toolkit remains 131,409 bytes, SHA-256
`2b4e08d2660543b10c2618bab85dd2079574986ec55ead472ecf26b99d3b7a92`;
Copy & Paste remains 55,914 bytes, SHA-256
`3fbb236391e38a3c0a3440ffa2871d5851cb654e5595dd2f655bdaad8e8a60ca`.
The real ExtJS browser fixture was not rerun in this session; its earlier result
remains historical local evidence. Live Firefox/Violentmonkey/Proxmox acceptance
remains pending beyond the maintainer's scoped UI feedback. Stable 0.5.0 and
runtime/version are unchanged. No commit, remote update, release, publication,
project creation or shortcut changes were performed. Tools-menu grouping and
versioned handoff copies remain proposals. The next evidence step remains the
live catalog campaign, not additional unapproved runtime work.

## Previous checkpoint — 2026-11-02: directory rename handoff (planned)

The maintainer reports dev.8 looks solid: the layout makes sense, Toolkit toggles
in the intended location, and the main UI frame is replaced as intended. This is
live UI workflow feedback, not acceptance of every report, clipboard scenario or
the full compatibility matrix. Stable 0.5.0 remains unchanged; no release or
promotion was authorized. No runtime changes or version bump accompany this handoff.

Recommended folder: `E:\Citadel\proxmox-toolkit`.
Recommended project display name: **Proxmox Toolkit**.
Current folder: `E:\Citadel\proxmox-copy-console`.
The destination did not exist when checked. The rename and new project setup
have NOT been performed. This turn prepares the plan only.

### Identity and state to preserve

- Origin: `https://github.com/StarlightDaemon/proxmox-toolkit.git` (already renamed).
- Branch: `codex/standalone-editions`.
- HEAD: `5a245c95aa114ec8d4114808857517206f2d54ad`.
- Extensive modified AND untracked implementation files are intentional. Preserve
  them, existing deletions, `.git`, `.cache`, and other hidden/ignored contents.
  Do not clone over this directory, reset, clean, prune worktrees or rebuild it
  from HEAD. The current candidate is not represented by HEAD alone.
- Main `.git` is a directory. A linked worktree exists at `.cache/ol-01-review`,
  branch `codex/ol-01-review`, HEAD
  `c9219895b259c91f934dcdc350f4a08db66ebae9`; its working tree was clean.
  Its `.git` pointer contains the OLD absolute directory, so repair is required
  after moving the containing main checkout.
- `.cache/directory-rename-baseline.json` records the pre-move identity, status
  and hashes of tracked/untracked non-ignored files, including this handoff.
  Ignored files are not hashed by this snapshot; preserve the entire directory.

### Move sequence for the maintainer / next agent

1. Finish/save editor work and stop repository-local tasks. Close tabs/terminals
   holding the old directory. Recheck destination absence and repository identity.
2. Rename the existing folder in Explorer from `proxmox-copy-console` to
   `proxmox-toolkit`. This is a same-parent directory rename, not a fresh clone or
   selective copy. Alternatively, from a PowerShell window outside the repository:

   ```powershell
   Set-Location -LiteralPath 'E:\Citadel'
   if (Test-Path -LiteralPath 'E:\Citadel\proxmox-toolkit') {
       throw 'Destination already exists; inspect it before proceeding.'
   }
   Rename-Item -LiteralPath 'E:\Citadel\proxmox-copy-console' -NewName 'proxmox-toolkit' -ErrorAction Stop
   git -C 'E:\Citadel\proxmox-toolkit' worktree repair 'E:\Citadel\proxmox-toolkit\.cache\ol-01-review'
   ```

3. Create/open the project **Proxmox Toolkit** using the renamed folder. Start
   the next chat there with this handoff and AGENTS.md. Do not continue filesystem
   writes from an old chat whose workspace root still points at the old location.
4. Verify origin, branch, HEAD and `git status --short` against the baseline;
   compare file hashes before regenerating anything. Run `git worktree list
   --porcelain` and `git -C .cache/ol-01-review status --short` to confirm both
   worktree paths resolve under the new root and the linked tree stays clean.
5. Run `node tools/build.cjs --check`, `node tools/check.cjs`, and
   `node --test --test-isolation=none tests/*.test.cjs` from the new root. Previous
   dev.8 results: 375 Node tests, build/static checks and real ExtJS browser
   fixture passed. These have not yet been rerun in the renamed directory.
6. Record completion here only after those checks. Update active local shortcuts
   as needed. Historical old repository paths, stable asset names, probe labels
   and release records are intentional; do not globally replace the old name.

Tooling uses repository-relative paths / `__dirname`; the inspected active build
and fixture tooling contains no dependency on the old checkout root. Ignored
browser cache files may contain old transient paths and can be regenerated by
their existing fixture commands if needed. Preserve the linked worktree.

### Resume context

Toolkit and Copy & Paste are the only shipped development editions, both
0.7.0-dev.8. Edit shared `src/` and `tools/features.cjs`; generate with
`node tools/build.cjs`. Never hand-edit generated userscripts. Keep the six
category tabs, inline report launchers, draft-preserving Back navigation, fixed
footer, global Documentation-adjacent toggle and underlying console intact.
Only Copy, Paste Only and Paste & Execute default on. Settings keys stay stable.

Primary live environment: PVE 9.2.3, daemon1 kernel 7.0.12-1-pve, Firefox 159.0
(64-bit), Violentmonkey 2.50.0. Retain the distinction between maintainer UI
feedback, synthetic local tests and untested report/manager scenarios.

Remaining proposals, not implementation approvals: configurable Tools-menu
grouping and versioned handoff copies to address Codex's file-review experience.
No change to file-review controls is established. Commit/push/merge/release and
publication remain separate authority boundaries. No new chat/project has been
created by this agent, and no message has been sent to another agent.

## Previous checkpoint — 2026-11-02: dev.8 category settings

Repository StarlightDaemon/proxmox-toolkit, branch codex/standalone-editions,
starting HEAD 5a245c95aa114ec8d4114808857517206f2d54ad verified. Existing work
preserved. User approved six categories, inline reports, visible footer and
console preservation for dev.8. No commit, remote update or publication.

Implemented native Console, Inventory, Recovery, Troubleshooting, Maintenance
and Integration tabs, with Diagnostics/Recipes regrouped. Checkbox/report cards
share a draft; all eleven report returns select their category and retain unsaved
values. Saved flags still gate reports. Proxy errors select Integration. Tabs
wrap and resize/activation-driven pagination keeps settings within the content
area, without new idle timers. Native controls remain mounted across settings
pages, then are destroyed on exit. The footer and underlying console stay intact.

Both generated editions and probe are 0.7.0-dev.8. All 375 Node tests pass;
real ExtJS/Chrome fixture covers category clicks, every paginated feature, draft
round-trips, footer/card/tab geometry at desktop/800/640 widths, all report return
routes, request cancellation, no component leaks, and one unchanged console
iframe/document/terminal marker/WebSocket through repeated toggles. Screenshots
and build/static checks accompany the handoff. Live Firefox 159.0 + Violentmonkey
2.50.0 + PVE 9.2.3 acceptance remains pending.

The previously proposed configurable Tools grouping remains a separate open
proposal. No change was made to Codex file-review behavior or handoff filenames.

## Previous checkpoint — 2026-11-02: dev.7 global launcher styling

Verified repository/ref/start unchanged; preserved all earlier work. Maintainer
reports dev.6's workspace, button function and exercised tools appear to work,
but supplied a screenshot of undersized, poorly spaced Toolkit beside
Documentation. This is scoped live feedback, not full catalog/matrix acceptance.

Root cause: the global north container supplies x-plain child defaults, while
Toolkit retained default-toolbar/proxmox-inline-button styling from its old
location. Explicit baseCls x-btn now resists that inherited default; UI and scale
follow Documentation, with matching 0 5 0 0 margin and no old inline class.
Both generated editions/probe advance to 0.7.0-dev.7. No new grants or UI polling.

The real ExtJS fixture now models native north defaults. Its new geometry/style
assertion fails against dev.6 and passes after the fix. All 372 Node tests and
the browser workspace/report/console-preservation checks pass; corrected screenshot
inspected. Build/static checks pass. Live dark-theme/Firefox sizing recheck is
pending. No commit, push or publication.

Grouping recommendation only: retain the three clipboard actions inline, group
all extra console utilities under Tools by default, and offer one persisted
grouped/inline preference. Reports stay in the workspace. Not implemented yet.

## Previous checkpoint — 2026-11-02: dev.6 main workspace and global toggle

Maintainer approved the reviewed plan: Toolkit beside global Documentation,
central workspace content, surrounding tree/header/task log preserved, toggle
return without losing the console. Repository/ref/start remain
StarlightDaemon/proxmox-toolkit, codex/standalone-editions,
5a245c95aa114ec8d4114808857517206f2d54ad; prior work preserved.

Native Ext.panel.Panel renders as an unmanaged absolutely positioned sibling in
#content. Native cards remain mounted, active and laid out. No iframe reparent,
hide, reload or native view destruction occurs during toggling. Temporary inert
and aria-hidden values are restored exactly; clipboard intent is cancelled and
console resolution blocked while covered. Content resize listeners size the
panel without polling; native mutation/tree-click listeners, page lifecycle and
Escape close/dispose it. No global method patching or new grants. Documentation
is selected by north-region/workspace ownership; resource Help is excluded.
Return to Proxmox restores the view; Back to Toolkit returns to Reports.
Explicit resource navigation and Save & Reload retain native replacement/reload
semantics and are not promised to preserve a console.

Verification: 372 Node tests pass, including lifecycle, accessibility restoration,
resize without timers, partial setup failure and pending input cancellation.
Real ExtJS 7.0.0.168 / Chrome 155.0.8059.85 fixture passes: exact central bounds,
surrounding regions, repeated cleanup, every report route, cancellation, resize,
Escape, resource navigation and logout. A same-origin iframe with a real local
WebSocket retains its document, terminal marker and open socket over ten toggle
cycles and report navigation, with no reconnect. Screenshots inspected; no
uncaught browser exceptions. This does not establish live Firefox compartments,
actual PVE/xterm session preservation or API/clipboard correctness.

Both editions/probe are 0.7.0-dev.6; hashes in catalog acceptance. No commits,
remote changes or publication. Live dev.6 campaign remains pending.

## Previous checkpoint — 2026-11-02: dev.5 naming, grants and report navigation

Repository/ref/start remain StarlightDaemon/proxmox-toolkit,
codex/standalone-editions, 5a245c95aa114ec8d4114808857517206f2d54ad.
Preserved prior uncommitted work. The maintainer traced the reported dev.4 syntax
error to a manual naming edit; the exact generated files passed parsing and all
364 then-current tests. Dev.5 generates versioned edition names and parses each
output before writing. Removed redundant GM_info/GM.info grant declarations;
retained their runtime reads, the nine used grants, historical namespace and
settings keys. Installation docs explain every grant and name-based identity.

The maintainer also reported no return navigation after Inventory/Maintenance.
All eleven report windows now have a native bottom-docked Back to Toolkit and
Close footer. Back destroys the report, cancels collection and opens the Reports
tab without writing settings, reloading or automatically collecting again.

Verification: 365 Node tests pass. The real ExtJS/Chrome fixture passes all prior
checks plus return navigation for every report, component cleanup, active-fetch
cancellation and narrow/scrolled footer visibility; screenshot inspected. The
first sandbox browser launch could not start Crashpad; the isolated rerun outside
the sandbox succeeded. A fixture-only scroll simulation was corrected to use DOM
scrolling after Ext.Component returned no scroller. No live Firefox/manager or
Proxmox acceptance is inferred. No commit, remote update or publication.

## Previous checkpoint — 2026-11-02: dev.4 blank report scopes

The maintainer confirmed the screenshot's environment versions and reported live
report failures on empty selection (notably Maintenance). The UI promised blank
Node meant the visible cluster, but the model required exactly one node.
Dev.4 removes that mismatch: independent per-node preflights cover all visible
nodes by default, including guestless nodes, with shared evidence fetched once.
Unreadable node checks remain unknown. Explicit filters narrow; invalid nodes
never broaden collection. Network includes guestless nodes and Recovery honors
its node filter for network collection. Task detail infers its node from UPID;
Compare and task-detail requirements are explained/validated before requests.

Verification: 364 Node tests pass; the real-ExtJS fixture renders blank-scope
Maintenance for two nodes including a guestless one, and verifies required-target
errors issue no requests. Screenshot inspected. Build/static/whitespace checks
pass. Both editions/probe are 0.7.0-dev.4. Live report correctness remains
unconfirmed; no commit, remote update or publication.

## Previous checkpoint — 2026-11-02: dev.3 placement/defaults and screenshot evidence

Maintainer supplied a dev.2 screenshot and requested Toolkit immediately left
of resource Help, with only Copy, Paste Only and Paste & Execute default on.
Implemented in shared source and rebuilt both editions/probe at 0.7.0-dev.3.
Saved settings remain intact; Restore defaults selects the new baseline.

Screenshot environment: PVE 9.2.3; node daemon1 kernel 7.0.12-1-pve, PMX
7.0.12-1, x86_64; Firefox 159.0 (64-bit); Violentmonkey 2.50.0; Toolkit
0.7.0-dev.2. Native dark Settings is visible. Inventory is checked alongside
the three clipboard actions. This records screenshot identity/rendering only,
not live clipboard/report acceptance or testing of the new dev.3 runtime.

Local verification: 348 Node tests and the real-ExtJS Chrome fixture pass; build,
static and whitespace checks pass. The fixture verifies left-of-Help placement
after resource replacement and three fresh defaults. Existing six-action console
regressions now explicitly use saved opt-in settings; fresh defaults and stored
preference preservation have separate coverage. No commit, push or publication.

## Previous checkpoint — 2026-11-02: dev.2 Help placement correction

The maintainer reported no Toolkit beside Help and noticed the unchanged dev.1
version. Source review found the prior selector targeted global Documentation,
which shares proxmoxHelpButton with resource Help. Corrected to the visible
config panel's own Help in its top action toolbar, excluding global Documentation
and modal/hidden Help. Resource destruction/navigation restores placement.
Bulk Actions is defined by PVE.node.Config and is not implemented by Toolkit.

Both editions and the probe now follow **0.7.0-dev.2**; settings titles and manager
commands expose it. Settings keys are unchanged. Future testing handoffs must
advance the shared development revision. Local tests: 348 pass; real ExtJS
fixture checks both native button locations and resource replacement. Build,
static and whitespace checks pass. No live browser was available through the
desktop tools; the installed candidate and live resolution remain unverified.
No commits, remote updates or publication.

## Previous checkpoint — 2026-11-02: native header and settings (placement corrected in dev.2)

The edition button now follows global Help and opens Settings directly. Native
ExtJS windows, tabs, checkboxes, fields and buttons inherit the installed theme.
The floating entry and home page are removed. Reports remain on a Reports tab;
console actions appear Copy, Paste Only, Paste & Execute. Header discovery
recovers late startup even with all features off and stops retrying once mounted.

Local evidence: 345 Node tests pass. The isolated Chrome fixture now renders real
ExtJS 7.0.0.168/Crisp with mocked workspace/GM/API data, including native placement,
saving, report access, narrow layout, Escape and component cleanup; screenshots
inspected. This does not qualify live PVE themes or Firefox/manager compartments.
Build/static/whitespace checks pass. Still local and uncommitted at 0.7.0-dev.1;
no remote, commit or release changes. See [acceptance](CATALOG-ACCEPTANCE.md).

## Previous checkpoint — 2026-11-02: configurable catalog, consolidated editions

Implemented locally at **0.7.0-dev.1** on `codex/standalone-editions`, starting
HEAD `5a245c95aa114ec8d4114808857517206f2d54ad` plus the existing uncommitted
0.6.0-dev.2 work. Toolkit now has 22 feature toggles; the only companion is
Copy & Paste (three toggleable clipboard actions). The maintainer explicitly
superseded individual-feature packaging during implementation. All old development
individual artifacts were removed; stable tags/releases and their identities
were not changed.

Settings use manager storage, origin/edition isolation, defaults and Save & Reload.
The six deferred console/integration/report ideas and ten management tools are
implemented. Management collection uses bounded, cancellable same-origin GETs;
reports distinguish evidence, omissions and unknowns. New Toolkit features are
off by default. See [catalog](CATALOG.md), [implementation record](CATALOG-DEVELOPMENT.md),
and [current acceptance](CATALOG-ACCEPTANCE.md).

Local verification: 338 Node tests pass, zero failures/skips. Cached pinned xterm
fixture verified. Headless Chrome 155.0.8059.85 exercised the settings and inventory
DOM using synthetic PVE/GM/API data; screenshots inspected. No live PVE access,
Firefox/manager qualification or actual clipboard/file contents are claimed.
The final record in CATALOG-DEVELOPMENT includes build/static/whitespace checks.

Next evidence step: run the pending Firefox + Violentmonkey scratch campaign,
including actual installed package versions, report permissions/API results,
serial/proxy integration, new native panels and migration from old script entries.
All work remains local and uncommitted. No commit, push, PR, merge or publication.

## Previous checkpoint — 2026-11-02: seven-edition feature implementation

Implemented locally at synchronized **0.6.0-dev.2**: Paste Only, Console Export,
Diagnostics and Diagnostic Recipes, plus the four new individual editions.
Toolkit includes all six actions; utility actions use a native Tools menu.
Shared source/generator, expanded regressions, current docs, implementing-agent
review and a precise pending acceptance campaign are complete. See
[review](FEATURE-REVIEW.md) and [candidate hashes/manual plan](FEATURE-ACCEPTANCE.md).

Exact baseline: origin StarlightDaemon/proxmox-toolkit, branch
codex/standalone-editions, starting HEAD
5a245c95aa114ec8d4114808857517206f2d54ad. Preserved the handoff and existing
OPEN-LOOPS/index/development-record edits. The final worktree is uncommitted;
HEAD alone does not identify these runtimes. No live Proxmox command or recipe,
commit, remote ref, PR, merge, tag, release or publication action occurred.

Final verification on Node.js 24.18.0: node tools/build.cjs and --check passed;
node tools/check.cjs passed 23 JavaScript parses, 136 local Markdown links,
metadata and synchronized versions; node tools/fetch-xterm.cjs verified the
cached pinned fixture (no download); node --test --test-isolation=none
tests/*.test.cjs passed **329/329**, zero failures/skips; git diff --check passed.
The final implementing-agent review fixed privacy/unknown-value, lifecycle and
redundant discovery issues documented in FEATURE-REVIEW. Earlier waves remain
chronological records. Next action is maintainer-operated Firefox +
Violentmonkey scratch acceptance using exact candidate hashes; all new live cases
remain pending. Stable 0.5.0 and its historical acceptance are unchanged.


## Previous checkpoint — 2026-11-02: selected feature implementation handoff

The maintainer selected Paste Only, Console Export, Diagnostics, and a
Diagnostic Recipe Picker and requested a grouped handoff for another agent to
implement and review. [The handoff](FEATURE-EXPANSION-HANDOFF.md) defines the
outcomes, behavior defaults, shared capability/edition boundaries, staged work,
regression and efficiency requirements, final review, and manual acceptance.
The other six researched ideas are deferred in OPEN-LOOPS and the handoff.

Preparation verified origin `StarlightDaemon/proxmox-toolkit`, branch
`codex/standalone-editions`, and HEAD
`edfb35efa93c248daa6dcb22cc6709a779e264fa`. Active uncommitted edition development
was present and changing concurrently. Preserve it and reconcile the latest
baseline before implementation. This wave adds planning documentation only;
it does not implement features, change versions, commit, publish, or qualify a
new runtime. The implementing agent must record actual checks and acceptance
separately from the earlier stable evidence.

Handoff verification: `node tools/check.cjs` passed parsing/metadata/version
checks for the current development tree and validated 117 local Markdown links.
Documentation whitespace checks passed. These checks validate the planning
changes and current source structure; no runtime test suite or live Proxmox
acceptance was run for this handoff.

## Previous checkpoint — 2026-11-02: repository rename and edition development

The maintainer authorized renaming the existing repository to
`StarlightDaemon/proxmox-toolkit`, updating links and local origin, and checking
old-address redirects. Original repository ID `1375405402` was verified before
and after the rename. Starting main/checkout commit:
`df1957edac560e5ae1caac36063ccc542866f442`. Local path remains
`E:\Citadel\proxmox-copy-console`; origin now points to
`https://github.com/StarlightDaemon/proxmox-toolkit.git`.

Publish canonical link/migration documentation on main while preserving the
accepted v0.5.0 tag and release assets. Stable installation links are pinned
to that tag so development edition filenames cannot change their meaning.
The maintainer chose Toolkit plus Copy-only and Paste-only scripts, generated
from shared source with one synchronized Toolkit version for all editions.
Implement and verify the changed runtime on `codex/standalone-editions`;
new Firefox + Violentmonkey live acceptance is separate from stable 0.5.0.

Rename verification: old repository, main-source page, and v0.5.0 release
URLs returned 301 then 200; the old release-asset URL returned 301, 302, then
200. The old raw tagged-source URL returned 200 directly (available, without
an HTTP redirect). Git lookup using the old clone URL returned the expected
main commit. Latest remains regular stable v0.5.0, with asset SHA-256
`8263ac0d60dcb9d08f1653c97cdfcdaa1960cdd0f404015c5a8beddedae523f8`.
These are remote URL/ref/asset checks, not new runtime or live Proxmox tests.

### Three synchronized development editions

Built **0.6.0-dev.1** from `src/toolkit.js` and `tools/editions.json`:
Toolkit (`proxmox-toolkit.user.js`), Copy-only (`proxmox-copy-console.user.js`),
and Paste-only (`proxmox-paste-execute.user.js`). All versions follow Toolkit
on every release, including editions with unchanged runtime. Build/check tools
enforce deterministic output and synchronized metadata; generation stamps the
manager probe header too. No user build step or runtime dependency is added.

Copy-only excludes clipboard reading and terminal input. Paste-only excludes
buffer extraction and clipboard-write grants/APIs. Selected action groups
share lifecycle code. Individuals coordinate clipboard work through an owned
DOM token, without shared privileged callbacks or clipboard text. Paste checks
ownership around input. Action markers refuse overlapping controls. Install
Toolkit or one/both individuals, not both configurations. Each individual has
one scan interval; Toolkit shares one. The historical v0.5.0 asset keeps its
all-in-one meaning; migration guidance identifies editions by name/version.

Verification: **221 local tests passed**, zero failures/skips, under Node.js
24.18.0. Existing 180 regressions passed; 41 additional checks cover capability
exclusion, synchronized stamping with unchanged runtime, coexistence, shared
locks, lost ownership, cancellation, standalone text safeguards, and real-xterm
Copy/partial-Paste execution. Source/metadata/links, generation freshness,
fixture integrity, and whitespace checks passed. Mock polling counts retain
one query per edition scan, one busy-marker read per scan, bounded resources,
and no hidden discovery. Two individuals use two scans, not Toolkit's one.
These are operation counts, not browser timing claims. New Firefox/manager
and Proxmox acceptance is pending under OL-12. No new stable release is made.

## Previous checkpoint — 2026-11-01: public documentation cleanup

The maintainer approved a shorter README, a corrected GitHub About description,
and two focused guides. Verified clean starting commit
`b8e638ad0d6717ed55d3f7b517853454589cf24a`, matching remote main, and origin
`https://github.com/StarlightDaemon/proxmox-copy-console.git`. Work proceeds
on `codex/docs-simplify`.

Keep the front page focused on the two actions, quick installation, essential
host/execution cautions, and supported scope. Move detailed setup, migration,
rollback, and custom-port instructions into `docs/INSTALL.md`; move text
handling, feedback, cancellation limits, and common problems into
`docs/USAGE.md`. Update the documentation index, repository instructions,
and Testing links. Preserve technical test evidence and historical records.
Clarify that transient changes without an event or polling observation cannot
be reconstructed; retain the safeguards and uncertainty guidance.

The approved About description is: "Native Copy and Paste & Execute buttons
for Proxmox node shells and LXC consoles." Existing repository topics remain
appropriate. About metadata is published separately from the documentation
commit. No userscript, version, release asset, or tag changes are needed.

Verification: README reduced from 963 to 339 whitespace-delimited words (65%).
Source/metadata/version checks and 92 repository-local Markdown links passed;
47 links in the seven changed Markdown files also passed heading-fragment
validation. Preserve the old candidate-acceptance fragment as an alias for
historical checkpoint links. Official manager setup links were checked.
Whitespace checks passed. The stable userscript SHA-256 remains
`8263ac0d60dcb9d08f1653c97cdfcdaa1960cdd0f404015c5a8beddedae523f8`.
No runtime tests were rerun locally for this documentation-only change;
publication CI is a separate check.

## Previous checkpoint — 2026-11-01: stable 0.5.0

The maintainer reconfirmed that the version works as intended within its
accepted scope and explicitly approved **0.5.0** as stable, without the RC
label. Promote main and publish v0.5.0 as a regular GitHub Release marked
Latest, with the installable userscript attached. Preserve the earlier RC
and stable tags/releases and their evidence; remote renaming is separate.

Verified clean checkout at `2495a270b0d4a45d459fc3d7acf8597269f6b642`,
matching remote main, with origin
`https://github.com/StarlightDaemon/proxmox-copy-console.git`. The live Latest
API still returned v0.4.1 while v0.5.0-rc.1 was a non-Latest prerelease.
Create `codex/release-0.5.0` for promotion. Change only userscript version and
description metadata; keep the tested executable body. Align current docs,
manager probe, and version checks. OL-11 practical acceptance is complete;
preserve the reported Firefox 159.0 (64-bit), Violentmonkey 2.50.0, Windows 11
environment and the remaining detailed qualification limits in Testing.

Verification: **180 local tests passed**, zero failures/skips, under Node.js
24.18.0. Source/metadata/version checks, 83 local Markdown links, pinned cached
xterm integrity, and whitespace checks passed. Stable script: 28,090 bytes;
SHA-256 `8263ac0d60dcb9d08f1653c97cdfcdaa1960cdd0f404015c5a8beddedae523f8`.
The normalized executable-body hash remains
`8cd88a878b1dd61ca77603ab00350864841aaefa0ac7ddbdcea3a467160d0828`,
matching the maintainer-tested runtime. Publication must verify main/tag refs,
CI, asset digest, regular release status, and the Latest release endpoint.

## Previous checkpoint — 2026-11-01: release candidate

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

## Feature wave 1 — 2026-11-02: baseline and Paste Only

Reconciled local origin `https://github.com/StarlightDaemon/proxmox-toolkit.git`,
branch `codex/standalone-editions`, HEAD
`5a245c95aa114ec8d4114808857517206f2d54ad`. Edition development is now committed;
preserved the existing handoff and OPEN-LOOPS/index/checkpoint edits. No branch
switch, commit, or remote mutation. Node 24.18.0 baseline: generation check,
source/metadata/link check, cached pinned-xterm integrity and all 221 tests pass.
Usage read: 54% of the available weekly window; no reset consumed.

Selected next synchronized version 0.6.0-dev.2. Shared input lifecycle now accepts
Paste Only independently of `term.input`; Enter dispatch is physically excluded
from that edition. Added final pre-dispatch validation and deterministic marker
ordering. Input-stage tests cover normalization, Unicode, limits, bracketed paste,
denial, partial send, timeout, hide/show, navigation, replacement, teardown and
lease loss, alongside the existing Paste & Execute regressions. Toolkit test
indices were updated to select the intended action after adding a third button.
Four generated editions are an intermediate build; export/diagnostics/recipes
and full seven-edition review follow. No live acceptance or release is implied.

## Feature wave 2 — 2026-11-02: export and native utility infrastructure

Added a native Tools menu in Toolkit and standalone utility controls, native
read-only text panels, Plain text/Markdown export and temporary Blob URL cleanup.
Export takes one activation snapshot through Copy's exact extractor, works with
retained disconnected output, and reports download intent only. Text is UTF-8
with no added newline; Markdown fences exceed all backtick runs. Names are UTC
and generic. Panel opening/browsing holds no clipboard lease.

The evolving seven-edition build passes the 240-test regression suite after
updating assertions for the intentional larger toolbar/menu and diagnostic-only
availability with a missing frame. Focused feature tests then pass 29/29,
including ten export cases for snapshot identity, literal text, alternate/empty/
ambiguous buffers, failure cleanup and pagehide. More diagnostics, recipes,
real-xterm export and expanded edition tests follow. No live browser/file-save
acceptance. The 500 ms recovery interval is unchanged.

## Feature waves 3 and 4 — 2026-11-02: diagnostics and recipes

Implemented explicit-open/refresh, allowlisted schema-1 diagnostics; the native
panel can integrate when the terminal is missing. Shared resolver reason codes
cover context/ownership/ambiguity. Clipboard API presence is never described as
permission approval; conditional bracketed-paste status is separate. Report
copying and static recipe copying share Copy's completion/timeout contract and
the cross-edition lease. Write cancellation now clears the watchdog on teardown,
loss of ownership and navigation, without claiming to undo a dispatched write.

Verified catalogue syntax against Proxmox's pveversion discussion, GNU df/uname
manuals and the systemd systemctl manual. GNU -h uses powers of 1024; systemctl
--failed requires systemd 233 or later. Picker shows prerequisites and exact
commands, copies without newline, refuses node-only entries in LXC and stale/
ambiguous targets, and never probes or sends terminal input. References and
platform limits will be retained in Usage.

All 304 local tests pass at this checkpoint, including every diagnostic reason
code, seeded-secret omission, permission/read/input non-use, recipe copy contracts,
all-six-individual ordering/overlap, cross-edition leases, and pinned real-xterm
export-byte comparisons. Renderer-free xterm still provides partial-send evidence,
not proof of successful rendered paste. Usage remains 54% in the reported window.
Final defect review, documentation, candidate hashes and acceptance plan follow.

## Final review wave — 2026-11-02

Separate implementing-agent review completed; no independent reviewer was used.
Added panel construction failure/teardown tests, strict Firefox menu/panel callback
checks, pre-event navigation refusal, unknown-count and nonprimitive-identity
regressions, open-panel idle counts, and six-individual operation counts. Removed
redundant discovery from clipboard-busy presentation; dispatch checks remain
fresh. Final 329 tests, deterministic generation, metadata/source/link checks,
cached pinned-fixture verification and whitespace checks pass as recorded above.
All seven exact hashes are in FEATURE-ACCEPTANCE; Toolkit is 53,737 bytes, SHA-256
3899cad5a4f5b1e8ea2a5525a41dfdc58a1719bbeae830bafd69491dcfadee39.

Current guides, manifest, generated editions, tests and review/acceptance records
are updated. No changes to historical release files/tags or acceptance claims.
No decision or local implementation blocker remains; live Firefox/Violentmonkey
clipboard/download/native UI and Proxmox acceptance is the next separate step.
All six deferred features remain deferred. Work is local and uncommitted.
