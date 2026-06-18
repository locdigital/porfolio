# Loc Digital CMS UI Redesign - Context & Handoff

This document summarizes the current status, codebase structure, visual implementation, and current bugs of the custom CMS UI redesign. Share this file with the next Codex agent to resume the work.

---

## 1. Goal Description
Redesign the **Decap CMS** admin interface of this Astro website to mimic the **Vercel Dashboard** aesthetic:
- **Clean Developer Aesthetics**: Light background (`#fafafa`), thin hairlines (`#ebebeb`), near-black text/buttons (`#171717`), and modern stacked shadows.
- **Typography**: Retain the site's default fonts (`Plus Jakarta Sans` as the primary UI sans-serif, and `DM Mono` for metadata, labels, and statistics).
- **Core Files**: The UI alterations are loaded via custom scripts/styles injected in [public/admin/index.html](file:///Users/nguyenphucloc/Library/Mobile%20Documents/com~apple~CloudDocs/porfolio/public/admin/index.html):
  - [public/admin/shell.js](file:///Users/nguyenphucloc/Library/Mobile%20Documents/com~apple~CloudDocs/porfolio/public/admin/shell.js) - App Shell markup & visibility routing.
  - [public/admin/shell.css](file:///Users/nguyenphucloc/Library/Mobile%20Documents/com~apple~CloudDocs/porfolio/public/admin/shell.css) - Custom visual variables and Decap CMS selector overrides.

---

## 2. Completed Implementations

### A. Core Routing & Custom Shell ([shell.js](file:///Users/nguyenphucloc/Library/Mobile%20Documents/com~apple~CloudDocs/porfolio/public/admin/shell.js))
- **Hijack Default Root Hash**: Redirects `#` or `#/` hash to a stable custom dashboard route `#/overview` to prevent Decap CMS from instantly loading the first list view.
- **Visual App Shell Wrapper**: Prepend a custom wrapper containing:
  - **Left Sidebar** (`.vc-sidebar`): Houses the Vercel triangle logo and quick navigation icons for Overview, Pages, Writing, Projects, and Media.
  - **Top Header Bar** (`.vc-header`): Contains tab links matching the sidebar items, a mocked global AI search bar, the "New Post" primary button, notifications, and avatar placeholder.
  - **Overview Console Dashboard** (`#loc-director-console`): Rendered only when active route is `#/overview`. Features KPI cards (Pages Completed, Blog Posts, Selected Work) and Collection card entries to quickly navigate to specific Decap CMS sub-routes.
- **Visibility & Class Toggle**: Automatically listens to `hashchange` events and toggles:
  - `body.loc-console-visible` (active on `#/overview` route to display the custom static dashboard).
  - `body.loc-editor-visible` (active on `#/collections/.../new` or `#/collections/.../entries/...` routes to apply layout adaptations for the Markdown editor).

### B. Custom CSS Visual Overrides ([shell.css](file:///Users/nguyenphucloc/Library/Mobile%20Documents/com~apple~CloudDocs/porfolio/public/admin/shell.css))
- Configured CSS theme variables matching Vercel Design System tokens.
- Structured CSS Grid/Flex layouts for the dual-sidebar custom dashboard.
- Adjusted Decap CMS container margins (`[class*="AppMain"]`) to align with our permanent left sidebar and top navigation.
- Overwrote buttons, checkbox selectors, nested tables, cards, preview split-panes, and input controls to match the clean outline aesthetic.

---

## 3. Current Issue: Missing Save / Publish / Back Buttons in Editor
When editing or creating an entry (e.g., navigating to `#/collections/writing/new`), the editor toolbar (the secondary header containing the `← Back`, `Changes saved` status, and `Publish` button dropdown) **is completely hidden**.

### Root Cause
1. **Decap CMS Toolbar Element**: In Decap CMS, the editor controls (Save/Publish/Back actions) are rendered inside the default `AppHeader` component, which is standard for the top of the interface.
2. **Global CSS Hide Rule**: In [shell.css:L766-L768](file:///Users/nguyenphucloc/Library/Mobile%20Documents/com~apple~CloudDocs/porfolio/public/admin/shell.css#L766-L768), we hide the default Netlify header globally:
   ```css
   #nc-root [class*="AppHeader"] {
     display: none !important;
   }
   ```
   This rule is necessary for the dashboard/list views, but because it is global, it also hides the `AppHeader` component when in the editor view—taking the action buttons along with it.

---

## 4. Required Next Steps (To-Do for next Agent)

### Step 1: Conditionally Display and Style the `AppHeader` inside the Editor
Modify [public/admin/shell.css](file:///Users/nguyenphucloc/Library/Mobile%20Documents/com~apple~CloudDocs/porfolio/public/admin/shell.css) to show the `AppHeader` component **only when editing entries** (by targeting `body.loc-editor-visible`). 

It should sit as a secondary sub-toolbar right below our main header:
```css
/* Show and style Netlify AppHeader in Editor view as a secondary actions toolbar */
body.loc-editor-visible #nc-root [class*="AppHeader"] {
  display: flex !important;
  position: fixed !important;
  top: 64px !important;       /* Placed below the custom 64px Vercel header */
  left: 64px !important;      /* Clears the 64px left sidebar */
  right: 0 !important;
  height: 56px !important;
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border-bottom: 1px solid var(--vc-hairline) !important;
  z-index: 99 !important;
  box-shadow: var(--vc-shadow-sm) !important;
  padding: 0 24px !important;
  align-items: center !important;
  justify-content: space-between !important;
}

/* Format action buttons inside this toolbar */
body.loc-editor-visible #nc-root [class*="AppHeader"] button,
body.loc-editor-visible #nc-root [class*="AppHeader"] a,
body.loc-editor-visible #nc-root [class*="AppHeader"] [role="button"] {
  border-radius: var(--vc-radius-sm) !important;
  font-size: 13px !important;
  padding: 6px 12px !important;
  min-height: 32px !important;
  line-height: 1.5 !important;
}
```

### Step 2: Adjust Editor Workspace Paddings
Verify that `EditorContainer` has sufficient top padding to prevent the editor widgets from slipping behind the sub-toolbar:
```css
[class*="EditorContainer"] {
  margin-left: 64px !important;
  padding-top: 120px !important; /* Clears 64px main header + 56px sub-toolbar */
  background-color: var(--vc-bg) !important;
  min-height: calc(100vh - 64px) !important;
}

[class*="EditorControlPane"] {
  padding: 40px !important;
  max-width: 800px !important;
  margin: 0 auto !important;     /* Centers editor sheet */
  background: var(--vc-surface) !important;
  border: 1px solid var(--vc-hairline) !important;
  border-radius: var(--vc-radius-lg) !important;
}
```

### Step 3: Verify Visual Presentation via Browser Agent
Run local verification on `http://localhost:4321/admin/#/collections/writing/new` to ensure:
- The sub-toolbar renders correctly below our custom tab header.
- The `← Back` collection link, save/publish status label, and `Publish` button dropdown are fully visible and clickable.
- Try selecting an existing entry and verify that the `Delete` action button is styled correctly.
