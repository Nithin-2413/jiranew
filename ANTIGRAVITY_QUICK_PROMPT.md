# Quick Antigravity Prompt - JIRA Report Generator UI/UX Fix

## Context
I have a JIRA Report Generator React app that needs critical UI/UX fixes. The project is 80% complete functionally but users rate the UI/UX at 1%.

## Critical Issues
1. **Data Overflow**: Charts/tables overflow when data is large - need internal scrolling
2. **Missing Filters**: Need team/people filters on EVERY visualization (not global)
3. **Export Broken**: Charts don't appear in PDF/Word exports

## Your Task
Read these files FIRST (in order):
1. `test_result.md` - Testing protocol and current status
2. `UI_UX_REDESIGN_PROMPT.md` - Complete redesign specifications
3. `SKILL_UI_UX.md` - UI/UX improvement skill guide
4. Project README and other .md docs in the repo

Then implement:

### Phase 1: Fix Critical Issues
- Add scroll containers to all charts/tables (max-height + overflow-y: auto)
- Add team/people filter dropdowns to ChartsPreview.js (one filter set per visualization)
- Fix pdfGenerator.js and wordGenerator.js to capture charts using html2canvas

### Phase 2: UI/UX Redesign
- Implement dark theme from UI_UX_REDESIGN_PROMPT.md
- Use distinctive fonts (NOT Inter, Roboto, Arial)
- Create glassmorphism cards with subtle animations
- Use unique cyan accent color (#00D9FF) instead of generic purple

### Phase 3: Testing
- Test with 500+ issues to verify no overflow
- Test filters work independently on each chart
- Test PDF/Word exports include all selected charts
- Update test_result.md following the testing protocol

## Files to Modify (Priority Order)
1. `frontend/src/index.css` - CSS variables & global styles
2. `frontend/src/App.css` - Dark theme
3. `frontend/src/components/ChartsPreview.js` - Filters + scroll
4. `frontend/src/components/MetricsCards.js` - Card redesign
5. `frontend/src/services/pdfGenerator.js` - Fix chart export
6. `frontend/src/services/wordGenerator.js` - Fix chart export
7. `frontend/src/services/dataProcessor.js` - Filter helpers

## Success Criteria
- ✅ Zero overflow issues with large datasets
- ✅ Every visualization has working filters
- ✅ Charts appear in PDF/Word exports
- ✅ Professional, modern dark theme
- ✅ User satisfaction improves to 80%+

## Important Notes
- Follow the testing protocol in test_result.md
- Update test_result.md after each change
- Use the color palette and fonts from UI_UX_REDESIGN_PROMPT.md
- Each visualization needs its OWN filter set (not shared/global)
- Test exports with ExportOptionsModal selections

Start with reading the documentation files, then implement fixes in priority order.