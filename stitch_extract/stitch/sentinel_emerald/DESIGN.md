```markdown
# Design System Specification: The Fortified Interface

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Vault."** 

In an era of superficial "modern" design, this system rejects the flimsy and the flat. It is built on the philosophy of **Structural Integrity**. We move beyond standard UI by treating the interface as a series of machined, interlocking layers of security. Instead of a generic grid, we utilize **Intentional Asymmetry** and **Tonal Depth** to guide the user’s eye toward what matters most: their data, protected. 

The experience should feel like a premium physical object—think of a high-end vault door or a precision-milled obsidian tool. We achieve this through "Atmospheric UI"—where depth is felt through color shifts and blurs rather than drawn with lines.

## 2. Color & Surface Architecture
This system operates on a high-contrast, high-trust palette of deep navies and slate grays, punctuated by a sharp, "security" emerald.

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders are strictly prohibited for sectioning or defining containers. 
Traditional borders create visual noise that distracts from complex data. Instead, boundaries must be defined solely through **Background Shifts**.
- Use `surface-container-low` for secondary sidebar areas.
- Use `surface-container-lowest` for the primary work surface.
- Use `surface-container-high` for interactive elements like headers or persistent footers.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Each level of nesting should step one tier up or down the surface scale:
1. **Base:** `surface` (#f7f9ff)
2. **Contextual Areas:** `surface-container-low` (#f0f4fc)
3. **Primary Data Containers:** `surface-container-lowest` (#ffffff)
4. **Elevated Overlays:** `surface-container-highest` (#dee3eb)

### The Glass & Gradient Rule
To move beyond a "template" feel, floating elements (modals, dropdowns) must use **Glassmorphism**.
- **Values:** Use `surface-variant` with a `60%` opacity and a `12px` backdrop-blur. 
- **Signature Textures:** For primary Action Buttons (CTAs), apply a subtle linear gradient from `primary` (#006b22) to `primary_container` (#01872e) at a 135-degree angle. This adds "weight" and "soul" to the action.

## 3. Typography
We utilize **Inter** as our typographic backbone. It is a font designed for high-density data, ensuring that cryptographic keys and file lists remain legible at any scale.

- **Display (lg/md/sm):** Used for marketing moments or high-level dashboard overviews. Set with a tight `tracking-tighter (-0.02em)` to feel authoritative.
- **Headline & Title:** These are your "Anchors." They define the start of a security context. Always use `on_surface` (#171c22) for maximum contrast.
- **Body:** Standardized at `body-md` (0.875rem) for data lists. This allows for more rows per screen without sacrificing legibility.
- **Labels (md/sm):** Reserved for metadata and "micro-copy." Use `on_surface_variant` (#3e4a3d) to create a clear visual step down from primary data.

## 4. Elevation & Depth
Depth is a security affordance. It tells the user where their focus should be locked.

### The Layering Principle
Do not use shadows for static elements. A `surface-container-lowest` card sitting on a `surface-container-low` background provides enough contrast to be "seen" without adding visual clutter.

### Ambient Shadows
For floating elements (Modals, Popovers), use **Atmospheric Shadows**:
- **Token:** `box-shadow: 0 20px 40px rgba(23, 28, 34, 0.06);`
- **Color:** The shadow must be a tinted version of `on-surface`, never pure black or gray. This creates a natural, "light-bleed" effect.

### The "Ghost Border" Fallback
If a border is required for accessibility (e.g., in high-contrast modes), use a **Ghost Border**:
- **Token:** `outline-variant` (#becab9) at `15%` opacity. 
- **Rule:** Never use 100% opacity for structural lines.

## 5. Components

### Buttons
- **Primary:** Gradient-filled (`primary` to `primary_container`), `DEFAULT` (8px) roundedness. No border.
- **Secondary:** `surface-container-highest` background with `on_surface` text. Feels "milled" into the UI.
- **Tertiary:** No background. `on_primary_fixed_variant` text. High-contrast, low-weight.

### Input Fields & Data Entry
- **Default State:** `surface-container-low` background. No border.
- **Active State:** `primary` (emerald) Ghost Border (20% opacity) with a subtle glow.
- **Error State:** `error` background at 5% opacity, text in `error`.

### Cards & Lists (The Security Table)
- **Constraint:** Forbid the use of divider lines between rows.
- **Solution:** Use vertical white space (`spacing-4`) and a subtle `surface-container-lowest` hover state to highlight the active row. This keeps data-heavy views clean and breathable.

### Signature Component: The Secure Badge
For "Success" or "Verified" states, use a "Pulse" chip.
- **Style:** `primary_container` background, `on_primary_container` text, and a `9999px` (full) pill radius. It should feel like a physical seal of approval.

## 6. Do’s and Don’ts

### Do:
- **Use "Breathing Room":** Security tools are stressful. Use the `spacing-8` and `spacing-12` tokens to separate major sections.
- **Embrace Monospace:** Use `ui-monospace` for keys, hashes, and IDs. It reinforces the "technologically advanced" personality.
- **Layer Surfaces:** If an element is important, move it "closer" to the user by shifting the surface color toward `lowest`.

### Don’t:
- **Don't use pure black:** Use `on_surface` (#171c22) for text. Pure black is jarring and lacks the "slate" sophistication of the brand.
- **Don't use "Drop Shadows" on cards:** Only use shadows for elements that physically move over others (modals).
- **Don't use standard icons:** Use "Light" or "Thin" weight iconography (1px or 1.5px stroke) to match the Inter typeface's precision. 

---
*Note to Junior Designers: This system is about the "quiet confidence" of security. Every pixel should feel intentional, every layer should feel structural, and the absence of lines should create a sense of infinite, organized space.*```