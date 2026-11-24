# Configurable catalog development

## Current local expansion — 0.8.0-dev.1

Five further reports are authorized for implementation and local verification.
The [0.8 expansion plan](EXPANSION-0.8.md) records their categories, scope and
acceptance criteria. The [development checkpoint](TOOLKIT-DEVELOPMENT.md) owns
actual verification results. No GitHub push or release is authorized without
operator approval. The stable-promotion and implementation records below retain
their historical meaning.

## Stable promotion — 2026-11-02

The maintainer subsequently accepted the last tested dev.8 runtime for stable
0.7.0 and authorized pushing/publishing it. Both editions advance together,
with runtime behavior unchanged. The implementation records below describe
their original development authority and evidence; the later release authority
is recorded in [Decisions](../DECISIONS.md). Remaining detailed live checks are
maintained in [catalog acceptance](CATALOG-ACCEPTANCE.md).

## Packaging correction during implementation

The maintainer subsequently directed that separate feature editions be stopped.
The final catalog ships only Toolkit and a lightweight Copy & Paste edition.
All management/utility features are exclusive to Toolkit. The intermediate
23-file build was removed; tests now exercise Toolkit feature selections rather
than treating those intermediate editions as products. The existing uncommitted
development files were consolidated under this explicit instruction.

## Authority and starting state

On 2026-11-02 the maintainer requested implementation of the ten researched
management tools, the six deferred feature ideas in Open Loops, and persistent
feature toggles in Toolkit. This supersedes the earlier handoff's deferral for
those six ideas. Local implementation and verification are authorized; commits,
remote updates, releases and live operational changes are separate.

Starting repository: StarlightDaemon/proxmox-toolkit, branch
`codex/standalone-editions`, HEAD `5a245c95aa114ec8d4114808857517206f2d54ad`.
The existing uncommitted 0.6.0-dev.2 seven-edition candidate is the starting
runtime. Preserve its work and stable 0.5.0 identity and evidence.

## Implementation plan

1. Add a versioned feature registry, origin-scoped manager settings, an always
   accessible settings launcher and manager command, with Save & Reload.
2. Add Scoped Copy, Find in Scrollback, Review & Paste, VM serial console
   recognition, Copy Task Report, and explicit custom HTTPS origin/proxy support.
3. Add Inventory, Configuration Compare, Backup Coverage, Task Investigator,
   Snapshot Ledger, Storage Inspector, Maintenance Preflight, Network Explorer,
   Guest Integration, and Recovery Manifest.
4. Generate Toolkit and Copy & Paste with one version; verify settings migrations, disabled
   feature inactivity, read-only request bounds and cancellation, report accuracy
   under missing permissions/data, console input invariants, and cleanup.
5. Update guides, acceptance checklist, and remaining evidence boundaries.

## Design boundaries

- Existing six Toolkit actions default on. New features default off. Copy & Paste
  enables its three clipboard actions. Modifiers (serial/proxy) are
  explicit toggles too. Preferences persist per browser origin and edition.
- Settings remain accessible with all features off. Save and reload is explicit;
  no implicit live hot-switching of an input operation. No settings contain
  transcripts, credentials, clipboard history, or cached management reports.
- Management requests use the current same-origin session and read-only GET
  endpoints, explicit activation, bounded concurrency/request/response budgets,
  deadlines, cancellation, and no hidden polling. Unavailable data stays unknown.
- Reports are local snapshots, with collection scope and errors visible. They
  do not promise restorable backups, safe deletion, migration success, full
  physical connectivity, or complete host backup. Operations remain in native PVE.
- The existing shared source may include build-time source fragments for readable
  settings/report modules. Generated userscripts remain dependency-free files.
- Existing manager host restrictions remain the trust boundary. Custom origins
  require an explicit manager include rule plus the custom-origin toggle.

## Evidence still requiring a live environment

OL-02/03 browser observations, OL-04 extended manager qualification, OL-05 actual
installed package comparison, OL-06 browser profiling if needed, OL-10 reproduction
of environmental exceptions, and OL-12 native acceptance cannot be closed by
local mocks. Prepare these checks and retain them as pending, not fabricated passes.

## Final implementation and review — 2026-11-02

Implemented the 22-toggle Toolkit and three-toggle Copy & Paste candidate at
0.7.0-dev.1. Both build from shared source; the second file physically omits the
management client, report model/UI, utilities and extra console tools. The new
features use explicit activation. All-off/report-only modes install no console
recovery interval; report collection never runs on idle scans.

Implementing-agent review (not an independent review) found and fixed:

- Property-string parsing initially discarded implicit volume names. It now
  preserves implicit and explicit file references, with storage/backup regressions.
- Network tracing now recognizes the actual API `slaves` field for bonds.
- Agent responsiveness uses the documented GET network-information endpoint;
  ping is POST and is not invoked by this read-only client.
- Reports reject unexpected API data shapes, preserve incomplete/unknown results,
  and use node, guest, request, time, individual-response and total-byte limits.
- Storage reference lookup uses indexed maps instead of scanning every reference
  for each volume. Local/shared identities remain distinct and deletion safety
  is never inferred from absent references.
- Settings failures/unknown schema leave features inactive, encoded traversal and
  remote URLs are refused, and queued requests recheck cancellation/budgets before
  dispatch. Closing a report aborts outstanding work and prevents stale rendering.
- Real DOM inspection found stylesheet display rules overriding HTML hidden
  attributes. An explicit hidden rule and a browser regression prevent irrelevant
  report options from showing. Tables scroll horizontally rather than crushing
  every column; settings use a responsive grid and sticky actions.
- Old individual-edition test assumptions were replaced by Toolkit-toggle and
  two-edition tests. Source-level omission remains verified for Copy & Paste.

Verification actually run:

| Surface | Result |
| --- | --- |
| Node.js 24.18.0 | 338 tests passed; zero failures, cancellations or skips |
| Generation | Two deterministic outputs at one version; `build.cjs --check` passed |
| Static checker | 25 JavaScript parses, 156 local Markdown links, metadata/version checks passed at the final checkpoint |
| xterm fixture | Cached fixture verified against pinned commit 89075b05773a2b6c380175dde3f8a4472a5ab506; no download |
| Headless Chrome 155.0.8059.85 | Toolkit 22 toggles/six defaults; saved all-off settings; origin scoping; lazy inventory; literal rendering; hidden options; narrow dialog; Escape. Copy & Paste three defaults and absent management entry. Screenshots inspected. |
| Whitespace | `git diff --check` passed |

The first headless browser launch was prevented by the execution sandbox's
crash-handler restriction. The isolated synthetic fixture then passed outside
that sandbox. It used no live Proxmox session or real manager storage.

No new runtime is live-qualified. Remaining evidence is tracked in Open Loops and
CATALOG-ACCEPTANCE. Work is local/uncommitted; no remote refs, PRs, tags or releases
were created or updated.

## API/source references checked

- [Proxmox cluster API](https://github.com/proxmox/pve-manager/blob/master/PVE/API2/Cluster.pm)
- [Task list/log API](https://github.com/proxmox/pve-manager/blob/master/PVE/API2/Tasks.pm)
- [Backup jobs API](https://github.com/proxmox/pve-manager/blob/master/PVE/API2/Backup.pm)
- [Storage content API](https://github.com/proxmox/pve-storage/blob/master/src/PVE/API2/Storage/Content.pm)
- [LXC configuration API](https://github.com/proxmox/pve-container/blob/master/src/PVE/API2/LXC/Config.pm)
- [Guest-agent methods and permissions](https://github.com/proxmox/qemu-server/blob/master/src/PVE/API2/Qemu/Agent.pm)
- [Network configuration fields](https://github.com/proxmox/pve-manager/blob/master/PVE/API2/Network.pm)
- [Native console types](https://github.com/proxmox/pve-manager/blob/master/www/manager6/button/ConsoleButton.js)
- [Native workspace navigation](https://github.com/proxmox/pve-manager/blob/master/www/manager6/Workspace.js)
- [Violentmonkey storage/menu APIs](https://violentmonkey.github.io/api/gm/)

These source checks describe contracts, not proof that a particular installed
PVE package exposes every field or that a user's permissions allow every query.

## Native integration follow-up — 2026-11-02

The maintainer requested Toolkit beside global Help, direct settings, native
Proxmox styling, and clipboard order Copy / Paste Only / Paste & Execute.
Implemented with native ExtJS components and the existing safe callback adapter.
Reports move into a settings Reports tab; report windows/buttons are native too.
Header recovery uses one backoff timeout until mounted, pauses while hidden,
and is independent of console actions. Mounted headers add no idle polling.
Report redraw explicitly destroys old native buttons; closing destroys all owned
components and cancels collection. No manager-specific UI API is used.

Verification: 345 Node tests, deterministic generation, static/link checks and
whitespace checks pass. The browser fixture now uses hash-pinned public Proxmox
ExtJS 7.0.0.168/Crisp assets; header/workspace, GM storage and report responses are
still synthetic. Actual component rendering, direct settings, toggle/save states,
report access, narrow layout, Escape and repeated-open/redraw cleanup pass in
Chrome 155.0.8059.85. Screenshots were inspected; a blank report layout discovered
visually was corrected by using the native contentEl layout target. Live PVE
themes and Firefox/userscript-manager compartments remain pending.

Global header structure was checked against the official
[workspace source](https://github.com/proxmox/pve-manager/blob/master/www/manager6/Workspace.js)
and [Help component](https://github.com/proxmox/proxmox-widget-toolkit/blob/master/src/button/HelpButton.js).
The earlier synthetic DOM results above describe the superseded overlay.
No commits, remote updates or releases were made.

## Help placement and candidate identity correction — 0.7.0-dev.2

The maintainer reported a missing Toolkit beside Help and unchanged dev.1.
Review of the official [config panel source](https://github.com/proxmox/pve-manager/blob/master/www/manager6/panel/ConfigPanel.js)
showed that the requested Help lives in the resource action toolbar. The prior
implementation instead selected global Documentation in the north header; the
fixture had incorrectly labeled that global button Help and therefore missed
the placement error. Dev.2 selects the visible config.helpButton in the panel's
top toolbar and restores it after resource replacement. Global Documentation,
modal Help and hidden resources are excluded.

Bulk Actions comes from the official [node config](https://github.com/proxmox/pve-manager/blob/master/www/manager6/node/Config.js).
Toolkit neither creates nor modifies it. Both generated editions/probe advance
together to 0.7.0-dev.2. Version appears in Settings and the manager command;
preferences retain the same storage key. Every future testing handoff should
advance the development revision instead of relying on hashes alone.

348 Node tests pass; the corrected real-ExtJS browser fixture now includes
both Documentation and resource Help and verifies placement after resource
replacement. Screenshots inspected. Build/static/whitespace checks pass.
Desktop discovery returned no accessible live browser window, so the installed
script identity and resolution on the maintainer's PVE remain unconfirmed.
Work stays local and uncommitted; no publication or remote changes.

## Dev.3 — placement/default refinement and screenshot evidence

Move Toolkit immediately left of resource Help and change fresh/reset defaults
to Copy, Paste Only and Paste & Execute. Preserve explicit saved choices.
Both editions and the probe use 0.7.0-dev.3. Regression fixtures for existing
six-action console workflows now supply saved opt-ins; fresh defaults and
preservation of a saved Export opt-in are tested independently.

The supplied dev.2 screenshot shows PVE 9.2.3, daemon1 kernel 7.0.12-1-pve
(PMX 7.0.12-1, x86_64), Firefox 159.0 (64-bit), Violentmonkey 2.50.0 and
Toolkit 0.7.0-dev.2. Native dark Settings renders. Inventory is also checked,
so the screenshot is not a three-features-only configuration. Record this as
UI/identity evidence, not successful action/report execution or dev.3 acceptance.

348 Node tests and the corrected real-ExtJS browser fixture pass, including
left-of-Help placement after resource replacement and three fresh defaults.
Build/static/whitespace checks pass. Local work only; no commits or publication.

## Dev.4 — blank scope and report requirements

The maintainer confirmed the recorded environment versions and reported live
report failures with no explicit selection. Maintenance contradicted its UI by
requiring a node. It now evaluates every visible node independently when blank,
with a visible per-node summary, grouped detail and shared cluster/backup reads.
Guestless nodes remain represented; denied reads remain unknown. Network also
collects interfaces on guestless nodes. Recovery respects explicit node network
filters. Compare requires two targets or one plus a baseline; task detail still
requires a UPID but infers its owning node. Both validate required inputs before
requests. Typos in explicit node filters never turn into broad collection.

364 Node tests pass (nine general-report blank-scope cases plus per-node, unknown,
guestless, filter and pre-request validation coverage). Real ExtJS browser fixture
checks blank-scope Maintenance across two nodes and pre-request required-target
hints; screenshot inspected. Request limits, same-origin GETs, lazy collection
and cancellation remain unchanged. Candidate 0.7.0-dev.4 is local/unreleased;
live resolution remains pending and no commits/remote changes were made.

## Dev.5 — versioned names, grant audit and report return

The maintainer clarified that dev.4's syntax error followed their manual naming
edit. Generated names now include the shared version; build-time parsing rejects
invalid output. The existing namespace/storage identity is documented, and two
redundant manager-info grants are removed, leaving nine used declarations.

Inventory and Maintenance live review exposed missing return navigation.
The shared report window now provides a native bottom-docked Back to Toolkit and
Close footer. Back cancels and disposes the current report and opens the Reports
tab. Local verification passes 365 Node tests and the real ExtJS browser fixture,
including all eleven report return routes, component cleanup, active-request
cancellation and a narrow scrolled report screenshot. Live acceptance remains
pending; see the current checkpoint and candidate identities.

## Dev.6 — central workspace and console-preserving return

The maintainer approved moving the launcher to global Documentation and filling
the central content region. A native panel covers the existing card without
reparenting/hiding/destroying it or its iframe. Temporary inert/aria-hidden
attributes protect the covered view; clipboard intent is cancelled. Return and
the global toggle restore the view. Resource navigation/logout exits normally;
Save & Reload explicitly reloads. Native resize/navigation listeners are scoped
to the panel lifetime. Report Back/Return navigation uses the same container.

372 Node tests pass. The real ExtJS/Chrome fixture verifies bounds, resizing,
surrounding regions, cleanup and report navigation, plus an unchanged iframe
document/terminal marker and real local WebSocket through repeated toggles with
no reconnect. Screenshots inspected; no uncaught browser exceptions. The
maintainer's dev.5 screenshot is visual evidence only; live dev.6 Firefox and
Proxmox console preservation remains pending. No new grants or runtime
dependencies, commit, push or publication.

## Dev.7 — global launcher geometry

Maintainer reports the dev.6 workspace/button/exercised toolchain work, with a
screenshot showing a small, unspaced Toolkit launcher. The header fixture lacked
PVE's north-container x-plain defaults. Adding those defaults reproduces the
defect. The launcher now explicitly uses x-btn, Documentation's UI/scale and
0 5 0 0 margin; old toolbar-specific styling is removed. Browser geometry checks
now pass for equal height/top and 5px gap; all 372 Node tests and existing browser
checks pass. Screenshot inspected. Both editions/probe are dev.7, still pending
live Firefox dark-theme sizing confirmation. Grouped/inline console utility
settings were recommended for review only; no new placement option was added.
