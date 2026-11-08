# Toolkit catalog and settings

This guide describes local **0.8.0-dev.1**, with 27 Toolkit toggles. The five
new reports and their limits are detailed in the [expansion plan](EXPANSION-0.8.md).
Published stable **0.7.0** remains available with its 22-toggle catalog and
maintainer-accepted workflow. New runtime behavior has not inherited that live
acceptance. The [acceptance record](CATALOG-ACCEPTANCE.md) preserves stable
evidence; the [development checkpoint](TOOLKIT-DEVELOPMENT.md) records candidate
verification. No candidate publication is authorized without operator approval.

## Install and select features

Install [Toolkit](../proxmox-toolkit.user.js) for the complete catalog, or
[Copy & Paste](../proxmox-copy-paste.user.js) for just Copy, Paste & Execute and
Paste Only. Disable old individual scripts and keep only one edition enabled.
Apply an exact trusted HTTPS host rule in the manager before loading either.

Click **Toolkit** immediately to the left of **Documentation** in the global
top bar. Click again, or choose **Return to Proxmox**, to restore the underlying
view. The versioned native panel fills the main content region, including the
resource toolbar and its local navigation. The server tree, global top bar and
Tasks / Cluster log remain visible and usable. The panel follows region resizing
and uses the installed Proxmox theme. Copy & Paste has a similarly placed named
button. There is no modal backdrop or intermediate home page. The manager extension's
**Toolkit settings** command also opens Settings, including when all features
are disabled. Settings are stored by the manager per edition and browser origin;
they are not synchronized between cluster-node URLs or devices by this script.

Toggling Toolkit preserves the existing view and mounted console underneath;
it does not reload the iframe or reconnect its socket. The covered view cannot
receive mouse/keyboard input. Opening Toolkit cancels pending clipboard intent;
already-dispatched clipboard writes cannot be undone. Selecting a resource exits
Toolkit and follows normal Proxmox navigation, which may replace that console.
**Save & Reload** remains an explicit full page reload. Network/session failures
can still disconnect a console independently of Toolkit.

Toolkit initially enables only **Copy, Paste Only and Paste & Execute**.
The other twenty-four features default off. Copy & Paste enables the same three.
Existing saved selections are preserved on upgrade. To adopt this baseline for
an existing installation, choose Restore defaults, then Save & Reload. Check or uncheck features, then **Save & Reload**.
Restore defaults changes the form only until saved. Preferences survive updates
of the same manager entry. Unknown feature IDs are ignored; new Toolkit features
remain off. A failed settings load or unknown schema leaves features inactive
until settings are saved. Failed saves do not apply changes or reload.

Disabled features have no active console controls or feature-specific requests/work.
Report launch buttons remain visible but disabled in Settings. With every
console action disabled there is no console recovery interval or console discovery.
A separate startup retry finds the resource toolbar even when all features are off; it stops
once mounted, pauses while hidden, and recovers when navigation destroys the old toolbar button.
The installed code and declared grants remain in the all-in-one file. Settings
remain reachable; reports are never collected just by enabling their toggle.

Console buttons appear left to right as **Copy → Paste Only → Paste & Execute**,
omitting disabled actions. Other console utilities remain in **Tools**.

Every report has a fixed native footer with **Back to Toolkit** and **Return to Proxmox**.
Back returns to the report's category tab and restores unsaved settings; Return restores the underlying Proxmox view and discards the unsaved draft.
Both cancel active collection and discard the open report. Download results
before leaving if you want to keep them. Navigation does not save feature
changes, reload the page or run another report. The footer remains outside the
scrolling report content, including after long Inventory or Maintenance results.

## Category navigation

Toolkit has six top tabs: **Console**, **Inventory**, **Recovery**,
**Troubleshooting**, **Maintenance**, and **Integration**. Diagnostics and Recipes
are under Troubleshooting; their console actions still live in Tools. Copy &
Paste has only Console. Report launch buttons sit beside their toggles.

Settings use compact cards in two columns when space permits. Tabs wrap on
narrower panels; Previous/Next pages keep the settings list within the available
height. Restore defaults, Return to Proxmox and Save & Reload remain docked.
All categories share one draft. Switching tabs/pages or returning from a report
preserves it, including an unfinished proxy prefix. Leaving Toolkit discards the
draft. Saving applies all categories, including options on other pages.
Report availability follows saved settings until Save & Reload; opening a report
never saves the draft or starts collection. Long report results still scroll.

## Console and integration features

| Toggle | Action and limits |
| --- | --- |
| Copy | Existing exact retained-buffer extraction and clipboard contract. |
| Paste & Execute | Existing validated paste plus separate Enter. |
| Paste Only | Existing validated paste, without appending Enter. |
| Console Export | Existing text/Markdown snapshot download. |
| Toolkit Diagnostics | Existing allowlisted console-integration report. |
| Diagnostic Recipes | Existing four fixed, explained copy-only commands. |
| Scoped Copy | Tools menu: copy the current viewport or last 1–10,000 logical lines. Viewport joins wraps inside visible edges, with no expansion beyond those edges. A clipped first/last line is intentionally partial. |
| Find in Scrollback | Tools menu: case-insensitive literal search of a captured retained-output snapshot, Previous/Next results and logical line numbers. Maximum 500 matches; query up to 1,024 characters. Reopen for newer output. No regex or terminal-output observer. |
| Review & Paste | Tools menu: read clipboard on activation, edit in a native panel, then Paste reviewed text. No Enter appended. Uses the existing validation/lease/session rules and no automatic retries. The editor expires after five minutes and closes on hide, navigation or observed session replacement. It clears after successful dispatch. Multiline text is not a guarantee against execution by the active program. |
| VM serial consoles | Permit the existing console actions in owned embedded `kvm` xterm frames with the exact node and VMID. Requires an already configured serial console; does not configure a VM. noVNC, SPICE, standalone windows and PDM remote consoles remain excluded. |
| Custom HTTPS origin / proxy path | Permit an explicitly included non-8006 HTTPS origin, or a same-origin proxy prefix such as `/pve/`. No default host broadening and no cross-origin iframe access. Requires separate acceptance of the actual proxy layout. |

For custom origins, replace the manager's include rule with the exact desired
HTTPS origin/path. Visit it, use the manager Settings command, enable the custom
origin toggle, set the path prefix if needed, and save/reload. Prefixes must begin
and end with `/` and contain only simple path segments. Standard PVE uses `/`.
The lightweight Copy & Paste edition targets HTTPS/8006; custom origins and serial
support belong to Toolkit. The [Usage guide](USAGE.md) retains detailed existing
console behavior and clipboard uncertainty limits.

## Management reports

Open the relevant Toolkit category and choose **Open report** beside its setting.
Newly selected toggles require Save & Reload before their report buttons activate.
Leave node and guest-ID filters blank for all visible resources, then **Run report**.
An explicit node narrows collection; a misspelled or inaccessible node produces
an error rather than broadening the report. Configuration Compare needs two
guest IDs (or one plus a baseline). Copy Task Report needs a complete UPID and
can infer its node. These requirements are shown before collection. Guest IDs are comma-separated. **Cancel collection**,
closing the dialog, navigation, and hiding the tab abort outstanding requests.
Rerunning collects a fresh snapshot. No background report refresh runs.

Results have collection time, selection, issues, and explanatory notes. Filter
rows and choose CSV columns. The table renders at most 500 rows; CSV contains all
matching collected rows. JSON contains the complete collected report. Downloads
are local browser requests, not proof of a saved file. Spreadsheet formula-like
CSV strings are neutralized with a leading apostrophe. Open guest uses PVE's
native resource selection when that integration is available.

| Toggle | Implemented outcome |
| --- | --- |
| Inventory & Report Builder | Guest identity/status/tags, configured CPU/memory, observed CPU/memory, disk and network configuration, filterable/exportable. Unreadable configuration stays null. |
| Guest Configuration Compare | Enter two guest IDs to compare current configurations, or one ID plus a prior Toolkit JSON configuration export. Expected name/MAC differences can be ignored. Pending settings are listed separately. Credentials, free-form descriptions, hooks and arbitrary command arguments are omitted; baseline exports use an allowlist. |
| Backup Coverage & Recovery Gaps | Join visible jobs, visible backup-storage content, guest backup exclusions and recent visible guest-specific backup tasks. Bind/device mounts are identified. Backup presence, job coverage and task outcome are separate; restoration and PBS verification remain unknown. Reused VMIDs can refer to earlier guests. Pool membership or unfamiliar selection rules may prevent coverage determination. |
| Task Failure Investigator | Query finished/active tasks across visible nodes, optionally by guest, type, failures and 1–3,650-day window. Maximum 500 tasks per node; narrow the window when the limit is reached. Retention/permission gaps and multi-guest backup tasks with no VMID limit the timeline. |
| Copy Task Report | Enter an exact UPID; its owning node is detected automatically unless supplied explicitly. Then collect status and up to 5,000 log lines. Error/failure lines are flagged. Copy the reviewable report using the shared clipboard contract, or download it. Task Investigator links to this tool when its toggle is enabled. Review logs for sensitive information before sharing. |
| Snapshot Age & Review Ledger | Cluster guest snapshot names, descriptions, parents and age, with a chosen review threshold. Excludes the pseudo-snapshot `current`. Does not delete snapshots or estimate reclaimed space. |
| Storage Reference & Unused-Disk Inspector | Compare visible volume inventories to visible current guest configurations; show attached, explicitly unused and no-visible-reference classifications, plus parent volume metadata. Local and shared references are handled separately. Snapshot/linked-clone/template/external/hidden references are not exhaustively resolved: no row is labeled safe to delete. |
| Node Maintenance Preflight | Blank Node assesses every visible node independently, including guestless nodes; enter a node to narrow the report. A per-node summary separates unknown checks from empty results. Inspect HA membership/status, cluster state, active tasks, visible backup artifacts, local/unknown storage dependencies, passthrough and other nodes' observed memory. Provides evidence for native migration checks, not a plan to take every node offline simultaneously; does not move or reboot anything. Per-node details are included in JSON; CSV contains guest findings. |
| Network Path Explorer | Expand guest NIC → bridge → bond/VLAN → interface paths. Show configured MTU/VLAN data and a per-node interface comparison, including nodes with no visible guests. Cycles and unknown upstream interfaces are explicit. Physical switch topology, actual connectivity and complete OVS/SDN behavior are outside this view. |
| Guest Integration Health Check | QEMU agent configuration and pending settings. Optional responsiveness checkbox performs a read-only guest-agent network-information request for running VMs with the agent enabled. It never calls guest-exec, ping POST, shutdown, freeze or trim. Configured, responding and unavailable are distinct. |
| Recovery Manifest & Rebuild Checklist | Allowlisted guest hardware/startup configuration, storage/network configuration, HA and resource mappings, plus recovery prerequisites. Omits credentials and arbitrary text. This is documentation, not a host backup or executable restore plan; actual files, keys, backups, firewall and external infrastructure still need preservation. |

## Added 0.8 reports

These five reports are available only in the development candidate. Select their
toggles, Save & Reload, then open the report beside the setting. Collection is
explicit and obeys the same scope, cancellation and permission limits above.

| Toggle / category | Workflow and limits |
| --- | --- |
| Capacity & Headroom / Inventory | Review selected guest configured allocations, current node consumption and sampled node/storage RRD history. Choose a historical timeframe and reserve percentage. Reserve headroom is an estimate for review, not guaranteed placement capacity; shared storage must not be summed once per observing node. |
| Cluster Configuration Changes / Inventory | Collect an allowlisted configuration baseline, download it, and import a prior baseline for a later comparison. Covers guest configuration, node networking and storage definitions. Unknown or no-longer-visible resources are not proven deletions; VMID reuse can make identity uncertain. No automatic history or rollback. |
| Troubleshooting Bundle Builder / Troubleshooting | Select evidence sections and optionally a task, add symptoms and reproduction notes, review assisted replacements and the final preview, then download Markdown or JSON. Evidence stays local; no upload or support submission occurs. Review arbitrary text for secrets before sharing. |
| Firewall Visibility & Rule References / Troubleshooting | Review visible enablement settings, policies, ordered rules and group/alias/IP-set references. Inspect where groups are used. Cluster aliases and IP sets are always collected; guest-level aliases and IP sets are opt-in (Include guest aliases and IP sets) because they add two or more requests per guest. These are configuration observations, not a promise about packet filtering or a replacement for backend-specific troubleshooting. |
| Update Readiness & Version Consistency / Maintenance | Compare installed package versions, running kernels, available candidates from the local package index, and repository summaries. Index freshness may be unknown. Kernel differences are review evidence; the report does not refresh repositories, install packages or reboot nodes. |

Download baselines deliberately and keep them with the change record you intend
to compare. Import only the intended cluster/origin, API proxy prefix and identical scope. Report
exports may contain internal identities even when credential fields are omitted.
The bundle's assisted redaction helps review but does not certify anonymity.
Baseline files must be under 4 MiB and also pass conservative in-memory content,
depth and entry limits. Support bundles offer local Markdown and JSON downloads;
there is no bundle clipboard action.

## Data and efficiency boundaries

Requests are same-origin GETs using the existing authenticated browser session.
No API tokens are requested or saved, and no cross-origin network grant is added.
Three requests run concurrently at most. Each request has a 15-second deadline
and an 8 MiB response limit; collection has a 32 MiB total response budget and a
400-request / 120-second scheduling
budget. Guest inventory is capped at 2,000 and node discovery at 100. These are
partial-report limits, not proof of full cluster coverage. In-flight requests may
finish after the scheduling deadline, within their own deadlines.

401/403, timeouts, disabled storage, missing data and caps produce issues or
unknowns. Permission filtering can silently hide resources even when requests
succeed. Reports never imply complete coverage just because no error occurred.
Reports and editor text are kept only in memory until closing; deliberate
clipboard copies and file downloads remain outside that memory lifecycle.

## Evidence

See [catalog development](CATALOG-DEVELOPMENT.md) for the implementation record,
[catalog acceptance](CATALOG-ACCEPTANCE.md) for the live checklist and hashes, and
[Testing](TESTING.md) for evidence boundaries. Local automated and synthetic
browser checks do not establish live API behavior, manager integration, native
Firefox/ExtJS UI, clipboard contents or actual saved files.
