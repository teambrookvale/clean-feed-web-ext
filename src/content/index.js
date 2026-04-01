(() => {
  const { getSettings } = globalThis.LinkedInAIFilterStorage;
  const { initializeRules } = globalThis.LinkedInAIFilterRemoteRules;

  const HIGHLIGHT_CLASS = "linkedin-ai-feed-filter-match";
  const HIDDEN_CLASS = "linkedin-ai-feed-filter-hidden";
  const BADGE_CLASS = "linkedin-ai-feed-filter-badge";
  const PLACEHOLDER_CLASS = "linkedin-ai-feed-filter-placeholder";
  const BADGE_ATTR = "data-linkedin-ai-feed-filter-badge";
  const PLACEHOLDER_ATTR = "data-linkedin-ai-feed-filter-placeholder";
  const POST_ID_ATTR = "data-linkedin-ai-feed-filter-id";
  const UNDONE_ATTR = "data-linkedin-ai-feed-filter-undone";

  let compiledSettings = createCompiledSettings({
    enabled: true,
    mode: "highlight",
    regexRules: [],
    keywordRules: [],
    excludeRules: [],
    caseSensitive: false
  });
  let observer;
  let activeRules;
  let postSequence = 0;

  init();

  async function init() {
    await refreshSettings();
    activeRules = await initializeRules();
    scanDocument();
    startObserver();

    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") {
        return;
      }

      const work = [];
      if (changes.filterSettings || changes.regexPatterns) {
        work.push(refreshSettings());
      }
      if (changes.activeDiscoveryRules?.newValue) {
        activeRules = changes.activeDiscoveryRules.newValue;
      }

      Promise.all(work).then(() => scanDocument());
    });
  }

  async function refreshSettings() {
    compiledSettings = createCompiledSettings(await getSettings());
  }

  function createCompiledSettings(settings) {
    const flags = settings.caseSensitive ? "" : "i";

    return {
      ...settings,
      regexRules: compileRegexList(settings.regexRules, flags),
      keywordRules: settings.keywordRules.map((rule) => settings.caseSensitive ? rule : rule.toLowerCase()),
      excludeRules: compileRegexList(settings.excludeRules, flags)
    };
  }

  function compileRegexList(patterns, flags) {
    return patterns.flatMap((pattern) => {
      try {
        return [new RegExp(pattern, flags)];
      } catch (error) {
        console.warn("Ignoring invalid regex pattern:", pattern, error);
        return [];
      }
    });
  }

  function startObserver() {
    if (observer) {
      observer.disconnect();
    }

    observer = new MutationObserver((mutations) => {
      const selector = getPostSelector();
      if (!selector) {
        return;
      }

      const candidates = new Set();

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) {
            continue;
          }

          if (node.matches?.(selector)) {
            candidates.add(node);
          }

          node.querySelectorAll?.(selector).forEach((post) => candidates.add(post));
        }
      }

      for (const post of candidates) {
        processPost(post);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function scanDocument() {
    const selector = getPostSelector();

    if (!selector) {
      return;
    }

    document.querySelectorAll(selector).forEach((post) => processPost(post));
  }

  function processPost(post) {
    ensurePostId(post);

    if (!compiledSettings.enabled) {
      clearPostState(post);
      return;
    }

    const text = extractPostText(post);
    const matched = text.length > 0 && matchesConfiguredRules(text);

    if (!matched) {
      clearPostState(post);
      return;
    }

    if (compiledSettings.mode === "hide") {
      hidePost(post);
      return;
    }

    highlightPost(post);
  }

  function matchesConfiguredRules(text) {
    if (matchesExcludeRules(text)) {
      return false;
    }

    return matchesRegexRules(text) || matchesKeywordRules(text);
  }

  function matchesExcludeRules(text) {
    return compiledSettings.excludeRules.some((pattern) => pattern.test(text));
  }

  function matchesRegexRules(text) {
    return compiledSettings.regexRules.some((pattern) => pattern.test(text));
  }

  function matchesKeywordRules(text) {
    if (compiledSettings.keywordRules.length === 0) {
      return false;
    }

    const haystack = compiledSettings.caseSensitive ? text : text.toLowerCase();
    return compiledSettings.keywordRules.some((keyword) => haystack.includes(keyword));
  }

  function extractPostText(post) {
    const selector = getTextSelector();
    const textNodes = selector ? post.querySelectorAll(selector) : [];

    if (textNodes.length === 0) {
      return (post.innerText || "").trim();
    }

    return Array.from(textNodes)
      .map((node) => node.textContent || "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function highlightPost(post) {
    post.classList.add(HIGHLIGHT_CLASS);
    post.classList.remove(HIDDEN_CLASS);
    post.removeAttribute(UNDONE_ATTR);
    ensureBadge(post);
    removePlaceholder(post);
  }

  function hidePost(post) {
    if (post.getAttribute(UNDONE_ATTR) === "true") {
      post.classList.remove(HIGHLIGHT_CLASS);
      removeBadge(post);
      removePlaceholder(post);
      return;
    }

    post.classList.remove(HIGHLIGHT_CLASS);
    post.classList.add(HIDDEN_CLASS);
    removeBadge(post);
    ensurePlaceholder(post);
  }

  function clearPostState(post) {
    post.classList.remove(HIGHLIGHT_CLASS, HIDDEN_CLASS);
    post.removeAttribute(UNDONE_ATTR);
    removeBadge(post);
    removePlaceholder(post);
  }

  function ensureBadge(post) {
    if (post.querySelector(`[${BADGE_ATTR}="true"]`)) {
      return;
    }

    const badge = document.createElement("div");
    badge.className = BADGE_CLASS;
    badge.setAttribute(BADGE_ATTR, "true");
    badge.textContent = "AI keyword match";

    post.prepend(badge);
  }

  function removeBadge(post) {
    post.querySelectorAll(`[${BADGE_ATTR}="true"]`).forEach((badge) => badge.remove());
  }

  function ensurePlaceholder(post) {
    const placeholderId = getPlaceholderId(post);
    const existing = document.querySelector(`[${PLACEHOLDER_ATTR}="${placeholderId}"]`);
    if (existing) {
      return;
    }

    const placeholder = document.createElement("div");
    const button = document.createElement("button");

    placeholder.className = PLACEHOLDER_CLASS;
    placeholder.setAttribute(PLACEHOLDER_ATTR, placeholderId);
    placeholder.textContent = "Post hidden by LinkedIn AI Feed Filter";

    button.type = "button";
    button.textContent = "Undo";
    button.addEventListener("click", () => {
      post.setAttribute(UNDONE_ATTR, "true");
      post.classList.remove(HIDDEN_CLASS);
      placeholder.remove();
    });

    placeholder.append(" ");
    placeholder.append(button);
    post.before(placeholder);
  }

  function removePlaceholder(post) {
    const placeholderId = getPlaceholderId(post);
    document.querySelector(`[${PLACEHOLDER_ATTR}="${placeholderId}"]`)?.remove();
  }

  function ensurePostId(post) {
    if (!post.getAttribute(POST_ID_ATTR)) {
      post.setAttribute(POST_ID_ATTR, `post-${postSequence}`);
      postSequence += 1;
    }
  }

  function getPlaceholderId(post) {
    ensurePostId(post);
    return post.getAttribute(POST_ID_ATTR);
  }

  function getPostSelector() {
    return activeRules?.discovery_rules?.post_selectors?.join(", ") || "";
  }

  function getTextSelector() {
    return activeRules?.extraction_rules?.text_selectors?.join(", ") || "";
  }
})();
