# Typography — type scale & legibility rules

Agents repeatedly ship UI with **font sizes that are too small** on phone. This
doc is the guardrail. Read it before adding or tuning text in `app/` or `src/`.

## Always use the responsive pattern

```tsx
const { scaleFont, scaleSpace, isTablet } = useResponsive();

<Text style={{ fontSize: typeScale.body * scaleFont }} />
```

- **Phone base** sizes live in `src/features/theme/type-scale.ts`.
- Multiply every `fontSize` by **`scaleFont`** (×1.3 on iPad, ≥768pt).
- Font **families** come from `fontFamilies` in `src/features/theme/fonts.ts` —
  pick the weight-specific family, do not set `fontWeight`.
- Colors from `theme.colors.*` only (see `AGENTS.md`).

## Minimum sizes (phone base, before `scaleFont`)

| Role | Token | Min (pt) | Use for |
|------|-------|----------|---------|
| Meta / kicker | `typeScale.meta` | **12** | Section kickers, mono uppercase labels |
| Caption | `typeScale.caption` | **14** | Row subtitles, hints, secondary lines |
| Body | `typeScale.body` | **16** | Paragraphs, benefit bullets, sheet intro |
| Title | `typeScale.title` | **17** | List-row titles, tappable row primary text |
| Section | `typeScale.section` | **22** | In-card headings |
| Sheet title | `typeScale.sheetTitle` | **26** | Bottom sheets, modals (`sheetTitleTablet` on iPad) |
| CTA | `typeScale.cta` | **15** | Button labels (`ctaTablet` on iPad) |

### Hard rules

1. **Never below 12pt** for any user-facing copy (except purely decorative
   chrome where the mockup is explicit — tab-bar micro-labels are the only
   exception, and even there prefer 10–11 only when matching `styles.css` exactly).
2. **Never use 10–11pt for list items, body copy, or sheet content.** Agents
   default to 10–13pt; that is too small — bump to the table above.
3. **Prefer `typeScale.*` over magic numbers.** If a size is missing, extend
   `type-scale.ts` and this table instead of inlining `fontSize: 11`.
4. **Match existing surfaces** before inventing: `profile-library-rows.tsx`,
   `membership-thanks-sheet.tsx`, `paywall-sheet.tsx` are reference implementations.
5. **Mockup CSS is a floor, not a ceiling.** When `styles.css` says 9–11px,
   add **+2 to +4pt** for mobile legibility unless the element is non-readable
   chrome. Pull structure and copy from mockups; pull sizes from this scale when
   in doubt (see `docs/agents/mockup-to-code-map.md` §1).

## Line height

Pair sizes with comfortable line heights (body ≥1.35×, titles slightly tighter).
When bumping `fontSize`, bump `lineHeight` proportionally — do not leave cramped
single-line heights on multi-line text.

## Checklist before declaring UI done

- [ ] Every `fontSize` uses `typeScale` or is ≥ the minimum for its role.
- [ ] Every `fontSize` is multiplied by `scaleFont`.
- [ ] Smoke on **phone and iPad** (`docs/agents/ui-visual-testing.md`).
- [ ] Re-check **`midnight`** palette — small muted text fails contrast first.
