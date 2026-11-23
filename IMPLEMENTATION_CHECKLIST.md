# CAI-LMM Integration & Implementation Checklist

## 1. Project Overview & Architecture

CAI-LMM is a lightweight, single-screen sales dashboard and customer registration portal designed for field and showroom staff. It operates alongside the central **Mahindra CRM** (`mahindra-crm` / `anhet_mahindra-tharun_dev`).

```
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│     CAI-LMM Application         │                 │      Mahindra CRM Portal        │
│    (http://127.0.0.1:8000)      │                 │    (http://127.0.0.1:8001)      │
├─────────────────────────────────┤                 ├─────────────────────────────────┤
│ • Single-Screen Lead Capture    │                 │ • Central Admin & CRM           │
│ • Local Catalog (lead_options)  │                 │ • Master Data Source            │
│ • Proxied API Integration       │  HTTP / REST    │ • API v1 Endpoints              │
│   (MahindraProxyController)     │ ──────────────> │   (MasterApiController)         │
│ • Local leads database          │   X-API-KEY     │ • Multi-branch, Roles, Fleet    │
└─────────────────────────────────┘                 └─────────────────────────────────┘
```

---

## 2. What Was Implemented

### A. Frontend Master Data Wiring ([form.blade.php](resources/views/leads/form.blade.php) & [lead-form.js](public/assets/lead-form.js))
Connected 5 critical master modules live to the Mahindra CRM API while retaining the clean single-screen UI:

1. **Enquiry Type & Source:**
   - **Enquiry Type:** Populated from `GET /api/mahindra/enquiry-types`.
   - **Enquiry Source:** Cascades on type change via `GET /api/mahindra/enquiry-types/{id}/sources`.
   - Stores: `enquiry_type_id`, `enquiry_type`, `lead_source_id`, `lead_source`.

2. **Dealer Organization & Branch:**
   - **Dealer Company:** Populated from `GET /api/mahindra/companies`.
   - **Dealer Branch:** Cascades on company change via `GET /api/mahindra/companies/{id}/branches`.
   - Stores: `company_id`, `branch_id`, `branch_name`.

3. **Assigned Sales Consultant:**
   - Populated from `GET /api/mahindra/employees`.
   - Stores: `assigned_employee_id`.

4. **Recommended Vehicle Model & Variant:**
   - **Model:** Populated from `GET /api/mahindra/vehicle-models` merged with local passenger/cargo catalogs.
   - **Variant:** Cascades on model change via `GET /api/mahindra/vehicle-models/{id}/variants`.
   - Stores: `vehicle_model_id`, `recommended_model`, `variant_id`, `variant_name`.

5. **Lead Status & Status Response:**
   - **Lead Status:** Populated from `GET /api/mahindra/lead-statuses`.
   - **Status Response:** Cascades on status change via `GET /api/mahindra/lead-statuses/{id}/responses`.
   - Stores: `lead_status_id`, `lead_status`, `status_response_id`, `status_response`.

---

### B. Validation & Request Handling ([SaveLeadRequest.php](app/Http/Requests/SaveLeadRequest.php))
- Updated validation rules to permit all 14 remote CRM columns.
- Relaxed strict local-catalog constraints for `recommended_model` and `lead_source` so values fetched from CRM pass validation without errors.

---

### C. Database & Schema Migration ([2026_11_23_000002_drop_legacy_foreign_keys_from_leads_table.php](database/migrations/2026_11_23_000002_drop_legacy_foreign_keys_from_leads_table.php))
- **Issue Resolved:** Fixed `SQLSTATE[23000]: 1452 Cannot add or update a child row` caused by old foreign key constraints referencing non-existent local master tables.
- **Action:** Dropped legacy constraints (`leads_branch_id_foreign`, `leads_assigned_employee_id_foreign`, `leads_organization_id_foreign`) from `cai_lmm.leads`.
- **Result:** Leads can now safely store foreign IDs from the Mahindra CRM database.

---

### D. UI Labels & Copy Utilities ([workspace.js](public/assets/workspace.js))
- Extended `leadLabels` dictionary with human-readable keys for branch, variant, enquiry type, status, and consultant.
- Updated detail dialogs and "Copy lead details" to render these new attributes automatically.

---

### E. Mahindra CRM Vite Build Fix
- Fixed Windows path issue caused by ampersand (`&`) in directory name (`C:\Divi\Annet CRM & LMM`) by referencing `node ./node_modules/vite/bin/vite.js` directly in [package.json](../mahindra-crm/anhet_mahindra-tharun_dev/package.json).
- Compiled production assets for Mahindra CRM (`npm run build`).

---

## 3. Implementation Checklist & Verification Matrix

| # | Check / Component | Target | Status | Verification Note |
|---|---|---|---|---|
| 1 | **Database Connectivity** | `cai_lmm` MySQL DB | ✅ PASS | Verified connected to local schema |
| 2 | **Schema Foreign Keys** | `leads` table | ✅ PASS | 0 legacy foreign key constraints blocking CRM IDs |
| 3 | **Local Option Catalog** | `lead_options` table | ✅ PASS | 54 choices across 11 fields seeded and accessible |
| 4 | **Mahindra API Auth** | `X-API-KEY` header | ✅ PASS | Authenticated with `cai_lmm_secret_token_7f9b8c2d1e` |
| 5 | **CRM Companies API** | `/api/v1/companies` | ✅ PASS | Returned 3 companies + branches live |
| 6 | **CRM Vehicle Models API** | `/api/v1/vehicle-models` | ✅ PASS | Returned 5 vehicle models + variants live |
| 7 | **CRM Enquiry Types API** | `/api/v1/enquiry-types` | ✅ PASS | Returned 6 enquiry types + sources live |
| 8 | **CRM Lead Statuses API** | `/api/v1/lead-statuses` | ✅ PASS | Returned 3 lead statuses + responses live |
| 9 | **CRM Employees API** | `/api/v1/employees` | ✅ PASS | Returned active employees live |
| 10 | **Lead CREATE** | `POST /api/leads` | ✅ PASS | Created test lead with full CRM IDs and labels |
| 11 | **Lead READ** | `GET /api/leads/{id}` | ✅ PASS | Verified data consistency & attributes |
| 12 | **Lead UPDATE** | `PUT /api/leads/{id}` | ✅ PASS | Updated priority and remarks successfully |
| 13 | **Lead LIST & PAGINATE** | `GET /api/leads` | ✅ PASS | Paginated response with metadata |
| 14 | **Lead DELETE** | `DELETE /api/leads/{id}` | ✅ PASS | Deleted test record cleanly |
| 15 | **Blade Compilation** | `view:cache` | ✅ PASS | All views compiled with 0 syntax errors |
| 16 | **Route Cache** | `route:cache` | ✅ PASS | All web & API routes validated |
| 17 | **Git Remote Sync** | GitHub `origin/main` | ✅ PASS | Pushed commit `1a4865a` up to date |

---

## 4. How to Run & Develop Locally

### Start Both Development Servers

**Terminal 1 — CAI-LMM (Port 8000):**
```powershell
cd "C:\Divi\Annet CRM & LMM\cai-lmm"
php artisan serve --host=127.0.0.1 --port=8000
```

**Terminal 2 — Mahindra CRM (Port 8001):**
```powershell
cd "C:\Divi\Annet CRM & LMM\mahindra-crm\anhet_mahindra-tharun_dev"
php artisan serve --host=127.0.0.1 --port=8001
```

### URLs
- **CAI-LMM Dashboard:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Mahindra CRM Admin:** [http://127.0.0.1:8001](http://127.0.0.1:8001)
