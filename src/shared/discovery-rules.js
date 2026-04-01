(() => {
  const LOCAL_DISCOVERY_RULES = {
    schema_version: 1,
    rules_version: "local-2026-04-01",
    published_at: "2026-04-01T00:00:00.000Z",
    rollout: {
      channel: "stable",
      percentage: 100
    },
    discovery_rules: {
      post_selectors: [
        '[role="main"] [role="listitem"]',
        '[data-testid="mainFeed"] [role="listitem"]',
        'main [role="listitem"]'
      ],
      candidate_container_selectors: [
        '[role="main"]',
        '[data-testid="mainFeed"]',
        "main",
        "body"
      ]
    },
    extraction_rules: {
      text_selectors: [
        '[data-testid="expandable-text-box"]',
        "p",
        'span[aria-hidden="false"]',
        "h1",
        "h2",
        "h3",
        "h4"
      ],
      use_inner_text_fallback: true
    }
  };

  globalThis.LinkedInAIFilterDiscoveryRules = {
    LOCAL_DISCOVERY_RULES
  };
})();
