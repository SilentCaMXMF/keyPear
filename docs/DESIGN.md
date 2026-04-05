# KeyPear Design Specification

> UI/UX design documentation for the KeyPear cloud storage application.
> This document serves as a reference for design improvements and consistency.

---

## 1. Project Overview

**KeyPear** is a self-hosted cloud storage application designed for small teams (10-100 users). It runs on a Raspberry Pi with storage backed by SMB, and is accessed via web interface.

### Tech Stack
- **Frontend**: Vanilla JS SPA with Vite + Tailwind CSS v4
- **Backend**: Express.js on Node.js
- **Storage**: SMB mount (192.168.1.254/public)
- **Deployment**: Vercel (frontend), Raspberry Pi (backend)

### Design Philosophy
- Clean, professional aesthetic suitable for business use
- Material Design 3 inspired with custom emerald/green theme
- Fast, responsive interactions with minimal visual clutter
- Accessible by default

---

## 2. Color System

### Primary Palette (Emerald/Green)

```css
/* Primary Colors */
--primary: #006b22;           /* Dark green - buttons, links */
--primary-container: #01872e; /* Bright green - accents, highlights */
--on-primary: #ffffff;        /* White text on primary */
--on-primary-container: #f7fff1; /* Light text on primary container */

/* Primary Shades */
--primary-50: #e8f5e9;
--primary-100: #c8e6c9;
--primary-200: #a5d6a7;
--primary-300: #81c784;
--primary-400: #66bb6a;
--primary-500: #01872e;  /* Default container */
--primary-600: #006b22;  /* Default primary */
--primary-700: #005c1e;
--primary-800: #004d19;
--primary-900: #003e15;
```

### Surface Colors

```css
/* Surface Container Scale (Material Design 3 inspired) */
--surface-container-lowest: #ffffff;   /* Cards, elevated surfaces */
--surface-container-low: #f0f4fc;      /* Sidebar background */
--surface-container: #eaeef6;         /* Input backgrounds */
--surface-container-high: #e4e8f0;     /* Hover states */
--surface-container-highest: #dee3eb; /* Secondary buttons */

/* Semantic Surfaces */
--background: #f7f9ff;                /* Page background */
--on-background: #171c22;              /* Primary text */
--on-surface: #171c22;                /* Body text */
--on-surface-variant: #3e4a3d;        /* Secondary text, captions */
```

### Error/Status Colors

```css
--error: #ba1a1a;
--error-container: #ffdad6;
--on-error: #ffffff;
--on-error-container: #93000a;

--success: #006e25;
--success-container: #80f98b;
```

### Dark Mode Colors

> ⚠️ **Dark mode is partially implemented but not fully tested.**

```css
--dark-background: #0f1419;
--dark-surface: #1a1f26;
--dark-surface-container: #242b33;
--dark-on-surface: #e6eaef;
--dark-on-surface-variant: #9aa3ae;
```

---

## 3. Typography

### Font Family

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

### Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 2rem (32px) | 800 (ExtraBold) | 1.2 |
| H2 | 1.125rem (18px) | 700 (Bold) | 1.4 |
| H3 | 1rem (16px) | 600 (SemiBold) | 1.4 |
| Body | 0.875rem (14px) | 400 (Regular) | 1.6 |
| Caption | 0.75rem (12px) | 400 | 1.5 |
| Label | 0.75rem (12px) | 700 | 1.2 |

### Letter Spacing

- Headlines: `-0.02em` (tight tracking)
- Labels: `0.05em` (wide tracking, uppercase)

### Sources

```html
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
```

---

## 4. Iconography

### Icon Library

**Material Symbols Outlined** (Google Fonts)

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..100&display=swap" rel="stylesheet">
```

### Usage

```html
<span class="material-symbols-outlined">icon_name</span>
```

### Common Icons Used

| Icon | Name | Use Case |
|------|------|----------|
| `folder` | Folder | Folder items |
| `folder_open` | Open folder | Empty state |
| `description` | File | Generic file |
| `image` | Image | Image files |
| `videocam` | Video | Video files |
| `audio_file` | Audio | Audio files |
| `picture_as_pdf` | PDF | PDF files |
| `upload` | Upload | Upload button |
| `download` | Download | Download action |
| `delete` | Delete | Delete action |
| `delete_forever` | Permanent delete | Trash actions |
| `restore` | Restore | Restore from trash |
| `create_new_folder` | New folder | Create folder |
| `drive_file_move` | Move | Move action |
| `content_copy` | Copy | Copy action |
| `edit` | Edit | Rename action |
| `group` | Group | Shared files |
| `schedule` | Clock | Recent files |
| `search` | Search | Search input |
| `home` | Home | Root folder |
| `logout` | Logout | Sign out |
| `sync` | Sync | Loading spinner |

### Icon Configuration

```css
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
```

- **FILL**: 0 (outlined) or 1 (filled)
- **wght**: 100-700 (weight)
- **GRAD**: 0 (normal) or 1 (filled)
- **opsz**: 20-48 (optical sizing)

---

## 5. Spacing System

### Tailwind Default Scale

| Token | Value | Use |
|-------|-------|-----|
| `px` | 1px | Borders |
| `0.5` / `1` | 4px / 8px | Tight spacing |
| `2` / `3` / `4` | 8px / 12px / 16px | Default gaps |
| `5` / `6` / `8` | 20px / 24px / 32px | Section spacing |
| `12` / `16` | 48px / 64px | Large gaps |

### Page Layout

```css
/* Sidebar width */
--sidebar-width: 256px;

/* Top bar height */
--topbar-height: 64px;

/* Main content padding */
--content-padding: 32px; /* p-8 in Tailwind */
```

---

## 6. Component Specifications

### 6.1 Top App Bar

**Location**: Fixed at top, full width

```html
<header class="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6">
  <!-- Logo -->
  <span class="text-xl font-black text-slate-900 tracking-tighter">keyPear</span>
  
  <!-- Search -->
  <div class="relative">
    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
    <input type="text" class="bg-slate-100 rounded-lg pl-10 pr-4 py-2 w-80">
  </div>
  
  <!-- User Avatar -->
  <div class="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
    <span class="text-sm font-bold text-primary">P</span>
  </div>
</header>
```

**States**:
- Default: Transparent with blur
- Scrolled: Solid white (optional)

### 6.2 Sidebar

**Location**: Fixed left, full height

```html
<aside class="fixed left-0 top-0 h-screen w-64 bg-slate-50 border-r border-slate-200/50">
  <!-- User Info Block -->
  <div class="h-10 w-10 rounded-lg bg-primary-container flex items-center justify-center text-white">
    <span class="material-symbols-outlined">lock</span>
  </div>
  
  <!-- Storage Bar -->
  <div class="h-1.5 bg-slate-200 rounded-full overflow-hidden">
    <div class="h-full bg-gradient-to-r from-primary to-primary-container rounded-full" style="width: 30%"></div>
  </div>
  
  <!-- Navigation -->
  <nav>
    <a class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 border-r-2 border-emerald-600">
      <span class="material-symbols-outlined">folder</span>
      My Files
    </a>
  </nav>
</aside>
```

**Navigation Items**:
1. My Files (icon: `folder`)
2. Shared with Me (icon: `group`)
3. Recent (icon: `schedule`)
4. Trash (icon: `delete`)

**Active State**: `bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border-r-2 border-emerald-600`

### 6.3 File List Item

```html
<li class="file-item flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">
  <input type="checkbox" class="w-4 h-4 rounded">
  
  <!-- Thumbnail or Icon -->
  <div class="h-10 w-10 flex items-center justify-center bg-slate-100 rounded-lg">
    <img src="/api/files/{id}/thumbnail" class="h-10 w-10 rounded-lg object-cover">
    <!-- OR -->
    <span class="material-symbols-outlined text-2xl text-primary">folder</span>
  </div>
  
  <!-- Info -->
  <div class="flex-1 min-w-0">
    <p class="text-sm font-medium truncate">filename.ext</p>
    <p class="text-xs text-slate-500">1.2 MB • Mar 21, 2026</p>
  </div>
  
  <!-- Actions (visible on hover) -->
  <button class="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg">
    <span class="material-symbols-outlined text-red-500">delete</span>
  </button>
</li>
```

**States**:
- Default: `bg-white`
- Hover: `bg-slate-50`
- Selected: `bg-primary/5`
- Disabled: 50% opacity

### 6.4 Context Menu

**Trigger**: Right-click on file/folder

```html
<div id="context-menu" class="fixed bg-white rounded-xl shadow-xl border border-slate-200 py-2 min-w-48 z-50">
  <button class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-slate-100">
    <span class="material-symbols-outlined text-lg">folder_open</span>
    Open
  </button>
  <button class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-slate-100 text-red-600">
    <span class="material-symbols-outlined text-lg">delete</span>
    Delete
  </button>
</div>
```

### 6.5 Buttons

**Primary Button**
```html
<button class="bg-gradient-to-br from-primary to-primary-container text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 hover:opacity-90">
  <span class="material-symbols-outlined">upload</span>
  Upload
</button>
```

**Secondary Button**
```html
<button class="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">
  New Folder
</button>
```

**Icon Button**
```html
<button class="p-2 hover:bg-slate-100 rounded-lg">
  <span class="material-symbols-outlined">more_vert</span>
</button>
```

### 6.6 Input Fields

```html
<input 
  type="text" 
  class="bg-slate-100 border-none rounded-lg px-4 py-2 text-sm w-full focus:ring-2 focus:ring-primary/20 outline-none"
  placeholder="Search files..."
>
```

### 6.7 Upload Progress

```html
<div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
  <div class="flex items-center gap-3 mb-2">
    <span class="material-symbols-outlined text-blue-600 animate-spin">sync</span>
    <span class="text-sm font-medium text-blue-700">Uploading... 45%</span>
  </div>
  <div class="h-1.5 bg-blue-200 rounded-full overflow-hidden">
    <div class="h-full bg-blue-500 rounded-full transition-all" style="width: 45%"></div>
  </div>
</div>
```

### 6.8 Modal (Move Dialog)

```html
<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
    <h3 class="text-lg font-bold mb-4">Move to...</h3>
    <div id="folder-tree" class="max-h-64 overflow-y-auto border rounded-lg p-2 mb-4">
      <!-- Folder items -->
    </div>
    <div class="flex justify-end gap-3">
      <button class="px-4 py-2 text-sm font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
      <button class="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg">Move Here</button>
    </div>
  </div>
</div>
```

---

## 7. Layout Structure

### Main Layout (Dashboard)

```
┌─────────────────────────────────────────────────────────────┐
│  Top App Bar (fixed)                              [Avatar]  │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│   Sidebar    │   Main Content                              │
│   (fixed)    │                                              │
│              │   ┌────────────────────────────────────┐    │
│   - Logo     │   │  Header                            │    │
│   - Storage  │   │  - Title                           │    │
│   - Nav      │   │  - Actions (New Folder, Upload)     │    │
│   - Sign Out │   ├────────────────────────────────────┤    │
│              │   │  Content Area                      │    │
│              │   │  - Dropzone (files view)          │    │
│              │   │  - File List                      │    │
│              │   │                                    │    │
│              │   └────────────────────────────────────┘    │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 640px | Sidebar collapses to hamburger menu |
| Tablet | 640-1024px | Narrower sidebar, condensed spacing |
| Desktop | > 1024px | Full layout |

---

## 8. Animations & Interactions

### Transitions

```css
/* Default transitions */
transition-all duration-200;

/* Button press */
transform scale-95; /* On click */

/* Hover fade */
opacity-90;
```

### Loading States

- **Spinner**: `animate-spin` on Material Symbol `sync`
- **Skeleton**: Gray pulse animation (not implemented)
- **Progress bar**: Linear gradient with `transition-all`

### Micro-interactions

| Action | Animation |
|--------|-----------|
| Button hover | `opacity-90` |
| Button press | `scale-95` |
| File item hover | Background color change |
| Context menu open | Fade in `opacity-0` → `opacity-100` |
| Upload progress | Width transition |
| Delete action | Fade out (optional) |

---

## 9. Current Views

### 9.1 My Files (Default)
- Folder navigation with breadcrumbs
- File/folder grid or list
- Drag-and-drop upload zone
- Sort options (name, date, size)
- Search functionality

### 9.2 Shared with Me
- Files shared by others
- Download action only
- No edit/delete actions

### 9.3 Recent
- Last accessed files
- Limited metadata
- Quick download

### 9.4 Trash
- Deleted items (30-day retention implied)
- Restore action
- Permanent delete action
- Empty trash button

---

## 10. Areas for Improvement

> ✏️ **For Design Specialist**

### High Priority

1. **Dark Mode** 
   - Not fully implemented
   - Need complete dark palette
   - Test all components in dark mode

2. **Empty States**
   - Need illustrations or icons
   - Helpful guidance text
   - Call-to-action buttons

3. **Loading States**
   - Skeleton screens for file list
   - Better loading indicators
   - Progress for multi-file uploads

4. **Responsive Design**
   - Mobile navigation (hamburger menu)
   - Touch-friendly targets
   - Tablet optimizations

### Medium Priority

5. **Keyboard Navigation**
   - Arrow keys for file navigation
   - Enter to open/download
   - Escape to close modals
   - Tab focus indicators

6. **Notifications/Toasts**
   - Success/error messages
   - Upload completion
   - Error recovery

7. **Breadcrumb Navigation**
   - Clickable path segments
   - Visual hierarchy
   - Quick jump to parent folders

8. **Bulk Operations UI**
   - Better selection UX
   - Progress for bulk actions
   - Confirmation dialogs

### Low Priority

9. **Drag and Drop**
   - Visual feedback during drag
   - Drop zone highlighting
   - Multi-select drag

10. **File Preview**
    - Modal preview for images
    - PDF viewer integration
    - Video player

11. **Animations**
    - Page transitions
    - Folder open/close
    - Staggered list animations

---

## 11. Accessibility

### Current Support

- Semantic HTML elements
- Focus indicators (via browser default)
- Sufficient color contrast (WCAG AA)
- Alt text for thumbnails

### Improvements Needed

- ARIA labels for icon buttons
- Keyboard shortcuts
- Screen reader announcements
- Focus trap in modals

---

## 12. File Structure Reference

```
frontend/
├── index.html              # HTML entry with fonts & icons
├── tailwind.config.js      # Tailwind color tokens
├── postcss.config.js       # PostCSS plugins
├── src/
│   ├── app.css            # Tailwind + custom styles
│   ├── main.js            # Entry point
│   ├── pages/
│   │   ├── dashboard.js   # Main dashboard component
│   │   ├── web3-login.js  # MetaMask SIWE login
│   │   └── settings.js   # Settings page
│   ├── lib/
│   │   ├── api.ts         # API client
│   │   └── web3.js        # MetaMask/SIWE helpers
│   ├── utils/
│   │   ├── api.js         # API utilities
│   │   └── auth.js        # Auth utilities
│   ├── components/
│   │   └── *.jsx          # React components (if migrated)
│   └── styles/
│       └── main.css       # Legacy styles (can be removed)
```

---

## 13. Design Tokens Reference

### CSS Custom Properties

```css
:root {
  /* Colors */
  --primary: #006b22;
  --primary-container: #01872e;
  --on-surface: #171c22;
  --on-surface-variant: #3e4a3d;
  --background: #f7f9ff;
  --error: #ba1a1a;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-4: 1rem;
  --space-8: 2rem;
  
  /* Borders */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}
```

---

## 14. Inspiration & References

- [Material Design 3](https://m3.material.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Material Symbols](https://fonts.google.com/icons)
- [Vercel Dashboard](https://vercel.com/dashboard) - UI patterns
- [Google Drive](https://drive.google.com) - File browser patterns
- [Dropbox](https://www.dropbox.com) - Familiar UX

---

*Last updated: March 2026*
*For questions or suggestions, open an issue on GitHub.*
