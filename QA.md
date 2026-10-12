# Verification — 11 October 2026

## Data preservation

- Source: preserved complete Oct 10 live standalone (`live-standalone.html`); the source manifest includes its SHA-256.
- 33 pages, including the extra `documentary.html`; 122 original assets; 5,040 editable fields.
- All imported text-node IDs and indices checked against PHP's HTML parser. No missing nodes or empty wrapper imports.
- Original project source, standalone HTML, client Drive and current production site were not modified.

## Backend

41 integration checks passed using actual PHP 8.3 through the official PHP-WASM runtime, mounted to persistent external-volume storage. Checks cover refusing HTTP authentication in production; account setup and login; Secure cookies; access and role restrictions; CSRF/origin checks; unsafe links and escaped text; draft/private-media privacy; atomic version conflicts; publication, original baseline and recovery; account disabling; password changes; login throttling; valid/invalid image uploads; backup-free restart persistence; all page/asset/field preservation; logout. The complete result list is in `QA-RESULTS.json`.

Additional HTTP checks: local `/storage/state.json` and `/app/bootstrap.php` return 404. JavaScript syntax checks passed.

## Browser

- Opened local dashboard; completed local session entry and homepage selection.
- Selected actual heading text by clicking the website iframe; edited it using the field form; saved through the real UI. The public page retained original wording while the draft was saved.
- Reset the test wording to original and saved again. Local homepage ends with no unpublished/unsaved changes; the test is retained in local revision history. Local state is excluded from the delivery ZIP.
- Desktop overview/editor visually inspected at 1440 × 1000; mobile overview/editor at 390 × 844. An observed mobile navigation overflow was fixed using min-width/zero-min grid constraints. Final DOM viewport width and document scroll width both equal 390.
- Desktop/mobile screenshots included. Mobile editor uses field/preview tabs; dirty navigation and publish/restore use native review dialogs.
- Jev unavailable (`TYPESAFE_API_KEY` missing); direct browser harness used only on the new local task tab, never client login/Drive/production pages.

## Remaining deployment checks

Not tested on Derrick's native PHP/hosting, Apache/LiteSpeed rewrites, CDN cache configuration, multiple native worker concurrency, production email/MFA or hosting backups. No formal security audit or legal/consent approval is implied by passing tests.

The current live domain changed to WordPress/Elementor on Oct 11. Its pages must be compared with this preserved site on staging before any live switch. This dashboard edits the preserved website, not the current WordPress database. See `INSTALL.md`.

Not implemented: arbitrary new page sections, workshop-record rollups, deduplicated unique-person totals, public volunteer intake, new video uploads, Google Drive integration, newsletter distribution, MFA or email password reset. These are explicitly identified in the interface, not presented as working features.
