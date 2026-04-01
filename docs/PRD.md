# Product Requirements Document

## Product

LinkedIn AI Feed Filter

## Objective

Give users control over AI-related content in their LinkedIn desktop feed by filtering posts locally in the browser based on user-defined rules.

## Problem

Users who do not want to see AI-related content on LinkedIn have no lightweight, user-controlled filtering tool. LinkedIn does not provide a targeted content filter for this use case.

## Target User

- LinkedIn desktop users
- Users who want to reduce AI-related content in their feed
- Users comfortable with simple browser settings, but not necessarily regex experts

## v1 Goals

- Filter LinkedIn desktop feed content in-browser
- Support AI-content matching using configurable rules
- Let users choose what happens to matched posts
- Keep all filtering local to the browser
- Ship on Firefox, Chrome, and Edge

## v1 Non-Goals

- Mobile browser support
- LinkedIn native mobile app support
- Cloud sync of settings
- Shared team configuration
- Advanced analytics
- Multi-site support beyond LinkedIn

## Supported Browsers

### Launch browsers

- Firefox
- Chrome
- Edge

### Follow-up browsers

- Brave via Chromium compatibility
- Opera via Chromium compatibility
- Safari as a separate packaging and review stream

## Core User Stories

- As a user, I can install the extension and immediately filter common AI-related posts.
- As a user, I can add my own regex or plain keyword rules.
- As a user, I can exclude terms to reduce false positives.
- As a user, I can choose whether matched posts are highlighted or hidden.
- As a user, I can undo a hidden post without reloading the page.
- As a user, I can understand which rule matched a post.

## v1 Feature Set

### Filtering

- Match LinkedIn feed posts against:
  - regex rules
  - plain keyword rules
- Support include and exclude lists
- Support case sensitivity toggle

### Matched Post Actions

- `Highlight` mode
  - apply yellow highlight to matched posts
  - default mode for first release
- `Hide` mode
  - collapse or hide matched posts
  - provide inline undo control

### Settings

- Enable or disable extension quickly from popup
- Full configuration in options page
- Reset defaults
- Import and export settings

### UX

- First-run onboarding
- Visible matched-state indicator
- Rule-level explanation for matched posts where feasible

## Settings Model

The extension will store a structured settings object with:

- `enabled`
- `mode`
  - `highlight`
  - `hide`
- `regex_rules`
- `keyword_rules`
- `exclude_rules`
- `case_sensitive`
- `site_settings`

## Privacy Requirements

- All filtering must happen locally in the browser.
- No remote code execution.
- No collection of post content off-device.
- Minimal permissions only.
- If telemetry is ever added, it must be opt-in and privacy-preserving.

## Technical Direction

- Shared WebExtension codebase for Firefox and Chromium browsers
- Browser-specific packaging only where required
- Safari handled after the shared codebase is stable

## Success Criteria For v1

- User can install the extension in a supported browser and filter LinkedIn feed posts without editing code.
- The extension works on standard feed variants and lazy-loaded content.
- The extension passes Firefox and Chromium QA for release-critical flows.
- Store submission assets and privacy documentation are complete.

## Release Decision

### Match action model

v1 will support both `highlight` and `hide` modes.

- Default mode: `highlight`
- Secondary mode: `hide`
- Hidden posts must support an inline undo action

This keeps first-run behavior safe while still supporting the stronger filtering behavior users are likely to want.
