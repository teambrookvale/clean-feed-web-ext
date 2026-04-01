(() => {
  const { getSettings, saveSettings } = globalThis.LinkedInAIFilterStorage;

  const enabledField = document.getElementById("enabled");
  const modeField = document.getElementById("mode");
  const regexCountField = document.getElementById("regex-count");
  const keywordCountField = document.getElementById("keyword-count");
  const summaryField = document.getElementById("summary");
  const openSettingsButton = document.getElementById("open-settings");
  const statusField = document.getElementById("status");

  init();

  async function init() {
    renderSettings(await getSettings());

    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local" || !changes.filterSettings?.newValue) {
        return;
      }

      renderSettings(changes.filterSettings.newValue);
    });
  }

  enabledField.addEventListener("change", async () => {
    const settings = await getSettings();
    await saveSettings({
      ...settings,
      enabled: enabledField.checked
    });
    setStatus(enabledField.checked ? "Filtering enabled" : "Filtering paused");
  });

  openSettingsButton.addEventListener("click", async () => {
    await browser.runtime.openOptionsPage();
    window.close();
  });

  function renderSettings(settings) {
    enabledField.checked = settings.enabled;
    modeField.textContent = settings.mode;
    regexCountField.textContent = String(settings.regexRules.length);
    keywordCountField.textContent = String(settings.keywordRules.length);
    summaryField.textContent = settings.enabled
      ? `Running in ${settings.mode} mode on LinkedIn feed pages.`
      : "Filtering is currently disabled.";
  }

  function setStatus(message) {
    statusField.textContent = message;
    window.setTimeout(() => {
      if (statusField.textContent === message) {
        statusField.textContent = "";
      }
    }, 1800);
  }
})();
