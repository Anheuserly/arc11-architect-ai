# ARC 11 ARCHITECT — WHATSAPP AUTOMATION & AI PLATFORM
## Windows Server Production Deployment & Operations Guide

### 1. Architecture Overview
- **Application**: Next.js 15+ Full-Stack with TypeScript, Tailwind CSS, App Router.
- **Database Engine**: PostgreSQL 18 running on Windows Server (`vps.amcmep.in:5432`).
- **Database Name**: `arc11architect` (Strictly isolated from `sge_datahub`).
- **ORM**: Prisma v6 with automated schema migrations.
- **Port**: `3011` (Default production port).
- **Process Manager**: PM2 for Windows or Windows Service (NSSM).

---

### 2. Prerequisites on Windows Server
1. **Node.js**: Node.js LTS (v20 or v22+).
2. **PostgreSQL**: PostgreSQL 18 (Already active and listening on port 5432).
3. **PM2 Process Manager**:
   ```powershell
   npm install -g pm2
   npm install -g pm2-windows-startup
   pm2-startup install
   ```

---

### 3. Deployment Directory Setup
On your Windows Server PowerShell terminal:
```powershell
# Clone or copy arc11-architect-ai to the server:
cd C:\Deployments
git clone https://github.com/shubham-arc11/arc11-architect-ai.git
cd arc11-architect-ai

# Install production dependencies
npm install --production=false

# Setup environment variables
Copy-Item .env.example .env
# Edit .env with your production credentials
```

---

### 4. Database Migrations & Initial Seeding
```powershell
# Synchronize Prisma schema with arc11architect database
npx prisma db push

# Seed initial ARC 11 services, FAQs, system settings, and Super Admin
npx tsx prisma/seed.ts
```

---

### 5. Running the Application via PM2
Create an `ecosystem.config.js` or start directly:
```powershell
# Build optimized production bundle
npm run build

# Start Next.js with PM2 on port 3011
pm2 start npm --name "arc11-whatsapp-ai" -- run start -- -p 3011

# Save PM2 state to automatically restart on server boot
pm2 save
```

---

### 6. Reverse Proxy & HTTPS Domain (IIS / Caddy / Nginx)
Meta WhatsApp Cloud API requires a valid public HTTPS webhook endpoint.
Point your subdomain (e.g. `whatsapp.arc11architect.com` or `api.arc11architect.com`) to the Windows Server port `3011`:

#### Example Caddy Configuration (`Caddyfile`):
```
whatsapp.arc11architect.com {
    reverse_proxy localhost:3011
}
```

#### Example IIS URL Rewrite (Reverse Proxy):
- In IIS Manager, add a Reverse Proxy rule pointing inbound traffic for `whatsapp.arc11architect.com` to `http://localhost:3011`.
- Bind a free Let's Encrypt SSL certificate via **win-acme**.

---

### 7. Meta WhatsApp Cloud API Webhook Configuration
1. Go to **Meta for Developers** -> Your App -> **WhatsApp** -> **Configuration**.
2. **Callback URL**: `https://whatsapp.arc11architect.com/api/webhooks/whatsapp`
3. **Verify Token**: Must match the private `WHATSAPP_VERIFY_TOKEN` value in your server environment. Generate a unique random value; do not use a documented default.
4. **Webhook Fields to Subscribe**:
   - `messages` (inbound messages from customers)
   - `message_status` (delivery & read receipts)

---

### 8. Automated Database Backup Script (PowerShell)
Create `backup_arc11architect.ps1` on your Windows Server:
```powershell
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupDir = "C:\Backups\arc11architect"
if (!(Test-Path -Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir }

$env:PGPASSWORD = "YOUR_POSTGRES_PASSWORD"
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -d arc11architect -F c -b -v -f "$BackupDir\arc11architect_$Date.dump"
```
Schedule this script via Windows Task Scheduler to run daily.
