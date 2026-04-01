(() => {
  const {
    DEFAULT_SETTINGS,
    getSettings,
    resetSettings,
    saveSettings,
    splitLines,
    validateSettings
  } = globalThis.LinkedInAIFilterStorage;
  const { getRulesDiagnostics, refreshRemoteRules } = globalThis.LinkedInAIFilterRemoteRules;

  const enabledField = document.getElementById("enabled");
  const modeField = document.getElementById("mode");
  const caseSensitiveField = document.getElementById("case-sensitive");
  const regexRulesField = document.getElementById("regex-rules");
  const keywordRulesField = document.getElementById("keyword-rules");
  const excludeRulesField = document.getElementById("exclude-rules");
  const saveButton = document.getElementById("save");
  const resetButton = document.getElementById("reset");
  const exportButton = document.getElementById("export-settings");
  const importButton = document.getElementById("import-settings");
  const importFileField = document.getElementById("import-file");
  const refreshRulesButton = document.getElementById("refresh-rules");
  const rulesSourceField = document.getElementById("rules-source");
  const rulesVersionField = document.getElementById("rules-version");
  const rulesSuccessField = document.getElementById("rules-success");
  const rulesErrorField = document.getElementById("rules-error");
  const statusField = document.getElementById("status");

  init();

  async function init() {
    renderSettings(await getSettings());
    renderDiagnostics(await getRulesDiagnostics());

    browser.storage.onChanged.addListener(async (changes, areaName) => {
      if (areaName !== "local") {
        return;
      }

      if (changes.filterSettings?.newValue) {
        renderSettings(changes.filterSettings.newValue);
      }

      if (changes.rulesDiagnostics?.newValue) {
        renderDiagnostics(changes.rulesDiagnostics.newValue);
      }
    });
  }

  saveButton.addEventListener("click", async () => {
    const candidate = readSettingsFromForm();
    const validation = validateSettings(candidate);

    if (!validation.valid) {
      setStatus(validation.errors[0]);
      return;
    }

    await saveSettings(candidate);
    setStatus("Settings saved");
  });

  resetButton.addEventListener("click", async () => {
    const settings = await resetSettings();
    renderSettings(settings);
    setStatus("Defaults restored");
  });

  exportButton.addEventListener("click", async () => {
    const settings = await getSettings();
    const blob = new Blob([`${JSON.stringify(settings, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "linkedin-ai-feed-filter-settings.json";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setStatus("Settings exported");
  });

  importButton.addEventListener("click", () => {
    importFileField.click();
  });

  importFileField.addEventListener("change", async () => {
    const [file] = importFileField.files || [];
    if (!file) {
      return;
    }

    try {
      const rawText = await file.text();
      const parsed = JSON.parse(rawText);
      const settings = await saveSettings(parsed);
      renderSettings(settings);
      setStatus("Settings imported");
    } catch (error) {
      setStatus(`Import failed: ${error.message}`);
    } finally {
      importFileField.value = "";
    }
  });

  refreshRulesButton.addEventListener("click", async () => {
    refreshRulesButton.disabled = true;
    setStatus("Refreshing discovery rules...");

    try {
      const result = await refreshRemoteRules({ manual: true });
      renderDiagnostics(await getRulesDiagnostics());
      setStatus(result.applied ? "Remote discovery rules applied" : "Using fallback discovery rules");
    } catch (error) {
      renderDiagnostics(await getRulesDiagnostics());
      setStatus(`Refresh failed: ${error.message}`);
    } finally {
      refreshRulesButton.disabled = false;
    }
  });

  function renderSettings(settings) {
    enabledField.checked = settings.enabled;
    modeField.value = settings.mode;
    caseSensitiveField.checked = settings.caseSensitive;
    regexRulesField.value = settings.regexRules.join("\n");
    keywordRulesField.value = settings.keywordRules.join("\n");
    excludeRulesField.value = settings.excludeRules.join("\n");
  }

  function readSettingsFromForm() {
    return {
      ...DEFAULT_SETTINGS,
      enabled: enabledField.checked,
      mode: modeField.value,
      caseSensitive: caseSensitiveField.checked,
      regexRules: splitLines(regexRulesField.value),
      keywordRules: splitLines(keywordRulesField.value),
      excludeRules: splitLines(excludeRulesField.value)
    };
  }

  function renderDiagnostics(diagnostics) {
    rulesSourceField.textContent = diagnostics.active_source || "packaged";
    rulesVersionField.textContent = diagnostics.active_version || "unknown";
    rulesSuccessField.textContent = formatTimestamp(diagnostics.last_successful_refresh_at);
    rulesErrorField.textContent = diagnostics.last_error || "None";
  }

  function formatTimestamp(value) {
    if (!value) {
      return "Never";
    }

    return new Date(value).toLocaleString();
  }

  function setStatus(message) {
    statusField.textContent = message;
    window.setTimeout(() => {
      if (statusField.textContent === message) {
        statusField.textContent = "";
      }
    }, 2400);
  }
})();
