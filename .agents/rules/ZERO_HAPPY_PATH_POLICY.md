# ZERO HAPPY-PATH & AGENT PERFECTION ENFORCEMENT POLICY

> **Scope:** ALL AI Agents, Subagents, and Automated Systems operating on `business-online.in`  
> **Enforcement Level:** STRICT & NON-NEGOTIABLE  
> **Objective:** 100% Accuracy, Zero Regressions, Zero Laziness, and Full Edge-Case Resilience.

---

## 1. The "Negative-First" Testing Mandate

Agents are strictly forbidden from only testing the "Happy Path" (ideal scenarios). Before declaring any task, component, or endpoint complete, you MUST execute and document negative and edge-case verification:

1. **Empty / Nil States:** Test forms with empty inputs, databases with zero records, and galleries with no photos.
2. **Invalid / Malformed Inputs:** Test subdomains with spaces or special symbols (`my store!`), invalid phone numbers, and oversized strings.
3. **404 / Non-Existent Routes:** Verify that non-existent tenants (`?tenant=doesnotexist`) gracefully display a clean 404 or fall back to the SaaS registration claimer.
4. **Boundary & Viewport Limits:** Verify layouts at narrow mobile widths ($360\text{px}$, $375\text{px}$) and ultra-wide screens ($2560\text{px}$).

---

## 2. The "Proof-of-Execution" Requirement

**A statement of completion is INVALID without direct proof.**

* **Forbidden Behavior:** Saying *"I have verified the code and everything is working properly"* without running a verification tool.
* **Mandatory Behavior:** You MUST execute automated test commands (e.g. `node test-script`, `curl -I`, HTTP status checks) and display the resulting terminal output or response codes in your response.

---

## 3. Strict Anti-Laziness & Zero-Truncation Rule

1. **Never Truncate Code:** Never write placeholder comments such as:
   - `// ... rest of the code remains same ...`
   - `// TODO: implement later`
   - `/* remaining CSS unchanged */`
2. **Preserve Integrity:** When modifying existing files, preserve all existing business logic, SEO tags, schema markup, and comments unless explicitly instructed to remove them.
3. **Finish the Last 20%:** Never leave UI states half-finished. Always include hover transitions, active states, loading indicators, and error toasts.

---

## 4. The Golden Anti-Regression Checklist

Whenever making edits to core files (`index.html`, `style.css`, `script.js`, `saas-directory.*`), you MUST verify both core platform modes:

```
[ ] Verification A: Main SaaS Portal (http://localhost:3344/)
    - Subdomain claimer is responsive and checks availability.
    - Justdial directory search filters cards dynamically.
    - Onboarding modal opens and creates a new tenant.

[ ] Verification B: Flagship Showcase (http://localhost:3344/?tenant=clickerbabu)
    - Bespoke Dark/Gold luxury styling is 100% intact.
    - Showreel video modal opens smoothly.
    - Top "⚡ Powered by business-online.in" badge renders with back link.
```

---

## 5. Mobile-First & Zero-Console-Error Standard

1. **Zero Runtime Exceptions:** The browser and Node environment must execute with zero uncaught JavaScript errors or broken module imports.
2. **Sub-500ms Edge Performance:** Never introduce heavy third-party CDNs or uncompressed assets that degrade First Contentful Paint (FCP).
3. **Safe Fallbacks:** Always handle network errors and API timeouts with friendly, user-facing fallback states.

---

## 6. Multi-Tenant Data Isolation Rule

1. **Always Partition by Tenant ID:** Never query or mutate records across different tenants.
2. **Strict RLS:** All database mutations must respect PostgreSQL Row-Level Security policies as defined in `docs/03_DATABASE_SCHEMA_AND_TENANCY_MODELS.md`.
