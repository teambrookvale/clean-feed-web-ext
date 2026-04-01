((root, factory) => {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.LinkedInAIFilterCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  function createCompiledSettings(settings) {
    const flags = settings.caseSensitive ? "" : "i";

    return {
      ...settings,
      regexRules: compileRegexList(settings.regexRules || [], flags),
      keywordRules: (settings.keywordRules || []).map((rule) => settings.caseSensitive ? rule : rule.toLowerCase()),
      excludeRules: compileRegexList(settings.excludeRules || [], flags)
    };
  }

  function compileRegexList(patterns, flags) {
    return patterns.flatMap((pattern) => {
      try {
        return [new RegExp(pattern, flags)];
      } catch {
        return [];
      }
    });
  }

  function matchesConfiguredRules(text, compiledSettings) {
    if (matchesExcludeRules(text, compiledSettings)) {
      return false;
    }

    return matchesRegexRules(text, compiledSettings) || matchesKeywordRules(text, compiledSettings);
  }

  function matchesExcludeRules(text, compiledSettings) {
    return compiledSettings.excludeRules.some((pattern) => pattern.test(text));
  }

  function matchesRegexRules(text, compiledSettings) {
    return compiledSettings.regexRules.some((pattern) => pattern.test(text));
  }

  function matchesKeywordRules(text, compiledSettings) {
    if (compiledSettings.keywordRules.length === 0) {
      return false;
    }

    const haystack = compiledSettings.caseSensitive ? text : text.toLowerCase();
    return compiledSettings.keywordRules.some((keyword) => haystack.includes(keyword));
  }

  function discoverPosts(rootNode, activeRules) {
    const selector = getPostSelector(activeRules);

    if (!selector || typeof rootNode?.querySelectorAll !== "function") {
      return [];
    }

    return Array.from(rootNode.querySelectorAll(selector));
  }

  function extractPostText(post, activeRules) {
    const selector = getTextSelector(activeRules);
    const useInnerTextFallback = activeRules?.extraction_rules?.use_inner_text_fallback !== false;
    const textNodes = selector && typeof post?.querySelectorAll === "function"
      ? post.querySelectorAll(selector)
      : [];

    if (!textNodes || textNodes.length === 0) {
      return useInnerTextFallback ? normalizeText(post?.innerText || post?.textContent || "") : "";
    }

    return normalizeText(Array.from(textNodes).map((node) => node.textContent || "").join(" "));
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function getPostSelector(activeRules) {
    return activeRules?.discovery_rules?.post_selectors?.join(", ") || "";
  }

  function getTextSelector(activeRules) {
    return activeRules?.extraction_rules?.text_selectors?.join(", ") || "";
  }

  return {
    createCompiledSettings,
    discoverPosts,
    extractPostText,
    matchesConfiguredRules
  };
});
