# AGENTS.md

## Repository purpose

`StarlightDaemon/proxmox-toolkit` contains Proxmox Toolkit development and
the stable Proxmox Copy Console lineage. The maintainer approved the Toolkit
name, Paste & Execute development, main promotion, and v0.5.0 stable release
publication as Latest. On 2026-11-02 the maintainer authorized renaming this
existing repository, updating links/remotes, and developing Toolkit and companion editions. Every edition follows the Toolkit version on every
release, even when its own runtime has not changed. Preserve the old-name
redirect by leaving that repository name unused. New runtime behavior needs
its own acceptance. On 2026-11-02 the maintainer accepted the last tested
0.7.0-dev.8 candidate for stable 0.7.0 and authorized pushing/publishing it as
the new stable. This promotion preserves runtime behavior and does not imply
full report, clipboard or browser-matrix qualification. The maintainer
authorized all catalog/open-loop feature implementations and then consolidated
packaging to Toolkit plus one Copy & Paste edition. No other individual feature
userscripts are shipped. Preserve historical edition records as historical.

## Authoritative project documents

- `src/toolkit.js`, `src/settings.js`, `src/console-extras.js`, `src/catalog-model.js`, `src/catalog-ui.js`, `tools/features.cjs`, and `tools/editions.json` — shared build-time source, feature registry, and one version manifest. Run `node tools/build.cjs`; do not hand-edit generated userscripts.
- `proxmox-toolkit.user.js` and `proxmox-copy-paste.user.js` — the only generated 0.7.0 stable editions, promoted from dev.8. Toolkit has all 22 toggles; Copy & Paste has the three clipboard actions. Detailed live qualification remains tracked. Historical 0.5.0 retains its all-in-one proxmox-copy-console.user.js asset at its tag/release.
- `README.md` — user-facing project overview.
- `docs/INSTALL.md` — installation, updates, host restrictions, migration, and rollback.
- `docs/USAGE.md` — action behavior, feedback, cancellation limits, and user troubleshooting.
- `docs/COMPATIBILITY.md` — current console scope, browser/manager guidance and optional integration requirements.
- `docs/CATALOG.md`, `docs/CATALOG-DEVELOPMENT.md`, and `docs/CATALOG-ACCEPTANCE.md` — configurable catalog usage, implementation record, and pending live campaign.
- `docs/EDITIONS.md` — edition selection, migration, generation, coexistence, and synchronized release versions.
- `CHANGELOG.md` — version/baseline record.
- `DECISIONS.md` — durable design decisions.
- `docs/README.md` — current documentation index.
- `docs/historicals/` — preserved project lineage, earlier designs, reviews, research, and test records; status statements are historical.
- `docs/DESIGN.md` — implementation design represented by the source.
- `docs/TESTING.md` — current compatibility, verification scenarios, troubleshooting, and evidence boundaries.
- `docs/OPEN-LOOPS.md` — current follow-up register and completion criteria; completed handoffs are archived.
- `docs/TOOLKIT-DEVELOPMENT.md` — ordered development record and resume checkpoint. Update after bounded work waves; Firefox + Violentmonkey is the primary development target.
- `LICENSE` — licensing terms.

## Efficiency

Efficiency is a primary design requirement. There is no fixed source-size limit.
Review repeated discovery and DOM work, idle behavior, and timer/listener
lifetimes. Prefer readable shared logic and justified complexity; preserve
correctness and input safeguards. Use operation counts or browser profiling to
support efficiency claims. Source bytes and hashes identify candidates rather
than determine whether they are acceptable.

## Mutation discipline

Before changing repository state:

1. Verify the exact repository identity.
2. Verify the exact target branch/ref and current starting commit.
3. Inspect the current repository-native instructions and relevant project documents.
4. Preserve unrelated tracked files unless deletion is explicitly authorized.
5. Match the execution surface to the evidence required by the task.

Treat these as separate authority boundaries unless explicitly granted together:

- implementation/file mutation;
- commit creation;
- remote branch/ref update;
- pull-request creation/review;
- merge;
- tag/release;
- deployment/publication.

A tool's capability does not grant authority. If an API operation necessarily combines actions, authority must cover the combined semantics.

## Baseline protection

Version 0.3.0 remains the historical baseline at commit `27a83d2ac836ef35c2f7e6644b6e448355631be0`. Do not rewrite its documented behavior or evidence.

Version 0.4.0 promotes the unchanged 0.4.0-dev.2 runtime following the maintainer's live workflow acceptance. Preserve the scope and limitations of that evidence in `docs/TESTING.md`; do not imply that the full compatibility matrix has passed. Identify future experimental behavior as unreleased work.

## Verification discipline

GitHub-side file/ref evidence is not proof of local execution, runtime correctness, clipboard behavior, or manual Proxmox acceptance. Report those evidence classes separately and do not claim tests were run unless a surface actually ran them.
