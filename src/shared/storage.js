(() => {
  const { DEFAULT_PATTERNS } = globalThis.LinkedInAIFilterDefaults;

  const INSTALLATION_ID_KEY = "installationId";
  const LEGACY_REGEX_PATTERNS_KEY = "regexPatterns";
  const SETTINGS_STORAGE_KEY = "filterSettings";

  const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    mode: "highlight",
    regexRules: [...DEFAULT_PATTERNS],
    keywordRules: [],
    excludeRules: [],
    caseSensitive: false
  });

  async function getSettings() {
    const stored = await browser.storage.local.get([SETTINGS_STORAGE_KEY, LEGACY_REGEX_PATTERNS_KEY]);
    const settings = normalizeSettings(stored[SETTINGS_STORAGE_KEY], stored[LEGACY_REGEX_PATTERNS_KEY]);

    if (!stored[SETTINGS_STORAGE_KEY] || !sameSettings(stored[SETTINGS_STORAGE_KEY], settings)) {
      await browser.storage.local.set({
        [SETTINGS_STORAGE_KEY]: settings
      });
    }

    if (!Array.isArray(stored[LEGACY_REGEX_PATTERNS_KEY])) {
      await browser.storage.local.set({
        [LEGACY_REGEX_PATTERNS_KEY]: settings.regexRules
      });
    }

    return cloneSettings(settings);
  }

  async function saveSettings(nextSettings) {
    const settings = normalizeSettings(nextSettings);
    const validation = validateSettings(settings);

    if (!validation.valid) {
      throw new Error(validation.errors[0]);
    }

    await browser.storage.local.set({
      [SETTINGS_STORAGE_KEY]: settings,
      [LEGACY_REGEX_PATTERNS_KEY]: settings.regexRules
    });

    return cloneSettings(settings);
  }

  async function resetSettings() {
    return saveSettings(DEFAULT_SETTINGS);
  }

  function splitLines(rawValue) {
    return String(rawValue || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function getInvalidPatterns(patterns, caseSensitive = false) {
    const flags = caseSensitive ? "" : "i";

    return patterns.filter((pattern) => {
      try {
        new RegExp(pattern, flags);
        return false;
      } catch {
        return true;
      }
    });
  }

  function validateSettings(settings) {
    const errors = [];

    if (!isBoolean(settings.enabled)) {
      errors.push("Enabled must be a boolean.");
    }

    if (!["highlight", "hide"].includes(settings.mode)) {
      errors.push("Mode must be either highlight or hide.");
    }

    if (!isBoolean(settings.caseSensitive)) {
      errors.push("Case sensitivity must be a boolean.");
    }

    if (!Array.isArray(settings.regexRules)) {
      errors.push("Regex rules must be an array.");
    }

    if (!Array.isArray(settings.keywordRules)) {
      errors.push("Keyword rules must be an array.");
    }

    if (!Array.isArray(settings.excludeRules)) {
      errors.push("Exclude rules must be an array.");
    }

    if (errors.length === 0) {
      const invalidRegexRules = getInvalidPatterns(settings.regexRules, settings.caseSensitive);
      const invalidExcludeRules = getInvalidPatterns(settings.excludeRules, settings.caseSensitive);

      if (invalidRegexRules.length > 0) {
        errors.push(`Invalid regex rule: ${invalidRegexRules[0]}`);
      }

      if (invalidExcludeRules.length > 0) {
        errors.push(`Invalid exclusion rule: ${invalidExcludeRules[0]}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function normalizeSettings(rawSettings, legacyRegexPatterns) {
    const baseSettings = rawSettings && typeof rawSettings === "object" ? rawSettings : {};
    const fallbackRegexRules = Array.isArray(legacyRegexPatterns) && legacyRegexPatterns.length > 0
      ? legacyRegexPatterns
      : DEFAULT_SETTINGS.regexRules;

    return {
      enabled: isBoolean(baseSettings.enabled) ? baseSettings.enabled : DEFAULT_SETTINGS.enabled,
      mode: ["highlight", "hide"].includes(baseSettings.mode) ? baseSettings.mode : DEFAULT_SETTINGS.mode,
      regexRules: normalizeRuleList(baseSettings.regexRules, fallbackRegexRules),
      keywordRules: normalizeRuleList(baseSettings.keywordRules, DEFAULT_SETTINGS.keywordRules),
      excludeRules: normalizeRuleList(baseSettings.excludeRules, DEFAULT_SETTINGS.excludeRules),
      caseSensitive: isBoolean(baseSettings.caseSensitive) ? baseSettings.caseSensitive : DEFAULT_SETTINGS.caseSensitive
    };
  }

  function normalizeRuleList(value, fallback) {
    if (!Array.isArray(value)) {
      return [...fallback];
    }

    return [...new Set(
      value
        .map((entry) => String(entry || "").trim())
        .filter(Boolean)
    )];
  }

  function cloneSettings(settings) {
    return {
      enabled: settings.enabled,
      mode: settings.mode,
      regexRules: [...settings.regexRules],
      keywordRules: [...settings.keywordRules],
      excludeRules: [...settings.excludeRules],
      caseSensitive: settings.caseSensitive
    };
  }

  function sameSettings(left, right) {
    try {
      return JSON.stringify(normalizeSettings(left)) === JSON.stringify(normalizeSettings(right));
    } catch {
      return false;
    }
  }

  function isBoolean(value) {
    return typeof value === "boolean";
  }

  async function getInstallationId() {
    const stored = await browser.storage.local.get(INSTALLATION_ID_KEY);
    if (typeof stored[INSTALLATION_ID_KEY] === "string" && stored[INSTALLATION_ID_KEY].length > 0) {
      return stored[INSTALLATION_ID_KEY];
    }

    const installationId = crypto.randomUUID();
    await browser.storage.local.set({
      [INSTALLATION_ID_KEY]: installationId
    });
    return installationId;
  }

  globalThis.LinkedInAIFilterStorage = {
    DEFAULT_SETTINGS,
    SETTINGS_STORAGE_KEY,
    getInstallationId,
    getInvalidPatterns,
    getSettings,
    resetSettings,
    saveSettings,
    splitLines,
    validateSettings
  };
})();
