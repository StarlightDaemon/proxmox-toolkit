# Design

The working candidate is **0.8.0-dev.1**. Published stable 0.7.0 and its evidence
remain preserved. The [0.8 expansion plan](EXPANSION-0.8.md) records five approved
local additions: capacity/history, imported-baseline changes, support bundles,
firewall configuration and update readiness. These reuse the existing workspace,
GET client, request budgets and cancellation; no background collection is added.
Model fragments separate collection/analysis for capacity/updates,
drift/firewall and support-bundle preparation. The registry assigns the five
reports to Inventory, Troubleshooting and Maintenance. Toolkit has 27 toggles;
Copy & Paste retains three. All five new reports default off.

Baselines are explicitly exported/imported, validated and held in memory.
Support bundles expose a preview and assisted redaction before local export.
Unknown or partial data stays explicit; configuration snapshots do not establish
change authorship, effective firewall behavior, restore or placement safety,
package-index freshness, or a universal reboot requirement.

## Configurable management layer

Each handed-off development candidate advances the shared dev.N revision. The
settings title and manager shortcut expose that generated version; persisted
settings keys stay unchanged across these revisions. Dev.3 defaults to Copy,
Paste Only and Paste & Execute; every other feature defaults off. Explicit saved
booleans override defaults, so updates do not silently reset existing choices.

Settings load before startup, with a synchronous legacy GM path and an awaited
modern GM path. Runtime action specifications are filtered once for this page
load. A load failure keeps features off. A permanent settings entry is independent
of console availability and feature enablement. Save writes only schema, boolean
flags and validated API prefix; it then reloads. No report/transcript persistence.

CatalogModel contains pure collection/analysis; catalog-ui supplies a scoped
DOM form/table in a native ExtJS workspace panel and a bounded same-origin GET client. Reports use explicit
activation, per-run caching, bounded work waves, request/response budgets and
AbortController cleanup. Hidden pages, navigation and closing cancel collection.
Strings use textContent/value, not HTML. JSON exports retain collected evidence;
CSV exports selected columns/filtered rows with formula neutralization.
Blank report scope selects all visible nodes/guests within existing collection
limits. Maintenance gathers shared cluster/backup evidence once and records
independent nodePreflights, including nodes with no guests. Task/storage read
failures stay null/unknown. A single-node preflight retains its existing detail
fields; multi-node details are grouped by node. Network includes guestless nodes;
Recovery narrows node-network collection when explicitly filtered. Explicit
unknown node names never broaden scope. Compare and task-detail requirements
are validated before transport; task detail can infer its node from UPID.

Settings use native ExtJS panels, six category tabs, checkbox cards and a docked action
bar through the Firefox callback adapter. A top-bar button toggles the workspace
immediately before Documentation. Discovery selects exactly one visible
proxmoxHelpButton directly owned by the workspace's north region; resource and
modal Help controls are excluded, without translated-label matching. A single
backoff timeout (250 ms to 8 s) recovers delayed startup, stops once mounted and
while hidden, and restarts after launcher destruction. Console scans do not query it.
The launcher explicitly sets baseCls x-btn to override the north container's
x-plain defaults, matches Documentation's UI/scale and its 5px right margin.
It does not use the resource toolbar's default-toolbar UI or inline CSS class.

An absolutely positioned Ext.panel.Panel is rendered directly into #content as
an unmanaged sibling of its native cards. No setContent, card switching,
reparenting, native hide or native view destruction occurs on toggling. Existing
card elements receive inert/aria-hidden temporarily; exact prior attribute values
are restored on exit. The console resolver rejects actions while Toolkit is open,
and opening cancels pending paste/write tracking. A previously dispatched OS write
cannot be undone. Content resize events size the panel without polling. Scoped
beforeadd/beforeremove/beforedestroy and tree-click listeners exit on native
navigation/logout; hash/page lifecycle also cancels. Listeners are removed when
the panel is closed or replaced by another Toolkit screen. Only Toolkit-owned
components are destroyed. Back returns to the report's category; Return to Proxmox and Escape
restore the underlying view. Save & Reload explicitly reloads the page.

The category tab bar uses a responsive table layout. Settings cards use a column
layout and resize/activation-driven pagination, with all checkbox components kept
alive for one shared draft. No new timers or discovery queries are added. Report
transitions capture the draft in memory; returning to the report's category
restores it. Leaving Toolkit clears it. Saved runtime flags still gate report
launchers; hidden/paginated controls remain part of every save. Invalid proxy
settings select Integration and show a docked message without a write or reload.

The server tree, top bar and task log remain outside the panel. Report redraw
destroys owned buttons before replacing DOM. Native theme/Firefox compartments
and actual Proxmox console lifecycle still require live qualification.

The preserved console/workspace design originated in **0.7.0**, promoted from dev.8 with no new runtime behavior. Historical 0.5.0 retains its accepted runtime at its tag/release. The maintainer accepted dev.8's tested workflow for promotion; detailed lifecycle and cross-script qualification remains tracked. The [historical design](historicals/DESIGN.md) preserves the baseline and development sequence. [Decisions](../DECISIONS.md) records the rationale.

## Editions and generation

`src/toolkit.js` and its settings/console-extra/catalog fragments are shared
build-time source. `tools/features.cjs` owns feature names/defaults;
`tools/editions.json` owns the synchronized version and two edition selections.
The generator emits Toolkit and Copy & Paste, physically omitting utility/report
capabilities from the lightweight edition. Console actions have one 500 ms
recovery interval when any are enabled, zero when all are off.
[Catalog](CATALOG.md) defines settings, reports, request budgets and limits.
Management reports have no idle polling. Use only one edition at a time.

A DOM attribute holds a random clipboard lease across manager sandboxes.
Each action checks/acquires it synchronously before clipboard work; only its
owner releases it. Paste validates ownership along with the captured session
before input and Enter. No clipboard/command content or privileged callbacks
are shared. This is trusted-page coordination, not authentication. Completion,
errors, cancellation, and watchdogs release it. Reload recovers if an extension
is killed while holding it. Busy state is read once per synchronous scan.

## Scope and console ownership

Each directly installable edition adds its selected native ExtJS actions beside the relevant node Shell or LXC Console control. There are no runtime dependencies, server changes, or transcript/clipboard-history storage. Input goes through the console's existing connection; the script opens no additional transport.

The manager's include rule selects eligible pages. A runtime guard also requires HTTPS, port 8006, and the top-level page. Restrict installation to trusted hosts: page globals are integration points, not authentication.

Discovery queries native `pveConsoleButton` components and uses their console type, node, and guest identity rather than translated labels. It searches iframe descendants of the toolbar owner's element. The loaded frame URL must be same-origin and match the console identity and `xtermjs=1`; remote-console parameters are excluded. Exactly one eligible terminal and one native anchor per toolbar are required.

The terminal is resolved again on every action. Each synchronous scan shares its resolved console between Copy availability, Paste availability, and pending-paste validation; that result is never cached across scans or asynchronous clipboard access. Missing/failed discovery cancels pending input without falling back to a previous result. A unique eligible native anchor may host Diagnostics even while its frame is missing or ambiguous; other actions remain disabled. Multiple native anchors prevent integration. Resolver observations use fixed reason codes and counts, with null for unobserved values. Hide-event, post-read, and post-paste checks still resolve independently. Unavailable or ambiguous contexts disable the buttons instead of falling back to another console. Persistent state retains the toolbar/buttons, not a long-lived terminal reference. A pending input action temporarily holds the exact frame, terminal, socket, and loaded URL for validation. An explicitly opened recipe panel retains its reviewed target until close; it is revalidated before copying.

## Text extraction

Ordinary shell copies use the retained normal buffer, including scrollback. An active alternate screen contributes that buffer instead.

Rows marked `isWrapped` are joined into logical lines. Extraction uses the terminal's current display width and public buffer/cell APIs. An empty final cell before a wrapped width-two glyph is omitted as a wrap placeholder; literal spaces remain. Interior blank lines and Unicode whitespace survive. Completed-line trailing ASCII spaces and trailing empty rows are removed.

This captures retained rendered text, not a lossless session recording. Discarded scrollback and terminal reflow losses cannot be recovered.

## Browser and manager integration

Page access uses `unsafeWindow`, Firefox's `wrappedJSObject`, or the current window. Terminal access supports direct and wrapped frame globals. Local loops avoid sending sandbox callbacks into page-owned array methods.

Where available, `cloneInto` shares configuration data and `exportFunction` separately shares handlers. Otherwise the existing function-cloning path is used. Exported callbacks ignore page arguments and return no privileged objects or promises. Sharing failures are contained; no injected/eval bridge or weaker-permission fallback is attempted.

Both editions retain nine grant declarations for legacy/modern clipboard writing,
settings storage, menu registration and unsafeWindow. Manager information is
automatically supplied; explicit info grants were removed in dev.5. Clipboard
reading uses the native browser API. Workspace integration adds no grants.
Firefox + Violentmonkey remains the primary target. Versioned names require
replacement in the existing manager entry; see Installation for the identity and
permission audit. Historical 0.5.0 evidence does not qualify the added 0.7.0 behavior.

## Clipboard and feedback

Copy selects callable `GM_setClipboard`, otherwise `GM.setClipboard` with its receiver intact. Use the legacy completion callback only for identified Tampermonkey; await returned promises from either API style. A void return reports unconfirmed dispatch. Copy never reads the OS clipboard back or retries through another API.

The owned lease prevents overlapping clipboard reads/writes, including report/recipe writes. Panel opening and export bypass clipboard serialization. The initiating button remains focusable but ignores repeated activation; other clipboard controls disable; utility panels and exports remain available. Copy's five-second watchdog reports uncertainty without canceling a possible late write. Late completion cannot overwrite timeout feedback. Pending write tracking is cancelled on owner destruction, lost lease, hidden page and navigation; its watchdog is cleared, but a previously dispatched OS write cannot be undone.

Icons/tooltips show outcomes without changing button labels. Each action defines its default presentation once; unchanged tooltips and disabled states are not rewritten during polling. Feedback resets after 1.5 seconds. Focus returns only to the same terminal from the same focused button in a visible document. Destroying a control cleans up its edition's toolbar group, timers, and pending input, while skipping a button already being destroyed. With the six legacy console actions enabled, the group contains those actions
and the Tools button. Fresh Toolkit settings enable only the three clipboard
actions;
Copy & Paste contains its three actions. Clipboard controls are ordered Copy,
Paste Only, Paste & Execute, regardless of which are enabled. Fixed errors never include clipboard/terminal text or arbitrary exception contents.

## Paste and input lifecycle

Paste & Execute requires native `navigator.clipboard.readText`, browser user
activation, and a visible, focused document. Call the read in the click call
stack with its receiver intact. It may require Firefox's own Paste prompt; no
permission bypass or fallback read API is attempted.

Input discovery checks public xterm `paste`, plus `input` only for Paste & Execute, and
enabled stdin. The Proxmox frame must expose `state === states.connected` and a
socket with `readyState === 1`. These page globals are integration points, not a
security boundary or stable extension API. Their shape was checked against the
[pinned Proxmox source](https://github.com/proxmox/pve-xtermjs/blob/89075b05773a2b6c380175dde3f8a4472a5ab506/xterm.js/src/main.js);
installed-package behavior still needs acceptance. Missing state disables Paste
while retained output may remain copyable.

Capture the session and top-page URL before reading. After the asynchronous
read, compare the live frame, terminal, socket, loaded URL, owner association,
page URL, visibility, focus, and deadline. Foreground scans latch observed session
invalidation; hash changes, page hiding, and control teardown cancel pending
intent. While a paste is pending, a callback on the documented ExtJS
`GlobalEvents.hide` event revalidates the captured session synchronously. This
latches a console/ancestor hide even if it is shown again before the next scan;
unrelated components hiding do not cancel a valid session. The callback ignores
page arguments, uses the existing Firefox sharing adapter, and is removed on
every completion path. Missing event subscription/removal capabilities disable
Paste. CSS-only visibility changes and connection invalidation still rely on
the existing observations and final session checks; transient changes without
an event or polling observation cannot be reconstructed afterward.
A 15-second watchdog resolves cancellation, and an explicit timestamp
check also rejects completion after a throttled timer. Browser prompt focus loss
alone does not cancel on an idle scan; focus is required again before sending.
Cancellation does not dismiss the browser's own clipboard prompt. Late clipboard
completion or rejection is handled without input or retry.

Prepare text by normalizing CRLF/CR to LF and removing trailing LF characters;
preserve other spaces and Unicode. Reject empty/whitespace-only text, over 65,536
UTF-16 code units, unpaired surrogates, and C0/C1/DEL control characters except
tab/CR/LF. For multiline text or tabs, require `modes.bracketedPasteMode === true`
and `options.ignoreBracketedPasteMode !== true`. This avoids treating those
characters as ordinary terminal keystrokes when bracketed paste is inactive.

Both input actions call `term.paste(text)` and recheck the session. Only Paste & Execute then calls `term.input('\r')` with no
intervening await. The Enter is outside the bracketed paste payload. Neither
method acknowledges remote execution: feedback reports text/Enter dispatch,
and any exception after dispatch begins is partial-send uncertainty. Never
retry automatically. The action does not detect the current program, recognize
an empty shell prompt, clear an existing command, or verify an exit status.

## Lifecycle and maintenance

Discovery runs immediately, every 500 ms while visible, and on visibility return. Idle scans never extract terminal rows, read/write the clipboard, assemble reports or browse recipes. Failed integration retries with warnings limited to once per 30 seconds; partial action groups are disposed of. ExtJS owns layout and appearance.

Each active edition has one page-lifetime recovery interval and a visibility
listener. Editions with input, writes or panels also have hash-change and page-hide cleanup listeners.
The interval continues to wake
while hidden, but performs no component query, frame search, or geometry/style
read; a hidden-page tick cancels pending input. Keep that simple recovery policy
until browser profiling justifies changing it. No output observer or cache of
terminal references is introduced. Ownership checks still inspect native
anchors for each console; the operation counts in Testing describe the tested
two-console fixture rather than a general scalability or timing claim.

At most one clipboard watchdog is active because Copy and Paste are serialized.
Each button replaces its own feedback timer instead of accumulating timers.
Only a pending paste subscribes to ExtJS hide, and its `finally` removes the
listener and watchdog on completion, denial, cancellation, timeout, or teardown.
Late clipboard results cannot restart an operation. Destroyed controls clear
their feedback timers. These lifetimes have mock coverage; native browser and
ExtJS lifecycle acceptance remains separate.

Efficiency guides implementation without a fixed source-size ceiling. Review
repeated discovery, DOM work, idle behavior, and timer/listener lifetimes; use
operation counts or profiling to support gains. Keep shared code readable and
preserve correctness and input safeguards. Source bytes/hash identify each
candidate. [Testing](TESTING.md) separates mocked contracts,
real-parser checks, CI, and live reports. The [development record](TOOLKIT-DEVELOPMENT.md)
contains the ordered implementation/checkpoint history.

## Utility panels, downloads and reporting

Toolkit uses Ext.menu.Menu/Item under a native Tools button. Utility markers on
that button make conflicts visible across sandboxes without sharing callbacks or
traversing menus. Individuals use direct native buttons, inserted by fixed rank.
All controls use the existing pageOptions compartment adapter. Components are
created and attached individually, so native objects are never passed to cloneInto.
Handlers ignore page arguments and exported callbacks return no sandbox promises.

A native modal Ext.window.Window contains a read-only TextArea and an overflowable
footer toolbar. Labels are fixed; displayed values use setValue, never HTML.
Panels are allocated only on activation and disposed on close, hidden documents,
navigation or group teardown. Captured snapshots are cleared. Child ownership
and destroying guards prevent double destruction. Native focus/keyboard behavior
needs live verification; clipboard completion does not force focus out of a panel.

Export shares extractFullConsole with Copy. Opening captures one snapshot, then
two native buttons request plain text (default) or Markdown. UTF-8 Blob bytes
preserve Copy text; Markdown uses one more backtick than the longest run (at
least three), placing the exact text between newlines and fences. UTC filenames
contain no page data. Each download gets a temporary anchor and object URL; the
anchor is removed after click and URL revoked after one second, or on failure,
panel teardown or pagehide. Download feedback makes no disk-save claim.

Diagnostics build a schema-1 object only on open/Refresh, using explicit fixed
primitive fields. Unknowns are null; known manager names are allowlisted. It
inspects buffer metadata without calling getLine. No raw objects, exception text,
URLs or console identities enter JSON. Clipboard API existence is not tested by
permission APIs or a clipboard operation. Copy uses the displayed snapshot and
the same write contract as Copy Console. Unavailable bootstrap integration still
uses the optional standalone probes.

Recipes are four static reviewed records. The native Previous/Next picker shows
the exact command, context and prerequisites. Copy re-resolves and compares the
frame, terminal, loaded URL, toolbar and native identity; node-only eligibility
is checked again. Commands have no trailing newline and are never dispatched to
the terminal. Window navigation is checked again inside each callback before
work, covering the interval before the next navigation event/scan.

Build capabilities INPUT, EXTRACT, WRITE, PANELS and the action blocks omit unused
code. PASTE alone owns the Enter call, so Paste Only cannot dispatch it. Diagnostic
capability inspection may test method existence but contains no invocation. See
[feature review](FEATURE-REVIEW.md) for regressions and operation counts, and
[acceptance](FEATURE-ACCEPTANCE.md) for native UI evidence still pending.
