# 07. Security & Secret Management

## Non-Negotiable Rules

- Never commit `.env`, `.dev.vars`, tokens, passwords, API keys, JWT keys, or webhook verification values.
- Commit `.env.example` only with placeholders.
- Never put secrets in Cloudflare `vars`; use encrypted Secrets if the project is later migrated to Workers.
- Never log `Authorization` headers, environment objects, raw database URLs, or Meta webhook credentials.

## Required Environment Variables

The safe placeholder list is in [`.env.example`](../.env.example). Production requires at least:

- `DATABASE_URL`
- `JWT_SECRET`
- `COOKIE_SECRET`
- `META_APP_ID`
- `META_APP_SECRET`
- `META_ACCESS_TOKEN`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`

`META_WEBHOOK_SECRET` is optional in this codebase because webhook HMAC verification uses `META_APP_SECRET` first. If it is set, it must be the same protected app-secret value, not a separately invented public value.

## Cloudflare Configuration

[`wrangler.jsonc.example`](../wrangler.jsonc.example) is deliberately a
**non-deployable, secret-free reference**. It does not make this application
ready for Cloudflare Workers; the current Prisma PostgreSQL runtime still needs
the documented Workers database migration before it can be deployed there.

Do not create a `wrangler.json` containing a `vars` block with secrets. JSON
does not support comments, and `vars` are not an encrypted secret store. If a
Workers migration is approved, store sensitive values in Cloudflare Secrets and
keep only public identifiers and non-sensitive runtime configuration in
`wrangler.jsonc`.

## Rotation Procedure After Exposure

If a secret appears in a commit, build log, screenshot, ticket, or chat:

1. Revoke and replace the Meta system-user access token in Meta Business Manager.
2. Reset the Meta App Secret in Meta for Developers and update the runtime environment.
3. Change the PostgreSQL password on the VPS and update `DATABASE_URL` on the production host.
4. Generate new high-entropy values for `JWT_SECRET`, `COOKIE_SECRET`, and `WHATSAPP_VERIFY_TOKEN`.
5. Restart the application, update the Meta webhook verification token, and confirm the webhook challenge plus one signed test event.
6. Remove leaked values from tracked repository history if any were ever pushed; rotation is still mandatory because history may already have been copied.

For the recommended VPS deployment, configure these values in the server's environment manager or a protected local `.env` file with restricted filesystem permissions. Do not place them in the repository.
