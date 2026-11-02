# Changelog

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
