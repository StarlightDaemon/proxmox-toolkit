# Toolkit 0.8 expansion

## Scope and authority

The operator authorized cataloging, refining, planning, implementing and locally
verifying all five additions on 2026-11-02. The working candidate is
**0.8.0-dev.1**, based on clean `main` at
`5dbe558f0857cc010a5f76d0987dc3aedeb6e7f8` in
`E:\Citadel\proxmox-toolkit`; that checkout, with the uncommitted candidate,
now lives at `E:\Proxmox Toolkit` (observed 2026-11-08). Published stable **0.7.0** remains the rollback
release. Local implementation does not publish a new release. The operator
explicitly requires approval before any GitHub push; no remote update, merge,
tag or release is authorized by this development request.

## Refined catalog

All five additions default off. Toolkit has 27 toggles; Copy & Paste retains
three. Both generated editions use the same candidate version. The existing
six categories accommodate these reports without another navigation tab.

| ID | Feature / category | First-version outcome | Deliberate boundary |
| --- | --- | --- | --- |
| CAPACITY | Capacity & Headroom / Inventory | Review selected guest allocations, current host consumption, sampled historical node/storage usage and a configurable reserve. | No automatic placement, guaranteed spare capacity, or addition of shared-storage copies into a misleading total. |
| DRIFT | Cluster Configuration Changes / Inventory | Export an allowlisted cluster baseline and compare a later collection against an imported baseline; show guest, network and storage changes. | No background history, author attribution, automatic rollback or inference that an invisible resource was deleted. |
| SUPPORT | Troubleshooting Bundle Builder / Troubleshooting | Choose evidence sections, describe symptoms and reproduction, review assisted redaction, and export a local Markdown or JSON handoff. | No upload, automatic support submission, raw credential collection or promise that arbitrary text is secret-free. |
| FIREWALL | Firewall Visibility & Rule References / Troubleshooting | Review cluster/node/guest settings and rules, referenced groups, aliases and IP sets within the visible scope. | Configuration evidence does not prove actual packet filtering; no rule editing or backend-independent packet simulation. |
| UPDATES | Update Readiness & Version Consistency / Maintenance | Compare package versions, running kernels, local-index update candidates and repository summaries across visible nodes. | No package-index refresh, installation, repository edits or reboot; a kernel difference is evidence for review, not an unconditional instruction. |

## Implementation plan

1. Extend the registry and synchronized manifest; retain three enabled defaults,
   existing settings keys, grants, host restrictions and two-edition packaging.
2. Add focused model fragments for capacity/updates, drift/firewall and support
   bundles. Reuse the bounded GET collector, per-run cache and cancellation.
3. Add report-specific form inputs and exports to the native report workspace.
   Keep Back, Return to Proxmox, drafts, literal text rendering and cleanup.
4. Exercise numerical and missing-data behavior, baseline validation, reference
   expansion, secret omission/redaction, transport constraints and exports with
   automated regressions. Exercise navigation and layout in the synthetic browser.
5. Regenerate both userscripts, run all relevant checks, inspect the final diff,
   and record exact local results in the development checkpoint. Leave release
   approval and live acceptance separate.

## Shared implementation constraints

Reports start only after explicit activation. Enabling a toggle or opening its
form does not collect data. They use the authenticated same-origin PVE browser
session and the existing bounded GET client: at most three concurrent requests,
15 seconds per request, 8 MiB per response, 32 MiB overall, 400 requests and a
120-second scheduling window. Existing node/guest caps and issue reporting apply.
Closing, navigation and hidden-page handling cancel collection. No new idle
polling, cross-origin permission, server agent or runtime dependency is added.

Partial or denied data remains unknown. Historical RRD values are consolidated
samples; their peaks are not unsampled instantaneous maxima. Resource allocation,
host consumption and observed workload demand remain separate. Imported baseline
data is untrusted and validated before comparison. Comparing different visibility
or selection scopes must not imply deletion or an unchanged complete cluster.
VMIDs are reusable and alone cannot prove historical guest identity.

Reports and baselines are held in memory until closed. A user-requested download
is a separate retained artifact. Baseline import accepts files under 4 MiB and
also enforces a conservative UTF-16 content budget, depth and entry limits; a
smaller encoded file can still exceed that in-memory budget. Support bundles
offer Markdown/JSON downloads, with no bundle clipboard action. Support
redaction is assisted: preview and edit
the output before sharing; labels are useful for correlating evidence but do not
make arbitrary logs anonymous. Package candidates come from the node's existing
index and do not establish that repositories were refreshed recently.

## Acceptance criteria

| Area | Automated or synthetic checks | Separate live observations |
| --- | --- | --- |
| Catalog / edition | 27 Toolkit settings, three enabled defaults, correct categories, all new code omitted from Copy & Paste, synchronized candidate version. | Existing manager settings survive replacement; each report is reachable in Firefox + Violentmonkey. |
| Capacity | Finite values, missing samples, selected guest totals, reserve calculations, shared-storage handling, bounded RRD calls and incomplete evidence. | Compare displayed quantities/units and timeframes with the same PVE node/storage views; inspect the saved export. |
| Changes | Export/import round-trip, invalid/oversized baselines (4 MiB file cap plus conservative content budget), missing/denied resources, migrated/reused VMID uncertainty, secret omission and scope mismatch. | Export a baseline, make one operator-controlled scratch configuration change through PVE, and confirm the precise difference. |
| Support | Selected-section collection, seeded secret omission, consistent replacements, user-edited preview, safe Markdown/JSON output and disposal. | Inspect downloaded bytes and confirm review choices survive export; manually assess sensitive fields before any sharing. |
| Firewall | Unknown settings, rule/group references, unavailable groups, bounded repeated references and literal rendering. Default guest cost is three reads (firewall options, rules, configuration); guest aliases/IP sets only when requested and marked `not requested` otherwise. | Compare collected configuration with native PVE views for the installed backend and permission level; no packet verdict inferred. |
| Updates | Missing package/repository data, version differences, kernel review evidence and no update/reboot transport. | Compare package and repository summaries with each node's native views; record index freshness separately. |
| Lifecycle | Lazy collection, cancellation, late-result refusal, repeated report cleanup, narrow layouts and underlying console preservation. | Confirm the actual PVE theme/workspace and userscript-manager lifecycle. |

## Verification record

All five implementation steps are complete locally. **435 Node tests passed**
with no failures, cancellations or skips. Deterministic generation, static/link,
metadata/version, pinned cached xterm and whitespace checks passed. The real
ExtJS/Chrome synthetic fixture passed all five collections and cancellations,
baseline import/export and scope rejection, edited support export bytes,
component cleanup, preserved console and narrow layouts. Screenshots were
inspected. The [development checkpoint](TOOLKIT-DEVELOPMENT.md) records commands,
artifact identities and limitations from actual execution. Earlier
0.7.0 results are historical evidence, not proof of this candidate. No live PVE,
clipboard, saved-file or broad browser acceptance is implied by local fixtures.

## Research basis

The additions extend the existing [catalog](CATALOG.md). Community examples
support their usefulness but do not measure adoption:

- [Capacity-planning and memory-reporting discussion](https://forum.proxmox.com/threads/windows-vm-high-memory-consumption-and-host-memory-reporting-discrepancy.186904/).
- [Request to track configuration evolution](https://forum.proxmox.com/threads/tracking-pve-qemu-vm-configuration-drift-evolution-over-time.185020/).
- [Troubleshooting report with manually replaced customer information](https://forum.proxmox.com/threads/firewall-not-matching.46671/).
- [Firewall configuration confusion](https://forum.proxmox.com/threads/firewall-not-working-on-vm-with-firewall-1-on-nic-and-fw-on-in-firewall-options.24242/).
- [Multi-node maintenance workflow discussion](https://forum.proxmox.com/threads/optimize-maintenance-process.175816/).

Upstream API implementations provide the feasibility reference for
[node statistics](https://github.com/proxmox/pve-manager/blob/master/PVE/API2/Nodes.pm),
[package/repository information](https://github.com/proxmox/pve-manager/blob/master/PVE/API2/APT.pm)
and [firewall configuration](https://github.com/proxmox/pve-firewall/blob/master/src/PVE/API2/Firewall/Cluster.pm).
Installed API behavior still requires live qualification.
