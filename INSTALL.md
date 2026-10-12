# Derrick: install on staging first

This is a working PHP content editor for the preserved full website. It is not a WordPress plugin and is not installed on the live domain. The Oct 11 public domain now serves WordPress/Elementor; do not overwrite it without reconciling that work with Nimo.

## Requirements

- Supported PHP 8.1+ (prefer a currently supported PHP release), DOM, Fileinfo and sessions.
- HTTPS, Apache/LiteSpeed rewrite support (or equivalent Nginx rules).
- Writable persistent storage OUTSIDE the web document root, with atomic rename and file locking on a local filesystem. Do not use ephemeral/container storage without a persistent volume.
- `upload_max_filesize=20M`, `post_max_size=21M`, and adequate hosting limits. Images only; existing videos are retained and new videos use approved external embeds.
- No production Node runtime, database service, new domain or Render subscription is inherently required. Confirm the existing hosting account supports this setup.

## Directory layout — important

```
africa-dashboard/
  app/                 private PHP application
  storage/             private catalogue, revisions, credentials, sessions, uploads
  config.php           private installation settings (create from example)
  public/              ONLY this directory is the website document root
    index.php
    api.php
    media.php
    admin/
    assets/
```

Never upload the whole package into a public folder and assume `.htaccess` will protect everything. User hashes, sessions, drafts and original content storage must be outside the web root. If the host fixes the web root to `public_html`, place `app`, `storage` and `config.php` in its parent and place the contents of `public` in `public_html`; the PHP files resolve private folders in that parent.

1. Back up the CURRENT live website, WordPress database and media independently. Keep the previous standalone intact.
2. Create a private staging subdomain and install the directory layout above. Restrict staging at hosting level and use HTTPS.
3. Make `storage` writable by PHP with owner-only permissions where possible (0700 directory, 0600 files). Do not use 0777. Keep `catalogue.json` and `import-manifest.json` from this package.
4. Copy `config.example.php` to `config.php` privately. Generate a 64-character installation token with `php -r 'echo bin2hex(random_bytes(32));'`. Put it in `setup_token`; never email it together with a password or commit it. Alternatively set `AOL_SETUP_TOKEN` in the server environment.
5. Open `/admin/` over HTTPS. Create the first administrator using the token, real email and a unique 12+ character password. REMOVE the setup token afterward. There is no default account/password.
6. Create named accounts. Editors can save/restore drafts and upload approved photos, but only administrators can publish, discard drafts, manage users or export content backups. Nimo should be an administrator if she approves publication.
7. Verify draft save, authenticated preview, publication and rollback on staging. Sign in as an editor and verify publishing is denied. Test a second browser session and concurrent edit conflict.
8. Verify `/storage/state.json`, `/app/bootstrap.php`, `/config.php` and `/tools/` cannot be fetched publicly. New uploads must be private until a published page references them.
9. Reconcile all live changes with the preserved 33-page source, including documentary content. Recheck all country figures and source labels; do not add programme attendances as if they were unique people.
10. Nimo reviews desktop/mobile output, consent wording and publication rights. Choose a cutover/rollback plan. Only then switch the domain/document root with explicit owner approval. Purge old LiteSpeed/CDN caches; dynamic `index.php` and authenticated API/preview pages must bypass page caching.

## Routing

The included `public/.htaccess` routes existing `.html` addresses into `index.php`. Do not place old static HTML files beside `index.php`: they would bypass editable rendering. Internal links retain their original `.html` addresses. If Nginx is used, configure the equivalent `try_files $uri $uri/ /index.php?page=$uri` rule with a basename-safe mapping and normal PHP execution; test all routes. The dashboard supports the public document root, not a nested path deployment without additional routing work.

## Storage, backup and security

- Server-side JSON transactions use an exclusive lock, version checks and atomic rename; drafts and published content are independent. Every save/publication/restoration is retained. Revisions can grow; monitor storage.
- Back up the entire private `storage` directory and public assets daily, encrypted off-host. A downloadable content JSON backup excludes accounts/session data and does not include image bytes. Test operator restoration on staging; there is deliberately no one-click unvalidated backup import.
- Uploaded JPG/PNG/WebP files have MIME and image checks, random names and live outside the web root. Private images are served only to authenticated editors; a published reference makes an image public. Publication-rights confirmation is an attestation, not evidence of signed consent. Agree on a media/retention/safeguarding policy.
- Passwords are hashed; cookies are HttpOnly, Secure and SameSite Strict in production. Mutations require POST, same-origin and CSRF tokens. Sessions time out after 1 hour idle or 8 hours absolute. Account disabling takes effect on the next request.
- HTTPS must reach PHP as HTTPS. Reverse proxies must be configured by the operator; do not blindly trust client-supplied forwarding headers.
- Login is rate-limited per IP/email. Host-level WAF/rate limits, malware scanning and an independent production security review are recommended before public use. MFA, email password reset and security-event notifications are not implemented.
- Keep `AOL_LOCAL_PREVIEW` unset in production. Loopback preview access is permitted only when the development launcher explicitly enables it and the remote address is loopback. Do not expose or reverse-proxy the preview process.

## Scope

All imported text, links, existing image/video sources, contact information and animated counters can be edited as fields. Layout and scripts remain protected. An edit affects one page only. Repeated values must be reviewed across their other occurrences; this is not an impact-record database with automatic rollups.

This build does not write to Google Drive, import volunteer reports, create mailing lists, invent metrics, provide a page builder, deploy to WordPress or process payments. Subscription links continue to use the approved Substack system.

## Local preview

With Node installed for DEVELOPMENT only:

```
npm ci --cache /Volumes/sin/CodexWork/npm-cache
npm run preview
```

Open `http://127.0.0.1:4188/admin/` and select **Open local workspace**. The launcher runs the PHP application through WordPress Playground's PHP-WASM runtime, mounted to local persistent files. This is a development tool, not WordPress. Stop it with Ctrl+C. The production installation runs ordinary PHP and does not need npm packages.
