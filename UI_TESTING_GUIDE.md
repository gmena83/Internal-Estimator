# UI Testing & Screenshot Capture Guide

## Automated UI Test Script

This guide provides step-by-step instructions for testing all UI features and capturing screenshots.

### Prerequisites

- Server running on `http://localhost:5000`
- Browser with developer tools open
- Screenshot tool ready (Windows: Win+Shift+S, Mac: Cmd+Shift+4)

## Test Scenarios

### 1. Dashboard - Initial State

**Steps**:

1. Navigate to `http://localhost:5000`
2. Wait for page to load completely
3. Verify glassmorphism effects on cards
4. Check animations on page load

**Screenshot**: `01_dashboard_initial.png`

**Validation Checklist**:

- [ ] "New Project" button visible and clickable
- [ ] Sidebar navigation present
- [ ] Recent projects list (if any)
- [ ] Glass effects visible on panels
- [ ] Smooth fade-in animation on load

---

### 2. New Project Dialog

**Steps**:

1. Click "New Project" button
2. Observe modal animation (should slide/scale in)
3. Verify glass effect on modal backdrop

**Screenshot**: `02_new_project_dialog.png`

**Validation Checklist**:

- [ ] Modal opens with smooth animation
- [ ] Backdrop blur effect visible
- [ ] Form fields are accessible
- [ ] Close button works
- [ ] Glass border visible

**Test Data**:

- Title: "UI Test Project - Glassmorphism Demo"
- Description: "Build a modern web application with glassmorphism UI, smooth animations, and responsive design"

---

### 3. Project Created - List View

**Steps**:

1. Submit the new project form
2. Wait for project to appear in list
3. Observe list item animation

**Screenshot**: `03_project_list.png`

**Validation Checklist**:

- [ ] Project appears in list
- [ ] Hover effect on project card
- [ ] Glass card styling applied
- [ ] Click opens project details

---

### 4. Chat Interface

**Steps**:

1. Click on the newly created project
2. Navigate to Chat tab
3. Observe chat interface layout

**Screenshot**: `04_chat_interface.png`

**Validation Checklist**:

- [ ] Chat input field visible
- [ ] Send button functional
- [ ] Message history displays
- [ ] Glass effect on message bubbles
- [ ] Smooth scroll behavior

**Test Message**: "Please generate a detailed estimate for this project"

---

### 5. Chat with Messages

**Steps**:

1. Send the test message
2. Wait for AI response
3. Observe message animations

**Screenshot**: `05_chat_with_response.png`

**Validation Checklist**:

- [ ] Message sent successfully
- [ ] Loading indicator appears
- [ ] Response animates in smoothly
- [ ] Markdown rendering works
- [ ] Timestamps visible

---

### 6. Estimate Tab

**Steps**:

1. Click "Estimate" tab
2. Wait for estimate to generate (if not already)
3. Observe scenario cards

**Screenshot**: `06_estimate_scenarios.png`

**Validation Checklist**:

- [ ] Tab switches smoothly
- [ ] Scenario A card visible
- [ ] Scenario B card visible
- [ ] Glass effect on cards
- [ ] Hover effects work
- [ ] Cost breakdown visible

---

### 7. Scenarios Comparison

**Steps**:

1. Click "Scenarios" tab
2. View side-by-side comparison

**Screenshot**: `07_scenarios_comparison.png`

**Validation Checklist**:

- [ ] Both scenarios displayed
- [ ] ROI analysis visible
- [ ] Feature comparison table
- [ ] Recommendation badge
- [ ] Interactive elements work

---

### 8. Action Buttons

**Steps**:

1. Scroll to action buttons section
2. Hover over each button
3. Observe hover effects

**Screenshot**: `08_action_buttons.png`

**Validation Checklist**:

- [ ] "Approve Estimate" button
- [ ] "Generate Assets" button
- [ ] "Send Email" button
- [ ] Glass button effects
- [ ] Hover animations smooth
- [ ] Click feedback visible

---

### 9. PDF Generation

**Steps**:

1. Click "Approve Estimate"
2. Wait for PDF generation
3. Verify PDF link appears

**Screenshot**: `09_pdf_generated.png`

**Validation Checklist**:

- [ ] Success message appears
- [ ] PDF download link visible
- [ ] Link is clickable
- [ ] Stage indicator updates

---

### 10. Files/Documents Tab

**Steps**:

1. Click "Files" or "Documents" tab
2. View generated documents

**Screenshot**: `10_files_tab.png`

**Validation Checklist**:

- [ ] Proposal PDF listed
- [ ] Download buttons work
- [ ] File icons visible
- [ ] Glass card styling

---

### 11. Dark Mode

**Steps**:

1. Click theme toggle (usually in header/sidebar)
2. Observe theme transition
3. Verify glass effects in dark mode

**Screenshot**: `11_dark_mode.png`

**Validation Checklist**:

- [ ] Theme switches smoothly
- [ ] Glass effects adjust for dark mode
- [ ] Text remains readable
- [ ] Contrast is sufficient
- [ ] All components update

---

### 12. Responsive - Mobile View

**Steps**:

1. Open browser DevTools (F12)
2. Toggle device toolbar
3. Select mobile viewport (iPhone/Android)

**Screenshot**: `12_mobile_view.png`

**Validation Checklist**:

- [ ] Layout adapts to mobile
- [ ] Sidebar collapses/hamburger menu
- [ ] Touch targets adequate size
- [ ] Glass effects still visible
- [ ] No horizontal scroll

---

## Automated Test Execution

### Using Browser Console

```javascript
// Run this in browser console for automated testing
async function runUITests() {
  const results = {
    passed: [],
    failed: [],
    screenshots: []
  };

  // Test 1: New Project Button
  const newProjectBtn = document.querySelector('[data-testid="new-project-btn"]') || 
                        document.querySelector('button:has-text("New Project")');
  if (newProjectBtn) {
    results.passed.push('New Project button found');
    newProjectBtn.click();
    await new Promise(r => setTimeout(r, 500));
  } else {
    results.failed.push('New Project button not found');
  }

  // Test 2: Modal Visibility
  const modal = document.querySelector('[role="dialog"]');
  if (modal && window.getComputedStyle(modal).display !== 'none') {
    results.passed.push('Modal opens correctly');
  } else {
    results.failed.push('Modal did not open');
  }

  // Test 3: Glass Effects
  const glassElements = document.querySelectorAll('.glass-card, .btn-glass');
  if (glassElements.length > 0) {
    results.passed.push(`Found ${glassElements.length} glass effect elements`);
  } else {
    results.failed.push('No glass effects found');
  }

  // Test 4: Animations
  const animatedElements = document.querySelectorAll('[class*="animate-"]');
  if (animatedElements.length > 0) {
    results.passed.push(`Found ${animatedElements.length} animated elements`);
  }

  console.log('UI Test Results:', results);
  return results;
}

// Execute tests
runUITests();
```

## Screenshot Naming Convention

- Format: `##_description.png`
- Examples:
  - `01_dashboard_initial.png`
  - `02_new_project_dialog.png`
  - `11_dark_mode.png`

## Success Criteria

- ✅ All 12 screenshots captured
- ✅ All CTAs functional
- ✅ Glass effects visible in all screenshots
- ✅ Animations smooth (no jank)
- ✅ Dark mode works correctly
- ✅ Mobile responsive

## Common Issues & Solutions

### Issue: Glass effects not visible

**Solution**: Check if `backdrop-filter` is supported in browser. Use Chrome/Edge/Safari.

### Issue: Animations stuttering

**Solution**: Disable browser extensions, check GPU acceleration enabled.

### Issue: Modal not opening

**Solution**: Check console for errors, verify JavaScript loaded correctly.

### Issue: Dark mode not switching

**Solution**: Verify theme provider is working, check localStorage for theme persistence.
