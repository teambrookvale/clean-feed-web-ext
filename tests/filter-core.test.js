const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  createCompiledSettings,
  discoverPosts,
  extractPostText,
  matchesConfiguredRules
} = require("../src/shared/filter-core.js");
const { parseHtml } = require("./support/simple-dom.js");

const { LOCAL_DISCOVERY_RULES } = loadLocalDiscoveryRules();

test("discovers posts from the main feed fixture", () => {
  const document = loadFixture("linkedin-main-feed.html");
  const posts = discoverPosts(document, LOCAL_DISCOVERY_RULES);

  assert.equal(posts.length, 2);
  assert.match(extractPostText(posts[0], LOCAL_DISCOVERY_RULES), /AI recruiting tools/i);
});

test("extracts text with innerText fallback when no selector matches", () => {
  const document = loadFixture("linkedin-main-fallback.html");
  const [post] = discoverPosts(document, LOCAL_DISCOVERY_RULES);

  assert.ok(post);
  assert.match(extractPostText(post, LOCAL_DISCOVERY_RULES), /full post should still be read/i);
});

test("discovers posts in a role=main group feed variant", () => {
  const document = loadFixture("linkedin-group-feed.html");
  const posts = discoverPosts(document, LOCAL_DISCOVERY_RULES);

  assert.equal(posts.length, 2);
  assert.match(extractPostText(posts[0], LOCAL_DISCOVERY_RULES), /Claude and GPT-4\.1/i);
});

test("matches regex, keyword, and exclusion rules correctly", () => {
  const settings = createCompiledSettings({
    enabled: true,
    mode: "highlight",
    regexRules: ["\\bai\\b"],
    keywordRules: ["copilot"],
    excludeRules: ["\\bsponsored\\b"],
    caseSensitive: false
  });

  assert.equal(matchesConfiguredRules("The AI tooling roadmap is live.", settings), true);
  assert.equal(matchesConfiguredRules("Copilot shipped another update.", settings), true);
  assert.equal(matchesConfiguredRules("Sponsored AI update from a vendor.", settings), false);
  assert.equal(matchesConfiguredRules("Quarterly planning workshop.", settings), false);
});

test("respects case-sensitive settings", () => {
  const settings = createCompiledSettings({
    enabled: true,
    mode: "highlight",
    regexRules: ["AI"],
    keywordRules: ["Claude"],
    excludeRules: [],
    caseSensitive: true
  });

  assert.equal(matchesConfiguredRules("AI adoption is rising.", settings), true);
  assert.equal(matchesConfiguredRules("ai adoption is rising.", settings), false);
  assert.equal(matchesConfiguredRules("Claude shipped a new feature.", settings), true);
  assert.equal(matchesConfiguredRules("claude shipped a new feature.", settings), false);
});

function loadFixture(name) {
  const filePath = path.join(__dirname, "fixtures", name);
  return parseHtml(fs.readFileSync(filePath, "utf8"));
}

function loadLocalDiscoveryRules() {
  const filePath = path.join(__dirname, "..", "src", "shared", "discovery-rules.js");
  const source = fs.readFileSync(filePath, "utf8");
  const LOCAL_DISCOVERY_RULES = {};
  const globalThis = {};

  // Evaluate the bundled browser script in a narrow CommonJS-friendly scope.
  // eslint-disable-next-line no-new-func
  new Function("globalThis", `${source}; return globalThis.LinkedInAIFilterDiscoveryRules;`)(globalThis);
  return globalThis.LinkedInAIFilterDiscoveryRules;
}
