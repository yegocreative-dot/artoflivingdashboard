# Art of Living Africa — content dashboard

Working local PHP editing workspace and a complete 33-page website import. Built 11 October 2026. Not deployed to the live domain.

## What works

- Click-to-select text, link, image and existing video-source editing; captions, contact details, browser titles, descriptions and counters are editable fields.
- Server-persisted drafts, authenticated previews and administrator publication. Original HTML/layout and media remain the foundation; no empty wrapper import.
- Version-checked saving, revision history and restore-as-draft, including the original baseline.
- Admin/editor accounts, login throttling, CSRF and same-origin checks, hashed passwords, account disabling and password changes.
- JPG/PNG/WebP upload, rights confirmation, private storage and publication-aware image delivery.
- Existing media library, grouped pages, search, mobile workspace and desktop/mobile site preview.
- Content JSON backup excluding credentials; operator guide for full file backups.

The import preserves 33 pages, 122 assets and 5,040 editable fields from the complete Oct 10 standalone snapshot, including `documentary.html`. The public site changed to WordPress/Elementor on Oct 11. That newer deployment has NOT been overwritten or reconciled automatically.

## Open locally

```
npm ci --cache /Volumes/sin/CodexWork/npm-cache
npm run preview
```

Open `http://127.0.0.1:4188/admin/` and click **Open local workspace**. All edits remain local. Development uses WordPress Playground's PHP-WASM runtime, not a WordPress CMS.

## Give to Derrick

Read `INSTALL.md`. The server needs ordinary PHP with DOM, Fileinfo and sessions, HTTPS and private writable persistent storage. There is no requirement to buy a new domain or Render service. Existing hosting suitability still needs operator verification. Install on private staging, create real accounts and reconcile the live WordPress version before any domain cutover.

## Limits

This is an editor for existing pages, not a layout/page builder, a workshop database, a mailing-list service or a volunteer-upload/Google Drive integration. Changes affect one page at a time; repeated wording/figures need deliberate review. No automatic unique-person totals or consent assumptions are introduced. New videos use approved YouTube/Vimeo embeds or operator-hosted files; image upload does not accept videos.

## Verification

Run `npm test`. `QA-RESULTS.json` records PHP-WASM integration checks; `QA.md` records browser checks and deployment limitations. Production still requires native-server staging tests, owner content review and independent security review. No production credentials are bundled. On this computer, double-click `Open Dashboard.command` to launch the local preview, then open the URL it prints. Keep its Terminal window open; Ctrl+C stops it.

## Source references

- [PHP password hashing](https://www.php.net/manual/en/function.password-hash.php)
- [PHP upload handling](https://www.php.net/manual/en/features.file-upload.php)
- [PHP session security](https://www.php.net/manual/en/session.security.ini.php)
- [Official PHP-WASM development runtime](https://developer.wordpress.org/playground/developers/local-development/php-wasm-node/)
