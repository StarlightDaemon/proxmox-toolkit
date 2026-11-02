# Decisions

This file records durable decisions by version. Historical sections preserve their original rationale; current compatibility and evidence are summarized in [Testing](docs/TESTING.md). An idea is not accepted merely because it appears in a historical proposal.

## Product scope and simplicity

The maintainer approved **Proxmox Toolkit** and Paste & Execute development on
2026-09-23. The 0.5.0-rc.1 release candidate adds that console action alongside
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
to main and availability under Releases. Publish v0.5.0-rc.1 as a prerelease
with the installable userscript attached and keep 0.4.1 as the latest stable
release. Preserve the tested runtime and its evidence limits. A final stable
0.5.0 promotion and remote renaming remain separate.

Keep one readable installable file, no runtime dependencies or build step, and
shared console targeting/lifecycle. On 2026-10-15 the maintainer removed the
fixed source-size ceiling and made efficiency the primary structural criterion.
Review repeated discovery and DOM work, idle behavior, resource lifetimes, and
the value of added complexity. Prefer readable shared logic; keep correctness
and input safeguards. Support performance claims with operation counts or
browser profiling. Report source bytes/hash for candidate identity without a
size threshold. Avoid speculative frameworks and minification for cosmetic
size reductions. Remote renaming/publication remains separate.

The October 16 efficiency review confirmed the checker has no source-size gate.
Reuse resolved ownership only within one synchronous scan, including pending
paste validation. Keep fresh session resolution around input and on hide events;
do not trade those checks for fewer calls. Timer/listener lifetimes and hidden
page behavior are covered by operation-count regressions; browser timing claims
require browser measurements. The separate clipboard-input length bound is an
input safeguard, not a source-size policy.

### Accepted for unreleased Toolkit development

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
the explicit Toolkit decisions above supersede them for unreleased development.

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
