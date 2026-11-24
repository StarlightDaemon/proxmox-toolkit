# Decisions

## Five-report local expansion — 2026-11-02

The operator accepted all five researched additions and directed cataloging,
refinement, planning, implementation, testing and verification from start to
finish. Implement them as local **0.8.0-dev.1**: Capacity & Headroom and Cluster
Configuration Changes in Inventory; Troubleshooting Bundle Builder and Firewall
Visibility & Rule References in Troubleshooting; Update Readiness & Version
Consistency in Maintenance. The six existing categories suffice. Each report
has its own toggle and defaults off; the three existing clipboard defaults stay.

Reuse the authenticated same-origin GET client, per-run caching, bounded work,
request budgets, native workspace and lifecycle cleanup. Explicit downloaded
baselines provide change comparison without background persistence. Support
exports require local review and offer assisted redaction; they are not uploaded.
Capacity estimates, configuration differences, firewall observations and update
candidates expose their uncertainty rather than claiming operational guarantees.
The [expansion plan](docs/EXPANSION-0.8.md) records the concrete scope and acceptance.

Both editions follow the Toolkit version; Copy & Paste keeps its three features.
Published stable 0.7.0 and all prior history remain unchanged. The operator
explicitly reserved GitHub publication approval: do not push, merge, tag or
release this candidate without that approval. Local verification and live
Proxmox/browser acceptance remain separate evidence classes.

## Stable 0.7.0 promotion — 2026-11-02

After positive dev.8 workflow feedback, the maintainer explicitly directed that
the last tested version become the new stable and be pushed. Promote dev.8 as
0.7.0 for both Toolkit and Copy & Paste, commit the accumulated implementation
and release documentation, advance main, and publish v0.7.0 as Latest with both
generated userscripts. No new runtime feature is part of promotion. Preserve
the tested body except generated version identity; retain defaults, grants,
settings keys, host restrictions and all historical tags/releases.

This is maintainer practical acceptance and release authorization, not an
assertion that every report, clipboard case or compatibility cell passed.
Keep detailed qualification and conditional maintenance in Open Loops. Tools-menu
grouping and versioned handoff copies remain unapproved proposals. The active
release checkout is `E:\Proxmox Toolkit` (relocated from
`E:\Citadel\proxmox-toolkit`, observed 2026-11-08); the old
`E:\Citadel\proxmox-copy-console` folder is preserved.

## Category settings and report entry points — 2026-11-02

Approved for dev.8: replace the generic Features/Reports split with six native
category tabs. Keep Inventory, Recovery, Maintenance and Integration distinct;
Console contains clipboard/output tools and Troubleshooting contains diagnostics,
recipes, tasks and network exploration. Each report opens beside its setting.
Use wrapped tabs and paginated cards instead of a long settings list. Keep the
footer docked, preserve unsaved settings during internal navigation, and clear
the draft when returning to Proxmox. Report availability uses saved runtime
flags until Save & Reload. The preserved-console workspace behavior is unchanged.
This supersedes the earlier Reports-tab return destination below.

## Main workspace and global launcher — 2026-11-02

Approved for dev.6: Toolkit sits immediately left of global Documentation and
toggles a native panel covering only #content. This supersedes the resource-Help
placement and modal settings decisions below for current development. Server
tree, global header and task log remain usable. Native cards and their iframe
documents stay mounted and active underneath; interaction is blocked with inert
and console-action guards while covered. No setContent/card-switch/reparent/hide
is used on toggling. Return destroys only owned UI and restores prior attributes.
Navigation/logout exits normally, and Save & Reload remains an explicit reload.
Resize and cleanup use scoped native listeners, not new idle polling. No new
userscript permissions are needed. Live Firefox/Proxmox acceptance is separate
from synthetic browser evidence.

## Versioned names, grants and report return — 2026-11-02

The maintainer requested version numbers in the script name. From dev.5 the
generator stamps both edition names and @version from the shared manifest;
namespace `homelab` and settings keys remain unchanged. Updating the existing
manager entry is required to preserve its storage rather than creating a new
name-based installation. Stable release identity remains historical.

Remove explicit GM_info/GM.info grants because reviewed managers supply these
properties automatically. Keep the legacy/modern clipboard, storage and menu
grants plus unsafeWindow: each serves an implemented capability. The menu is a
deliberate recovery shortcut alongside the native toolbar. Toggles control work,
not static grant revocation. Installation docs record the audit and sources.

Every report has persistent native Back to Toolkit / Close navigation outside
its scrolling body. Back returns to the Reports tab, destroys the old report and
cancels collection. It does not save settings, reload or fetch automatically.
No forward/history cache of potentially sensitive report snapshots is introduced.

## Configurable catalog and packaging consolidation — 2026-11-02

The maintainer authorized all ten researched management tools and the six deferred
feature ideas, with each capability toggleable. During implementation the maintainer
replaced the individual-feature packaging plan with all-in-one Toolkit plus one
lightweight Copy & Paste edition. This supersedes earlier standalone-per-feature
decisions for development only; historical artifacts/releases are not rewritten.

Toolkit has 22 toggles. As requested for dev.3, only Copy, Paste Only and
Paste & Execute default on; the other nineteen default off. Saved selections
remain intact; Restore defaults applies this baseline only after Save & Reload. Copy & Paste has only Copy, Paste & Execute and Paste Only, all
initially on. Settings are versioned, per edition/origin, stored by the manager,
and applied through Save & Reload. Settings UI remains accessible with all off.
Management data is collected on demand using same-origin GETs and bounded lifetimes.
Blank report scope means all visible resources, within collection limits. Node
Maintenance evaluates each visible node independently. Compare retains explicit
comparison targets, and task detail requires a UPID but can infer the node.
Explicit invalid node filters never silently broaden the scope.
The maintainer subsequently requested native integration: the edition button
sits immediately before the selected resource's Help component and opens Settings directly.
Settings use ExtJS windows, tabs, fields and buttons with the installed PVE theme.
Reports remain accessible on a Reports tab and use native window/button shells
with scoped DOM content. The former floating launcher/home page and shadow-root
settings design are superseded. Console order is Copy, Paste Only, Paste & Execute.
See [catalog](docs/CATALOG.md) and [implementation record](docs/CATALOG-DEVELOPMENT.md).
Each distinct candidate handed to the maintainer for testing advances dev.N in
the shared manifest, including UI fixes. Settings show that version visibly.
Reusing dev.1 for the earlier native UI handoff was an oversight; dev.2 corrects
the Help/Documentation selector and stamps both editions together.
Local implementation authority does not grant commit/push/release authority.

This file records durable decisions by version. Historical sections preserve their original rationale; current compatibility and evidence are summarized in [Testing](docs/TESTING.md). An idea is not accepted merely because it appears in a historical proposal.

## Selected feature expansion — 0.6.0-dev.2 (unreleased)

The 2026-11-02 implementation handoff authorizes local Paste Only, Console
Export, Diagnostics and Diagnostic Recipes, plus an individual edition for each.
The original standalone Paste & Execute keeps its identity; “Paste Only” now
means the distinct action that never appends Enter. Seven editions share one
manifest version. Stable 0.5.0 and all published identities remain unchanged.

Toolkit keeps direct Copy, Paste & Execute and Paste Only buttons, with native
Export/Diagnostics/Recipes items under Tools. Export captures one explicit-open
snapshot; plain text is the default download button, with Markdown beside it.
Diagnostics are snapshots, refreshed explicitly, copied as an allowlisted schema;
unknown/unobserved values remain null. The recipe picker uses Previous/Next and
Copy command; it never stages or executes input. These native controls avoid a
custom UI framework and preserve keyboard semantics for live qualification.

Extraction, writing, reading/validation, Enter dispatch, panels and diagnostics
are separate build capabilities. Report and recipe copying use the existing
five-second write contract and owned cross-edition lease. Opening panels does
not acquire that lease. Cancelling a dispatched write only abandons completion
tracking; a late OS clipboard change remains possible. Paste Only uses the same
15-second lifecycle, normalization, controls/Unicode checks and bracketed-paste
requirement as Paste & Execute, but does not require the Enter API.

Console identities accept primitive native values, avoiding arbitrary object
coercion during diagnostics. Native-anchor ambiguity prevents integration;
missing/ambiguous frames can still be diagnosed through an unambiguous anchor.
All six deferred features remain deferred. Local implementation/review does not
authorize committing, pushing, PRs, merging or releasing. See
[review](docs/FEATURE-REVIEW.md) and [acceptance](docs/FEATURE-ACCEPTANCE.md).

## Product scope and simplicity

On 2026-11-02 the maintainer authorized renaming this existing repository to
**proxmox-toolkit**, retaining its history/releases and old-address redirect.
Update current canonical links and local origin; leave the old repository
name unused. Historical records and published assets retain their identities.

The maintainer also chose three independently installable editions:
**Toolkit** (all features), **Copy Console**, and **Paste & Execute**. Future
features follow the same optional standalone plus all-in-one pattern. Generate
the editions from shared source rather than maintaining divergent forks.
Toolkit owns the version: one manifest stamps the same version into every
edition on every release, including editions with unchanged runtime behavior.
Develop this packaging separately from the accepted stable 0.5.0 runtime.

The maintainer approved **Proxmox Toolkit** and Paste & Execute development on
2026-09-23. Stable 0.5.0 adds that console action alongside
Copy in one userscript. Firefox + Violentmonkey is the primary development and
acceptance target. The broader name permits modest future additions, but no
other feature is accepted by implication. Chrome/other-manager qualification
requires its own evidence; prior copy-only passes do not qualify new input.

On 2026-11-01 the maintainer reported extensive successful testing of
0.5.0-dev.1 and authorized pushing a release candidate with documentation.
Promote it to 0.5.0-rc.1 by version/description metadata only. Preserve the tested
runtime. Record the report as practical workflow acceptance in Firefox 159.0
(64-bit), Violentmonkey 2.50.0, and Windows 11. Proxmox/package versions and
per-scenario observations were not supplied.
After the candidate branch push, the maintainer explicitly authorized promotion
to main and availability under Releases. Version v0.5.0-rc.1 was published as
a prerelease with the installable userscript attached; 0.4.1 remained Latest
at that checkpoint.

The maintainer then explicitly confirmed the current version works as intended
within the accepted scope and approved stable **0.5.0**, removing the RC label.
Preserve the tested runtime, change version/description metadata only, promote
main, and publish v0.5.0 as a regular GitHub Release explicitly marked Latest.
This promotion does not imply new browser/manager or scenario qualification.
Preserve earlier tags/releases. Repository renaming was separately authorized
on 2026-11-02 as recorded above.

Keep each edition as one readable installable file with no runtime dependencies
or user build step, and share console targeting/lifecycle in the development
source. On 2026-10-15 the maintainer removed the
fixed source-size ceiling and made efficiency the primary structural criterion.
Review repeated discovery and DOM work, idle behavior, resource lifetimes, and
the value of added complexity. Prefer readable shared logic; keep correctness
and input safeguards. Support performance claims with operation counts or
browser profiling. Report source bytes/hash for candidate identity without a
size threshold. Avoid speculative frameworks and minification for cosmetic
size reductions. Publication of new runtime candidates remains separate from
the repository rename and existing stable release.

The October 16 efficiency review confirmed the checker has no source-size gate.
Reuse resolved ownership only within one synchronous scan, including pending
paste validation. Keep fresh session resolution around input and on hide events;
do not trade those checks for fewer calls. Timer/listener lifetimes and hidden
page behavior are covered by operation-count regressions; browser timing claims
require browser measurements. The separate clipboard-input length bound is an
input safeguard, not a source-size policy.

### Accepted for Toolkit 0.5.0

- **Use the existing console session.** The new action uses public xterm paste
  and input APIs. Proxmox's page-level connection state and open socket identify
  a usable session; never treat a retained buffer as proof of connection. Do not
  create an SSH session, network API, or alternate transport for this feature.
- **Read only on activation.** Native `navigator.clipboard.readText()` runs in
  the userscript activation call stack with its receiver intact. Require browser
  user activation and an active document; no background reads, history, new GM
  grants, permission bypass, or native clipboard-write fallback. Firefox's own
  Paste prompt may appear. One-click behavior is a live acceptance question.
- **Cancel stale intent.** Keep one read/write action pending. For input, capture
  the console frame, terminal, socket, loaded URL, and top-page URL; revalidate
  after the clipboard read and before Enter. Navigation/hiding/teardown and
  observed session invalidation cancel the operation. Fifteen seconds expires
  the operation, not the browser clipboard request; late results cannot send.
- **Define paste plus Enter.** Normalize CRLF/CR, remove trailing line breaks,
  preserve other text, call `paste(text)`, then `input('\r')` separately. Require
  effective bracketed-paste mode for multiline text or tabs. Refuse empty or
  whitespace-only content, other C0/C1/DEL controls, malformed UTF-16, and more
  than 65,536 UTF-16 code units. These are initial candidate bounds. No routine
  confirmation dialog, shell quoting/rewriting, or clearing existing input.
- **Report dispatch honestly.** Success means text and Enter were sent through
  xterm, not that the shell command succeeded. Partial input cannot be undone;
  never retry automatically. Keep clipboard/command content out of logs/tooltips.
- **Migrate the name explicitly.** Candidate @name is Proxmox Toolkit; keep the
  existing namespace and filename during development. Users replace their entry
  or disable the old one before enabling a separate candidate. The existing Copy
  marker prevents two active installations from creating competing toolbars.

### Historical scope through 0.4.1

The following copying-only scope and 20 KiB ceiling describe the stable releases;
the explicit Toolkit decisions above supersede them for Toolkit 0.5.0.

The product has one job: copy the intended Proxmox console's retained text accurately through one native Copy button. Firefox + Violentmonkey is the maintainer's primary daily homelab combination; Chrome compatibility remains required.

Accept an addition only when it solves a demonstrated problem in that copying workflow and its benefit justifies the code, permissions, interface, and ongoing maintenance it adds. Prioritize correctness, reliable targeting, useful failure feedback, and small compatibility fixes. Optional copying features need evidence of recurring use; a plausible idea alone does not put one on the roadmap.

Keep one readable installable file, no runtime dependencies, and no required build step. The existing 20 KiB check is a review ceiling, not room to fill. Prefer removing duplication or an unnecessary branch over creating abstractions for hypothetical future uses. Tests and probes stay outside the shipped runtime; keep documentation focused and avoid duplicating policy across new files.

## Accepted for 0.3.0

### Use explicit full-buffer copying instead of selection-driven copying

**Decision:** Copy terminal content only when the user activates the dedicated **Copy** control, and derive the copied text from xterm's retained buffer.

**Rationale:** The earlier select-to-copy lineage exposed browser/Firefox selection incompatibility with the xterm interaction model. A probe also found that xterm `getSelection()` was already populated before `onSelectionChange()` ran. The project therefore stopped using selection events as the copying foundation.

### Integrate through native ExtJS controls

**Decision:** Insert a real `Ext.button.Button` immediately after the visible Proxmox **Shell** or **Console** control.

**Rationale:** Proxmox then owns button dimensions, theme, hover behavior, and toolbar layout. Button text remains **Copy** so feedback does not cause width/reflow changes.

### Rediscover the active terminal instead of retaining one terminal reference

**Decision:** Resolve the visible xterm terminal fresh when needed and periodically re-evaluate installation state.

**Rationale:** Proxmox can create, hide, destroy, and recreate console frames/components while navigating. Fresh discovery avoids relying on a stale terminal object.

### Reconstruct logical lines from the retained xterm buffer

**Decision:** Read physical buffer rows, concatenate rows marked `isWrapped`, trim right-side padding only after a logical line is complete, and remove only trailing empty logical rows.

### Distinguish normal and alternate buffers

**Decision:** Use the normal buffer for ordinary shell operation so retained scrollback is included. When the alternate buffer is active, copy that active alternate buffer because it represents the current alternate-screen display.

## Accepted for 0.4.0

These choices were implemented in 0.4.0-dev.2 and promoted without runtime changes after the maintainer's live node/LXC copy-paste acceptance on 2026-09-18. They do not revise the historical 0.3.0 baseline. The maintainer's promotion decision accepts that observed workflow; the broader browser/manager qualification plan remains open in `docs/TESTING.md`.

- **Bind to console ownership and exact identity.** Use native `pveConsoleButton` metadata and the owner's frame descendants. Resolve the loaded URL and terminal afresh per click; decline ambiguous or unsupported contexts. English labels and global-frame fallbacks cannot establish ownership.
- **Preserve Unicode whitespace and distinguish wide-wrap placeholders.** Keep the ASCII-padding cleanup policy explicit. Use public buffer/cell APIs and current display columns, without changing terminal options or using xterm private internals.
- **Report the strength of clipboard evidence.** Await a supported callback/promise; label void-returning dispatch unconfirmed. Do not add clipboard reading, automatic retries, a fallback API chain, or an automatic clearing timer. A timeout is uncertainty and does not cancel an extension write.
- **Keep polling simple.** Skip hidden documents and scan on visibility return. Keep the 500 ms foreground interval until actual traces justify changing it. Never extract buffer rows on idle scans.
- **Keep one installable file with no runtime dependencies.** Tests may download a pinned, verified Proxmox xterm bundle into ignored `.cache/`. Node built-ins provide the test/check tools, and CI uses pinned actions with read-only permissions.
- **Restore focus conservatively.** Only the same focused button and same active terminal qualify. Do not intercept terminal keyboard shortcuts.
- **Keep trust configuration outside a new settings system.** Document manager-level host restrictions; preserve userscript identity and do not introduce an auto-update channel.
- **Target rolling stable platforms, Firefox first.** Current stable Proxmox VE with its standard console packages is the intended platform. Firefox is the primary development/acceptance browser for the maintainer's daily homelab workflow; Chrome is the secondary compatibility target. Both require evidence before claiming cross-browser qualification. The maintainer approved 0.4.0 promotion on the reported live workflow while remaining matrix coverage stays open. Prioritize Tampermonkey/Violentmonkey and test additional manager families separately. Do not maintain legacy-version shims speculatively.
- **Share one implementation across managers.** Select legacy/modern clipboard capabilities before a write; export Firefox callbacks/configuration only when the sandbox provides `cloneInto`. Keep callbacks free of page arguments and privileged return values. Add a generated variant only when an actual manager incompatibility requires one; do not maintain ten manual forks to match an arbitrary app count. See [Testing and compatibility](docs/TESTING.md).

## Deferred

### Compatibility test scope clarified 2026-09-19

Keep a shared source where small, evidenced compatibility changes suffice. Offer generated manager-specific variants only if shared behavior cannot remain reliable and lean; separate editions need their own acceptance. Stable 0.4.1 retains the 0.4.1-dev.1 runtime that addresses FireMonkey callback boundaries without requiring a manager fork. Practical passes for all four primary browser/manager combinations are recorded in Testing; promotion does not imply full edge-case qualification.

Use Chrome as the representative Chromium test browser. Other Chromium browsers are expected-compatible by maintainer policy, with no routine broad test matrix, but remain unverified unless actually exercised. Investigate a derivative browser when a concrete report warrants it. Both primary Chrome managers now have operator-reported candidate workflow passes; preserve their evidence limits in Testing.

After those Chrome passes, the maintainer narrowed active testing to Firefox and Chrome with Violentmonkey and Tampermonkey. Firefox + Violentmonkey remains the daily-use priority. Defer further extended-manager testing unless explicitly requested or needed for a concrete copying defect; preserve existing reports and shared compatibility code. Additional managers and probes are not release gates for practical workflow acceptance. Keep exact-version and full-scenario qualification distinct from that acceptance. Do not patch unrelated Proxmox form markup, unload handling, or suppress browser warnings in this userscript.

Viewport-only copying is an uncommitted idea, not a planned feature. Revisit only if daily use demonstrates a need, then define scrolled-viewport semantics, wrapped edges, and an accessible activation method within the simplicity policy. No broad compatibility fallback is added without probe evidence from the target installation.
