const test = require("node:test");
const assert = require("node:assert/strict");

const {
  canonicalStringify,
  createAppliedDiagnostics,
  createFallbackDiagnostics,
  createFetchAttemptDiagnostics,
  createInitialDiagnostics,
  createRolloutIneligibleDiagnostics,
  isRolloutEligible,
  stableBucket,
  stripRemoteSignature,
  validateLocalShape,
  validateRemoteRules
} = require("../src/shared/remote-rules-core.js");

test("accepts a valid signed remote rules payload", () => {
  const payload = createSignedPayload();

  assert.doesNotThrow(() => {
    validateRemoteRules(payload, () => true);
  });
});

test("rejects a payload with a bad signature", () => {
  const payload = createSignedPayload();

  assert.throws(() => {
    validateRemoteRules(payload, () => false);
  }, /signature verification failed/i);
});

test("rejects a payload with an unsupported schema", () => {
  const payload = {
    ...createSignedPayload(),
    schema_version: 2
  };

  assert.throws(() => {
    validateRemoteRules(payload, () => true);
  }, /unsupported rules schema version/i);
});

test("rejects a payload with an invalid local rules shape", () => {
  const payload = {
    ...createSignedPayload(),
    extraction_rules: {
      text_selectors: [""]
    }
  };

  assert.throws(() => {
    validateRemoteRules(payload, () => true);
  }, /failed schema validation/i);
});

test("validates rollout eligibility deterministically", () => {
  const installationId = "installation-123";
  const bucket = stableBucket(installationId);

  assert.equal(isRolloutEligible({ channel: "stable", percentage: 100 }, installationId), true);
  assert.equal(isRolloutEligible({ channel: "beta", percentage: 100 }, installationId), false);
  assert.equal(isRolloutEligible({ channel: "stable", percentage: 0 }, installationId), false);
  assert.equal(
    isRolloutEligible({ channel: "stable", percentage: bucket + 1 }, installationId),
    true
  );
  assert.equal(
    isRolloutEligible({ channel: "stable", percentage: bucket }, installationId),
    false
  );
});

test("creates diagnostics for initial, fetch, applied, rollout-ineligible, and fallback states", () => {
  const initial = createInitialDiagnostics("local-2026-04-01", "https://example.test/rules.json");
  const fetchAttempt = createFetchAttemptDiagnostics(initial, "https://example.test/rules.json", 12345);
  const applied = createAppliedDiagnostics(fetchAttempt, "remote-2026-04-02", 23456);
  const ineligible = createRolloutIneligibleDiagnostics(applied, fetchAttempt);
  const fallback = createFallbackDiagnostics(
    fetchAttempt,
    { rules_version: "cached-2026-04-01" },
    "local-2026-04-01",
    "network down"
  );

  assert.deepEqual(initial, {
    active_source: "packaged",
    active_version: "local-2026-04-01",
    last_fetch_attempt_at: 0,
    last_successful_refresh_at: 0,
    last_error: null,
    remote_url: "https://example.test/rules.json"
  });
  assert.equal(fetchAttempt.last_fetch_attempt_at, 12345);
  assert.equal(fetchAttempt.last_error, null);
  assert.equal(applied.active_source, "remote");
  assert.equal(applied.active_version, "remote-2026-04-02");
  assert.equal(applied.last_successful_refresh_at, 23456);
  assert.equal(ineligible.active_source, "remote");
  assert.equal(ineligible.active_version, "remote-2026-04-02");
  assert.match(ineligible.last_error, /not enabled for this rollout bucket/i);
  assert.equal(fallback.active_source, "cached_remote");
  assert.equal(fallback.active_version, "cached-2026-04-01");
  assert.equal(fallback.last_error, "network down");
});

test("marks packaged fallback correctly when cached rules are unavailable", () => {
  const diagnostics = createFallbackDiagnostics(
    createFetchAttemptDiagnostics(
      createInitialDiagnostics("local-2026-04-01", "https://example.test/rules.json"),
      "https://example.test/rules.json",
      12345
    ),
    { rules_version: "local-2026-04-01" },
    "local-2026-04-01",
    "signature failure"
  );

  assert.equal(diagnostics.active_source, "packaged");
  assert.equal(diagnostics.active_version, "local-2026-04-01");
});

test("canonicalStringify is stable across object key order", () => {
  const left = canonicalStringify({
    b: 2,
    a: {
      d: 4,
      c: 3
    }
  });
  const right = canonicalStringify({
    a: {
      c: 3,
      d: 4
    },
    b: 2
  });

  assert.equal(left, right);
});

test("stripRemoteSignature removes only the signature field", () => {
  const payload = createSignedPayload();
  const stripped = stripRemoteSignature(payload);

  assert.equal("signature" in stripped, false);
  assert.equal(stripped.rules_version, payload.rules_version);
});

test("validateLocalShape accepts the packaged local discovery rules shape", () => {
  assert.equal(validateLocalShape(stripRemoteSignature(createSignedPayload())), true);
});

function createSignedPayload() {
  return {
    schema_version: 1,
    rules_version: "remote-2026-04-02",
    published_at: "2026-04-02T00:00:00.000Z",
    rollout: {
      channel: "stable",
      percentage: 100
    },
    discovery_rules: {
      post_selectors: [
        '[role="main"] [role="listitem"]'
      ],
      candidate_container_selectors: [
        '[role="main"]'
      ]
    },
    extraction_rules: {
      text_selectors: [
        '[data-testid="expandable-text-box"]',
        "p"
      ]
    },
    signature: "ZmFrZS1zaWduYXR1cmU"
  };
}
