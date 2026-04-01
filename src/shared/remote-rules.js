(() => {
  const { LOCAL_DISCOVERY_RULES } = globalThis.LinkedInAIFilterDiscoveryRules;
  const { getInstallationId } = globalThis.LinkedInAIFilterStorage;
  const {
    base64ToBytes,
    canonicalStringify,
    createAppliedDiagnostics,
    createFallbackDiagnostics,
    createFetchAttemptDiagnostics,
    createInitialDiagnostics,
    createRolloutIneligibleDiagnostics,
    isRolloutEligible,
    stripRemoteSignature,
    validateLocalShape,
    validateRemoteRules
  } = globalThis.LinkedInAIFilterRemoteRulesCore;

  const RULES_STORAGE_KEY = "activeDiscoveryRules";
  const LAST_GOOD_REMOTE_RULES_KEY = "lastKnownGoodRemoteRules";
  const RULES_DIAGNOSTICS_KEY = "rulesDiagnostics";
  const RULES_REFRESH_TTL_MS = 6 * 60 * 60 * 1000;
  const REMOTE_RULES_URL = "https://linkedin-ai-feed-filter-rules.r2.dev/discovery-rules.json";

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
    const nextDiagnostics = createFetchAttemptDiagnostics(currentDiagnostics, REMOTE_RULES_URL, Date.now());

    await saveRulesDiagnostics(nextDiagnostics);

    try {
      const response = await fetch(REMOTE_RULES_URL, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Rules fetch failed with status ${response.status}`);
      }

      const candidateRules = await response.json();
      await validateRemoteRules(candidateRules, verifySignature);

      const eligible = await isRolloutEligibleForInstallation(candidateRules.rollout);

      if (!eligible) {
        await saveRulesDiagnostics(createRolloutIneligibleDiagnostics(currentDiagnostics, nextDiagnostics));
        return { applied: false, activeRules: await getStoredActiveRules() };
      }

      await browser.storage.local.set({
        [RULES_STORAGE_KEY]: stripRemoteSignature(candidateRules),
        [LAST_GOOD_REMOTE_RULES_KEY]: stripRemoteSignature(candidateRules)
      });

      await saveRulesDiagnostics(createAppliedDiagnostics(nextDiagnostics, candidateRules.rules_version, Date.now()));

      return {
        applied: true,
        activeRules: stripRemoteSignature(candidateRules)
      };
    } catch (error) {
      const fallbackRules = await getFallbackRules();
      await browser.storage.local.set({
        [RULES_STORAGE_KEY]: fallbackRules
      });

      await saveRulesDiagnostics(
        createFallbackDiagnostics(nextDiagnostics, fallbackRules, LOCAL_DISCOVERY_RULES.rules_version, error.message)
      );

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

    const initialDiagnostics = createInitialDiagnostics(LOCAL_DISCOVERY_RULES.rules_version, REMOTE_RULES_URL);

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

    await saveRulesDiagnostics(
      createFallbackDiagnostics(
        createInitialDiagnostics(LOCAL_DISCOVERY_RULES.rules_version, REMOTE_RULES_URL),
        rules,
        LOCAL_DISCOVERY_RULES.rules_version,
        null
      )
    );
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

  async function isRolloutEligibleForInstallation(rollout) {
    const installationId = await getInstallationId();
    return isRolloutEligible(rollout, installationId);
  }

  globalThis.LinkedInAIFilterRemoteRules = {
    REMOTE_RULES_URL,
    getRulesDiagnostics,
    initializeRules,
    refreshRemoteRules
  };
})();
