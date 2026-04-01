(() => {
  const DEFAULT_PATTERNS = [
    "\\bai\\b",
    "\\bartificial intelligence\\b",
    "\\bgenai\\b",
    "\\bgenerative ai\\b",
    "\\bllm\\b",
    "\\blarge language model(s)?\\b",
    "\\bprompt engineering\\b",
    "\\bmachine learning\\b",
    "\\bchatgpt\\b",
    "\\bclaude\\b",
    "\\bgpt-?4(\\.1)?\\b",
    "\\bcopilot\\b"
  ];

  globalThis.LinkedInAIFilterDefaults = {
    DEFAULT_PATTERNS
  };
})();
