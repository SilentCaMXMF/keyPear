```markdown
# Design System Specification

## 1. Overview & Creative North Star: "The Digital Atrium"
This design system moves beyond the rigid, boxy constraints of traditional enterprise software. Our Creative North Star is **The Digital Atrium**—a philosophy rooted in light, expansive space, and organic structure. 

Instead of using lines to "fence in" content, we use tonal shifts to "sculpt" it. The goal is a high-end editorial experience where information feels curated rather than captured. We achieve this through:
*   **Intentional Asymmetry:** Using white space as a structural element to guide the eye.
*   **Layered Translucency:** Using glassmorphism to create a sense of physical depth.
*   **Chromatic Depth:** Leveraging a monochromatic emerald palette against cool-toned neutrals to evoke trust and premium precision.

---

## 2. Color & Surface Architecture
The palette is a sophisticated blend of Deep Emerald and Arctic Neutrals. We follow a strict hierarchy of "Tonal Separation" rather than structural outlining.

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** Boundaries must be defined solely through background color shifts. A sidebar is not "separated" by a line; it exists on `surface-container-low` (#f1f3f9) while the workspace breathes on `background` (#f7f9ff).

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine paper.
*   **Level 0 (Background):** `background` (#f7f9ff). The base canvas.
*   **Level 1 (The Sidebar/Sub-structure):** `surface-container-low` (#f1f3f9).
*   **Level 2 (The Interactive Card):** `surface-container-lowest` (#ffffff). Pure white surfaces sitting on top of Level 0 or 1.
*   **Level 3 (The Pop-over/Modal):** `surface-bright` (#f7f9ff) with high diffusion.

### The "Glass & Gradient" Rule
To elevate CTAs beyond the "flat" look:
*   **Signature Gradients:** Use a linear gradient (135°) from `primary` (#005017) to `primary-container` (#006b22) for primary actions.
*   **Glassmorphism:** For floating navigation or tooltips, use `surface-container-lowest` at 80% opacity with a `20px` backdrop-blur.

---

## 3. Typography: Editorial Authority
We utilize **Inter** not as a utility font, but as a brand voice. The hierarchy is designed to feel like a high-end financial journal.

| Level | Token | Weight | Size | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- |
| **H1** | `headline-lg` | ExtraBold (800) | 2rem | -0.02em |
| **H2** | `title-md` | Bold (700) | 1.125rem | -0.01em |
| **H3** | `title-sm` | SemiBold (600) | 1rem | 0 |
| **Body** | `body-md` | Regular (400) | 0.875rem | 0 |
| **Label** | `label-md` | Medium (500) | 0.75rem | 0.05em (Caps) |

**Director's Note:** Use `headline-lg` sparingly to anchor a page. Ensure large headings have ample "breathing room" (at least `spacing-12`) to maintain the premium editorial feel.

---

## 4. Elevation & Depth: The Layering Principle
Depth is achieved through **Tonal Layering** and **Ambient Light**, never through heavy drop shadows.

*   **Tonal Stacking:** Place a `surface-container-lowest` (White) card on a `surface-container-low` (Pale Blue) background. The 2% contrast difference creates a sophisticated, "soft" lift.
*   **Ambient Shadows:** For floating elements, use a "Tinted Shadow": 
    *   *Offset:* 0px 8px | *Blur:* 24px | *Color:* `on-surface` (#181c20) at 6% opacity.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use `outline-variant` (#bfcaba) at **15% opacity**. It should feel like a suggestion of a line, not a boundary.

---

## 5. Signature Components

### Buttons & CTAs
*   **Primary:** Gradient-filled (`primary` to `primary-container`), `radius-lg` (1rem). No border.
*   **Secondary:** Ghost style. Transparent background with a `primary` text label. 
*   **Interaction:** On hover, the container should shift slightly darker; on press, scale to 98% to simulate physical depth.

### Cards & Containers
*   **Rule:** Forbid divider lines. Use `spacing-6` (1.5rem) of padding to separate content clusters.
*   **Shape:** Use `radius-xl` (1.5rem) for main dashboard cards and `radius-lg` (1rem) for inner nested elements.

### Form Fields
*   **Style:** Minimalist. `surface-container-lowest` background with a `2px` bottom-bar in `outline-variant` that transforms into `primary` on focus. 
*   **Roundedness:** `radius-md` (0.75rem) to ensure they feel distinct from the softer container cards.

### Navigation Sidebar
*   **Background:** `surface-container-low` (#f1f3f9).
*   **Active State:** Use a "Pill" indicator in `primary-fixed` (#9bf89c) with `on-primary-fixed` (#002106) text. This high-contrast emerald pop against the muted blue background signals clear hierarchy.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical margins (e.g., a wider left margin for text columns) to create an editorial layout.
*   **Do** use Material Symbols Outlined with a `optical size: 20` and `weight: 300` for a delicate, premium look.
*   **Do** leverage the `tertiary` (#7e1f42) palette exclusively for "High-Insight" notifications or premium features to contrast the green.

### Don’t
*   **Don’t** use 100% black text. Always use `on-surface` (#181c20) to maintain visual softness.
*   **Don’t** use dividers (`<hr>`). Use white space (`spacing-8`) or tonal shifts to separate sections.
*   **Don’t** use "Default" Inter tracking. Tighten the `headline-lg` by -2% to make it feel more authoritative.
*   **Don't** use sharp corners. Everything in this system must feel approachable, adhering to the `0.75rem` to `1.5rem` radius scale.