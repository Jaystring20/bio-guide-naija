
# Bilingual emergency audio with rotating biomarker summary

Today the emergency screen speaks the same English sentence every 12 seconds:
"Emergency. Contact a doctor now. Critical values detected for Glucose, Potassium."

We'll keep the 12s cadence and the existing mute/acknowledge controls, but make each repeat alternate so the caregiver hears it in both languages and gets the actual numbers on alternating loops.

## What the loop will sound like

For an emergency with `Glucose = 28 mmol/L` and `Potassium = 7.1 mmol/L`:

```text
Loop 0 (English, with values):
  "Emergency. Contact a doctor now. Critical values detected for
   Glucose at 28 mmol/L, Potassium at 7.1 mmol/L."

Loop 1 (Pidgin, names only):
  "Emergency! Abeg call doctor now. Wahala dey for Glucose and Potassium."

Loop 2 (English, names only):
  "Emergency. Contact a doctor now. Critical values detected for
   Glucose, Potassium."

Loop 3 (Pidgin, with values):
  "Emergency! Abeg call doctor now. Wahala dey for Glucose dey 28 mmol/L,
   and Potassium dey 7.1 mmol/L."
```

Cap at the first 3 emergency biomarkers per phrase so it stays under ~6 seconds of speech.

## Why this design

- **Bilingual reach** — VeriDIA's caregiver audience is mixed English/Pidgin; alternating loops ensures whichever language they think in, they hear it within 12 seconds.
- **Avoids "alarm blindness"** — varying the phrasing keeps the message attention-getting instead of becoming background noise.
- **Always names the biomarkers** — every loop, in either language, names the triggering biomarkers; values are added on alternating loops for clinical context without making the sentence too long every time.
- **No new TTS dependency** — uses the same on-device Web Speech API the rest of the app uses (free, offline).

## Technical details

- File: `src/components/EmergencyAlert.tsx`
- Replace the static `phrase` constant with a `buildPhrase(loopIndex)` helper inside the existing emergency-audio `useEffect`.
- Track loop index via a closure-local `let loop = 0` that increments after each `speak()`.
- `loop % 2 === 0` -> English, `=== 1` -> Pidgin.
- `loop % 2 === 0` -> include "at {value} {unit}" / "dey {value} {unit}"; otherwise names only. The two parities combine so all four variants in the example above appear in the first four loops.
- Set `utt.lang` to `en-US` for English loops and `en-NG` for Pidgin loops (browsers don't ship a Pidgin voice; en-NG gives the closest phonetic read).
- Keep the existing 12s `setInterval`, mute toggle, cleanup, and acknowledge button untouched.
- No backend, schema, or routing changes.
