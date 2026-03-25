# UI/UX Improvement Skill for JIRA Report Generator

## Purpose
Fix critical UI/UX issues and redesign the JIRA Report Generator interface to achieve professional, enterprise-grade quality.

## When to Use This Skill
Use this skill when working on UI/UX improvements for the JIRA Report Generator project, specifically when addressing:
- Data overflow and component scrolling issues
- Missing team/people filters on visualizations
- Chart export problems in PDF/Word reports
- Overall dark theme and design system improvements

## Prerequisites - ALWAYS READ FIRST
Before making ANY changes, read these project files:
1. `test_result.md` - Testing protocol and implementation status
2. `design_guidelines.json` - Design specifications (if exists)
3. `JIRA_REPORT_GENERATOR.md` - Feature documentation
4. `README.md` - Project overview
5. `UI_UX_REDESIGN_PROMPT.md` - Complete redesign specifications

## Critical Issues to Fix

### 1. Component Overflow & Scrolling
**Problem**: Large datasets cause visualizations to overflow and overlap.

**Solution**:
- Wrap each chart/table in a scroll container with `max-height` and `overflow-y: auto`
- Add custom styled scrollbars matching dark theme
- Ensure sticky table headers when scrolling
- Test with 500+ items to verify

**Files**: `ChartsPreview.js`, `App.css`

### 2. Team/People Filters
**Problem**: No way to filter visualizations by team or assignee.

**Solution**:
- Add filter dropdowns to EVERY visualization (not global filters)
- Each chart gets: Team, Assignee, Status, Issue Type filters
- Filters must be independent per visualization
- Filtered data must reflect in exports

**Files**: `ChartsPreview.js`, `dataProcessor.js`, `pdfGenerator.js`, `wordGenerator.js`

### 3. Charts Not in Reports
**Problem**: Visualizations don't appear in exported PDF/Word documents.

**Solution**:
- Use html2canvas to capture charts as images
- Ensure proper scaling (scale: 2) and dark background
- Respect ExportOptionsModal selections
- Fix sizing to fit PDF/Word page boundaries

**Files**: `pdfGenerator.js`, `wordGenerator.js`

## Design System

### Color Palette (Dark Theme)
```css
--bg-primary: #0a0a0a;
--bg-secondary: #141414;
--accent-primary: #00D9FF;  /* Unique cyan - NOT purple */
--text-primary: #FFFFFF;
--border-subtle: rgba(255, 255, 255, 0.08);
```

### Typography (Distinctive Fonts)
```css
--font-display: 'Outfit', 'Manrope', sans-serif;
--font-body: 'Satoshi', 'Plus Jakarta Sans', sans-serif;
/* AVOID: Inter, Roboto, Arial, Space Grotesk */
```

### Component Patterns

**Glassmorphism Cards**:
```css
.glass-card {
  background: rgba(20, 20, 20, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 217, 255, 0.15);
}
```

**Scroll Containers**:
```css
.scroll-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.scroll-container::-webkit-scrollbar {
  width: 6px;
}

.scroll-container::-webkit-scrollbar-thumb {
  background: var(--accent-primary);
  border-radius: 3px;
}
```

**Animations**:
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.card {
  animation: fadeInUp 0.5s ease-out;
}
```

## Implementation Checklist

### Phase 1: Global Styles (Start Here)
- [ ] Update `index.css` with CSS variables
- [ ] Update `App.css` with dark theme
- [ ] Import distinctive fonts
- [ ] Add global animations

### Phase 2: Core Components
- [ ] Redesign `MetricsCards.js` with glassmorphism
- [ ] Update `Dashboard.js` layout structure
- [ ] Fix `ChartsPreview.js` - add filters + scroll
- [ ] Update all modals with new design

### Phase 3: Data & Exports
- [ ] Add filter helpers to `dataProcessor.js`
- [ ] Fix chart capture in `pdfGenerator.js`
- [ ] Fix chart capture in `wordGenerator.js`
- [ ] Test exports with large datasets

### Phase 4: Testing
- [ ] Test with 500+ issues for overflow
- [ ] Test all filters independently
- [ ] Test PDF export with all charts
- [ ] Test Word export with all charts
- [ ] Update `test_result.md` with results

## Key Files to Modify

**High Priority**:
1. `frontend/src/index.css` - Global styles & variables
2. `frontend/src/App.css` - Dark theme & layout
3. `frontend/src/components/Dashboard.js` - Layout
4. `frontend/src/components/MetricsCards.js` - Cards
5. `frontend/src/components/ChartsPreview.js` - Charts + filters
6. `frontend/src/services/dataProcessor.js` - Filter logic
7. `frontend/src/services/pdfGenerator.js` - Chart export
8. `frontend/src/services/wordGenerator.js` - Chart export

**Medium Priority**:
9. `frontend/src/components/FilterModal.js` - Redesign
10. `frontend/src/components/ConfigurationModal.js` - Redesign
11. `frontend/src/components/ExportOptionsModal.js` - Redesign

## Testing Protocol

After each change:
1. Update `test_result.md` with implementation details
2. Set `needs_retesting: true` for modified tasks
3. Add comment to `status_history` explaining changes
4. Update `agent_communication` with summary
5. Test with large datasets (500+ items)
6. Verify exports contain charts
7. Check filters work independently

## Success Metrics

The redesign succeeds when:
- ✅ Zero data overflow issues with any dataset size
- ✅ All visualizations have working independent filters
- ✅ PDF/Word exports contain all selected charts correctly
- ✅ UI achieves 80%+ user satisfaction (up from 1%)
- ✅ Design is distinctive, modern, and professional
- ✅ Animations are smooth (60fps)
- ✅ No generic AI aesthetics

## Common Pitfalls to Avoid

❌ Don't use generic fonts (Inter, Roboto, Arial)
❌ Don't use purple gradient on white (cliché)
❌ Don't forget to test with large datasets
❌ Don't make filters global (each viz needs its own)
❌ Don't skip chart capture in exports
❌ Don't forget to update test_result.md
❌ Don't use fixed heights without scroll
❌ Don't overlap components

## Additional Resources

- Recharts documentation for chart customization
- html2canvas docs for proper chart capture
- Framer Motion for advanced animations
- shadcn/ui for base components (customize heavily)
- Tailwind CSS for utility classes