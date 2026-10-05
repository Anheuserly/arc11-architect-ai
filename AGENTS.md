# AGENTS.md — Autonomous AI Agent Guide & Instructions

> **Project:** ARC 11 Architect — WhatsApp Automation & AI Suite (`arc11-architect-ai`)  
> **Workspace Root:** `/Volumes/HP_P500/GitHub/arc11-architect-ai`  
> **Target Audience:** Autonomous Coding Agents (ChatGPT Codex, Claude Code, Antigravity, Cursor, Devin)

---

## 🧭 Mission & Role

You are working on the production WhatsApp automation system and customer portal for **ARC 11 Architect**, a premier architectural, interior design, and planning consultancy based in India (Delhi NCR / Pan-India).

Your goal is to maintain and extend a system that:
1. Handles official WhatsApp customer communication via Meta Cloud API (`+91 93118 47555`).
2. Syncs chats and customer records in real-time to a web dashboard.
3. Automatically qualifies incoming design and construction leads.
4. Maintains personalized, persistent client memory profiles across conversations.
5. Preserves architectural safety rules (no fabricated quotes, fake credentials, or false municipal promises).

---

## 🏗️ System Architecture & Key Modules

When reading or modifying code, refer to these core files:

| Module | File Path | Responsibility |
| :--- | :--- | :--- |
| **Dashboard UI** | [`src/app/page.tsx`](file:///Volumes/HP_P500/GitHub/arc11-architect-ai/src/app/page.tsx) | Next.js 15 client component with Active Inbox, Contacts Directory, Leads view, 3-second live polling hook, and AI Memory Inspector. |
| **Inbound Processor** | [`src/services/message-processor.ts`](file:///Volumes/HP_P500/GitHub/arc11-architect-ai/src/services/message-processor.ts) | WhatsApp inbound pipeline: idempotency check (`wamid`), auto-contact registration, memory extraction, state machine, and reply triggers. |
| **Client Memory** | [`src/services/client-memory.ts`](file:///Volumes/HP_P500/GitHub/arc11-architect-ai/src/services/client-memory.ts) | Parses messages for architectural styles, plot areas, locations, budgets, likes/dislikes; saves to `Contact.notes` as JSON; triggers auto-leads. |
| **AI Engine** | [`src/services/ai-engine.ts`](file:///Volumes/HP_P500/GitHub/arc11-architect-ai/src/services/ai-engine.ts) | Grounded AI responder. Injects official knowledge (Services, FAQs) and client memory into system prompts. Supports rule fallback and OpenAI/Gemini. |
| **WhatsApp Client** | [`src/services/whatsapp-client.ts`](file:///Volumes/HP_P500/GitHub/arc11-architect-ai/src/services/whatsapp-client.ts) | Meta Graph API v21.0 HTTP client for sending text and interactive messages. |
| **Webhook Handler** | [`src/app/api/webhooks/whatsapp/route.ts`](file:///Volumes/HP_P500/GitHub/arc11-architect-ai/src/app/api/webhooks/whatsapp/route.ts) | Handles Meta challenge handshake (`GET`) and inbound events (`POST`) with HMAC SHA-256 signature verification. |
| **Database Client** | [`src/lib/prisma.ts`](file:///Volumes/HP_P500/GitHub/arc11-architect-ai/src/lib/prisma.ts) | Singleton Prisma Client connecting to PostgreSQL on VPS (`vps.amcmep.in:5432/arc11architect`). |

---

## 🛡️ Critical Guidelines & Constraints

### 1. Architectural Safety & Fidelity Rules
- **NEVER invent prices or fixed fee structures.** Architectural fees depend on built-up area, scope of drawings, and municipal bye-laws. Always offer to prepare a customized proposal or schedule an architect consultation.
- **NEVER fabricate licenses or credentials.** ARC 11 Architect operates with registered architects (COA India standards).
- **Tone:** Professional, refined, warm, aesthetic, and architectural.

### 2. WhatsApp Meta API Rules
- **24-Hour Policy Window:** Meta restricts freeform text replies to within 24 hours of the customer's last message. If outside the window, use Meta template messages or surface appropriate UI status.
- **Idempotency:** Always verify `wamid` uniqueness before recording or responding to messages.

### 3. Database Integrity
- The PostgreSQL database is live and shared on `vps.amcmep.in:5432/arc11architect`.
- Do NOT execute destructive DDL commands (`DROP TABLE`, `TRUNCATE`).
- Run `npx prisma generate` whenever modifying `prisma/schema.prisma`.

### 4. Build & Type Checking
- Always verify your changes compile cleanly without errors:
  ```bash
  npm run build
  ```
- All 13 routes must build cleanly.

---

## 🧠 Memory & Lead Pipeline Rules

- **Client Profile Memory:**
  Stored inside `Contact.notes` as a serialized JSON object:
  ```json
  {
    "projectType": "Luxury Villa / Bungalow",
    "location": "Noida Sector 150",
    "plotArea": "300 sq yards",
    "stylePreferences": ["Modern / Contemporary", "Minimalist", "4 BHK"],
    "likes": ["Central Courtyard (Aangan)"],
    "dislikes": ["Avoid traditional or dark wooden themes"],
    "updatedAt": "2026-10-05T08:24:48.553Z"
  }
  ```
- **Auto-Lead Creation:**
  Whenever a client mentions location + plot size or project type in any message, `ClientMemoryService.autoCaptureLeadIfApplicable` must either create a new `Lead` or update an existing recent lead record.

---

## 🚀 Common Development Workflows

### Starting Local Dev Server
```bash
npm run dev
# Dashboard available at http://localhost:3000
```

### Simulating Inbound Customer WhatsApp Message (No Tunnel Required)
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "toPhone": "919999888877",
    "recipientName": "Vikram Kapoor",
    "messageText": "Hi, I am looking for a 4BHK villa design in Noida Sector 150 on 300 sq yards.",
    "isSimulateIncoming": true
  }'
```

### Checking Current Contacts & Memory via CLI
```bash
curl -s http://localhost:3000/api/contacts | python3 -m json.tool
```

---

## 📖 Additional Documentation References

Before starting complex tasks, review the detailed documents in `docs/`:
- `docs/01-architecture-overview.md` — Complete system architecture & flow diagrams.
- `docs/02-database-schema.md` — Prisma models and entity relationships.
- `docs/03-meta-whatsapp-integration.md` — Meta Cloud API and webhook setup.
- `docs/04-ai-engine-and-client-memory.md` — Deep dive into memory extraction & prompt injection.
- `docs/05-api-reference.md` — Full REST API specifications.
- `docs/06-current-state-and-next-steps.md` — Active task list and pending features.
