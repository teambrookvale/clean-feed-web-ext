# LinkedIn AI Feed Filter

Cross-browser browser extension PoC that scans the LinkedIn feed, matches posts against regex keywords, and highlights matching posts with a yellow background.

## Features

- Shared WebExtension source layout for Firefox and Chromium browsers
- Regex-based keyword matching
- Yellow highlight for matching feed posts
- Popup UI to edit regex patterns without code changes
- Live rescanning when LinkedIn lazy-loads more posts

## Build

The project uses dependency-free Node scripts for local builds and packaging.

```sh
npm run build
npm run package
```

Build output:

- `dist/firefox/`
- `dist/chromium/`

Package output:

- `dist/linkedin-ai-feed-filter-firefox.zip`
- `dist/linkedin-ai-feed-filter-chromium.zip`

## Load the extension in Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click `Load Temporary Add-on...`
3. Select [dist/firefox/manifest.json](/Users/Ed/Development/linkedin-firefox-filter/dist/firefox/manifest.json) after running `npm run build`
4. Open LinkedIn feed pages under `https://www.linkedin.com/`

## Load the extension in Chrome or Edge

1. Run `npm run build`
2. Open the browser's extensions page
3. Enable developer mode
4. Click "Load unpacked"
5. Select [dist/chromium](/Users/Ed/Development/linkedin-firefox-filter/dist/chromium)

## Default patterns

The popup starts with a small set of AI-related regexes, including:

- `\bai\b`
- `\bartificial intelligence\b`
- `\bgenerative ai\b`
- `\bllm\b`
- `\bchatgpt\b`
- `\bclaude\b`

## Notes

- This PoC highlights posts rather than hiding them.
- Invalid regex lines entered in the popup are rejected on save.
- LinkedIn changes its DOM often, so selectors may need adjustment later.
