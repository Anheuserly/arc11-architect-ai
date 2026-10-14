# ARC 11 Architect — Project Handover & Architecture Master Index

> **Platform:** WhatsApp Automation & AI Lead Engine for ARC 11 Architect  
> **Status:** Fully functional, PostgreSQL connected on VPS, Meta WhatsApp Cloud API integrated, AI memory & lead qualification active.  
> **Target Audience:** Developers, ChatGPT Codex, or autonomous agents continuing development.

---

## 📌 Executive Summary

**ARC 11 Architect** is a premier architectural, interior design, and planning consultancy based in India (Delhi NCR / Pan-India). This application (`arc11-architect-ai`) is the official 24/7 automated WhatsApp business suite and internal portal.

It handles:
1. **WhatsApp Cloud API Integration:** Official bidirectional messaging on business phone number `+91 93118 47555`.
2. **Real-Time Web Dashboard:** Built with Next.js 15 (Turbopack, Tailwind CSS, Lucide icons) for human agents to inspect active chats, take over conversations, test dispatches, and review incoming leads.
3. **Automated Client Discovery & Directory:** Every phone number that interacts with the business is automatically saved as a `Contact` and listed in the portal with history.
4. **AI Architectural Memory Engine:** Automatically extracts and persists client preferences, style choices (modern, classical, vastu), plot sizes, locations, budgets, likes, and dislikes into `Contact.notes`.
5. **Intelligent Lead Qualification:** Automatically extracts project inquiries from conversational WhatsApp messages and registers them in the `Lead` pipeline.

---

## 📂 Documentation Structure (`docs/`)

| Document | Description |
| :--- | :--- |
| **[`01-architecture-overview.md`](./01-architecture-overview.md)** | Tech stack, system architecture diagram, directory layout, and key modules. |
| **[`02-database-schema.md`](./02-database-schema.md)** | Prisma models, PostgreSQL structure on Windows VPS, relationships, and indexing. |
| **[`03-meta-whatsapp-integration.md`](./03-meta-whatsapp-integration.md)** | Cloud API credentials, webhook verification, message sending, and live syncing. |
| **[`04-ai-engine-and-client-memory.md`](./04-ai-engine-and-client-memory.md)** | Rule engine, LLM handoff, ClientMemoryService, memory serialization, and lead qualification. |
| **[`05-api-reference.md`](./05-api-reference.md)** | Complete REST API endpoints (`/api/conversations`, `/api/contacts`, `/api/messages/send`, etc.). |
| **[`06-current-state-and-next-steps.md`](./06-current-state-and-next-steps.md)** | Exact snapshot of what has been built, recent fixes, verified tests, live-integration blockers, deployment decision, and immediate next tasks. |

---

## ⚡ Quick Start for Codex / Developers

### 1. Environment & Database
The project connects directly to a live PostgreSQL database hosted on a Windows VPS:
- **Host:** `vps.amcmep.in:5432`
- **Database:** `arc11architect`
- **Prisma Client:** Run `npx prisma generate` if schema changes.

### 2. Running Locally
```bash
# Install dependencies
npm install

# Run development server (Turbopack)
npm run dev

# Run production build validation
npm run build
```
Local dashboard is served on `http://localhost:3000` (or `http://localhost:3011`).

### 3. Key Source Files
- `src/app/page.tsx`: Single-page architectural dashboard (Inbox, Contacts Directory, Leads, Services, FAQs, Live 3s Polling).
- `src/services/whatsapp-client.ts`: Meta Graph API v21.0 wrapper for sending messages.
- `src/services/message-processor.ts`: Inbound message lifecycle, state machine, and reply triggers.
- `src/services/client-memory.ts`: Persistent memory extractor (likes, dislikes, styles, plot specs) and auto-lead creator.
- `src/services/ai-engine.ts`: High-fidelity prompt engineering, knowledge base retriever, and memory-aware responder.
- `src/app/api/webhooks/whatsapp/route.ts`: Webhook listener for incoming messages and delivery receipt updates.

## Operational Status Note

The application build is healthy and the webhook implementation has been tested, but it is **not yet receiving real customer messages** because the Meta app remains unpublished while business verification is in review. See [the current-state handover](./06-current-state-and-next-steps.md) before changing the callback URL, deployment host, catalog integration, or production credentials.
