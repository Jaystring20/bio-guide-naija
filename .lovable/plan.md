

# Fix Mobile Layout + Android Chrome Upload Issues

## Problems Identified

1. **Report page tabs overflow on small screens** — The 4 tabs ("Summary", "Biomarkers", "Diet Plan", "Doctor Q's") use `overflow-x-auto` but have no scrollbar hint, and on narrow screens the language toggle + title can collide
2. **Floating PDF button overlaps bottom nav** — Fixed at `bottom-20 right-4` but may overlap content or be hard to tap on smaller Android devices
3. **Tab buttons need proper wrapping** — Currently `whitespace-nowrap` prevents wrapping; on very small screens they scroll off-screen without visual indication
4. **Android Chrome file upload broken** — The `accept="image/*"` with `capture="environment"` on the camera input can cause issues on some Android Chrome versions. The file input `accept="image/*,.pdf"` may also fail on certain Android browsers that don't handle the comma-separated MIME types well

## Changes

### 1. ResultReport.tsx — Mobile layout fixes
- **Tabs**: Switch from horizontal scroll to a **flex-wrap grid** (2x2) so all 4 tabs are always visible without scrolling
- **Title + Language toggle**: Stack vertically on mobile instead of `justify-between` in a row (title on top, toggle below)
- **PDF button**: Move to `bottom-24` to clear the bottom nav, add a subtle label

### 2. UploadLab.tsx — Android Chrome upload fix
- **Camera input**: Remove `capture="environment"` from the camera input and instead use `capture` only as an attribute. Some Android Chrome versions fail when both `accept="image/*"` and `capture="environment"` are set. Use `capture="camera"` as a more compatible option, and add a fallback
- **File input**: Change `accept="image/*,.pdf"` to `accept="image/jpeg,image/png,image/webp,image/heic,.pdf,application/pdf"` — explicit MIME types work better on Android Chrome
- **Add error handling**: Wrap file selection in a try-catch and show a helpful toast if the file picker fails
- **Add drag-and-drop zone**: For desktop/tablet users as an alternative input method

### 3. BiomarkersTab — Status badge wrapping
- On the expandable biomarker cards, ensure the status badge and chevron don't get cut off on narrow screens by allowing the name/value section to truncate if needed

### Files Changed
| File | Change |
|------|--------|
| `src/pages/ResultReport.tsx` | Fix tab layout (wrap grid), stack title/toggle, adjust PDF button position |
| `src/pages/UploadLab.tsx` | Fix Android Chrome accept attributes, improve capture compatibility, add error handling |
| `src/components/report/BiomarkersTab.tsx` | Minor text truncation fix for narrow screens |

