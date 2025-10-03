# Canvas Renderer DOM - Phase 3 Plan

**Date**: 2025-10-02  
**Author**: @darianrosebrook  
**Phase**: 3 - Accessibility & Polish  
**Branch**: `feature/canvas-renderer-phase3-accessibility`  
**Status**: 🟡 In Progress

---

## Overview

Phase 3 focuses on making the canvas renderer accessible to all users, including those using assistive technologies. This phase ensures WCAG 2.1 AA compliance and adds keyboard navigation support.

---

## Current State

### Completed
- ✅ Phase 1: Core rendering infrastructure
- ✅ Phase 2: Performance optimizations
- ✅ Main branch updated and pushed
- ✅ Feature branch created

### Ready to Implement
- 🎯 Accessibility tree generation
- 🎯 Keyboard navigation
- 🎯 ARIA labels and roles
- 🎯 Screen reader support
- 🎯 Focus indicators

---

## Objectives

### 1. Accessibility Tree
**Goal**: Provide semantic HTML structure for screen readers

**Requirements**:
- Generate accessible DOM structure
- Use semantic HTML elements where appropriate
- Maintain parallel visual and accessible trees

**Implementation Strategy**:
- Add `role` attributes to canvas elements
- Generate hidden accessible text for screen readers
- Map visual nodes to semantic equivalents

---

### 2. Keyboard Navigation
**Goal**: Full keyboard access to all interactive elements

**Requirements**:
- Tab navigation between selectable nodes
- Arrow key navigation within canvas
- Enter/Space for selection
- Escape to clear selection

**Keyboard Shortcuts**:
```
Tab/Shift+Tab: Navigate between nodes
Arrow Keys: Move focus within canvas
Enter/Space: Select/deselect node
Escape: Clear selection
Cmd/Ctrl+A: Select all
```

**Implementation Strategy**:
- Add `tabIndex` to interactive elements
- Implement keyboard event handlers
- Maintain focus state
- Visual focus indicators

---

### 3. ARIA Labels and Roles
**Goal**: Proper labeling for assistive technology

**Requirements**:
- `role="application"` for canvas container
- `aria-label` for all interactive elements
- `aria-selected` for selection state
- `aria-describedby` for node details

**Node Type Mappings**:
```typescript
frame -> role="group" aria-label="Frame: {name}"
text -> role="text" aria-label="Text: {content}"
component -> role="button" aria-label="Component: {name}"
```

**Implementation Strategy**:
- Add ARIA attributes during render
- Update attributes on state change
- Provide meaningful labels

---

### 4. Focus Indicators
**Goal**: Visible focus indicators for keyboard users

**Requirements**:
- High contrast focus outline (3:1 ratio)
- Different from selection outline
- Follows focus movement
- Respects prefers-reduced-motion

**Visual Style**:
```css
.canvas-node:focus {
  outline: 3px solid #2563eb; /* Blue focus ring */
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3);
}

@media (prefers-reduced-motion: reduce) {
  .canvas-node:focus {
    transition: none;
  }
}
```

---

### 5. Screen Reader Support
**Goal**: Full screen reader compatibility

**Requirements**:
- Announce selection changes
- Announce node updates
- Provide node context
- Support live regions for updates

**Implementation Strategy**:
- Add `aria-live="polite"` regions
- Announce actions via screen reader
- Test with VoiceOver (macOS) and NVDA (Windows)

---

## Implementation Tasks

### Task 1: Add ARIA Attributes (30 min)
- [ ] Add `role` attributes to renderer
- [ ] Add `aria-label` to all nodes
- [ ] Add `aria-selected` for selection state
- [ ] Add `tabIndex` for keyboard navigation

### Task 2: Keyboard Navigation (45 min)
- [ ] Implement Tab navigation
- [ ] Implement Arrow key navigation
- [ ] Implement Enter/Space selection
- [ ] Implement Escape to clear

### Task 3: Focus Indicators (30 min)
- [ ] Add focus styling CSS
- [ ] Track focus state in renderer
- [ ] Update focus on keyboard navigation
- [ ] Test with keyboard-only navigation

### Task 4: Screen Reader Support (45 min)
- [ ] Add live regions for announcements
- [ ] Implement announcement helpers
- [ ] Add contextual descriptions
- [ ] Test with VoiceOver/NVDA

### Task 5: Accessibility Testing (30 min)
- [ ] Manual keyboard navigation test
- [ ] Screen reader test (VoiceOver)
- [ ] Color contrast verification
- [ ] WCAG 2.1 AA checklist

---

## Acceptance Criteria

### Keyboard Navigation
- [ ] Can navigate all nodes with Tab
- [ ] Can select nodes with Enter/Space
- [ ] Can clear selection with Escape
- [ ] Focus is visible at all times

### Screen Reader
- [ ] VoiceOver reads node types correctly
- [ ] Selection changes are announced
- [ ] Node properties are accessible
- [ ] Navigation context is clear

### WCAG 2.1 AA Compliance
- [ ] Color contrast ≥ 4.5:1 for text
- [ ] Focus indicators ≥ 3:1 contrast
- [ ] All interactive elements keyboard accessible
- [ ] No keyboard traps
- [ ] Meaningful labels for all controls

---

## Files to Modify

1. **src/renderer.ts**
   - Add ARIA attributes to rendered elements
   - Implement keyboard event handlers
   - Add focus management
   - Add live region support

2. **src/types.ts**
   - Add focus state to SelectionState
   - Add keyboard navigation options

3. **src/renderers/*.ts**
   - Add ARIA labels to each node type
   - Add role attributes
   - Add focus handling

---

## Testing Strategy

### Manual Testing
1. **Keyboard Only**: Navigate entire canvas without mouse
2. **Screen Reader**: Test with VoiceOver on macOS
3. **High Contrast**: Test in high contrast mode
4. **Reduced Motion**: Test with prefers-reduced-motion

### Automated Testing (Phase 4)
- axe-core accessibility tests
- Keyboard navigation tests
- ARIA attribute validation
- Focus management tests

---

## Non-Functional Requirements

### Performance
- Keyboard navigation overhead: <2ms per keystroke
- ARIA attribute updates: <1ms per change
- No impact on render performance

### Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Screen readers (VoiceOver, NVDA, JAWS)
- Keyboard layouts (QWERTY, AZERTY, etc.)

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex keyboard navigation | Medium | Start with Tab/Enter basics, iterate |
| Screen reader compatibility | Medium | Test early with VoiceOver, adjust |
| Performance overhead | Low | Benchmark keyboard handlers |
| Focus management complexity | Medium | Use browser focus APIs, keep simple |

---

## Success Metrics

- [ ] 100% keyboard navigable
- [ ] WCAG 2.1 AA compliance verified
- [ ] VoiceOver compatible
- [ ] No accessibility warnings in browser devtools
- [ ] Focus visible at all times
- [ ] Zero keyboard traps

---

## Timeline

**Estimated Duration**: 1-2 days (3-4 hours focused work)  
**Started**: 2025-10-02  
**Target Completion**: 2025-10-03

**Breakdown**:
- ARIA attributes: 30 min
- Keyboard navigation: 45 min
- Focus indicators: 30 min
- Screen reader support: 45 min
- Testing: 30 min
- Buffer: 30 min

---

## References

- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/
- **Keyboard Navigation**: https://webaim.org/techniques/keyboard/

---

**Next Steps**: Begin with Task 1 - Add ARIA Attributes

---

**Last Updated**: 2025-10-02  
**Status**: Ready to start Phase 3 implementation


