# Open loops

Local **0.8.0-dev.1** implements the operator-authorized five-report expansion;
see [scope and acceptance](EXPANSION-0.8.md). All new reports default off. Local
verification is recorded separately from live qualification and publication.
The operator requires approval before GitHub push; stable 0.7.0 remains published.

Stable **Proxmox Toolkit 0.7.0** promotes the maintainer-tested 0.7.0-dev.8
runtime after explicit stable promotion approval on 2026-11-02. Both Toolkit
and Copy & Paste share the release version. Detailed qualification remains
separate from practical workflow acceptance. Historical 0.5.0 is preserved.
The reported Toolkit environment is Firefox 159.0 (64-bit), Violentmonkey
2.50.0, and Windows 11. Earlier 0.4.1 copy-only reports cover four primary
browser/manager combinations; they do not qualify Toolkit input elsewhere.
[Testing](TESTING.md) separates historical, automated, and live evidence.
[Decisions](../DECISIONS.md#product-scope-and-simplicity) governs additions.

## Remaining and conditional work

IDs are retained for continuity. These are evidence gaps or conditional ideas, not a requirement to complete everything before using the script.

| ID | State | Follow-up and completion criterion |
| --- | --- | --- |
| OL-16 | Local five-report expansion; verification and live evidence tracked separately | Complete the [0.8 acceptance criteria](EXPANSION-0.8.md), record actual local checks in the development checkpoint, and collect operator live observations for the installed PVE APIs, report contents, baselines and exports. Do not treat stable 0.7.0 acceptance as a pass for the new reports. GitHub push requires operator approval. |
| OL-12 | Stable 0.7.0 approved; detailed live qualification open | Record remaining Toolkit and Copy & Paste observations using the [catalog campaign](CATALOG-ACCEPTANCE.md), especially report permissions/results, actual clipboard/file contents, serial/proxy, migration and lifecycle cases. Maintainer practical acceptance authorizes release; it does not mark the full checklist passed. |
| OL-02 / OL-03 | Practical passes complete; detailed evidence optional | At the next relevant Firefox/Chrome test, record exact versions and per-scenario clipboard comparisons. Close full qualification only with the detailed observations in Testing; do not repeat the accepted campaign just to fill a table. |
| OL-04 | Compatibility fix released; extended testing deferred | FireMonkey callback fix is in 0.4.1; reported FireMonkey/Greasemonkey results are preserved. Reopen extended-manager testing only for a requested target or a concrete copying defect. No manager-specific fork is currently needed. |
| OL-05 | Package evidence pending | Record installed console package versions and compare with the pinned xterm fixture. Add or refresh a fixture only when an observed package/API difference warrants it; close with comparison and relevant regression evidence. |
| OL-06 | Duplicate idle/pending polling work removed; browser profiling conditional | October 16 mock instrumentation confirms one component query per scan and one frame search per visible console, both idle and pending a clipboard read; hidden-page ticks do no discovery. Timer/listener counts stay bounded; see [Testing](TESTING.md). These counts do not establish browser CPU/latency gains. Keep the 500 ms interval; profile browser cost only after a reported issue or before making timing claims. |
| OL-07 | Settings and explicit custom origins implemented; live migration pending | Verify manager host rules, custom port/path setup and persistence using the catalog campaign. No default permission broadening. |
| OL-08 | Scoped Copy implemented; live acceptance pending | Viewport clips wrapped edges; last-N uses logical retained lines. Validate actual clipboard contents and native panel behavior. |
| OL-10 | Deferred: environmental UI errors | If the earlier Firefox exceptions recur, reproduce identical navigation in a clean profile, then isolate extensions/preferences. Close with a demonstrated cause or inability to reproduce; keep unrelated Proxmox fixes outside this script. |
| OL-13 | Proposal only: configurable Tools-menu grouping | Review the grouped/inline preference proposal before implementing it. Existing grouping is unchanged by stable promotion. |
| OL-14 | Proposal only: versioned handoff copies | Decide whether versioned handoff files would help review. No change to Codex review controls is established or authorized by this proposal. |
| OL-15 | Local checkout housekeeping | Use `E:\Proxmox Toolkit` for ongoing work; it is the former `E:\Citadel\proxmox-toolkit` checkout, relocated by 2026-11-08. The old `E:\Citadel\proxmox-copy-console` folder still exists. Verify it holds no unique work and close old-folder tasks before any separately authorized removal. The linked review worktree at `.cache/ol-01-review` was repaired for the new root on 2026-11-08; do not prune it. |

## Routine maintenance

- Generate both editions from shared source and one manifest version. Run build,
  static/link, pinned-fixture and Node checks for changes; use the synthetic
  ExtJS browser fixture for affected UI behavior and collect live evidence where
  browser/manager or Proxmox behavior matters.
- Keep install/release links, migration and rollback instructions, asset hashes,
  and the evidence register aligned with each release. Never reuse the old
  GitHub repository name while its redirect is needed.
- Revisit pinned Proxmox/xterm/ExtJS fixtures when installed package differences
  or defects justify it. Preserve clipboard safeguards and review idle work,
  timer/listener lifetimes and cancellation when changing runtime behavior.

## Catalog implementation

The maintainer authorized the remaining six ideas and ten management tools on
2026-11-02, then consolidated packaging to Toolkit plus Copy & Paste.
Scoped Copy, Find in Scrollback, Review & Paste, VM serial support, Copy Task
Report, and custom HTTPS/proxy support are implemented as opt-in Toolkit features.
The ten management tools and all existing actions have individual toggles. See
[catalog](CATALOG.md) and [development](CATALOG-DEVELOPMENT.md).

The evidence-only and conditional entries above remain open: local implementation
cannot supply installed package versions, live clipboard/browser acceptance,
production profiling or reproduction of an absent environmental error.

## Completed

- **OL-11:** Paste & Execute implementation, local review, maintainer practical
  acceptance, main promotion, and stable 0.5.0 publication authorized. The
  maintainer explicitly accepts the feature within its scope. Runtime is
  unchanged from the tested development candidate; only release metadata
  changes. Detailed platform/scenario and other-manager qualification remain
  evidence gaps in Testing, not a requirement to repeat the accepted campaign.
- **OL-01:** Bounded callback/clipboard/lifecycle review completed with no runtime change; independent review and 82 tests passed at that historical checkpoint.
- **OL-09:** 0.4.0 promotion completed. Stable tags, release notes, and userscript assets for both [0.4.0](https://github.com/StarlightDaemon/proxmox-copy-console/releases/tag/v0.4.0) and [0.4.1](https://github.com/StarlightDaemon/proxmox-copy-console/releases/tag/v0.4.1) are preserved; stable 0.5.0 supersedes them as Latest.
- README simplified; copy/paste installation and port guidance published.

The [archived register](historicals/OPEN-LOOPS.md) preserves the original ownership notes, completed OL-01 handoff, review evidence, and earlier release blockers. Those blockers and assignments are historical.

## Taking an item

Claim one ID with a task/agent reference and starting commit. Read AGENTS.md and the relevant current docs, define a bounded outcome, and preserve unrelated files. An entry does not authorize implementation, live-system access, or publication.

Return the finding or patch, checks actually run, limitations, and a proposed status. A reviewer verifies the evidence before closing the item. Keep source inspection, mocked execution, parser tests, CI, and live clipboard acceptance distinct. Do not invent missing versions, expand scope to every item, or treat an old review proposal as an unimplemented feature.
