# Proxmox Toolkit feature implementation handoff

**Historical 0.6.0 feature checkpoint.** Current packaging and runtime are the
0.7.0-dev.8 Toolkit and Copy & Paste candidates. See [catalog](CATALOG.md) and
[current acceptance](CATALOG-ACCEPTANCE.md). Earlier deferrals, filenames and hashes
below describe the previous assignment, not the current catalog.

Prepared 2026-11-02 for the implementing agent and maintainer review.

## Outcome and assignment

Implement and review four selected additions: **Paste Only**, **Console Export**,
**Diagnostics**, and a **Diagnostic Recipe Picker**. Users should be able to
stage clipboard text without Toolkit appending Enter, save retained console
output, understand action availability, and obtain explained troubleshooting
commands. Keep the existing Copy and Paste & Execute workflows reliable.

The maintainer selected ideas 1, 3, 4, and 10 from the feature research for this
implementation handoff. The other six ideas are deferred in the register below.
Acceptance of this scope does not establish compatibility or a release date.
The behavior choices below are implementation defaults; resolve routine details
within this scope and record material adjustments with their reasons.

Deliver a complete local implementation, generated editions, relevant tests,
updated documentation, a defect review, and a precise manual acceptance plan.
Commit creation, remote updates, PR creation, merge, tagging, release, and
publication remain separate authority boundaries under [AGENTS.md](../AGENTS.md).
Do not execute recipes or arbitrary commands in a live Proxmox console merely
to demonstrate the implementation. Maintainer-operated acceptance can follow
the prepared scratch-environment instructions.

## Starting state and repository coordination

At preparation, the local repository is `E:\Citadel\proxmox-copy-console`, with
origin `https://github.com/StarlightDaemon/proxmox-toolkit.git`, branch
`codex/standalone-editions`, and HEAD
`edfb35efa93c248daa6dcb22cc6709a779e264fa`. The worktree contains active,
uncommitted edition development; HEAD alone does not identify that candidate.
Other repository work was changing during preparation. Recheck the exact
identity, branch, commit, diff, and working instructions before any mutation.
Preserve that work and coordinate its integration; never reset, clean, switch
away from dirty work, or rebuild over another agent's edits without reconciling
the current source. Use an isolated `codex/` branch/worktree when appropriate,
while ensuring the required edition changes actually exist in its baseline.

Read [Decisions](../DECISIONS.md), [Design](DESIGN.md), [Editions](EDITIONS.md),
[Usage](USAGE.md), [Installation](INSTALL.md), [Testing](TESTING.md), and the
latest [development checkpoint](TOOLKIT-DEVELOPMENT.md). Reconcile stale document
statements against the current implementation and accepted decisions.

Current development uses `src/toolkit.js`, `tools/build.cjs`, and
`tools/editions.json` to generate 0.6.0-dev.1 candidates. Edit shared source and
the generator/manifest; never maintain manually divergent generated scripts.
Stable v0.5.0 remains the historical all-in-one release at its tag, including
its original `proxmox-copy-console.user.js` asset. Preserve all published
identities and historical evidence.

## Shared product and implementation constraints

- Target the existing HTTPS/8006 top-level PVE interface and embedded node Shell
  and LXC consoles. Preserve exact native-anchor ownership, same-origin frame
  identity, ambiguity refusal, and fresh resolution around asynchronous input.
- Use native ExtJS controls and the existing Firefox compartment adapter. Keep
  the primary Copy and Paste & Execute actions recognizable. Default Toolkit
  layout: add a distinct Paste Only action beside the existing input action,
  and group Export, Diagnostics, and Recipes in one native Tools menu. Individual
  utility editions may expose their own native button. Verify keyboard access,
  menu cleanup, narrow toolbars, themes, and conservative focus restoration.
- Keep one shared implementation without runtime dependencies, additional
  network transports, server installation, background clipboard access,
  transcript/history storage, automatic command execution, or automatic retry.
- Preserve clipboard completion versus unconfirmed dispatch versus timeout
  feedback. Report input dispatch separately from remote command success and
  download requests separately from successful saving to disk.
- Serialize all clipboard reads and writes using the existing cross-edition
  lease. Diagnostics report copying and recipe copying must participate too.
  Opening a panel or browsing a catalogue must not hold a clipboard lease.
  Preserve owner-only release and cancellation on lost ownership.
- Preserve the 500 ms recovery policy unless actual profiling justifies a
  change. Toolkit keeps one scan interval; an additional individual edition may
  have its own existing-style interval. Do no buffer extraction, clipboard
  access, report assembly, or recipe work during idle discovery. Reuse each
  scan's resolved context; do not add duplicate discovery per action.
- Bound temporary timers/listeners, destroy native components once, and clean
  up on navigation and teardown. Keep text out of DOM coordination attributes,
  tooltips, console logs, and exception messages. Render displayed data as text,
  without interpreting terminal content or page-supplied errors as markup.

## Paste Only behavior

Provide a distinct **Paste Only** action. Preserve Paste & Execute as an
independent direct action with its existing behavior.

Reuse the input-session and clipboard-read lifecycle, including user activation,
focused/visible document, a connected socket, enabled stdin, the 15-second
deadline, navigation/hide/teardown cancellation, and revalidation after the
asynchronous read. Keep reads in the activation call stack and preserve the
browser's permission prompt. Share validation and cleanup between the two input
actions without retaining a terminal across idle scans.

Normalize CRLF/CR to LF and remove trailing LF characters, matching the current
paste preparation policy. Preserve other spaces and Unicode. Retain the
65,536 UTF-16-code-unit limit, malformed-Unicode/control-character rejection,
whitespace-only refusal, and effective bracketed-paste requirement for multiline
text or tabs. Explain trailing-line-break removal in Usage.

Call `term.paste(prepared.text)` once and never call `term.input` or append any
submission character for this action. The Paste Only capability check must not
require `term.input` merely because Paste & Execute does. Revalidate before
dispatch, then validate the resulting session for honest feedback; never retry
after any possible partial send. Use wording such as **Text sent; no Enter
appended**, rather than claiming execution was prevented. Multiline text and the
active terminal program can still cause behavior; the action neither detects a
shell prompt nor clears existing input. Keep the existing uncertainty handling
when `paste` throws after input may have been emitted.

## Console Export behavior

Provide **Export Console** with Plain text as the default and Markdown as an
optional format in the same native export interface.

Capture one freshly resolved snapshot on explicit activation using the exact
same extraction function as Copy: retained normal scrollback, or the active
alternate screen, with current wrapped-line, wide-glyph, Unicode, padding, and
blank-row semantics. Do not add scoped copying in this wave. Retained readable
output can be exported after disconnection; an input-capable connection is not
required. Empty, unavailable, or ambiguous buffers produce distinct contained
feedback and no download.

Plain-text UTF-8 content must equal Copy's extracted text, without extra metadata
or an added trailing newline. Markdown contains that text in a code block with
a fence longer than any conflicting sequence in the content. It must preserve
literal text, including embedded fences and HTML-like strings. Keep filenames
generic and deterministic, for example `proxmox-console-20261102T183000Z.txt` or
`.md`, using UTC. Do not place hostnames, users, or terminal text in filenames.

Use a local Blob/object URL and a browser download request, with no extra GM
download permission or server request. Remove temporary anchors and revoke URLs
after the browser can consume them; cover cleanup on failure and teardown.
Do not overwrite or read the clipboard. Feedback says **Download requested**;
browser cancellation or successful disk saving is not observable proof. Include
a brief usage note that exported output can contain sensitive information.

## Diagnostics behavior

Provide a native **Diagnostics** panel that evaluates current integration and
action prerequisites only when opened or explicitly refreshed. Show a readable
summary and **Copy diagnostic report** producing a versioned structured report.
Keep this action available when input is unavailable, as long as the native
control can be integrated. If ExtJS or the native anchor is absent entirely,
retain the existing optional probes as the bootstrap troubleshooting path.

Use stable reason codes shared with action availability checks where practical.
Distinguish, for example, missing or ambiguous console, inaccessible frame,
unavailable terminal API, disconnected session, disabled stdin, absent clipboard
API, missing hide-event lifecycle support, and another clipboard operation.
Show bracketed-paste state as a conditional prerequisite for multiline/tab input,
rather than treating it as a reason to disable all single-line paste.

Allowlist report fields: report schema and script/edition version, known manager
identity when exposed, relevant capability booleans, context eligibility,
ambiguity/counts, normal/alternate-buffer state, connection and stdin readiness,
bracketed-paste status, and fixed reason codes. Represent unknown values honestly.
Clipboard API presence is not permission approval; never test permissions by
reading the clipboard, writing a test value, or sending terminal input. Do not
guess browser or installed PVE/package versions, execute discovery commands,
or fetch package information.

Exclude buffer rows, command/clipboard text, host/node/guest names and IDs,
usernames, full URLs/query strings, tickets, cookies, socket URLs, arbitrary
exceptions, and raw page objects. Reuse the existing clipboard-write contract
for Copy diagnostic report and preserve busy/timeout behavior. No automatic
uploads, persistent reports, or background collection. Readiness is a snapshot,
not a guarantee that a later action will succeed.

## Diagnostic Recipe Picker behavior

Provide **Recipes**, a small native picker with a description, exact command,
applicable context, prerequisites, and a **Copy command** action. The first
version copies commands for manual use; it does not send terminal input, stage
text into the terminal, chain recipes, or run anything automatically. This
keeps the reviewed command visible and lets users invoke either input action
separately. Copy command needs no clipboard-reading or terminal-input capability.

Start with the following fixed catalogue; verify each entry against authoritative
documentation before shipping and record platform limits alongside it:

| Recipe | Command | Availability and explanation |
| --- | --- | --- |
| PVE package versions | `pveversion -v` | Node Shell only; list installed PVE package versions. |
| Filesystem capacity | `df -h` | Node or Linux LXC; GNU/coreutils-style human-readable filesystem usage. |
| Kernel and system identity | `uname -a` | Node or Linux LXC; identity information can disclose host details. |
| Failed systemd units | `systemctl --failed --no-pager` | Node or systemd-based LXC; requires systemd and relevant access. |

Node/LXC context describes the owned console, not proof of the active program,
guest distribution, installed utility, or current privilege. Explain unavailable
tools/prerequisites without probing the shell. Recheck context before copying a
context-restricted entry; stale selection must not silently become applicable to
a different target. Refuse ambiguous context. Copy the command without a
trailing newline, using the shared clipboard serialization and completion
feedback. Catalogue commands and explanations are static reviewed data, not
page-generated shell interpolation.

Exclude package upgrades, reboot/shutdown, service changes, storage mutation,
download-and-run commands, automatic sudo, credentials, arbitrary parameters,
editable/user-saved recipes, and command history. Those would require a separate
product decision. Document that read-only commands can still disclose system
information and that users must inspect the destination and command themselves.

## Editions and capability boundaries

Include all four additions in Toolkit and provide an optional individual edition
for each, following the accepted edition model. Preserve the existing Copy
Console and Paste & Execute edition identities. The existing documentation's
phrase "Paste-only edition" currently means the standalone **Paste & Execute**
script; distinguish this clearly from the new **Paste Only** action/edition.

Suggested new identities are Proxmox Paste Only (`proxmox-paste-only.user.js`),
Proxmox Console Export (`proxmox-export-console.user.js`), Proxmox Toolkit
Diagnostics (`proxmox-toolkit-diagnostics.user.js`), and Proxmox Diagnostic
Recipes (`proxmox-diagnostic-recipes.user.js`). Check for conflicts before fixing
names in metadata and migration guidance. Seven editions result, including the
three existing ones. All must use one manifest-owned Toolkit development version;
choose the next candidate version after reconciling ongoing edition work and
regenerate every edition, even those with unchanged runtime.

Separate shared extraction, clipboard writing, clipboard reading, input dispatch,
and diagnostic metadata needs in the small existing generator as necessary.
Physical capability omission matters: Export must not accidentally include
clipboard writes merely to reuse extraction, and Diagnostics/Recipes must not
include transcript extraction or terminal input merely to reuse clipboard writes.
Avoid a general plugin framework or speculative configuration system.

| Individual edition | Required feature capability | Capability that must be absent |
| --- | --- | --- |
| Copy Console | Buffer extraction and clipboard write | Clipboard read and terminal input |
| Paste & Execute | Clipboard read, validated paste, separate Enter | Transcript extraction and clipboard write |
| Paste Only | Clipboard read and validated paste | Transcript extraction, clipboard write, and Enter dispatch |
| Console Export | Buffer extraction and local download | Clipboard read/write and terminal input |
| Toolkit Diagnostics | Allowlisted capability inspection and report clipboard write | Transcript extraction, clipboard read, and terminal input |
| Diagnostic Recipes | Static catalogue, context checks, and clipboard write | Transcript extraction, clipboard read, and terminal input |

Diagnostic capability inspection may check whether an input method exists; it
must never invoke it. Keep grants minimal per edition and prove the generated
boundaries with tests. Toolkit or a compatible set of individual editions is
supported; overlapping Toolkit/individual installations remain unsupported.
Give every action a stable conflict marker, including actions inside menus.
Prove duplicate suppression, deterministic ordering, and shared clipboard
coordination across the expanded edition combinations without putting content
or privileged objects into shared page state.

## Implementation stages

1. **Reconcile the baseline.** Inventory current edits and acceptance status,
   agree the source baseline with concurrent work, record identity/version,
   and run existing checks. Attribute pre-existing failures before changing
   behavior. Do not interpret stable 0.5.0 evidence as edition acceptance.
2. **Add Paste Only.** Share bounded input lifecycle and validation, separate
   the Enter step, extend generation, and verify both input actions and
   cross-edition cancellation/serialization before continuing.
3. **Add export.** Separate extraction from clipboard writing, implement both
   formats and download cleanup, and compare export bytes with Copy fixtures.
4. **Add diagnostics.** Introduce contained reason-coded capability reporting,
   native panel lifecycle, sanitized report serialization, and clipboard copy.
5. **Add recipes.** Verify the fixed catalogue, implement target-aware selection
   and copy, and finish the shared native utility menu/individual controls.
6. **Review the complete candidate.** Run the full checks, inspect generated
   capabilities/grants, review lifecycle and operation counts, update docs and
   acceptance steps, fix findings, and rerun affected checks. Record a bounded
   checkpoint after each wave in TOOLKIT-DEVELOPMENT.md.

## Required verification and review

Extend meaningful regressions using the existing Node mock and pinned real-xterm
fixtures. The following behaviors are acceptance requirements:

| Area | Required evidence |
| --- | --- |
| Paste Only | One read and one paste; no appended Enter or `term.input` call; works without `term.input`; preserves normalization/Unicode/length/control/bracketed-paste rules; no input after denial, expiry, navigation, hide/show, ownership loss, or session replacement; partial send never retries. |
| Paste & Execute regression | Existing text preparation, session checks, separate single Enter, partial-send uncertainty, and no retry remain intact. |
| Export | Normal/alternate buffers, wrapped and wide Unicode lines, empty/ambiguous contexts, literal Markdown fences/HTML, UTF-8 bytes, generic filename, no clipboard/input/network use, and object URL/anchor cleanup. |
| Diagnostics | Every reason code has a scenario; reports omit seeded secrets/IDs/URLs and never traverse arbitrary objects; API presence is not permission; unknown values and missing integration stay contained; no buffer-row access, clipboard reads, or terminal input. |
| Recipes | Exact catalogue commands lack trailing newlines; node-only entry is blocked in LXC; stale/ambiguous targets are refused; copy denial/unconfirmed/timeout use the existing contract; no clipboard read, shell probe, or input dispatch. |
| Editions and lifecycle | Deterministic generation, one synchronized version, minimal grants and absent capability code; representative individual combinations and duplicate overlap; lease owner-only release, denial/timeout recovery, cleanup, native menu teardown, and focus behavior. |
| Efficiency | Operation counts before/after for idle, pending, hidden, panel refresh, and teardown; no extraction/report work while idle, duplicate discovery within one synchronous scan, accumulating listeners/timers, or unchanged UI writes. Preserve fresh resolution at asynchronous action boundaries. Report measured counts, not assumed browser speed gains. |

Run from the reconciled repository root with Node.js 24, adapting commands only
when the current repository instructions require it:

```powershell
node tools/build.cjs
node tools/build.cjs --check
node tools/check.cjs
node tools/fetch-xterm.cjs
node --test --test-isolation=none tests/*.test.cjs
git diff --check
```

The fixture command verifies a cached fixture or downloads the pinned fixture;
record which occurred. Existing real-xterm tests have a headless textarea
limitation: emitting paste data and then throwing is partial-send evidence, not
proof of a successful rendered paste. Preserve that distinction.

Review the final diff as a separate pass after implementation: verify feature
scope, ownership around every asynchronous operation, single-Enter semantics,
generated capability exclusion, report privacy, Markdown text preservation,
cross-edition leases, teardown, and idle work. Fix actionable defects and state
remaining risks with evidence. An implementing agent can perform this review;
do not imply an independent review unless another reviewer actually performed it.

Prepare a Firefox + Violentmonkey manual checklist with exact candidate hashes,
edition combinations, browser/manager/PVE/package versions, harmless synthetic
output, an empty scratch shell prompt, multiline/bracketed-paste cases, delayed
permission approval/cancellation, switching/reconnecting consoles, export file
inspection, actual copied report/recipe comparison, keyboard access, and return
from hidden tabs. A success icon is not proof of clipboard contents, disk saving,
or remote execution. Record unexercised cases as pending; Chrome/Tampermonkey and
other combinations need their own evidence.

Update README, USAGE, INSTALL, EDITIONS, DESIGN, TESTING, CHANGELOG, DECISIONS,
OPEN-LOOPS, and TOOLKIT-DEVELOPMENT as relevant to the final implementation.
Keep development behavior clearly unreleased and stable installation/rollback
links pinned to the accepted release. Finish with files changed, checks actually
run, findings/fixes, candidate identities, manual acceptance status, and any
remaining decision or blocker. Local completion is not release publication.

## Deferred feature register

The maintainer placed these six ideas on the back burner for future review.
Do not implement them or their supporting machinery in this assignment.

| Original idea | Deferred feature | Revisit when |
| --- | --- | --- |
| 2 | Scoped Copy including viewport and last N lines | Repeated need justifies explicit wrapped-edge and viewport semantics; retain OL-08 continuity. |
| 5 | Find in Scrollback | Users repeatedly need in-console search and a bounded dependency/maintenance approach is agreed. |
| 6 | Review & Paste editor | Direct Paste Only proves insufficient and the extra staging lifecycle is justified. |
| 7 | QEMU/KVM serial-console support | A configured target environment is available for ownership, migration, reconnect, and input qualification. |
| 8 | Copy Task Report | Recurring task-support work warrants a report beyond native task-log downloads. |
| 9 | Custom HTTPS port and proxy support | Recurring installation friction warrants explicitly supported origins and proxy layouts. |

## Research anchors

- [xterm Terminal API](https://xtermjs.org/docs/api/terminal/classes/terminal/)
  describes the separate paste/input methods; installed-package behavior still
  needs qualification.
- [Pinned Proxmox xterm integration](https://github.com/proxmox/pve-xtermjs/blob/89075b05773a2b6c380175dde3f8a4472a5ab506/xterm.js/src/main.js)
  provides the existing console-state and transport integration reference.
- [Mozilla clipboard documentation](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
  describes user activation and browser permission behavior.
- [Browser download API](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement/download)
  describes download intent and suggested filenames.
- [Proxmox pveversion discussion](https://lists.proxmox.com/pipermail/pve-devel/2024-April/063253.html),
  [GNU df manual](https://www.gnu.org/s/coreutils/manual/html_node/df-invocation.html),
  [GNU uname manual](https://www.gnu.org/software/coreutils/manual/html_node/uname-invocation.html),
  and [systemctl manual](https://www.freedesktop.org/software/systemd/man/latest/systemctl)
  are starting references for the static recipe catalogue. Verify current syntax
  and applicability before shipping it.
