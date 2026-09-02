# business-online.in — Developer & AI Agent Playbook, CI/CD & Deployment Guide

> **Document ID:** `DOC-07-PLAYBOOK`  
> **Status:** Ground Truth / Active Blueprint  
> **Target Audience:** All Future AI Agents, Full-Stack Engineers, DevOps, Contributors  
> **Version:** 1.0 (Enterprise Baseline)

---

## 1. 5-Minute Developer & AI Agent Quickstart

Welcome to **`business-online.in`**! Any new developer or AI agent joining this codebase must follow this sequence to understand and execute work within 5 minutes.

### Step 1: Read the Master Specs (In Order)
1. **[01_MASTER_VISION_AND_PRODUCT_ROADMAP.md](file:///c:/Users/Devisha%20Pandey/Desktop/storyby_clickerbabu/docs/01_MASTER_VISION_AND_PRODUCT_ROADMAP.md)** — Understand why we exist and the Photography Wedge.
2. **[02_SYSTEM_ARCHITECTURE_AND_ROUTING.md](file:///c:/Users/Devisha%20Pandey/Desktop/storyby_clickerbabu/docs/02_SYSTEM_ARCHITECTURE_AND_ROUTING.md)** — How wildcard subdomains and edge caching work.
3. **[03_DATABASE_SCHEMA_AND_TENANCY_MODELS.md](file:///c:/Users/Devisha%20Pandey/Desktop/storyby_clickerbabu/docs/03_DATABASE_SCHEMA_AND_TENANCY_MODELS.md)** — PostgreSQL schemas and RLS security.

### Step 2: Launch Local Development Server
```bash
# Start the lightweight testing server
node -e "
const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
http.createServer((req, res) => {
  let p = path.join(__dirname, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
  fs.readFile(p, (err, data) => {
    if (err) return res.writeHead(404).end('Not Found');
    res.writeHead(200, { 'Content-Type': mime[path.extname(p)] || 'text/plain' });
    res.end(data);
  });
}).listen(3344, () => console.log('Development Server: http://localhost:3344'));
"
```

### Step 3: Test Core Multi-Tenant URL States
* **Main SaaS Directory:** `http://localhost:3344/`
* **Clicker Babu Flagship:** `http://localhost:3344/?tenant=clickerbabu`
* **Sharma Sweets & Bakery:** `http://localhost:3344/?tenant=sharmasweets`
* **Royal Dental Clinic:** `http://localhost:3344/?tenant=royaldental`

---

## 2. Repository Directory Structure

```
storyby_clickerbabu/
├── docs/                                 # Complete Enterprise Architecture Docs
│   ├── 01_MASTER_VISION_AND_PRODUCT_ROADMAP.md
│   ├── 02_SYSTEM_ARCHITECTURE_AND_ROUTING.md
│   ├── 03_DATABASE_SCHEMA_AND_TENANCY_MODELS.md
│   ├── 04_PHOTOGRAPHY_ECOSYSTEM_DEEPDIVE.md
│   ├── 05_API_SPEC_AND_WHATSAPP_AUTOMATION.md
│   ├── 06_SEO_PROGRAMMATIC_AND_DIRECTORY.md
│   └── 07_DEVELOPER_AND_AGENT_PLAYBOOK.md
├── tenants/                              # Tenant System & Data Profiles
│   ├── schema.json                       # Official JSON Schema for all tenants
│   ├── tenant-registry.js                # High-speed client/edge routing engine
│   ├── clickerbabu.json                  # Flagship Tenant #1 Profile
│   ├── sharmasweets.json                 # Food & Bakery Tenant Profile
│   └── royaldental.json                  # Healthcare Tenant Profile
├── assets/                               # Media, Icons & Scripts
│   ├── images/                           # High-res WebP photos
│   └── js/lenis.min.js                   # Momentum scroll library
├── cloudflare-worker.js                  # Production Edge Worker for *.business-online.in
├── saas-directory.css                    # SaaS Portal & Justdial Directory Styles
├── saas-directory.js                     # Subdomain claimer & directory search logic
├── index.html                            # Master Universal Entrypoint
├── style.css                             # Luxury Dark & Gold Flagship CSS
├── script.js                             # Clicker Babu interactive engine
├── CNAME                                 # Custom Domain Binding (business-online.in)
├── robots.txt                            # Search Engine Directives
└── sitemap.xml                           # Master Sitemap Index
```

---

## 3. Environment Variables & Secrets Reference

When deploying to staging or production, the following environment variables must be securely configured:

```ini
# --- PostgreSQL & Supabase Database ---
SUPABASE_URL="https://xyzcompany.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..." # (Server-side Only)

# --- Cloudflare Edge & R2 Storage ---
CLOUDFLARE_API_TOKEN="cf_api_..."
CLOUDFLARE_ACCOUNT_ID="acc_..."
R2_ACCESS_KEY_ID="r2_..."
R2_SECRET_ACCESS_KEY="r2_sec_..."
R2_BUCKET_NAME="business-online-media"

# --- WhatsApp Cloud API ---
META_WA_PHONE_NUMBER_ID="10982374928"
META_WA_ACCESS_TOKEN="EAAX..."
META_WA_WEBHOOK_VERIFY_TOKEN="secret_verify_token_here"

# --- Razorpay Payment Gateway ---
RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="sec_..."
RAZORPAY_WEBHOOK_SECRET="whsec_..."
```

---

## 4. Production Deployment & Cloudflare Setup Checklist

Before pushing any code to production:

```
[ ] 1. Wildcard DNS Check: Verify that *.business-online.in CNAME is active in Cloudflare.
[ ] 2. SSL/TLS Verification: Confirm Cloudflare Universal SSL covers both apex and subdomains.
[ ] 3. Schema Validation: Run node tests to confirm all tenant JSON files conform to tenants/schema.json.
[ ] 4. Lighthouse Performance Audit: Performance >= 95, Accessibility >= 95, SEO = 100.
[ ] 5. WhatsApp Link Test: Verify that all wa.me links generate correct URL-encoded messages.
[ ] 6. Security Header Check: Ensure Content-Security-Policy and X-Frame-Options are present.
```

---

## 5. Non-Negotiable Engineering Rules for Developers & AI Agents

1. **Never Break Clicker Babu:** `clickerbabu.business-online.in` is our $100K live showcase. Any change that breaks its bespoke styling, audio player, or showreel modal will cause immediate loss of high-ticket client trust.
2. **Zero Bloat Policy:** No heavy frontend frameworks for static storefronts. Keep vanilla JavaScript under 50KB total bundle size.
3. **Always Preserve Multi-Tenant Isolation:** Never write cross-tenant SQL queries or expose other tenants' private leads.
4. **Mobile First Verification:** Test every new component on a mobile viewport (375px width) before marking work complete.

---

## 6. Troubleshooting Common Issues

### Issue 1: Subdomain returns 404 or points to default page
* **Cause:** Wildcard DNS record (`*`) is missing or proxied incorrectly.
* **Fix:** In Cloudflare DNS, ensure `CNAME * -> business-online.in` with Proxy status **ON (Orange Cloud)**.

### Issue 2: Tenant profile fails to render
* **Cause:** Missing required field in tenant JSON (e.g. `businessName`, `category`, or `contact.whatsapp`).
* **Fix:** Validate against `tenants/schema.json` using `ajv` or standard JSON schema validator.

### Issue 3: WhatsApp pre-filled message text is broken
* **Cause:** Unescaped special characters in URL string.
* **Fix:** Always wrap dynamic strings in `encodeURIComponent()`.
