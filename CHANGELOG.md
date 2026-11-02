# Changelog

## 0.7.0 — 2026-11-02

- Promote the maintainer-tested 0.7.0-dev.8 runtime to stable at the maintainer's
  explicit request. Both Toolkit and Copy & Paste follow version 0.7.0.
  Runtime behavior, defaults, grants, settings keys and host rules are unchanged;
  generated names, version strings and development descriptions reflect stable.
- Ship only `proxmox-toolkit.user.js` and `proxmox-copy-paste.user.js`. Toolkit
  has 22 toggles across Console, Inventory, Recovery, Troubleshooting, Maintenance
  and Integration; Copy & Paste has the three clipboard actions. Only Copy,
  Paste Only and Paste & Execute default on.
- Include dev.8's Documentation-adjacent workspace, inline report launchers,
  draft-preserving Back navigation, fixed footer and preserved console.
  Update installation, migration, rollback and maintenance documentation.
- Stable promotion accepts the maintainer's tested workflow. Detailed report,
  actual clipboard, proxy/serial and broader manager/browser observations remain
  tracked; local automation does not mark those scenarios passed.
- Preserve earlier tags, releases, assets and historical edition records.
  Keep the old GitHub repository name unused so its redirect continues working.

## 0.7.0-dev.8 — Unreleased category settings navigation

- Replace Features/Reports with Console, Inventory, Recovery, Troubleshooting,
  Maintenance and Integration. Move Diagnostics and Recipes into Troubleshooting.
- Place report launchers beside their toggles; retain saved-state gating and
  explicit Run report. Back returns to the matching category with the draft intact.
- Wrap tabs and paginate settings cards on smaller panels. Keep footer controls
  docked and preserve the existing console while toggling back to Proxmox.
- Keep the three clipboard defaults, settings keys and nine grants unchanged.
  Synchronize Toolkit, Copy & Paste and the probe to dev.8.
- Verify 375 Node tests and real ExtJS browser navigation/layout/lifecycle checks.
  Live Firefox/Proxmox acceptance remains pending.

## 0.7.0-dev.7 — Unreleased global button styling correction

- Give the global Toolkit launcher an explicit native button base class so the
  north container's x-plain defaults cannot strip its styling. Match
  Documentation's UI/scale and use its 5px right-hand spacing; remove the old
  resource-toolbar UI and inline class. The companion launcher follows the same fix.
- Reproduce the dev.6 mismatch in the real ExtJS fixture using native header
  defaults, then verify matching height/top alignment and spacing after the fix.
- Keep existing Tools grouping unchanged. A configurable grouping option is a
  recommendation for review, not an implemented feature in this candidate.

## 0.7.0-dev.6 — Unreleased main-workspace integration

- Move Toolkit immediately left of global Documentation; the button toggles the
  workspace while remaining available across resource navigation.
- Fill the central content region with native Features/Reports panels. Keep the
  server tree, top bar and task log available; follow native region resizing.
- Preserve the native view, card selection and mounted console iframe underneath.
  Temporarily make that view inert; never reparent, hide or destroy it on toggle.
  Cancel pending clipboard intent and block console actions while covered.
- Return to Proxmox restores the existing view. Back to Toolkit returns to
  Reports. Resource navigation, logout, Escape and page hiding clean up the
  workspace and cancel collection. Save & Reload still explicitly reloads.
- Verify 372 Node tests and a real ExtJS/Chrome fixture, including unchanged
  iframe document/terminal and a real local WebSocket across repeated toggles.
  Live Firefox/Proxmox console preservation remains pending.

## 0.7.0-dev.5 — Unreleased naming, permissions and report navigation

- Generate versioned names for both editions, including Proxmox Toolkit
  0.7.0-dev.5; keep the historical `homelab` namespace and settings keys.
- Remove redundant GM_info / GM.info grant declarations; retain automatic
  manager information access and the nine grants used for clipboard, settings,
  menu fallback and page integration. Document each capability and update identity.
- Parse generated candidates during the build before emitting them.
- Add a persistent native Back to Toolkit / Close footer to every report.
  Back returns to the Reports tab and cancels active collection without saving
  settings or reloading. Verify all report routes and a narrow scrolled layout.
- The maintainer traced the reported dev.4 syntax error to a manual naming edit;
  no syntax defect was reproduced in the generated dev.4 artifact.

## 0.7.0-dev.4 — Unreleased report scope correction

- Make blank Maintenance scope assess all visible nodes independently, with
  a per-node summary and unknown/error evidence preserved.
- Include guestless nodes in Network Path Explorer; honor explicit node filters
  in Recovery network collection. Show the resolved report scope.
- Infer task-detail node from UPID. Explain Compare/task required targets before
  collecting; remove irrelevant guest filters from task detail and storage.
- Keep current permissions, request/concurrency limits and cancellation behavior.
  Explicit invalid node names produce an error, never an automatic broad query.

## 0.7.0-dev.3 — Unreleased placement and defaults refinement

- Place Toolkit immediately before resource Help (to its left).
- Enable only Copy, Paste Only and Paste & Execute by default in both editions.
  Existing saved preferences survive upgrades; Restore defaults selects the
  three-action baseline and requires Save & Reload to apply.
- Record the supplied dev.2 screenshot's environment and native dark UI evidence
  without treating it as a complete feature-acceptance campaign.

## 0.7.0-dev.2 — Unreleased toolbar placement correction

- Place Toolkit beside the selected resource's Help button, including the node
  toolbar with Shell/Bulk Actions. The previous selector incorrectly targeted
  global Documentation, which shares the Help component type.
- Recover placement when navigation replaces the resource toolbar. Exclude
  global Documentation, hidden resources and modal Help.
- Advance both editions and the diagnostic probe from dev.1 to dev.2. Show the
  version in the native settings title and manager menu command. Settings persist.
- Correct the browser fixture to include both Documentation and resource Help,
  and test resource replacement. Live Firefox/PVE confirmation remains pending.

## 0.7.0-dev.1 — Unreleased configurable catalog

- Consolidate packaging to Toolkit and one Copy & Paste companion. Remove the
  individual development feature scripts; published assets are unchanged.
- Add persistent, origin-scoped settings with 22 Toolkit toggles, defaults,
  Save & Reload, a native settings button beside global Help and a manager fallback.
- Open native ExtJS settings directly from Toolkit; remove the floating launcher
  and intermediate home page. Keep enabled management reports on a Reports tab.
- Order console buttons Copy, Paste Only, Paste & Execute. Recover delayed header
  loading even with all features disabled, with no header timer after mounting.
- Implement scoped copy, retained-output search, review/edit/paste without Enter,
  opt-in embedded VM serial support, and explicit HTTPS origin/proxy-prefix support.
- Implement ten read-only management reports and Copy Task Report, with local
  JSON/CSV export, incomplete-data reporting, bounded GET requests and cancellation.
- Retain existing clipboard safeguards and stable evidence boundaries. Native
  Firefox/manager/PVE acceptance remains pending; no release is published.

## 0.6.0-dev.2 — Unreleased feature candidate

- Add Paste Only with the shared bounded input lifecycle and no appended Enter.
- Add exact retained-output export as UTF-8 text or literal fenced Markdown,
  generic UTC filenames, and bounded local download cleanup.
- Add explicit-refresh, allowlisted Diagnostics and four explained copy-only
  diagnostic recipes. No shell probing, automatic execution, or uploads.
- Generate Toolkit and six optional individual editions from one version;
  physically omit excluded extraction, clipboard and dispatch capabilities.
- Group utilities in a native Tools menu, coordinate all clipboard actions,
  cancel pending writes on teardown/lease loss, and preserve 500 ms recovery.
- Record local checks, review and manual acceptance separately. No release,
  publication, live browser acceptance, or expansion of stable 0.5.0 evidence.


## 0.6.0-dev.1 — Unreleased synchronized editions

- Generate Toolkit, Copy Console, and Paste & Execute from one shared source
  and one Toolkit-owned version manifest. Every edition carries the same
  release version even when its runtime is unchanged.
- Name the all-in-one file `proxmox-toolkit.user.js`. The development
  `proxmox-copy-console.user.js` is Copy-only; `proxmox-paste-execute.user.js`
  is Paste-only. Preserve historical assets and document migration.
- Omit excluded capability code from standalone outputs; Paste-only has no
  clipboard-write grants. Retain input/session validation and Copy policy.
- Coordinate pending actions across editions with an owned DOM token; refuse
  overlapping controls. Keep discovery per scan and resource lifetimes bounded.
  New live acceptance remains pending.
- Rename the existing repository to proxmox-toolkit and update links/origin.
  Verify old repository/source/release/download/Git URLs; keep the old name
  unused so redirects remain intact.

## 0.5.0 — 2026-11-01

- Promote the unchanged 0.5.0-rc.1 runtime to stable after the maintainer
  confirmed it works as intended within the accepted scope and explicitly
  approved stable 0.5.0 publication. Change only version/description metadata.
- Publish v0.5.0 as the latest stable GitHub Release with the installable
  userscript attached. Update installation, design, decisions, and test records
  for stable Toolkit. Preserve earlier tags/releases and evidence boundaries.
- Retain the maintainer's Firefox 159.0 (64-bit), Violentmonkey 2.50.0,
  Windows 11 workflow acceptance. Promotion does not expand the tested
  browser/manager or scenario coverage.
- Pass all 180 local tests and source/metadata/link/fixture/whitespace checks.
  Verify the normalized executable body is identical to the tested candidate.

## 0.5.0-rc.1 — 2026-11-01

- Promote the unchanged 0.5.0-dev.1 runtime to a release candidate after the
  maintainer reported extensive successful live testing and authorized a push.
  Change only userscript version/description metadata; preserve permissions,
  input safeguards, console targeting, and Copy behavior.
- Align candidate installation, design, decisions, test evidence, and follow-up
  documentation. Record the practical acceptance separately from automated
  tests. The reported environment is Firefox 159.0 (64-bit), Violentmonkey
  2.50.0, and Windows 11; Proxmox/package versions and per-scenario results
  were not supplied.
- Pass all 180 local tests, source/metadata/local-link checks, cached xterm
  fixture integrity verification, and whitespace checks under Node.js 24.18.0.
- Promote the candidate from `codex/toolkit-paste-execute` to main and publish
  v0.5.0-rc.1 as a GitHub prerelease with the installable userscript attached,
  following explicit maintainer approval. Stable 0.4.1 remains the latest
  stable release; its tag, assets, and historical evidence remain unchanged.

## 0.5.0-dev.1 — Unreleased Proxmox Toolkit candidate

- Adopt the maintainer-approved Proxmox Toolkit name; keep the repository URL,
  userscript filename, namespace, and existing grants during development.
- Add native Paste & Execute beside Copy for embedded node Shell/LXC consoles.
  Read clipboard text on activation, use the existing connected terminal, and
  paste followed by a separate Enter. Remove trailing line breaks; require
  bracketed-paste mode for multiline text/tabs; refuse unsupported input.
- Cancel pending input on expiry, navigation, teardown, or session changes.
  Serialize clipboard actions and never retry a submission automatically.
- Share paired toolbar cleanup and fixed feedback without changing Copy's
  extraction/write policy.
- Apply audit fixes: avoid reentrant ExtJS button destruction, share console
  discovery within each idle scan, centralize action presentation, and skip
  unchanged button updates. Cancel pending paste on observed ExtJS console
  hiding even if it returns between scans; release the temporary hide listener.
- Replace the fixed source-size ceiling with efficiency-focused review of
  repeated work, resource lifetimes, and justified complexity. Retain byte/hash
  reporting for candidate identity.
- Extend per-scan discovery reuse to pending-paste validation. Preserve fresh
  resolution after clipboard reading, after pasting, and on hide events. Add
  measured pending/hidden scan coverage and fail-closed discovery regressions.
- Add input/session/cancellation regressions and a documented name-migration,
  rollback, and live acceptance procedure. Firefox + Violentmonkey is primary.
  Live clipboard/Proxmox acceptance was pending at this development checkpoint;
  see 0.5.0-rc.1 for the subsequent maintainer report. 0.4.1 remains stable.

## 0.4.1 — 2026-09-19

- Preserve the runtime of live-tested `0.4.1-dev.1` at `6d803b0946af66c021bc9999cfdce292de750120`; only userscript version/description metadata changes for promotion.
- Record maintainer-reported practical passes with Firefox and Chrome, each using Violentmonkey and Tampermonkey. The final Firefox/Tampermonkey candidate check closes the earlier version gap; exact versions and detailed evidence limits remain in [Testing](docs/TESTING.md).
- Focus ongoing acceptance on those four combinations. Keep additional managers deferred and unrelated PVE browser notices outside the script's scope. Promoted to main after maintainer review and explicit approval. Tag/GitHub Release publication is separate from this source promotion.

## Earlier development — 0.4.1-dev.1

- Address FireMonkey's observed rejection of sandbox callbacks passed to page-owned array `filter`/`some` methods by using local loops for anchor counting and duplicate-button checks.
- When available, use Firefox `exportFunction` for no-argument/no-return handlers and clone configuration data separately. Preserve the existing clone-functions path for managers without that API.
- Keep the shared script, permissions, clipboard behavior, and installation scope. Add regression cases for strict callback boundaries and export failure containment. Operator reports cover Firefox/Violentmonkey, Firefox/FireMonkey, Firefox/Greasemonkey, and both primary Chrome managers; preserve exact-version and scenario limits in [Testing](docs/TESTING.md). Stable 0.4.0 is unchanged on main.

## 0.4.0 — 2026-09-19

- Promote the unchanged runtime from `0.4.0-dev.2` after the maintainer reported successful live copy/paste across several node Shell and LXC consoles, with expected text detail and correct current-console targeting.
- Promotion changes the version and release description only; no copying behavior, permissions, dependencies, or installation scope changes.
- Retain explicit evidence limits: this is a maintainer-reported workflow acceptance, not completion of the full browser/manager and edge-case matrix. See [Testing](docs/TESTING.md) for the report and remaining checks.

## Earlier development — 0.4.0-dev.2 (unreleased)

- Target current stable Proxmox VE, Chrome, and Firefox; document a ten-app survey and nine browser/manager test combinations, with all live results pending.
- Add modern `GM.setClipboard` / `GM.info` capability support while retaining legacy manager APIs. Never retry a failed write through a second API.
- Add Firefox configuration/callback sharing when `cloneInto` is available; shared callbacks do not return privileged objects.
- Use a portable include glob with a runtime HTTPS/8006/top-frame guard and document trusted-host restrictions.
- Add a separate read-only manager-context probe and compatibility regression coverage. Keep one dependency-free userscript; no manager-specific forks or native clipboard fallback.

## Earlier development — 0.4.0-dev.1 (unreleased)

Development implementation only; live Proxmox/browser/userscript-manager acceptance is outstanding. The documented 0.3.0 baseline remains at commit `27a83d2ac836ef35c2f7e6644b6e448355631be0`.

- Associate each Copy button with its own console owner and exact node/type/guest identity; refuse ambiguous frames and unsupported remote consoles.
- Discover native console controls by component type instead of English labels.
- Catch extraction/integration failures, clean up partial controls, and rate-limit integration warnings without logging terminal content or raw errors.
- Preserve Unicode whitespace and omit xterm's empty last-column placeholder when a wide glyph wraps; retain the existing ASCII-padding policy.
- Distinguish clipboard completion from legacy unconfirmed dispatch, handle promises/callbacks/errors/timeouts, and prevent overlapping copy requests.
- Show normal/alternate buffer scope, replace feedback timers, disable unavailable controls, and conservatively restore terminal focus.
- Skip hidden-page discovery and rescan on visibility return; retain 500 ms periodic recovery.
- Add dependency-free Node checks, regression fixtures, a pinned real-xterm probe, a read-only live diagnostic, and CI configuration.
- Add editor/line-ending conventions and trusted-host installation guidance. No runtime dependencies or automatic update URLs were added.

## 0.3.0 — Documented baseline

- Added a native ExtJS **Copy** button for supported Proxmox xterm consoles.
- Supported node **Shell** and LXC **Console** toolbar integration.
- Added visible xterm discovery with fresh rediscovery to tolerate navigation, reconnects, and recreated console instances.
- Copied the full retained normal buffer, including scrollback.
- Reconstructed xterm wrapped physical rows into logical text lines.
- Used the active alternate buffer when an alternate-screen application is active.
- Preserved stable **Copy** button text while using icon and tooltip changes for brief feedback.
- Used native ExtJS layout behavior rather than split-button or custom layout behavior.
