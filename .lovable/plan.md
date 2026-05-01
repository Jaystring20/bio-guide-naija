## Hide Advisory Board from landing page (keep page available)

The advisory board members aren't confirmed yet, so we'll remove all references to them from the public landing page. The `/advisory-board` page itself will stay in the codebase (still routable directly) so we can re-link it once the real roster is signed.

### Changes

**`src/pages/Landing.tsx`**
- Remove the `<AdvisoryBoardPreview />` section from the page body.
- Remove the `import { AdvisoryBoardPreview }` line.
- Remove the "Advisory Board" link from the desktop nav (`#advisory-board`).
- Remove the "Advisory Board" link from the mobile menu list.

**Kept as-is (no deletion)**
- `src/pages/AdvisoryBoardPage.tsx` — still exists, still routable at `/advisory-board` if you visit directly.
- `src/components/landing/AdvisoryBoardPreview.tsx` — kept but unused, ready to re-import.
- `src/data/advisoryBoard.ts` — kept.
- Route in `src/App.tsx` — kept.

### Re-enabling later
When the real board is confirmed, just re-add the import + `<AdvisoryBoardPreview />` block + the two nav links. No data migration needed.
