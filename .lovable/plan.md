

# Multi-Profile System: Caregivers, Doctors & Health History Import

## The Big Picture

Right now BioGuide is built for one person uploading their own results. You want to support three additional scenarios:

1. **Caregivers** — a parent uploading results for their child, or someone managing an elderly parent's health
2. **Doctors/Health workers** — uploading and tracking results for multiple patients
3. **Historical records** — importing past lab results (from hospitals, previous tests) to build a health timeline

All three share a common need: **a "health profile" that is separate from the logged-in user's account**.

## How It Works

### New concept: "Dependants"

A logged-in user (the account owner) can create **dependant profiles** — people whose health they manage. Each dependant has their own name, age, sex, region, and relationship to the account owner.

When uploading a lab result, the user picks **who this result is for**: themselves or one of their dependants. The AI analysis uses that person's demographics (not the account owner's).

### User roles during onboarding

Add a step to onboarding: "How will you use BioGuide?"
- **For myself** — current flow, no changes
- **Caregiver** — unlocks "Add dependant" (child, parent, spouse, etc.)
- **Health professional** — unlocks "Add patient" (same data model, different labeling)

This is cosmetic — the data model is the same. A "dependant" and a "patient" are the same table row with a different `relationship` label.

### Historical records import

On the upload page, add an option: "When was this test done?" with a date picker. This lets users upload older results with the correct date, building a proper timeline. The AI still reads the result the same way — it just gets stored with the historical date.

For bulk import: a "Add past results" flow where users can upload multiple images in sequence, tagging each with a date and the person it belongs to.

## Database Changes

### New table: `dependants`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users, the account owner |
| full_name | text | |
| age | integer | nullable |
| sex | enum (male/female) | nullable |
| geopolitical_zone | enum | nullable |
| relationship | text | "child", "parent", "spouse", "patient", "other" |
| created_at | timestamptz | |

RLS: users can only CRUD their own dependants.

### Modify `lab_results`

Add two columns:
- `dependant_id` (uuid, nullable, FK → dependants) — if null, the result belongs to the account owner
- `test_date` (date, nullable) — user-specified date of the actual test (distinct from `upload_date`)

### Modify edge function

When `dependant_id` is provided, fetch demographics from the `dependants` table instead of `profiles`. Pass that person's age/sex/region to the Gemini prompts.

## UI Changes

### 1. Onboarding — new step (after welcome, before region)
"How will you use BioGuide?"
- For myself
- I care for family members (caregiver)
- I'm a health professional

Selection stored on profile as `user_role` (text column on profiles). Purely cosmetic — affects labels and prompts shown.

### 2. Profile page — "People I manage" section
- List of dependants with name, relationship, age
- "Add person" button → simple form (name, age, sex, region, relationship)
- Edit/delete existing dependants

### 3. Upload page — "Who is this result for?"
- Shown before the camera/file buttons
- Pills: "Myself" + each dependant's name
- Optional date picker: "When was this test done?" (defaults to today)

### 4. History page — filter by person
- Filter pills at top: "All" | "Myself" | each dependant name
- Each result card shows who it belongs to

### 5. Home page
- If user has dependants, show a "People" section with quick-upload shortcuts per person

## Files Changed

| File | Change |
|------|-------|
| DB migration | Create `dependants` table, add `dependant_id` and `test_date` to `lab_results`, add `user_role` to `profiles` |
| `supabase/functions/interpret-lab/index.ts` | Check for `dependant_id`, fetch demographics from correct table |
| `src/pages/Onboarding.tsx` | Add role selection step |
| `src/pages/UploadLab.tsx` | Add person selector + date picker |
| `src/pages/History.tsx` | Add person filter |
| `src/pages/Profile.tsx` | Add dependants management section |
| `src/pages/Index.tsx` | Show dependants shortcuts if any exist |
| `src/contexts/AuthContext.tsx` | Add `user_role` to Profile type |
| New: `src/hooks/useDependants.ts` | CRUD hook for dependants |
| New: `src/components/AddDependantDialog.tsx` | Form dialog for adding/editing dependants |

## What This Enables

- A mother uploads her child's blood test → gets diet plan with child-appropriate Nigerian foods
- A caregiver uploads their elderly father's result → AI knows to factor in age-related considerations
- A doctor uploads 5 patients' results in a row → each tagged to the right patient profile
- Anyone can upload old results with historical dates → builds a timeline for trend tracking
- All existing single-user functionality stays exactly the same — this is purely additive

