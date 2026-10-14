# 06. Current State, Recent Fixes & Next Steps

This document is the **exact handover snapshot** for ChatGPT Codex or any engineer taking over this repository.

---

## 🎯 Current Working State

1. **Meta WhatsApp Integration:**
   - App `1366869258359438` is subscribed to WABA `1427614785976785` and phone number `1374779232381161` (`+91 93118 47555`).
   - Webhook endpoint is fully implemented at `src/app/api/webhooks/whatsapp/route.ts` with signature verification and challenge response.

2. **Database:**
   - PostgreSQL is active on `vps.amcmep.in:5432/arc11architect`.
   - Contact records, conversation threads, leads, messages, and state machine records are actively storing real data.

3. **Portal Dashboard:**
   - Real-time 3-second background polling is implemented in `src/app/page.tsx` so new incoming messages and newly created contacts appear automatically without requiring a manual browser refresh.
   - **Active Inbox Tab:** Live thread viewing, message composer, human takeover button, error notice banner.
   - **Clients & Contacts Directory Tab:** Lists every client connected via WhatsApp, with phone numbers, first connected date, badges (`Client & Lead` or `Connected`), and direct dialogue navigation.
   - **AI Architectural Memory Inspector:** The right-hand sidebar displays the client's extracted profile:
     - Preferred project type
     - Plot size & built-up area
     - Budget
     - Architectural styles
     - Likes & must-haves (green checkmarks)
     - Dislikes & avoidances (red tags)

4. **Automated AI Intelligence:**
   - Freeform project inquiries (e.g., *"4BHK luxury villa in Noida on 300 sq yards, love modern minimalist and courtyard, avoid dark wood"*) are automatically parsed into `ClientMemoryService` and recorded in `Contact.notes`.
   - An architectural `Lead` is automatically generated and linked to the contact.

---

## 🛠️ Recent Fixes Implemented

- **React Infinite Re-render Loop Resolved:**  
  Fixed dependency array instability in `src/app/page.tsx` that previously caused `Maximum update depth exceeded`.
- **Meta 24-Hour Policy Notice:**  
  Added delivery status tracking and clear UI indicators when Meta rejects a message due to the 24-hr customer service window.
- **TurboPack Dev Server Stability:**  
  Cleaned Turbopack build cache and verified `npm run build` exits with code 0 across all 13 routes.
- **Webhook Event Processing Verified:**
  A locally signed webhook event and Meta's `messages` test event both reached the inbound pipeline. Contact/conversation/message creation and webhook idempotency were verified. A reply to Meta's sample/test number is expected to show as failed because it is not a real customer recipient.
- **WhatsApp Catalog Connected:**
  The Commerce Manager catalog was connected to the WABA, with catalog visibility and cart enabled. Product/service data remains owned by Commerce Manager, not the local PostgreSQL database.
- **Build Script Repaired:**
  Replaced an invalid, suppressed Prisma post-install command with `prisma generate` so generated client artifacts are produced intentionally during installs.

---

## ⚠️ Live WhatsApp Status & Required Meta Action

The bot code and webhook are working in test conditions, but real WhatsApp messages will not be delivered until Meta permits production traffic.

1. **Meta app state:** currently unpublished.
2. **Business verification:** currently in review.
3. **Webhook subscription:** the `messages` field is subscribed and the callback challenge has been verified.
4. **Local testing:** the temporary public tunnel must point to `https://<temporary-host>/api/webhooks/whatsapp` and remains valid only while the local app and tunnel are running.

When verification is approved, publish the Meta app, ensure the callback points to a stable public HTTPS address, send a real message from a non-test customer number, and inspect the dashboard plus the Meta delivery status.

---

## ☁️ Deployment Investigation — 2026-10-14

Cloudflare's build log confirms that `npm run build` finishes successfully. The deployment then fails because the Cloudflare CI command is set to bare `npx wrangler deploy`. Wrangler attempts an automatic OpenNext migration in the non-interactive build environment, installs unpinned adapter dependencies, detects an unsupported Next.js version, and then fails within workerd/Miniflare with a locked SQLite database (`SQLITE_BUSY`).

This is **not an application compilation failure** and retrying the same CI command is not a reliable repair.

### Recommended production path

Deploy the existing Node/Next.js application on the Windows VPS that already hosts PostgreSQL and expose it through a named Cloudflare Tunnel. This preserves the current Prisma PostgreSQL runtime, creates a stable HTTPS webhook URL for Meta, and avoids an untested database migration to an edge runtime.

### Alternative: Cloudflare Workers migration

Choose this only as a dedicated migration project. It requires all of the following before changing the live Meta webhook:

1. Upgrade and lock Next.js to an adapter-supported, patched release.
2. Install and configure the Cloudflare adapter locally; commit the generated Wrangler/OpenNext configuration rather than allowing CI to generate it.
3. Configure a supported connection method from Workers to the existing PostgreSQL database (for example, Cloudflare Hyperdrive and a compatible driver) and update Prisma/database access accordingly.
4. Add production secrets through Cloudflare, never in source control.
5. Run a local adapter build, a deployed health check, the Meta verification challenge, and one signed inbound webhook test.

Cloudflare now recommends its current Next.js-on-Workers path for new projects; OpenNext should be manually configured and maintained rather than auto-migrated during CI. Refer to the official Cloudflare and OpenNext documentation when beginning this migration.

---

## 🚀 Immediate Next Tasks for Codex / Developer

If continuing development, here are the recommended next steps:

1. **Complete Meta publication and business verification (required for real inbound messages):**
   - Publish the app once Meta verification is approved.
   - Configure a stable public HTTPS callback endpoint.
   - Test with a real customer WhatsApp number, then verify inbound and outbound delivery status in the dashboard.

2. **Choose and implement the production host:**
   - Preferred: Windows VPS + named Cloudflare Tunnel.
   - Alternative: complete the deliberate Cloudflare Workers/Hyperdrive migration described above.

3. **Public Webhook Tunnel (for local testing):**
   - Use `ngrok http 3000` or Cloudflare Tunnel (`cloudflared`) to expose the local server.
   - Put the HTTPS URL into Meta App Dashboard -> WhatsApp -> Configuration -> Callback URL (`https://<tunnel-domain>/api/webhooks/whatsapp`).
   - Meta messages will then stream directly to the local dev server.

4. **Template Message Support for Outbound Beyond 24 Hours:**
   - If a human agent wants to message a client after 24 hours, add support in `WhatsAppClient` to send pre-approved Meta WhatsApp Templates (e.g. `arc11_consultation_followup`).

5. **Media & Floor Plan Attachments:**
   - Meta webhooks support receiving image and document attachments (PDF floor plans, CAD drawings).
   - In `src/app/api/webhooks/whatsapp/route.ts`, fetch the media file from Meta Graph API using `media_id` and store the file URL in `Message.mediaUrl`.

6. **Team Role-Based Access Control:**
   - Add team member assignment dropdown in the chat header so specific architects can be assigned to specific leads.
