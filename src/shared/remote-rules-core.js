((root, factory) => {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.LinkedInAIFilterRemoteRulesCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const SUPPORTED_SCHEMA_VERSION = 1;
  const ROLLOUT_CHANNEL = "stable";

  function createInitialDiagnostics(localRulesVersion, remoteUrl) {
    return {
      active_source: "packaged",
      active_version: localRulesVersion,
      last_fetch_attempt_at: 0,
      last_successful_refresh_at: 0,
      last_error: null,
      remote_url: remoteUrl
    };
  }

  function createFetchAttemptDiagnostics(currentDiagnostics, remoteUrl, now) {
    return {
      ...currentDiagnostics,
      last_fetch_attempt_at: now,
      last_error: null,
      remote_url: remoteUrl
    };
  }

  function createRolloutIneligibleDiagnostics(currentDiagnostics, nextDiagnostics) {
    return {
      ...nextDiagnostics,
      active_source: currentDiagnostics.active_source,
      active_version: currentDiagnostics.active_version,
      last_error: "Remote rules fetched but not enabled for this rollout bucket."
    };
  }

  function createAppliedDiagnostics(nextDiagnostics, rulesVersion, now) {
    return {
      ...nextDiagnostics,
      active_source: "remote",
      active_version: rulesVersion,
      last_successful_refresh_at: now,
      last_error: null
    };
  }

  function createFallbackDiagnostics(nextDiagnostics, fallbackRules, localRulesVersion, errorMessage) {
    return {
      ...nextDiagnostics,
      active_source: fallbackRules.rules_version === localRulesVersion ? "packaged" : "cached_remote",
      active_version: fallbackRules.rules_version,
      last_error: errorMessage
    };
  }

  function validateRemoteRules(rules, verifySignature) {
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

    if (!verifySignature(rules)) {
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

  function isRolloutEligible(rollout, installationId) {
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

    return stableBucket(installationId) < percentage;
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

  return {
    SUPPORTED_SCHEMA_VERSION,
    base64ToBytes,
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
  };
});
