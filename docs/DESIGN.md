# Design

This describes **0.6.0-dev.1** generated editions, developed from stable Toolkit 0.5.0. Stable 0.5.0 retains its accepted runtime at its tag/release; changed lifecycle and cross-script coordination require new live acceptance. The [historical design](historicals/DESIGN.md) preserves the baseline and development sequence. [Decisions](../DECISIONS.md) records the rationale.

## Editions and generation

`src/toolkit.js` is shared source; `tools/editions.json` owns Toolkit's release
version and feature selection. The Node generator emits three independently
installable files, physically omitting excluded feature code. Every edition
follows Toolkit's version on every release. See [Editions](EDITIONS.md).
Toolkit has one scan interval; two active individuals each have one. Action
markers prevent overlapping toolbar installation; use Toolkit or individuals.

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

The terminal is resolved again on every action. Each synchronous scan shares its resolved console between Copy availability, Paste availability, and pending-paste validation; that result is never cached across scans or asynchronous clipboard access. Missing/failed discovery cancels pending input without falling back to a previous result. Hide-event, post-read, and post-paste checks still resolve independently. Unavailable or ambiguous contexts disable the buttons instead of falling back to another console. Persistent state retains the toolbar/buttons, not a long-lived terminal reference. A pending input action temporarily holds the exact frame, terminal, socket, and loaded URL for validation.

## Text extraction

Ordinary shell copies use the retained normal buffer, including scrollback. An active alternate screen contributes that buffer instead.

Rows marked `isWrapped` are joined into logical lines. Extraction uses the terminal's current display width and public buffer/cell APIs. An empty final cell before a wrapped width-two glyph is omitted as a wrap placeholder; literal spaces remain. Interior blank lines and Unicode whitespace survive. Completed-line trailing ASCII spaces and trailing empty rows are removed.

This captures retained rendered text, not a lossless session recording. Discarded scrollback and terminal reflow losses cannot be recovered.

## Browser and manager integration

Page access uses `unsafeWindow`, Firefox's `wrappedJSObject`, or the current window. Terminal access supports direct and wrapped frame globals. Local loops avoid sending sandbox callbacks into page-owned array methods.

Where available, `cloneInto` shares configuration data and `exportFunction` separately shares handlers. Otherwise the existing function-cloning path is used. Exported callbacks ignore page arguments and return no privileged objects or promises. Sharing failures are contained; no injected/eval bridge or weaker-permission fallback is attempted.

The source retains legacy and modern clipboard/manager-info grants plus `unsafeWindow`. Clipboard reading uses the native browser API, with no new manager grants. One shared implementation targets Firefox + Violentmonkey first; the maintainer reports candidate workflow acceptance, with exact platform and scenario qualification still open in Testing. The new @name requires explicit replace/disable-old installation guidance, while the legacy Copy marker still prevents duplicate installations.

## Clipboard and feedback

Copy selects callable `GM_setClipboard`, otherwise `GM.setClipboard` with its receiver intact. Use the legacy completion callback only for identified Tampermonkey; await returned promises from either API style. A void return reports unconfirmed dispatch. Copy never reads the OS clipboard back or retries through another API.

One pending flag prevents overlapping clipboard reads/writes. The initiating button remains focusable but ignores repeated activation; other controls disable. Copy's five-second watchdog reports uncertainty without canceling a possible late write. Late completion cannot overwrite timeout feedback.

Icons/tooltips show outcomes without changing button labels. Each action defines its default presentation once; unchanged tooltips and disabled states are not rewritten during polling. Feedback resets after 1.5 seconds. Focus returns only to the same terminal from the same focused button in a visible document. Destroying a control cleans up its edition's toolbar group, timers, and pending input, while skipping a button already being destroyed. For Toolkit that group contains both actions; individual editions own one action each. Fixed errors never include clipboard/terminal text or arbitrary exception contents.

## Paste and input lifecycle

Paste & Execute requires native `navigator.clipboard.readText`, browser user
activation, and a visible, focused document. Call the read in the click call
stack with its receiver intact. It may require Firefox's own Paste prompt; no
permission bypass or fallback read API is attempted.

Input discovery adds checks for public xterm `paste`/`input` capabilities and
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

Call `term.paste(text)`, recheck the session, then call `term.input('\r')` with no
intervening await. The Enter is outside the bracketed paste payload. Neither
method acknowledges remote execution: feedback reports text/Enter dispatch,
and any exception after dispatch begins is partial-send uncertainty. Never
retry automatically. The action does not detect the current program, recognize
an empty shell prompt, clear an existing command, or verify an exit status.

## Lifecycle and maintenance

Discovery runs immediately, every 500 ms while visible, and on visibility return. Idle scans never extract terminal rows or read the clipboard. Failed integration retries with warnings limited to once per 30 seconds; partial button pairs are disposed of. ExtJS owns layout and appearance.

Each active edition has one page-lifetime recovery interval and a visibility
listener. Editions with Paste also have hash-change and page-hide listeners.
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
