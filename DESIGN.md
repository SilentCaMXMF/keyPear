# Design System Specification

## 1. Overview & Creative North Star: "The Digital Ether"
This design system moves away from the rigid, utility-first aesthetics of traditional file management to embrace **The Digital Ether**. The creative vision is to treat cloud storage not as a static "locker," but as a light, breathable environment where data feels weightless. 

We break the "standard template" look by utilizing intentional asymmetry—placing hero typography off-center and allowing file containers to float on layered surfaces rather than being trapped in a grid. We lean into high-end editorial layouts where white space is treated as a premium functional element, not just a gap. Through overlapping glass surfaces and sophisticated tonal shifts, we evoke a sense of professional security and modern simplicity.

---

## 2. Colors: Depth Through Tone
The color architecture is built on a foundation of soft blues and sophisticated neutrals to ensure the interface feels "airy" yet authoritative.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections or content blocks. Traditional lines create visual clutter that breaks the "Ether" aesthetic. Boundaries must be defined strictly through:
- **Background Color Shifts:** Placing a `surface-container-low` component on a `surface` background.
- **Tonal Transitions:** Using the hierarchy of container tokens to define prominence.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-transparent layers. Use the following tiers to define depth:
- **Base Layer:** `surface` (#f8f9fb)
- **Primary Sections:** `surface-container-low` (#f2f4f6)
- **Interactive Elements:** `surface-container-lowest` (#ffffff) for a "lifted" look.
- **Overlays/Modals:** `surface-container-highest` (#e0e3e5) to ground floating elements.

### The "Glass & Gradient" Rule
To add visual "soul," primary CTAs and hero headers should utilize subtle gradients (e.g., `primary` #004fa8 to `primary_container` #0366d6). For floating navigation or action bars, use **Glassmorphism**: apply `surface_container_lowest` with 70% opacity and a `24px` backdrop-blur to allow underlying colors to bleed through softly.

---

## 3. Typography: Editorial Authority
We utilize **Inter** to bridge the gap between technical precision and human readability.

- **Display Scale (`display-lg` to `display-sm`):** Reserved for high-level storage summaries or welcome states. Use `display-md` (2.75rem) with tighter letter-spacing (-0.02em) to create an editorial, high-fashion impact.
- **Headline & Title:** Use `headline-sm` (1.5rem) for folder names and major categories. These provide the structural "bones" of the system.
- **Body & Labels:** `body-md` (0.875rem) is our workhorse for file metadata. Ensure `label-sm` is used sparingly for technical data (file sizes, dates), utilizing the `tertiary` color to de-emphasize secondary information.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are often a crutch for poor layout. In this system, depth is earned through tone.

- **The Layering Principle:** Place a `surface-container-lowest` card (Pure White) onto a `surface-container-low` section. This creates a natural, soft lift that is perceivable without being aggressive.
- **Ambient Shadows:** When an element must "float" (like a context menu or upload modal), use an ultra-diffused shadow:
  - **Blur:** 32px to 48px.
  - **Opacity:** 4-6% of the `on_surface` color.
  - **Tint:** The shadow should be slightly tinted with `primary` to maintain the cool, blue-toned atmosphere.
- **The "Ghost Border" Fallback:** If accessibility requirements demand a border, use the `outline_variant` token at **15% opacity**. Anything higher is prohibited.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`), `DEFAULT` (8px) roundness, white text.
- **Secondary:** `surface-container-highest` background with `on_surface` text. No border.
- **Tertiary:** Text-only with `primary` color, used for low-emphasis actions like "Cancel" or "View More."

### Cards & File Items
- **Rule:** Forbid the use of divider lines between file entries. 
- **Style:** Use vertical whitespace (Spacing Scale `4` or `1rem`) and a subtle hover state shift to `surface-container-high`.
- **Roundness:** Always use `DEFAULT` (8.5rem/8px) or `md` (0.75rem/12px) for file containers to maintain the friendly, approachable feel requested.

### Input Fields
- **State:** Default state uses `surface-container-highest` background. 
- **Focus:** Transitions to a "Ghost Border" of `primary` at 20% opacity with a soft `primary_fixed` glow.

### Chips (File Tags)
- **Selection Chips:** Use `secondary_container` with `on_secondary_container` text to denote active filters or "Selected" files. The green accent (`secondary` #006e25) provides a trustworthy "Success" signal.

---

## 6. Do's and Don'ts

### Do
- **Do** use asymmetrical margins (e.g., more padding on the left than the right in hero sections) to create an intentional, custom feel.
- **Do** utilize `backdrop-blur` on all sticky headers to maintain a sense of layered depth as the user scrolls through files.
- **Do** prioritize the `surface-container` tiers to create hierarchy before considering shadows.

### Don't
- **Don't** use 100% black (#000000) for text. Always use `on_surface` (#191c1e) to keep the contrast high-end rather than harsh.
- **Don't** use 1px dividers to separate files in a list. Rely on the Spacing Scale `2` (0.5rem) of clear air.
- **Don't** use sharp corners. Every container must adhere to the 8px–12px `DEFAULT` roundness to ensure the "Friendly" brand promise is met.