# ISI Design Guidelines

## Design Approach
**System-Based: Linear + VS Code Command Palette Hybrid**

This productivity application demands a professional, information-dense interface optimized for complex workflow orchestration. Drawing from Linear's clean productivity aesthetic and VS Code's command-center functionality.

## Core Design Principles
1. **Information Hierarchy**: Multi-level navigation with clear visual separation between project context, workspace, and system status
2. **Command-First UX**: Chat interface as primary interaction, supporting paste-and-process workflows
3. **Real-time Transparency**: Persistent API health monitoring with status indicators
4. **Workflow Clarity**: Five distinct stages with clear progression markers

## Layout System

**Three-Panel Command Center**
- Left Sidebar: `w-64` fixed width, full height
- Main Workspace: `flex-1` flexible, contains chat + viewer
- Right Sidebar: `w-72` fixed width, full height

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: `p-4` or `p-6`
- Section spacing: `space-y-6` or `space-y-8`
- Inline elements: `gap-2` or `gap-4`

## Typography

**Font Families**
- Primary: `font-sans` (Inter via CDN)
- Mono: `font-mono` (JetBrains Mono via CDN) for code/technical content

**Hierarchy**
- Page Headers: `text-2xl font-semibold`
- Section Titles: `text-lg font-medium`
- Body Text: `text-base font-normal`
- Secondary Info: `text-sm font-normal`
- Captions/Meta: `text-xs font-medium`
- Mono Content: `text-sm font-mono`

## Component Library

### Left Sidebar: Project Navigator
**Last 5 Projects List**
- Compact cards: `p-3 rounded-lg` per project
- Project title: `text-sm font-medium truncate`
- Metadata row: `text-xs` (date, status badge)
- Active state: `ring-2 ring-inset`

**History Button**
- Fixed bottom position: `absolute bottom-4`
- Full-width: `w-full px-4`
- Icon + label: Heroicons `archive-box`

**History Modal**
- Overlay: Full viewport with backdrop
- Content: `max-w-4xl` centered container
- Search bar: Top position with `sticky top-0`
- Grid layout: `grid grid-cols-2 gap-4` for archive items

### Main Workspace

**Chat Interface**
- Messages area: `flex-1 overflow-y-auto space-y-4`
- Input zone: Fixed bottom, `sticky bottom-0`
- Textarea: Auto-expanding, `min-h-24 max-h-48`
- Send button: Icon-only, positioned inline-end

**Markdown Viewer**
- Container: `max-w-4xl mx-auto py-8 px-6`
- Headings: Progressive sizing with bottom borders
- Code blocks: `rounded-lg p-4` with syntax highlighting
- Tables: Full-width with alternating row treatments
- Lists: Proper indentation `ml-6`

**Action Bar**
- Horizontal layout: `flex gap-3 justify-end`
- Button group at stage completion
- Icons: Heroicons (document-check, arrow-path, paper-airplane, clipboard-document-list)

### Right Sidebar: API Health Dashboard

**Header**
- Title: `text-lg font-semibold`
- Last updated timestamp: `text-xs`

**Service Status Cards**
- Stacked vertically: `space-y-3`
- Each card: `p-3 rounded-lg`
- Service name: `text-sm font-medium`
- Status indicator: Dot icon with label (Heroicons `signal`)
- Metrics: Small stats row `text-xs`

**Integration Services**
- Perplexity: Research status
- Gemini: Reasoning usage
- Claude: Code generation
- PDF.co: Document rendering
- Resend: Email tracking (opened/clicked counts)
- Gamma: Presentation status
- Nano Banana: Image generation

### Stage Progress Indicator

**Workflow Steps Bar**
- Horizontal stepper: `flex justify-between`
- 5 circular nodes connected by lines
- Stage labels: `text-xs` below nodes
- Current stage: Emphasized treatment
- Completed stages: Check mark icons
- Future stages: Number indicators

### Modals & Overlays

**Standard Modal Structure**
- Backdrop: Full viewport overlay
- Content: `max-w-2xl` default, `max-w-6xl` for document previews
- Header: `px-6 py-4 border-b`
- Body: `px-6 py-6`
- Footer: `px-6 py-4 border-t` with action buttons

**Markdown Document Preview**
- Full viewport modal: `max-w-6xl h-[90vh]`
- Two-column option for comparison views
- Zoom controls in header
- Download/print actions in footer

### Forms & Inputs

**Text Input**
- Standard height: `h-10 px-3 rounded-lg`
- Focus state: `ring-2 ring-offset-0`
- Error state: Additional red ring

**Textarea**
- Minimum height: `min-h-32`
- Rounded corners: `rounded-lg`
- Padding: `p-3`

**Select Dropdown**
- Same height as text input: `h-10`
- Chevron icon right-aligned

**Buttons**
- Primary: `px-4 h-10 rounded-lg font-medium`
- Secondary: Same size, different treatment
- Icon buttons: `h-10 w-10 rounded-lg`
- Small variant: `h-8 px-3 text-sm`

### Status Badges
- Compact: `px-2 h-6 rounded-full text-xs font-medium`
- States: Active, Pending, Completed, Failed, Archived
- Icons: Small dot or icon prefix

### Cards & Containers

**Project Cards (Archive)**
- Grid item: `rounded-lg p-4`
- Header row: Title + status badge
- Meta row: Date, client, value
- Action buttons: Icon-only at top-right

**Estimate Scenario Cards**
- Side-by-side comparison: `grid grid-cols-2 gap-6`
- Header: Scenario name + recommended badge
- Content sections: Features, pricing, timeline
- Footer: CTA button

**Document Generation Cards**
- List view: `space-y-4`
- Icon + document type: Left aligned
- Status indicator: Right aligned
- Download action: Icon button

## Asset Guidelines

**Icons**: Heroicons via CDN
- UI controls: 20px (h-5 w-5)
- Status indicators: 16px (h-4 w-4)
- Large icons: 24px (h-6 w-6)

**Fonts**: Google Fonts via CDN
- Inter (weights: 400, 500, 600)
- JetBrains Mono (weight: 400)

## Accessibility

- Minimum touch target: 40px (h-10)
- Focus indicators on all interactive elements
- ARIA labels for icon-only buttons
- Semantic HTML for document structure
- Keyboard navigation for all workflows

## Animations

**Minimal Motion**
- Sidebar collapse/expand: `transition-all duration-200`
- Modal entry: `transition-opacity duration-150`
- Status updates: Subtle pulse on change
- NO scroll-triggered animations
- NO decorative motion

## Images

**No hero images** - This is a utility application, not a marketing site.

**Functional Images Only**
- Generated cover images in document previews
- Client logos in project cards (small, 32px height)
- Status icons as inline elements