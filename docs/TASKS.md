# Tasks

## How To Use This Backlog

- `P0` means blocking for a public release.
- `P1` means high-value work that should land before launch unless scope is cut deliberately.
- `P2` means post-launch or optional polish.
- `Depends on` lists prerequisite tasks.
- `Done when` defines the minimum acceptance bar.

## P0: Foundation And Release Blocking Work

### T001: Write v1 product requirements

- Priority: `P0`
- Depends on: none
- Scope:
  - define target user
  - define v1 feature set
  - define supported browsers
  - define non-goals
  - define privacy principles
- Done when:
  - a short `docs/PRD.md` exists
  - launch browsers are explicitly named
  - v1 behavior for matched posts is explicit

### T002: Decide match action model

- Priority: `P0`
- Depends on: `T001`
- Scope:
  - decide whether v1 supports highlight, hide, or both
  - define default mode
  - define undo behavior for hidden posts
- Done when:
  - behavior is documented
  - settings model reflects the decision

### T003: Restructure repo into shared source layout

- Priority: `P0`
- Depends on: `T001`
- Scope:
  - introduce `src/` layout
  - separate shared logic from browser entrypoints
  - move popup, content, and shared config into distinct modules
- Done when:
  - repo has a clear source layout
  - extension still runs after restructuring

### T004: Add build and packaging pipeline

- Priority: `P0`
- Depends on: `T003`
- Scope:
  - add reproducible build command
  - generate browser-ready package outputs
  - support Firefox and Chromium first
- Done when:
  - one command builds Firefox and Chromium artifacts
  - package outputs are placed in a predictable directory

### T005: Normalize browser API compatibility

- Priority: `P0`
- Depends on: `T003`
- Scope:
  - isolate `browser.*` and `chrome.*` usage
  - add compatibility layer if needed
  - verify popup, storage, and content script behavior across Firefox and Chromium
- Done when:
  - no browser-specific API issues block Firefox or Chromium

### T006: Harden post discovery selectors

- Priority: `P0`
- Depends on: `T003`
- Scope:
  - replace current selector strategy with layered fallbacks
  - cover standard posts, group posts, promoted posts, suggested posts, reposts, and video posts
- Done when:
  - representative fixture coverage exists
  - selectors do not rely on a single brittle LinkedIn class path

### T007: Harden text extraction

- Priority: `P0`
- Depends on: `T006`
- Scope:
  - extract relevant text for matching across post variants
  - handle collapsed text and repost context
  - avoid matching irrelevant chrome where possible
- Done when:
  - text extraction is modular
  - fixtures confirm expected extracted text for major post types

### T008: Add include and exclude rule engine

- Priority: `P0`
- Depends on: `T007`
- Scope:
  - support regex rules
  - support plain keyword rules
  - support exclusions
  - support case sensitivity control
- Done when:
  - rule engine is independent from DOM code
  - unit tests cover include and exclude behavior

### T009: Add hide mode with undo

- Priority: `P0`
- Depends on: `T002`, `T008`
- Scope:
  - add hide or collapse action
  - preserve highlight mode
  - add undo affordance for hidden posts
- Done when:
  - users can switch mode in settings
  - hidden posts can be restored without reload

### T010: Prevent duplicate processing and mutation churn

- Priority: `P0`
- Depends on: `T006`, `T007`
- Scope:
  - debounce mutation observer work
  - avoid repeated badges and repeated DOM writes
  - avoid recompiling patterns unnecessarily
- Done when:
  - repeated lazy loading does not create duplicate UI
  - observer logic is measurably bounded

### T011: Build options page

- Priority: `P0`
- Depends on: `T002`, `T008`
- Scope:
  - move full settings from popup into options page
  - support rule editing, exclusions, mode selection, reset, import, and export
- Done when:
  - full configuration is available in options
  - popup remains lightweight

### T012: Add inline validation and settings persistence

- Priority: `P0`
- Depends on: `T011`
- Scope:
  - validate regex rules
  - show clear user-facing errors
  - store structured settings schema
- Done when:
  - invalid settings cannot silently break matching
  - schema migrations are at least minimally planned

### T013: Add unit tests for rule engine

- Priority: `P0`
- Depends on: `T008`
- Scope:
  - test regex compilation
  - test keyword matching
  - test exclusions
  - test settings serialization
- Done when:
  - core matching logic has automated tests

### T014: Add LinkedIn DOM fixture tests

- Priority: `P0`
- Depends on: `T006`, `T007`
- Scope:
  - create static fixture set for feed variants
  - test discovery, extraction, and actions against fixtures
- Done when:
  - at least 10 representative fixtures exist
  - fixture tests run in CI

### T015: Add browser smoke tests

- Priority: `P0`
- Depends on: `T004`, `T011`, `T014`
- Scope:
  - smoke test extension load and basic filtering in Firefox and Chrome
- Done when:
  - automated smoke checks pass in both browsers

### T016: Add release metadata and branding assets

- Priority: `P0`
- Depends on: `T011`
- Scope:
  - final name
  - icons
  - screenshots
  - short and long descriptions
- Done when:
  - assets are ready for store submission

### T017: Publish privacy policy and support docs

- Priority: `P0`
- Depends on: `T001`
- Scope:
  - privacy policy
  - support contact
  - basic FAQ
- Done when:
  - user-facing docs exist and can be linked from store listings

### T018: Add CI for lint, tests, and builds

- Priority: `P0`
- Depends on: `T004`, `T013`, `T014`
- Scope:
  - run lint
  - run unit tests
  - run fixture tests
  - run build packaging
- Done when:
  - CI validates release-critical paths on every push or PR

### T019: Create manual QA checklist and execute it

- Priority: `P0`
- Depends on: `T009`, `T011`, `T015`
- Scope:
  - normal feed
  - reposts
  - promoted posts
  - suggested posts
  - group feed
  - video posts
  - lazy loading
  - highlight mode
  - hide mode
  - popup
  - options page
- Done when:
  - a written checklist exists
  - Firefox and Chrome passes are completed

### T020: Package and submit Firefox release

- Priority: `P0`
- Depends on: `T016`, `T017`, `T018`, `T019`
- Scope:
  - create release artifact
  - complete AMO listing
  - address review feedback
- Done when:
  - Firefox version is approved or awaiting only store review

### T021: Package and submit Chrome release

- Priority: `P0`
- Depends on: `T016`, `T017`, `T018`, `T019`
- Scope:
  - create Chromium release artifact
  - complete Chrome Web Store listing
  - address review feedback
- Done when:
  - Chrome version is approved or awaiting only store review

### T022: Package and submit Edge release

- Priority: `P0`
- Depends on: `T021`
- Scope:
  - submit Chromium package to Edge Add-ons
  - complete Edge listing
- Done when:
  - Edge version is approved or awaiting only store review

## P1: High-Value Pre-Launch Work

### T023: Add onboarding flow

- Priority: `P1`
- Depends on: `T011`
- Scope:
  - first-run guidance
  - explain highlight vs hide
  - explain local-only filtering
- Done when:
  - first-time users get a clear setup path

### T024: Add presets for common AI content filters

- Priority: `P1`
- Depends on: `T011`
- Scope:
  - default starter sets
  - one-click preset apply
- Done when:
  - a user can activate useful filters without writing regex

### T025: Add per-post match explanation

- Priority: `P1`
- Depends on: `T008`, `T009`
- Scope:
  - show which rule matched
  - allow quick disable or exclusion from the post UI
- Done when:
  - false positives are easier for users to diagnose

### T026: Add import and export of settings

- Priority: `P1`
- Depends on: `T011`, `T012`
- Scope:
  - export settings JSON
  - import settings JSON safely
- Done when:
  - settings can be backed up and restored

### T027: Add performance profiling on large feeds

- Priority: `P1`
- Depends on: `T010`, `T015`
- Scope:
  - profile mutation handling
  - profile DOM writes
  - profile large pattern sets
- Done when:
  - clear performance bottlenecks are identified and addressed

### T028: Add rollback and hotfix process

- Priority: `P1`
- Depends on: `T018`
- Scope:
  - define response flow for LinkedIn DOM breakages
  - define patch release process
- Done when:
  - operational response is documented

## P2: Post-Launch And Expansion Work

### T029: Add optional telemetry design

- Priority: `P2`
- Depends on: `T017`
- Scope:
  - only if product metrics become necessary
  - must be opt-in and privacy-preserving
- Done when:
  - telemetry design is documented before any implementation

### T030: Add Safari packaging workflow

- Priority: `P2`
- Depends on: `T004`, `T022`
- Scope:
  - Apple packaging path
  - Safari compatibility validation
- Done when:
  - Safari package builds locally

### T031: Submit Safari release

- Priority: `P2`
- Depends on: `T030`
- Scope:
  - Apple review assets
  - Safari QA
  - submission handling
- Done when:
  - Safari listing is submitted or approved

## Suggested Sprint Order

### Sprint 1

- `T001`
- `T002`
- `T003`
- `T004`
- `T005`

### Sprint 2

- `T006`
- `T007`
- `T008`
- `T010`

### Sprint 3

- `T009`
- `T011`
- `T012`
- `T024`

### Sprint 4

- `T013`
- `T014`
- `T015`
- `T019`

### Sprint 5

- `T016`
- `T017`
- `T018`
- `T020`
- `T021`
- `T022`

## Current Recommended Start Point

Start with these tasks in order:

1. `T001` Write v1 product requirements
2. `T002` Decide match action model
3. `T003` Restructure repo into shared source layout
4. `T004` Add build and packaging pipeline
5. `T006` Harden post discovery selectors
