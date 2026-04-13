

# BioGuide Landing Page Redesign — AwaDoc-Inspired

Taking cues from AwaDoc's clean, spacious, confidence-building layout and adapting it to BioGuide's "Lab-to-Nutrition" value prop. Mobile-first, desktop-responsive.

## Key Design Changes (vs current)

1. **Hero**: Centered layout (like AwaDoc) instead of split-grid. Large headline, subtitle, single rounded CTA pill button. Social proof avatars + "Helping X Nigerians" below CTA. Floating cards move below hero on mobile (visible, not hidden).

2. **Social Proof / Users Section** (NEW — inspired by AwaDoc's people collage): Colorful circular avatar placeholders with chat-bubble-style speech bubbles showing real user scenarios: "My cholesterol dropped!", "I finally understand my results", "The diet plan was so practical". No real photos needed — use colored circles with initials.

3. **How It Works**: Left-aligned heading with descriptive paragraph (like AwaDoc), then 4 cards in a row (desktop) / stacked (mobile). Each card has a soft pastel-colored icon area at top, bold title, description below. Cleaner than current numbered badges.

4. **Who It's For** (NEW): Horizontal pill tags — "Caregivers", "New Parents", "Diabetics", "Health-Conscious Nigerians", "Elderly Care". Then 3 benefit cards with colored icon backgrounds (peach, mint, gold) and bullet-point lists — similar to AwaDoc's "Who we work with" section.

5. **Compliance & Trust**: Light gray background section. Large centered heading "Complies with the highest standards of quality and data security". NDPA badge, data minimization icon, confidentiality shield — rendered as large icon+text blocks (not the current dark bar).

6. **CTA Banner**: Full-width primary-colored (Bio Deep green) section with white text, floating avatar circles around edges, centered headline + dark CTA button. Mirrors AwaDoc's teal CTA section.

7. **Mobile hamburger menu**: Add a menu icon for mobile nav instead of hiding links entirely.

8. **Footer**: Keep as-is, minor polish.

## Files to Edit
- `src/pages/Landing.tsx` — Full rewrite of the landing page component
- `src/index.css` — Minor animation additions if needed

## Technical Approach
- Single file component, no external images (Lucide icons + CSS shapes + initials for avatars)
- Mobile-first Tailwind classes throughout
- Smooth scroll for anchor links
- Framer-motion-free (pure CSS animations to keep bundle small)

