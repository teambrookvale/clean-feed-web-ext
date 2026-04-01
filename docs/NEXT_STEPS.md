# Next Steps

## Recommended Next Step

Implement the full settings and options page.

This unlocks several release-blocking needs at once:

- move configuration out of the popup
- expose remote discovery-rule diagnostics cleanly
- add mode selection for `highlight` vs `hide`
- add exclusions and future import/export support
- make the product usable without editing internals

## Recommended Order

1. Build an options page.
2. Add `hide` mode with undo.
3. Create LinkedIn DOM fixtures for post discovery and text extraction.
4. Add automated tests for:
   - local fallback
   - remote-rule validation
   - selector extraction
5. Publish a real signed R2 rules endpoint.

## Why This Order

The options page is the highest-leverage next step because it improves product usability and gives a clean home for diagnostics and future settings expansion. After that, fixture-based selector hardening and tests are the safest way to make the remote discovery-rule path production-ready.
