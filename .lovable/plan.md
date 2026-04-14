

# Health Trend Charts — Biomarker Values Over Time

## What We're Building

A new "Trends" tab/page accessible from the History page that shows line charts of biomarker values across multiple lab results for a specific person. Users pick a person (Myself or a dependant), then see charts for each biomarker that appears in 2+ results, plotted over time with the reference range shown as a shaded band.

## How It Works

1. **Entry point**: A "View Trends" button on the History page (below the person filter pills)
2. **New page `/trends`**: Accepts an optional `?person=<id>` query param (no param = "myself")
3. **Data aggregation**: Fetches all completed `lab_results` for the selected person, extracts biomarker values, groups by biomarker name, sorts by date
4. **Charts**: Uses Recharts (already installed via the chart component) to render a `LineChart` per biomarker with:
   - X-axis: test dates
   - Y-axis: biomarker value
   - Reference range as a shaded `ReferenceArea`
   - Color-coded dots (green = normal, yellow = borderline, red = abnormal)
5. **Language toggle**: Reuses the English/Pidgin toggle pattern
6. **Empty state**: If a person has fewer than 2 results, show a message encouraging more uploads

## Files Changed

| File | Change |
|------|--------|
| New: `src/pages/Trends.tsx` | Trend charts page — person selector, biomarker line charts |
| `src/App.tsx` | Add `/trends` route |
| `src/pages/History.tsx` | Add "View Trends" button linking to trends page |
| `src/components/BottomNav.tsx` | Add Trends icon to bottom nav (or integrate into History) |

## Technical Details

- Recharts `LineChart` + `ReferenceLine` for min/max of reference ranges
- Reference range parsing: split strings like `"70-100"` into numeric bounds for the shaded area
- Data shape: `{ date: string, value: number, status: string }[]` per biomarker
- Person filtering reuses existing `dependant_id` / null logic from History
- Only biomarkers appearing in 2+ results get a chart; single-point ones listed as text

