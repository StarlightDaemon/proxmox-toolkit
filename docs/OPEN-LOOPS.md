# Open loops

Stable 0.4.1 is released with reported copy-only practical passes in the four
primary browser/manager combinations. The maintainer subsequently authorized
**Proxmox Toolkit** and Paste & Execute development, then reported successful
live testing of 0.5.0-dev.1 on 2026-11-01 and authorized pushing 0.5.0-rc.1.
[Testing](TESTING.md) separates historical evidence from candidate acceptance.
[Decisions](../DECISIONS.md#product-scope-and-simplicity) governs additions.

## Remaining and conditional work

IDs are retained for continuity. These are evidence gaps or conditional ideas, not a requirement to complete everything before using the script.

| ID | State | Follow-up and completion criterion |
| --- | --- | --- |
| OL-11 | Practical acceptance received; release candidate authorized | The maintainer reports extensive successful live testing of 0.5.0-dev.1 and authorizes pushing 0.5.0-rc.1 on `codex/toolkit-paste-execute`. Preserve the tested runtime; promotion changes version/description metadata only. See the [current checkpoint](TOOLKIT-DEVELOPMENT.md) and [evidence limits](TESTING.md#maintainer-reported-live-acceptance--2026-11-01). The reported environment is Firefox 159.0 (64-bit), Violentmonkey 2.50.0, and Windows 11. Proxmox/package versions and per-scenario results were not supplied. Detailed Firefox + Violentmonkey qualification, other-manager evidence, and stable promotion remain separate follow-ups; do not infer individual passes from the broad acceptance report. |
| OL-02 / OL-03 | Practical passes complete; detailed evidence optional | At the next relevant Firefox/Chrome test, record exact versions and per-scenario clipboard comparisons. Close full qualification only with the detailed observations in Testing; do not repeat the accepted campaign just to fill a table. |
| OL-04 | Compatibility fix released; extended testing deferred | FireMonkey callback fix is in 0.4.1; reported FireMonkey/Greasemonkey results are preserved. Reopen extended-manager testing only for a requested target or a concrete copying defect. No manager-specific fork is currently needed. |
| OL-05 | Package evidence pending | Record installed console package versions and compare with the pinned xterm fixture. Add or refresh a fixture only when an observed package/API difference warrants it; close with comparison and relevant regression evidence. |
| OL-06 | Duplicate idle/pending polling work removed; browser profiling conditional | October 16 mock instrumentation confirms one component query per scan and one frame search per visible console, both idle and pending a clipboard read; hidden-page ticks do no discovery. Timer/listener counts stay bounded; see [Testing](TESTING.md). These counts do not establish browser CPU/latency gains. Keep the 500 ms interval; profile browser cost only after a reported issue or before making timing claims. |
| OL-07 | Installation guidance updated; monitor actual friction | Copy/paste is now the primary install path, with host restrictions and a custom-port note. Revisit defaults only for recurring setup problems; do not broaden permissions or add settings speculatively. |
| OL-08 | Idea, not planned | Viewport-only copying needs a recurring workflow need before design work. Define scrolled-viewport semantics, wrapped edges, accessibility, and maintenance cost before considering implementation. |
| OL-10 | Deferred: environmental UI errors | If the earlier Firefox exceptions recur, reproduce identical navigation in a clean profile, then isolate extensions/preferences. Close with a demonstrated cause or inability to reproduce; keep unrelated Proxmox fixes outside this script. |

## Completed

- **OL-01:** Bounded callback/clipboard/lifecycle review completed with no runtime change; independent review and 82 tests passed at that historical checkpoint.
- **OL-09:** 0.4.0 promotion completed. Stable tags, release notes, and userscript assets for both [0.4.0](https://github.com/StarlightDaemon/proxmox-copy-console/releases/tag/v0.4.0) and [0.4.1](https://github.com/StarlightDaemon/proxmox-copy-console/releases/tag/v0.4.1) are published; 0.4.1 is Latest.
- README simplified; copy/paste installation and port guidance published.

The [archived register](historicals/OPEN-LOOPS.md) preserves the original ownership notes, completed OL-01 handoff, review evidence, and earlier release blockers. Those blockers and assignments are historical.

## Taking an item

Claim one ID with a task/agent reference and starting commit. Read AGENTS.md and the relevant current docs, define a bounded outcome, and preserve unrelated files. An entry does not authorize implementation, live-system access, or publication.

Return the finding or patch, checks actually run, limitations, and a proposed status. A reviewer verifies the evidence before closing the item. Keep source inspection, mocked execution, parser tests, CI, and live clipboard acceptance distinct. Do not invent missing versions, expand scope to every item, or treat an old review proposal as an unimplemented feature.
