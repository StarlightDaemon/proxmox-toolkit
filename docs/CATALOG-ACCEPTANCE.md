# Configurable Toolkit acceptance

The local **0.8.0-dev.1** candidate adds five reports. Its acceptance criteria
are in the [0.8 expansion plan](EXPANSION-0.8.md), and actual local results belong
in the [development checkpoint](TOOLKIT-DEVELOPMENT.md). The stable 0.7.0 hashes,
results and live evidence below are preserved; they do not qualify the new code.

## 0.8.0-dev.1 live checklist — pending

Operator steps for OL-16. Every report is read-only. Change PVE state only
where a step asks for one operator-controlled scratch change. Record Firefox,
Violentmonkey, OS, PVE and `pve-manager` versions; the installed Toolkit
SHA-256; and, per step, pass/fail with what was actually seen. Run each report
once as an administrator and once as a restricted account (for example
PVEAuditor on one node). Hidden resources must show up as gaps or issues, not
as clean empty results.

1. **Install and settings:** replace the existing Toolkit entry's code, keeping
   the entry. Confirm `@version 0.8.0-dev.1`, 27 toggles, the same three
   defaults, and that earlier opt-ins survive. Enable the five new reports;
   confirm each opens without collecting until Run report.
2. **Capacity & Headroom:** run with day and week timeframes. For one node,
   compare host memory, logical CPUs and storage used/total with the native
   Summary views (GiB here; PVE may show GB). Change the reserve and confirm
   only the balance columns move. If a container has no memory value, confirm
   it is labelled `memory not configured`.
3. **Cluster Configuration Changes:** run with blank scope; Download baseline
   JSON. Make one scratch change (for example a test VM's memory). Choose the
   file **before** fixing the scope fields, confirm it loads, then Run and
   confirm exactly that difference. Set a different Node and confirm Run refuses
   with the baseline's scope before any request. Inspect the saved file for
   secrets (`cipassword`, descriptions, comments must be absent).
4. **Troubleshooting Bundle Builder:** select a task with the task-log section.
   Before preparing, add these to Symptoms:
   `CSRFPreventionToken: TEST`, `PVEAuthCookie=PVE:user@pve:65F1A2B3::TEST`,
   `PVEAPIToken=user@pve!t=00000000-0000-0000-0000-000000000000`,
   and a clock time such as `12:34:56`. Confirm every value is
   `[REDACTED-SECRET]`, the time stays readable, and node names/addresses are
   labelled. Edit the preview, download Markdown and JSON, and confirm the saved
   bytes equal the edited preview. Review for anything else sensitive before sharing.
5. **Firewall Visibility & Rule References:** compare cluster, one node and one
   guest's enablement, policies and rule order with the native Firewall panels
   and the installed backend (nftables or legacy). Run once with Include guest
   aliases and IP sets off (guest entries show `not requested`) and once on;
   note both request counts from the status line.
6. **Update Readiness & Version Consistency:** compare `pve-manager`, running
   kernel and available update count with each node's Updates and Repositories
   panels. Confirm that repository output has origins only (no paths, keys or
   credentials) and that no refresh/upgrade was triggered (Tasks shows none).
7. **Lifecycle:** cancel each report mid-collection, close/reopen, navigate away
   and back, and narrow the window. The console underneath must keep its session,
   and late results must not appear after cancel.
8. **Copy & Paste edition:** confirm it remains three clipboard actions with no
   report code or new grants.

Record results here with the date and installed hash. A pass here qualifies
these reports only; it does not close the 0.7.0 campaign items below.

Release: **0.7.0**, promoted from **0.7.0-dev.8** at the maintainer's explicit
request on 2026-11-02 after positive live workflow feedback. The only outputs
are Toolkit and Copy & Paste. Promotion preserves the tested runtime; it does
not certify every checklist item below. Historical 0.5.0 acceptance does not
qualify added behavior. Record remaining observations against the stable artifact.

## Stable 0.7.0 verification — 2026-11-02

Shared source, feature registry and generator hashes match the saved dev.8
baseline. Both generated files equal dev.8 after replacing the generated version
identity and removing the development-description prefix. No default, grant,
settings-key or runtime logic changes accompany promotion.

All 375 Node tests pass with zero failures/cancellations/skips under Node.js
24.18.0. Generation, static/link, metadata, pinned-xterm integrity and whitespace
checks pass. The real ExtJS 7.0.0.168 / Chrome 155.0.8059.85 fixture also passes,
including preserved console document/socket, all report return routes,
cancellation, narrow layouts and component cleanup. Desktop/narrow screenshots
were inspected. The sandbox launch failed to start Crashpad; the isolated
elevated rerun passed. These are local synthetic results, not live PVE tests.

| Stable file | Bytes | SHA-256 |
| --- | --- | --- |
| proxmox-toolkit.user.js | 131350 | 2f7ffd80663ac3fc43a0d383d6dff18ee9d7da48c7733b59f734a8149fd664ff |
| proxmox-copy-paste.user.js | 55861 | 2c88df1f7e714910b58727322147332d67d67184ac617437bdc69bc0a5c21318 |

## Local development evidence

Dev.7's native-header geometry check reproduces the dev.6 sizing error under
x-plain north defaults, then verifies the correction. Check the global launcher
beside Documentation in the maintainer's Firefox/Violentmonkey dark-theme setup:
matching height, vertical alignment, icon/text padding and a visible gap. Dev.6
workspace/button/tool use was reported positively; this is not an exhaustive pass.

Node regression and report/settings fixtures cover generation, two-edition
capability boundaries, preserved console safeguards, disabled-feature inactivity,
settings load/defaults, API GET-only constraints, concurrency/cancellation/budgets,
and report logic under incomplete data. Pinned renderer-free xterm still provides
buffer and partial-send evidence, not successful rendered paste.

`tools/browser-smoke.cjs` runs real ExtJS 7.0.0.168/Crisp in isolated headless
Chrome with a synthetic PVE workspace, manager storage and API responses.
Prepare the pinned public library/theme with `node tools/fetch-ui-fixture.cjs`. It checks toggle/default
counts, saving all-off settings, origin scope, no requests before explicit report
activation, literal rendering of HTML-like guest names, narrow layouts and Escape.
Screenshots are written to ignored `.cache/catalog-browser/`. It does not exercise
a real userscript manager, Firefox compartments, real API permissions or the
installed PVE workspace/themes. Resource-toolbar placement/replacement, versioned settings, repeated-open
and report redraw cleanup are also checked.

The dev.1 maintainer review reported the expected Help-adjacent button missing.
The selector mistakenly matched global Documentation; dev.2 fixes that source
error. This is not yet a live-confirmed resolution.

## Screenshot evidence — dev.2, supplied 2026-11-02

The maintainer supplied a screenshot showing PVE 9.2.3, node daemon1 with kernel
7.0.12-1-pve (PMX 7.0.12-1, x86_64), Firefox 159.0 (64-bit), Violentmonkey
2.50.0 and Toolkit 0.7.0-dev.2 in both Settings and the manager command. It shows
the native dark settings window rendered, the three clipboard toggles checked,
and Inventory & Report Builder also checked. This confirms displayed identity
and UI rendering, not every feature, OS clipboard result or report accuracy.
The maintainer described this as the same prior test environment. Dev.3 is a
new candidate with the requested placement/default changes and needs recheck.

The maintainer confirmed the transcribed environment versions and then reported
blank-scope report failures during live testing. Dev.4 corrects Maintenance
scope behavior and clarifies specific-target reports. Resolution remains pending.

## Remaining live campaign

Record exact Firefox, Violentmonkey, OS, PVE, `pve-manager`, `pve-xtermjs` and
console package versions. Install only one edition, with exact trusted-host
rules, in a scratch environment. Record the installed hash alongside observations.

1. **Settings:** verify all 22 Toolkit toggles; Copy & Paste has only three.
   Verify exactly Copy, Paste Only and Paste & Execute default on; Restore defaults
   selects those three, while existing saved opt-ins survive updates. Verify keyboard navigation/Escape, narrow layouts,
   light/dark themes, Restore defaults, save failure, and Save & Reload.
   Verify Toolkit sits immediately before global Documentation and toggles a
   main-content panel. No copy is added beside resource Help. Keep the tree,
   top bar and task log visible/clickable. Verify resizing all three surrounding
   regions. Check resource navigation/logout closes Toolkit; returning with its
   button or Return to Proxmox preserves the same console iframe, scrollback,
   shell state and connection. Keyboard input must not reach the covered console.
   Test pending Paste before opening Toolkit: no delayed input should be sent.
   Save & Reload remains an intentional reload, outside toggle preservation.
   Verify Reports opens enabled tools and Back returns to its chooser.
   Disable every feature and reopen Settings through both header and manager.
   Test slow startup and header replacement with every console action disabled.
   Restart the browser; confirm choices. Visit another origin; confirm isolation.
   Test an update of the same manager entry without losing preferences.
2. **Idle:** with all-off and report-only selections, observe zero console scan
   interval and zero report requests. With console actions on, inspect idle/hidden
   operation behavior. Compare startup/idle CPU only if making a performance claim.
3. **Existing actions:** repeat relevant Copy/Paste/Paste Only/export/diagnostic/
   recipe cases from the historical [feature campaign](FEATURE-ACCEPTANCE.md),
   using Toolkit toggles rather than removed individual scripts. Verify the visible
   order Copy, Paste Only, Paste & Execute for both editions and subsets. Inspect actual
   clipboard/file contents and preserve uncertain/late-write behavior.
4. **Scoped Copy and Find:** use wrapped Unicode output, a scrolled viewport,
   alternate screens, and fewer than N retained logical lines. Compare exact
   viewport clipping and last-N output. Search literal metacharacters and verify
   logical line numbers, 500-match limit and snapshot lifetime.
5. **Review & Paste:** use a scratch empty shell prompt and harmless text. Confirm
   no input before review, edit the text, paste without Enter, and observe exact
   bytes. Exercise denial, multiline without bracketed paste, invalid Unicode,
   oversized input, partial sends, five-minute expiry, hide/show, navigation,
   reconnect and terminal replacement. No automatic retries.
6. **Serial and proxy:** use an already configured embedded VM serial xterm
   console; verify node/VMID ownership, migration and reconnect, noVNC/SPICE
   exclusion. Test explicitly included HTTPS custom-port and same-origin prefix
   layouts. Reject cross-origin frames, HTTP and malformed prefixes. These tests
   do not authorize changing VM hardware or production proxy configuration.
7. **Inventory/Compare:** run inventory with blank filters, then explicit filters.
   Compare must explain its two-target/one-plus-baseline requirement before any
   requests. Compare report values with native current configuration;
   differentiate pending changes and observed usage. Exercise selected IDs,
   CSV column choices, literal formula-like names, JSON baseline import and
   ignored identity fields. Verify credentials/arguments are omitted.
8. **Backups:** include scheduled-but-failed guests, no visible backups, disabled
   jobs, pool selection, excluded disks and LXC bind mounts. Compare artifacts
   and tasks with native views. Test inaccessible/disabled storage and reused
   VMIDs. Never mark restoration/verification as passed from backup presence.
9. **Tasks:** follow a migrated guest across nodes, narrow the date/type filters,
   inspect a chosen UPID, verify log limits and actual copied report. Test retention
   gaps, limited task permissions, multi-guest jobs and more than 500 tasks.
10. **Snapshots/storage:** check old/current snapshot semantics, local versus
    shared volumes, unused attachments, linked-clone parents, incomplete resource
    access and external references. Do not delete anything to demonstrate a report.
11. **Maintenance/network/agent/recovery:** compare HA, active tasks, visible
    backups, passthrough and memory observations with native views. Verify Linux
    bridge/bond/VLAN paths and interface comparisons. Agent checks must issue
    only the documented GET information request, never an executable command.
    Inspect exported recovery configuration and omissions; it is not a host backup.
12. **Lifecycle and permissions:** while a report collects, cancel/close/hide/
    navigate and verify requests stop and late results do not update replacement
    panels. Exercise a restricted user and session expiry, timeouts, large data,
    request budget and response cap. No raw errors/credentials in console logs.
13. **Migration:** disable old standalone entries, install one new edition, and
    verify no duplicate toolbar controls. Roll back to the exact stable v0.5.0
    asset with all candidates disabled. Published release identities remain intact.

OL-02/03 detailed cross-browser observations, OL-04 other-manager qualification,
OL-05 installed-package comparison, OL-06 any justified profiling, OL-10 recurrence
of environment-specific errors, and OL-12 detailed live qualification remain evidence work.
No checklist item is checked off by the local automated suite alone.

## Dev.4 scope checks — live confirmation pending

Run Maintenance with blank Node/Guest IDs: expect a summary for each visible
node, including guestless nodes. Check single-node filtering, denied task/storage
reads shown as unknown, and guest findings under the correct node. This does not
qualify simultaneous maintenance of all nodes. Check Network includes guestless
nodes and Recovery narrows network collection when Node is specified. Verify
Copy Task Report works with only UPID; Compare and task detail clearly request
missing targets before making requests. Verify invalid node names never broaden
collection. Existing limits and partial-data warnings still apply.

## Dev.8 category checks — live confirmation pending

Confirm all six category tabs are reachable, with Diagnostics/Recipes under
Troubleshooting and report buttons next to their toggles. On a smaller browser
or resized tree/task log, verify tabs wrap and Previous/Next exposes every setting
without a long scrolling list. Check footer visibility, cross-category saving,
Restore defaults and invalid proxy feedback. Open a saved-enabled report while
other settings are unsaved; Back should restore that draft and the matching
category without fetching again. Return to Proxmox discards the draft and keeps
the mounted console connected. Save & Reload remains an intentional reload.

## Historical dev.8 candidate identities

Dev.8 live checks: replace the code in the existing entry and confirm the name
includes 0.7.0-dev.8, settings persist, and nine grants remain. The maintainer
identified the earlier syntax error as a manual naming edit, not a generated
build defect. Confirm Copy completion and both settings entry points after the
grant cleanup. Run Inventory and Maintenance, scroll results, use Back to Toolkit
and expect Inventory or Maintenance respectively, with any unsaved settings intact. Verify Return to Proxmox restores PVE, Back during collection
cancels it, and reopening requires explicit Run report. Local browser fixtures
pass these navigation checks; live acceptance remains pending.

Generated hashes are recorded below after final verification. Regenerate and
record new hashes after any source change; a hash does not establish correctness.

| File | Bytes | SHA-256 |
| --- | --- | --- |
| proxmox-toolkit.user.js | 131409 | 2b4e08d2660543b10c2618bab85dd2079574986ec55ead472ecf26b99d3b7a92 |
| proxmox-copy-paste.user.js | 55914 | 3fbb236391e38a3c0a3440ffa2871d5851cb654e5595dd2f655bdaad8e8a60ca |
