# 05. REST API Reference

All API routes are located in `src/app/api/`.

---

## 📋 Route Index

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/contacts` | List contacts with leads, conversations, and search filter |
| `POST` | `/api/contacts` | Manually create or upsert a contact |
| `GET` | `/api/conversations` | List all conversations ordered by `lastMessageAt desc` |
| `GET` | `/api/conversations/[id]` | Fetch full conversation thread, messages, and contact details |
| `POST` | `/api/conversations/[id]` | Perform conversation action (`send_message`, `takeover`, `resume_ai`) |
| `POST` | `/api/messages/send` | Send outbound message via Meta or simulate incoming message |
| `GET` | `/api/leads` | List all captured architectural leads |
| `GET` | `/api/services` | List active ARC 11 services |
| `GET` | `/api/faqs` | List active architectural FAQs |
| `GET` | `/api/webhooks/whatsapp` | Meta webhook verification handshake (`hub.challenge`) |
| `POST` | `/api/webhooks/whatsapp` | Inbound WhatsApp messages & status delivery callbacks |

---

## 🔍 Endpoint Specifications

### 1. `GET /api/contacts`
- **Query Params:** `?q=searchterm` (filters name or phone)
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "535291cf-c50f-45a3-96fa-c8ff2fb01e83",
        "waId": "919999888877",
        "phoneNumber": "919999888877",
        "name": "Vikram Kapoor",
        "notes": "{\"stylePreferences\":[\"Modern / Contemporary\"],\"likes\":[\"Central Courtyard\"]}",
        "tags": ["Luxury Villa / Bungalow", "Modern / Contemporary"],
        "leads": [...],
        "conversations": [...]
      }
    ]
  }
  ```

---

### 2. `POST /api/conversations/[id]`
- **Actions:**
  - `send_message`: Sends human agent message to WhatsApp (`{ "action": "send_message", "text": "Hello" }`).
  - `takeover`: Pauses AI bot and sets status to `HUMAN_ACTIVE`.
  - `resume_ai`: Sets status back to `BOT_ACTIVE`.

---

### 3. `POST /api/messages/send`
- **Body:**
  ```json
  {
    "toPhone": "919876543210",
    "recipientName": "Client Name",
    "messageText": "Message content",
    "scheduleTime": null,
    "isSimulateIncoming": false
  }
  ```
- **Live Dispatch:** Calls Meta Cloud API if `isSimulateIncoming: false`.
- **Inbound Simulator:** Feeds message through `MessageProcessorService` if `isSimulateIncoming: true`.
