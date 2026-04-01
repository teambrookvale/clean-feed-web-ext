# Smoke Test

Use this checklist against the current local build before packaging or release.

## Build

1. Run `npm run build`.
2. Confirm both outputs exist:
   - `dist/firefox/manifest.json`
   - `dist/chromium/manifest.json`

## Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Load `dist/firefox/manifest.json` as a temporary add-on.
3. Open a LinkedIn feed page.
4. Open the extension popup.
5. Confirm the popup opens without errors.
6. Open the full settings page from the popup.

Verify:

- filtering can be enabled and disabled
- settings persist after closing and reopening the popup
- settings persist after reloading the LinkedIn tab
- highlight mode visibly marks matching posts
- hide mode hides matching posts
- hide mode undo restores a hidden post
- regex rules save and apply
- keyword rules save and apply
- exclusion regex rules prevent expected matches
- remote rules refresh completes without breaking filtering

## Chromium

1. Open the browser extensions page.
2. Enable developer mode.
3. Load `dist/chromium/` as an unpacked extension.
4. Open a LinkedIn feed page.
5. Open the extension popup.
6. Open the full settings page from the popup.

Verify:

- filtering can be enabled and disabled
- settings persist after closing and reopening the popup
- settings persist after reloading the LinkedIn tab
- highlight mode visibly marks matching posts
- hide mode hides matching posts
- hide mode undo restores a hidden post
- regex rules save and apply
- keyword rules save and apply
- exclusion regex rules prevent expected matches
- remote rules refresh completes without breaking filtering

## Suggested Test Inputs

Use a small set of rules so behavior is obvious:

- regex rule: `\\bai\\b`
- keyword rule: `copilot`
- exclusion rule: `\\bsponsored\\b`

## Failure Checks

If filtering does not work:

1. Reload the extension.
2. Hard-refresh the LinkedIn tab.
3. Check the page console for errors from:
   - `src/shared/remote-rules.js`
   - `src/shared/remote-rules-core.js`
   - `src/content/index.js`
4. Confirm matched posts receive the `linkedin-ai-feed-filter-match` class in highlight mode.
5. Confirm hidden posts receive the `linkedin-ai-feed-filter-hidden` class in hide mode.
