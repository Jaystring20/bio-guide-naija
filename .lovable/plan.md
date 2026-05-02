# Issue Tracking System for Admin Support

Build a proper ticketing layer on top of the existing Support Desk so admins can track every user issue from "reported" to "resolved", keep a running notes timeline, and see the full history per user / per report.

## What gets built

### 1. Database — two new tables

**`support_issues`** — one row per issue/ticket
- `id` uuid PK
- `affected_user_id` uuid (the user having the problem)
- `lab_result_id` uuid nullable (the specific report, if any)
- `title` text (short summary, e.g. "Stuck in processing 25 min")
- `description` text (admin's diagnosis or user's complaint)
- `category` text — `processing_delay | failed_extraction | diet_missing | critical_followup | upload_error | account | other`
- `status` text — `open | in_progress | waiting_user | resolved | closed | reopened` (default `open`)
- `priority` text — `low | normal | high | urgent` (default `normal`)
- `source` text — `admin_created | user_feedback | auto_detected` (default `admin_created`)
- `assigned_to` uuid nullable (admin user)
- `created_by` uuid (admin who logged it)
- `resolution_summary` text nullable (filled when resolved)
- `resolution_action` text nullable (e.g. `regenerated_diet`, `rerun_interpret`, `manual_completed`, `user_re_uploaded`)
- `resolved_at`, `resolved_by`, `created_at`, `updated_at` timestamps

**`support_issue_events`** — append-only timeline per issue
- `id`, `issue_id` (FK), `actor_id` (admin), `created_at`
- `event_type` — `note | status_change | assignment | action_taken | linked_action`
- `from_status`, `to_status` text nullable
- `note` text nullable (free-form admin note)
- `action_key` text nullable (e.g. `admin-regenerate-diet`, `admin-set-status:failed`) — links a recovery action to the timeline
- `metadata` jsonb nullable (action result, error, etc.)

**RLS:** admins-only SELECT/INSERT/UPDATE on both tables (using `has_role(auth.uid(), 'admin')`). No user access.

**Trigger:** when `support_issues.status` changes, auto-insert a `status_change` event row. Also bump `updated_at`.

**RPC `admin_user_issue_history(_user_id uuid)`** (SECURITY DEFINER, admin-gated) — returns the user's issues + last event for the User Detail page history view.

### 2. Edge functions (admin-gated, service role)

- `admin-issue-action` — single endpoint that runs a recovery action (`regenerate_diet`, `rerun_interpret`, `set_status_failed`, `set_status_completed`) AND logs an `action_taken` event on the linked issue in one transaction. Reuses the logic already in `admin-regenerate-diet` and `admin-set-status` so the timeline stays accurate.

(Plain notes, status changes, and assignments are simple table writes from the client under RLS — no edge function needed.)

### 3. UI — three surfaces

**a. Issue panel inside Support Desk (`/app/admin/support?result_id=…`)**
When a report is loaded, show:
- "Open issues for this report/user" list at the top (status badge + title + age).
- "Log new issue" button → inline form (title, category auto-suggested from diagnosis, priority, description prefilled with current diagnosis text).
- Every existing recovery button (Regenerate diet, Mark failed, Force complete) gets an optional "Attach to issue #…" selector so the action is recorded on the timeline.

**b. New page `/app/admin/issues` — Issue Queue**
- Filters: status, priority, category, assigned-to-me, date range, search (user email / title / issue id).
- Table columns: Priority, Title, User, Linked report, Status, Age, Assignee, Last update.
- Row click → Issue Detail.
- "New issue" button (without a preselected report) for issues like account/login problems.

**c. New page `/app/admin/issues/:id` — Issue Detail**
- Header: title, status dropdown, priority dropdown, assignee dropdown, category, source.
- Side panel: affected user (name, email, link to user detail), linked report (link to Support Desk diagnosis), created/updated/resolved timestamps.
- **Timeline (resolution history)**: chronological feed of events — notes, status changes, actions taken, assignments — each with actor avatar/name and time.
- **Add note** composer at the bottom (textarea + "Save note" button).
- **Resolve dialog** (when moving to `resolved`): requires `resolution_action` (dropdown) + `resolution_summary` (textarea). Stored on the issue row + a `status_change` event.
- **Reopen** button on resolved/closed issues — sets status back to `reopened` and logs an event.
- "Run recovery action" buttons (Regenerate diet, Rerun interpret, Mark failed, Force complete) — each calls `admin-issue-action` so the action shows up on the timeline automatically.

**d. Cross-links**
- Admin Dashboard header: add "Issues" button next to "Support Desk", with a small badge for `open + in_progress` count.
- Control Room "Help" row action: in addition to opening Support Desk, show "Issues (N)" if any exist for that report.
- User Detail (existing admin user view): add a "Resolution history" tab listing all past issues for that user with status, category, resolution summary, and resolved-at — exactly the "history per affected user" you asked for.

### 4. Playbook integration

When logging a new issue, the auto-diagnosis already done by Support Desk pre-fills:
- `category` (mapped from `Diagnosis` levels)
- suggested `playbook_id` (stored in `metadata` of the first event)
- description seeded with the current diagnosis label + detail.

When resolving, the playbook's recommended action becomes the default `resolution_action` so admins capture *what actually fixed it* — building a real knowledge base over time.

## Technical details

- New routes in `src/App.tsx`: `/app/admin/issues` and `/app/admin/issues/:id`, both wrapped in `AdminRoute`.
- New files:
  - `src/pages/admin/IssueQueue.tsx`
  - `src/pages/admin/IssueDetail.tsx`
  - `src/components/admin/IssuePanel.tsx` (embedded in SupportDesk)
  - `src/components/admin/IssueTimeline.tsx`
  - `src/components/admin/NewIssueDialog.tsx`
  - `src/components/admin/ResolveIssueDialog.tsx`
  - `src/hooks/useIssues.ts` (list/detail/mutations via react-query)
  - `supabase/functions/admin-issue-action/index.ts`
- Edited:
  - `src/pages/admin/SupportDesk.tsx` — embed `IssuePanel`, route action buttons through `admin-issue-action` when an issue is selected.
  - `src/pages/admin/AdminDashboard.tsx` — "Issues" header button + open count badge (lightweight count query).
  - `src/pages/admin/ControlRoom.tsx` — show issue count chip per row (single grouped count query).
- Migration file creates the two tables, RLS policies, status-change trigger, `updated_at` trigger reusing `update_updated_at_column()`, and the `admin_user_issue_history` RPC.
- All admin writes go through RLS (admin-only). The edge function only exists to chain "run recovery action + append event" atomically using the service role.

## Out of scope (can add later if you want)

- Email/WhatsApp notifications when status changes.
- SLA timers / auto-escalation.
- User-facing "my support requests" view (currently admin-only).
- Bulk actions on the queue.

Once approved I'll create the migration, build the pages/components, deploy the edge function, and wire up the entry points.
