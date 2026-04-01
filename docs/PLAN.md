# Release Plan

## Goal

Turn the current LinkedIn AI feed filter PoC into a releasable cross-browser product, with Firefox and Chromium browsers on the first critical path and Safari as a follow-up packaging path.

## Product Definition

### Proposed v1 product scope

- Support LinkedIn feed filtering on desktop browsers.
- Provide two actions for matched posts:
  - highlight in yellow
  - hide or collapse post
- Allow users to configure:
  - regex patterns
  - plain keyword patterns
  - case sensitivity
  - include and exclude lists
  - per-pattern enable and disable state
- Keep all filtering local in the browser.
- Release on Firefox, Chrome, and Edge first.

### Explicit non-goals for v1

- Mobile browser support
- LinkedIn native mobile app support
- Server-side sync of settings
- Team sharing or cloud accounts
- Analytics beyond basic opt-in telemetry

## Delivery Strategy

Start with a shared WebExtension codebase for Chromium browsers plus Firefox. Treat Safari as a separate packaging and review stream after the shared codebase is stable.

## Milestones

### Milestone 0: Product Spec And Technical Foundation

#### Outcome

Lock the v1 feature set, browser support policy, privacy posture, and technical direction.

#### Tasks

- [ ] Write a short product requirements doc for v1.
- [ ] Decide the exact behavior for matched posts:
  - highlight only
  - hide only
  - user-selectable mode
- [ ] Define the settings model:
  - regex entries
  - plain keyword entries
  - exclusions
  - per-site toggles
- [ ] Define supported browsers for first release:
  - Firefox
  - Chrome
  - Edge
- [ ] Confirm Safari is phase-two packaging, not launch critical path.
- [ ] Define privacy policy principles:
  - no remote code
  - local-only processing
  - minimal permissions
- [ ] Choose the build approach:
  - plain WebExtension packaging
  - shared source plus browser-specific manifests
- [ ] Define versioning and release numbering.

#### Exit criteria

- [ ] v1 scope is written and agreed.
- [ ] Browser support plan is written.
- [ ] Privacy posture is written.
- [ ] Build approach is chosen.

### Milestone 1: Core Engine Hardening

#### Outcome

Make feed parsing and matching robust enough for real users across LinkedIn feed variants.

#### Tasks

- [ ] Refactor the content script into separate modules:
  - post discovery
  - text extraction
  - match evaluation
  - DOM actions
- [ ] Replace fragile selectors with layered selectors and fallbacks.
- [ ] Add support for these post contexts:
  - standard feed posts
  - reposts
  - promoted posts
  - suggested posts
  - group feed posts
  - video posts
  - posts with collapsed text
- [ ] Add robust rescanning for infinite scroll and lazy-loaded content.
- [ ] Prevent duplicate processing and badge duplication.
- [ ] Improve performance:
  - debounce mutation handling
  - avoid full rescans where possible
  - avoid excessive regex recompilation
- [ ] Handle invalid patterns safely without breaking the content script.
- [ ] Add exclusions so users can suppress false positives.
- [ ] Add hide or collapse mode in addition to highlight mode.
- [ ] Add a safe undo path for hidden posts.

#### Exit criteria

- [ ] The extension behaves correctly on at least 10 representative LinkedIn DOM fixtures.
- [ ] No obvious duplicate badge or repeated mutation bugs remain.
- [ ] Matching is resilient across lazy-loaded feed updates.

### Milestone 2: Product-Grade UX And Settings

#### Outcome

Move from PoC controls to a product-grade user experience.

#### Tasks

- [ ] Keep popup focused on quick controls:
  - enable or disable extension
  - current mode
  - shortcut to full settings
- [ ] Add an options page with structured settings UI.
- [ ] Add settings sections for:
  - filter mode
  - keyword rules
  - regex rules
  - exclusions
  - import and export
  - reset defaults
- [ ] Add inline regex validation with clear error states.
- [ ] Add sample presets for common AI-related filtering.
- [ ] Add onboarding for first install.
- [ ] Add visible explanation on matched posts:
  - which rule matched
  - quick unfilter action
- [ ] Add polished icons and extension branding.
- [ ] Review the visual design so it feels consistent and intentional.

#### Exit criteria

- [ ] A non-technical user can install the extension and configure filters without editing code.
- [ ] Settings are understandable and validated.
- [ ] The extension has basic branding and onboarding.

### Milestone 3: Cross-Browser Architecture And Build Pipeline

#### Outcome

Produce reliable packages for Firefox and Chromium browsers from a shared source tree.

#### Tasks

- [ ] Reorganize the repo into a shared source layout, for example:
  - `src/core`
  - `src/content`
  - `src/popup`
  - `src/options`
  - `src/shared`
  - `build/`
- [ ] Create browser-specific manifest generation if needed.
- [ ] Normalize API usage for Firefox and Chromium:
  - `browser.*`
  - `chrome.*`
  - polyfill strategy if needed
- [ ] Add a reproducible build script.
- [ ] Add dev and release packaging scripts.
- [ ] Add linting and formatting.
- [ ] Add release artifact outputs for:
  - Firefox zip
  - Chrome zip
  - Edge zip
- [ ] Decide how Brave and Opera are handled:
  - Chromium package compatibility
  - no separate code path

#### Exit criteria

- [ ] One command can build release-ready packages for Firefox, Chrome, and Edge.
- [ ] Shared source is the default implementation path.
- [ ] Browser-specific differences are isolated.

### Milestone 4: Quality Assurance

#### Outcome

Establish enough automated and manual QA to release with confidence.

#### Tasks

- [ ] Add unit tests for:
  - regex compilation
  - keyword matching
  - exclusion handling
  - settings serialization
- [ ] Add DOM fixture tests for LinkedIn feed variants.
- [ ] Add browser smoke tests for:
  - Firefox
  - Chrome
- [ ] Add manual QA checklist for:
  - normal feed
  - group feed
  - reposts
  - promoted posts
  - suggested posts
  - video posts
  - infinite scroll
  - collapsed long posts
  - hide mode
  - highlight mode
  - options page
  - popup interactions
- [ ] Run performance checks on large feeds.
- [ ] Run permission and privacy review.

#### Exit criteria

- [ ] Automated tests cover critical logic.
- [ ] Manual QA checklist is complete for Firefox and Chrome.
- [ ] No release-blocking defects remain open.

### Milestone 5: Release Engineering

#### Outcome

Prepare store assets, policies, and packaging so the extension can be submitted.

#### Tasks

- [ ] Add final extension metadata:
  - name
  - description
  - short description
  - icons
  - screenshots
- [ ] Write store listing copy.
- [ ] Write user-facing help and FAQ.
- [ ] Publish a privacy policy.
- [ ] Add support contact details.
- [ ] Create changelog process.
- [ ] Add CI for:
  - lint
  - tests
  - build
  - tagged release packaging
- [ ] Define release checklist for every version.
- [ ] Define rollback process if LinkedIn DOM changes break the extension.

#### Exit criteria

- [ ] Release artifacts are reproducible.
- [ ] All store assets exist.
- [ ] Privacy policy and support docs are published.

### Milestone 6: Store Submission And Launch

#### Outcome

Ship to public browser stores in a controlled sequence.

#### Tasks

- [ ] Submit Firefox package to Mozilla Add-ons.
- [ ] Submit Chrome package to Chrome Web Store.
- [ ] Submit Edge package to Edge Add-ons.
- [ ] Validate store review feedback and patch quickly.
- [ ] Monitor initial user reports.
- [ ] Schedule first maintenance release window.

#### Exit criteria

- [ ] Firefox release is approved.
- [ ] Chrome release is approved.
- [ ] Edge release is approved.
- [ ] Initial launch support process is active.

### Milestone 7: Safari Follow-Up

#### Outcome

Extend the stable WebExtension product to Safari.

#### Tasks

- [ ] Review current Safari WebExtension conversion requirements.
- [ ] Confirm macOS and Safari version support policy.
- [ ] Add Safari packaging workflow.
- [ ] Test content script compatibility in Safari.
- [ ] Validate permissions, storage, popup, and options behavior.
- [ ] Prepare Apple-specific listing assets and submission docs.

#### Exit criteria

- [ ] Safari package builds successfully.
- [ ] Core functionality passes manual QA in Safari.
- [ ] Safari submission is ready or approved.

## Recommended Repo Backlog

### Foundation

- [ ] Add `src/` structure and shared modules.
- [ ] Add build scripts.
- [ ] Add lint config.
- [ ] Add test runner.
- [ ] Add browser fixture HTML samples.

### Content Engine

- [ ] Modularize post selection.
- [ ] Modularize text extraction.
- [ ] Modularize matching logic.
- [ ] Modularize actions: highlight, hide, undo.
- [ ] Add mutation observer performance guardrails.

### UI

- [ ] Redesign popup for quick actions.
- [ ] Add options page.
- [ ] Add onboarding page or first-run state.
- [ ] Add icons and screenshots.

### Release Ops

- [ ] Add CI workflow.
- [ ] Add signed artifact instructions.
- [ ] Add release checklist.
- [ ] Add support and privacy docs.

## Browser Release Requirements

### Firefox Add-ons

- [ ] Firefox-compatible manifest and permissions
- [ ] Signed submission package
- [ ] Store description and screenshots
- [ ] Privacy policy URL
- [ ] Clear explanation of data handling

### Chrome Web Store

- [ ] Chromium-compatible package
- [ ] Single-purpose description
- [ ] Store listing assets
- [ ] Privacy disclosures
- [ ] Justification for requested permissions

### Edge Add-ons

- [ ] Chromium-compatible package
- [ ] Edge store listing assets
- [ ] Support and privacy links

### Safari

- [ ] Safari WebExtension conversion or packaging workflow
- [ ] Apple developer setup
- [ ] Safari-specific QA
- [ ] Apple review assets and metadata

## Risks

- LinkedIn changes its DOM often, so selector resilience and regression testing are critical.
- Regex-based filtering can create false positives unless exclusions and plain-keyword mode are added.
- Cross-browser packaging differences can create release friction if not isolated early.
- Safari support is feasible, but the packaging and review process is materially different from the other browsers.

## Release Order Recommendation

1. Firefox
2. Chrome
3. Edge
4. Brave and Opera via Chromium compatibility
5. Safari

## Immediate Next Steps

- [ ] Convert the current PoC into a structured `src/` layout.
- [ ] Add user-selectable highlight or hide mode.
- [ ] Build an options page.
- [ ] Add tests around matching and LinkedIn fixtures.
- [ ] Add packaging for Firefox and Chrome first.
