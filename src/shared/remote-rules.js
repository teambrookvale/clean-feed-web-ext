(() => {
  const { LOCAL_DISCOVERY_RULES } = globalThis.LinkedInAIFilterDiscoveryRules;
  const { getInstallationId } = globalThis.LinkedInAIFilterStorage;

  const RULES_STORAGE_KEY = "activeDiscoveryRules";
  const LAST_GOOD_REMOTE_RULES_KEY = "lastKnownGoodRemoteRules";
  const RULES_DIAGNOSTICS_KEY = "rulesDiagnostics";
  const RULES_REFRESH_TTL_MS = 6 * 60 * 60 * 1000;
  const REMOTE_RULES_URL = "https://linkedin-ai-feed-filter-rules.r2.dev/discovery-rules.json";
  const ROLLOUT_CHANNEL = "stable";
  const SUPPORTED_SCHEMA_VERSION = 1;

  const PUBLIC_KEY_JWK = {
    crv: "P-256",
    ext: true,
    key_ops: ["verify"],
    kty: "EC",
    x: "MKBCTNI8L2zXf8xH2vRazS4HOXEusGIE2jkTBxyq0q4",
    y: "4Etl6SR8XIiQunlslqY5T2r8j04YfGLmRoTSesQxFDQ"
  };

  async function initializeRules() {
    const activeRules = await getStoredActiveRules();
    const diagnostics = await getRulesDiagnostics();

    if (Date.now() - diagnostics.last_fetch_attempt_at >= RULES_REFRESH_TTL_MS) {
      refreshRemoteRules({ manual: false }).catch((error) => {
        console.warn("Remote discovery rules refresh failed:", error);
      });
    }

    return activeRules;
  }

  async function refreshRemoteRules({ manual }) {
    const currentDiagnostics = await getRulesDiagnostics();
    const nextDiagnostics = {
      ...currentDiagnostics,
      last_fetch_attempt_at: Date.now(),
      last_error: null,
      remote_url: REMOTE_RULES_URL
    };

    await saveRulesDiagnostics(nextDiagnostics);

    try {
      const response = await fetch(REMOTE_RULES_URL, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Rules fetch failed with status ${response.status}`);
      }

      const candidateRules = await response.json();
      await validateRemoteRules(candidateRules);

      const eligible = await isRolloutEligible(candidateRules.rollout);

      if (!eligible) {
        await saveRulesDiagnostics({
          ...nextDiagnostics,
          active_source: currentDiagnostics.active_source,
          active_version: currentDiagnostics.active_version,
          last_error: "Remote rules fetched but not enabled for this rollout bucket."
        });
        return { applied: false, activeRules: await getStoredActiveRules() };
      }

      await browser.storage.local.set({
        [RULES_STORAGE_KEY]: stripRemoteSignature(candidateRules),
        [LAST_GOOD_REMOTE_RULES_KEY]: stripRemoteSignature(candidateRules)
      });

      await saveRulesDiagnostics({
        ...nextDiagnostics,
        active_source: "remote",
        active_version: candidateRules.rules_version,
        last_successful_refresh_at: Date.now(),
        last_error: null
      });

      return {
        applied: true,
        activeRules: stripRemoteSignature(candidateRules)
      };
    } catch (error) {
      const fallbackRules = await getFallbackRules();
      await browser.storage.local.set({
        [RULES_STORAGE_KEY]: fallbackRules
      });

      await saveRulesDiagnostics({
        ...nextDiagnostics,
        active_source: fallbackRules.rules_version === LOCAL_DISCOVERY_RULES.rules_version ? "packaged" : "cached_remote",
        active_version: fallbackRules.rules_version,
        last_error: error.message
      });

      return {
        applied: false,
        activeRules: fallbackRules,
        error
      };
    }
  }

  async function getStoredActiveRules() {
    const stored = await browser.storage.local.get(RULES_STORAGE_KEY);
    const rules = validateLocalShape(stored[RULES_STORAGE_KEY]) ? stored[RULES_STORAGE_KEY] : LOCAL_DISCOVERY_RULES;

    if (!stored[RULES_STORAGE_KEY]) {
      await browser.storage.local.set({
        [RULES_STORAGE_KEY]: rules
      });
      await ensureDiagnosticsSeed(rules);
    }

    return rules;
  }

  async function getFallbackRules() {
    const stored = await browser.storage.local.get(LAST_GOOD_REMOTE_RULES_KEY);
    if (validateLocalShape(stored[LAST_GOOD_REMOTE_RULES_KEY])) {
      return stored[LAST_GOOD_REMOTE_RULES_KEY];
    }

    return LOCAL_DISCOVERY_RULES;
  }

  async function getRulesDiagnostics() {
    const stored = await browser.storage.local.get(RULES_DIAGNOSTICS_KEY);
    if (stored[RULES_DIAGNOSTICS_KEY]) {
      return stored[RULES_DIAGNOSTICS_KEY];
    }

    const initialDiagnostics = {
      active_source: "packaged",
      active_version: LOCAL_DISCOVERY_RULES.rules_version,
      last_fetch_attempt_at: 0,
      last_successful_refresh_at: 0,
      last_error: null,
      remote_url: REMOTE_RULES_URL
    };

    await saveRulesDiagnostics(initialDiagnostics);
    return initialDiagnostics;
  }

  async function saveRulesDiagnostics(diagnostics) {
    await browser.storage.local.set({
      [RULES_DIAGNOSTICS_KEY]: diagnostics
    });
  }

  async function ensureDiagnosticsSeed(rules) {
    const stored = await browser.storage.local.get(RULES_DIAGNOSTICS_KEY);
    if (stored[RULES_DIAGNOSTICS_KEY]) {
      return;
    }

    await saveRulesDiagnostics({
      active_source: rules.rules_version === LOCAL_DISCOVERY_RULES.rules_version ? "packaged" : "cached_remote",
      active_version: rules.rules_version,
      last_fetch_attempt_at: 0,
      last_successful_refresh_at: 0,
      last_error: null,
      remote_url: REMOTE_RULES_URL
    });
  }

  async function validateRemoteRules(rules) {
    if (!rules || typeof rules !== "object") {
      throw new Error("Rules payload is not an object.");
    }

    if (!rules.signature || typeof rules.signature !== "string") {
      throw new Error("Rules payload is missing a signature.");
    }

    if (rules.schema_version !== SUPPORTED_SCHEMA_VERSION) {
      throw new Error(`Unsupported rules schema version: ${rules.schema_version}`);
    }

    validateLocalShape(stripRemoteSignature(rules), true);

    const verified = await verifySignature(rules);
    if (!verified) {
      throw new Error("Rules signature verification failed.");
    }
  }

  function validateLocalShape(rules, throwOnFailure = false) {
    const valid = Boolean(
      rules &&
      typeof rules === "object" &&
      typeof rules.rules_version === "string" &&
      Array.isArray(rules.discovery_rules?.post_selectors) &&
      rules.discovery_rules.post_selectors.every(isNonEmptyString) &&
      Array.isArray(rules.extraction_rules?.text_selectors) &&
      rules.extraction_rules.text_selectors.every(isNonEmptyString)
    );

    if (!valid && throwOnFailure) {
      throw new Error("Rules payload failed schema validation.");
    }

    return valid;
  }

  function stripRemoteSignature(rules) {
    const { signature, ...unsignedRules } = rules;
    return unsignedRules;
  }

  async function verifySignature(rules) {
    const encoder = new TextEncoder();
    const unsignedPayload = canonicalStringify(stripRemoteSignature(rules));
    const signatureBytes = base64ToBytes(rules.signature);

    const key = await crypto.subtle.importKey(
      "jwk",
      PUBLIC_KEY_JWK,
      {
        name: "ECDSA",
        namedCurve: "P-256"
      },
      false,
      ["verify"]
    );

    return crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: "SHA-256"
      },
      key,
      signatureBytes,
      encoder.encode(unsignedPayload)
    );
  }

  async function isRolloutEligible(rollout) {
    if (!rollout || rollout.channel !== ROLLOUT_CHANNEL) {
      return false;
    }

    const percentage = Number(rollout.percentage);
    if (!Number.isFinite(percentage) || percentage <= 0) {
      return false;
    }

    if (percentage >= 100) {
      return true;
    }

    const installationId = await getInstallationId();
    const bucket = stableBucket(installationId);
    return bucket < percentage;
  }

  function stableBucket(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
    }
    return Math.abs(hash) % 100;
  }

  function canonicalStringify(value) {
    if (Array.isArray(value)) {
      return `[${value.map(canonicalStringify).join(",")}]`;
    }

    if (value && typeof value === "object") {
      return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
    }

    return JSON.stringify(value);
  }

  function base64ToBytes(base64) {
    const normalized = base64.replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
    const binary = atob(`${normalized}${padding}`);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }

  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  globalThis.LinkedInAIFilterRemoteRules = {
    REMOTE_RULES_URL,
    getRulesDiagnostics,
    initializeRules,
    refreshRemoteRules
  };
})();
