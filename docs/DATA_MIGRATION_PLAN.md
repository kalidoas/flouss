# Flouss Data Migration Plan

## Overview
Flouss is an offline-first, client-side personal finance progressive web application. All data resides in `localStorage` on the user's device. To ensure that **no existing data is ever lost** across version upgrades, this migration plan details the transitions between schema versions.

---

## 1. Schema Versions & Evolution

| Version | Storage Key | Description |
|---|---|---|
| **v1.0** | `flouss_app_storage_v1` | Initial balance, basic categories, simple transactions (`YYYY-MM-DD`). |
| **v2.0** | `flouss_app_storage_v2` | Locked initial balance, recurring rules, recent notes, PIN lock. |
| **v2.5 (Phases 1-3)** | `flouss_app_storage_v2` (extended) | Category keys (`food`, `cafe`, etc.) + sub-categories; ISO timestamps (`YYYY-MM-DDTHH:mm:ssZ`) for transactions; category-level and sub-category-level goals; Excel export. |
| **v3.0 (Phase 5)** | `flouss:users` & `flouss:{userId}:data` | Multi-user support with PBKDF2 hashed passwords, separate namespaces, owner adoption of v2 data. |

---

## 2. Migration Triggers & Sequence

### A. Pre-Migration Safety Snapshot
Before any schema transformation runs:
1. `createEmergencyLocalStorageBackup()` serializes existing keys (`flouss_app_storage_v2`, etc.) into `flouss_emergency_snapshot`.
2. If any migration error occurs, data is preserved untouched and the snapshot can be restored.

### B. Category Key & Sub-category Migration (Phases 1-2)
1. **Existing Categories Migration**:
   - Matches known default category IDs (e.g., `cat_nourriture` -> `key: 'food'`).
   - If a category was created by the user (no known default ID), `key` is `undefined`, preserving `category.name` as user-authored free text.
   - Adds `subcategories: SubCategory[]` initialized with default translated sub-categories for default categories, and empty array for user-created categories.
2. **Transaction Date & Time Migration**:
   - If an existing transaction has date format `YYYY-MM-DD`, it is normalized to an ISO datetime `YYYY-MM-DDT12:00:00.000Z` so legacy records sort cleanly at noon.
   - Future transactions store exact user-selected ISO date and time (defaulting to current minute).

### C. Multi-User Account Migration (Phase 5)
1. **First-launch after multi-user update**:
   - Flouss checks if `flouss:users` exists in `localStorage`.
   - If not found, but legacy `flouss_app_storage_v2` has data (`isOnboarded: true` or `initialBalance !== null`):
     - An onboarding/account claim modal appears: *"Créer votre compte"* (Name, Username, Password, Recovery Code).
     - The legacy data is assigned to this newly created **Owner** user account.
     - The data is saved under `flouss:{ownerId}:data`.
     - `flouss:activeUserId` is set to `ownerId`.
   - The legacy `flouss_app_storage_v2` is kept as a backup archive so no data can be erased.
2. **User Data Isolation**:
   - Each user interacts strictly with `flouss:{userId}:data`.
   - No user (including Owner) can inspect other users' transactional data.

---

## 3. Backward Compatibility & JSON Import/Export
- **Export**: Exports contain full user data (`initialBalance`, `transactions`, `categories` with sub-categories and keys, `incomeSources`, `recurringRules`, `recentNotes`).
- **Import**:
  - Automatically identifies older v1/v2 export payloads and applies migration steps:
    1. Upgrades dates to ISO timestamps.
    2. Maps category keys.
    3. Populates missing optional fields (`subcategories`, `monthlyBudget`, `isGoal`).
  - Validates integrity and guarantees zero silent data corruption.
