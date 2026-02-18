# Morse Master - Theming Guide

Morse Master is fully themable using CSS custom properties (CSS variables). This guide shows you how to customize the appearance when embedding the app in your webpage.

## Table of Contents

- [Quick Start](#quick-start)
- [Available CSS Variables](#available-css-variables)
- [Example Themes](#example-themes)
- [Best Practices](#best-practices)
- [Advanced Customization](#advanced-customization)

---

## Quick Start

To apply a custom theme, override the CSS variables in your webpage:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="morse-trainer.css">
    <style>
        /* Your custom theme */
        :root {
            --mt-primary: #0ea5e9;
            --mt-primary-hover: #0284c7;
            --mt-bg: #f0f9ff;
        }
    </style>
</head>
<body>
    <div id="app-container"></div>
    <script type="module">
        import { MorseTrainer } from './morse-trainer.js';
        new MorseTrainer(document.getElementById('app-container'));
    </script>
</body>
</html>
```

---

## Available CSS Variables

### Primary Colors

These control the main brand color throughout the app.

```css
:root {
    --mt-primary: #4f46e5;              /* Main brand color */
    --mt-primary-hover: #4338ca;        /* Hover state for primary elements */
    --mt-primary-light: #e0e7ff;        /* Light background tint */
    --mt-primary-lighter: #c7d2fe;      /* Lighter background/borders */
    --mt-primary-dark: #0f172a;         /* Dark primary (e.g., CTA buttons) */
    --mt-primary-darker: #1e293b;       /* Darker variant */
}
```

### Secondary Colors

Background colors for buttons and subtle UI elements.

```css
:root {
    --mt-secondary: #f1f5f9;            /* Secondary background */
    --mt-secondary-hover: #e2e8f0;      /* Secondary hover state */
}
```

### Background & Surfaces

Page and card backgrounds.

```css
:root {
    --mt-bg: #f8fafc;                   /* Main page background */
    --mt-surface: #ffffff;              /* Card/modal surface */
    --mt-surface-dark: #1e293b;         /* Dark card variant */
    --mt-surface-darker: #334155;       /* Darker elements within dark cards */
}
```

### Text Colors

```css
:root {
    --mt-text-main: #0f172a;            /* Primary text */
    --mt-text-muted: #64748b;           /* Muted/secondary text */
    --mt-text-light: #cbd5e1;           /* Light text (on dark backgrounds) */
    --mt-text-lighter: #a0aec0;         /* Even lighter text */
    --mt-text-white: #ffffff;           /* White text */
}
```

### Status Colors

Colors for success, error, info, and warning states.

```css
:root {
    /* Success (correct answers, achievements) */
    --mt-success: #10b981;
    --mt-success-bg: #ecfdf5;
    --mt-success-light: #f0fdf4;
    --mt-success-border: #a7f3d0;
    --mt-success-hover: #d1fae5;
    
    /* Error (wrong answers, alerts) */
    --mt-error: #f43f5e;
    --mt-error-bg: #fff1f2;
    --mt-error-light: #ffe4e6;
    --mt-error-border: #ffe4e6;
    
    /* Info (tips, notifications) */
    --mt-info: #4f46e5;
    --mt-info-bg: #e0e7ff;
    --mt-info-border: #c7d2fe;
    
    /* Warning */
    --mt-warning: #f59e0b;
}
```

### Accent Colors

Special purpose accent colors.

```css
:root {
    --mt-cyan: #0891b2;                 /* Cyan accent */
    --mt-cyan-light: #a5f3fc;           /* Light cyan */
    --mt-cyan-bright: #22d3ee;          /* Bright cyan */
    --mt-sky: #38bdf8;                  /* Sky blue */
    --mt-indigo-light: #a5b4fc;         /* Light indigo */
}
```

### Border, Shadow & Overlay

```css
:root {
    --mt-border: #e2e8f0;               /* Default border color */
    --mt-border-light: rgba(255, 255, 255, 0.1);    /* Light border */
    --mt-border-lighter: rgba(255, 255, 255, 0.15); /* Lighter border */
    
    --mt-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    --mt-shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
    --mt-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    --mt-shadow-xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
    
    --mt-overlay: rgba(0, 0, 0, 0.5);   /* Modal backdrop */
}
```

### Spacing & Layout

```css
:root {
    --mt-radius: 1rem;                  /* Default border radius */
    --mt-radius-sm: 0.5rem;             /* Small radius */
    --mt-radius-lg: 1.5rem;             /* Large radius */
    --mt-radius-xl: 2rem;               /* Extra large radius */
    --mt-radius-full: 9999px;           /* Fully rounded (pills, circles) */
}
```

### Typography

```css
:root {
    --mt-font: ui-sans-serif, system-ui, sans-serif;
    --mt-font-mono: ui-monospace, monospace;
}
```

### Transitions

```css
:root {
    --mt-transition: all 0.2s;          /* Default transition */
    --mt-transition-fast: all 0.15s;    /* Fast transition */
    --mt-transition-slow: all 0.3s;     /* Slow transition */
}
```

---

## Example Themes

### Dark Theme

A complete dark mode theme:

```html
<style>
:root {
    /* Primary colors - keep vibrant for dark mode */
    --mt-primary: #6366f1;
    --mt-primary-hover: #4f46e5;
    --mt-primary-light: #312e81;
    --mt-primary-lighter: #4338ca;
    --mt-primary-dark: #818cf8;
    --mt-primary-darker: #6366f1;
    
    /* Backgrounds - dark grays */
    --mt-bg: #0f172a;
    --mt-surface: #1e293b;
    --mt-surface-dark: #0f172a;
    --mt-surface-darker: #020617;
    
    /* Text - light on dark */
    --mt-text-main: #f1f5f9;
    --mt-text-muted: #94a3b8;
    --mt-text-light: #64748b;
    --mt-text-lighter: #475569;
    
    /* Secondary - darker variants */
    --mt-secondary: #334155;
    --mt-secondary-hover: #475569;
    
    /* Borders - subtle */
    --mt-border: #334155;
    
    /* Shadows - lighter for dark backgrounds */
    --mt-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3);
    --mt-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4);
    
    /* Status colors - adjust for better visibility */
    --mt-success: #34d399;
    --mt-success-bg: #064e3b;
    --mt-success-light: #065f46;
    --mt-error: #f87171;
    --mt-error-bg: #7f1d1d;
    --mt-error-light: #991b1b;
    --mt-info-bg: #312e81;
}
</style>
```

### Ocean Theme

A cool blue and teal theme:

```html
<style>
:root {
    --mt-primary: #0891b2;
    --mt-primary-hover: #0e7490;
    --mt-primary-light: #cffafe;
    --mt-primary-lighter: #a5f3fc;
    --mt-primary-dark: #164e63;
    --mt-primary-darker: #155e75;
    
    --mt-bg: #ecfeff;
    --mt-surface: #ffffff;
    
    --mt-secondary: #e0f2fe;
    --mt-secondary-hover: #bae6fd;
    
    --mt-success: #14b8a6;
    --mt-success-bg: #ccfbf1;
    --mt-info-bg: #cffafe;
    --mt-info-border: #a5f3fc;
}
</style>
```

### Warm/Sunset Theme

An orange and red theme:

```html
<style>
:root {
    --mt-primary: #f97316;
    --mt-primary-hover: #ea580c;
    --mt-primary-light: #fed7aa;
    --mt-primary-lighter: #fdba74;
    --mt-primary-dark: #9a3412;
    --mt-primary-darker: #7c2d12;
    
    --mt-bg: #fff7ed;
    --mt-surface: #ffffff;
    
    --mt-secondary: #ffedd5;
    --mt-secondary-hover: #fed7aa;
    
    --mt-success: #84cc16;
    --mt-success-bg: #ecfccb;
    --mt-info: #f97316;
    --mt-info-bg: #fed7aa;
    --mt-info-border: #fdba74;
}
</style>
```

### Forest/Nature Theme

A green theme:

```html
<style>
:root {
    --mt-primary: #22c55e;
    --mt-primary-hover: #16a34a;
    --mt-primary-light: #dcfce7;
    --mt-primary-lighter: #bbf7d0;
    --mt-primary-dark: #14532d;
    --mt-primary-darker: #166534;
    
    --mt-bg: #f0fdf4;
    --mt-surface: #ffffff;
    
    --mt-secondary: #dcfce7;
    --mt-secondary-hover: #bbf7d0;
    
    --mt-success: #10b981;
    --mt-success-bg: #d1fae5;
    --mt-info: #22c55e;
    --mt-info-bg: #dcfce7;
    --mt-info-border: #bbf7d0;
    
    --mt-warning: #eab308;
}
</style>
```

### Purple/Royal Theme

An elegant purple theme:

```html
<style>
:root {
    --mt-primary: #a855f7;
    --mt-primary-hover: #9333ea;
    --mt-primary-light: #f3e8ff;
    --mt-primary-lighter: #e9d5ff;
    --mt-primary-dark: #581c87;
    --mt-primary-darker: #6b21a8;
    
    --mt-bg: #faf5ff;
    --mt-surface: #ffffff;
    
    --mt-secondary: #f3e8ff;
    --mt-secondary-hover: #e9d5ff;
    
    --mt-success: #22c55e;
    --mt-success-bg: #dcfce7;
    --mt-info: #a855f7;
    --mt-info-bg: #f3e8ff;
    --mt-info-border: #e9d5ff;
}
</style>
```

### Minimal/High Contrast

A clean, high-contrast black and white theme:

```html
<style>
:root {
    --mt-primary: #000000;
    --mt-primary-hover: #1f2937;
    --mt-primary-light: #f3f4f6;
    --mt-primary-lighter: #e5e7eb;
    --mt-primary-dark: #000000;
    --mt-primary-darker: #111827;
    
    --mt-bg: #ffffff;
    --mt-surface: #ffffff;
    
    --mt-secondary: #f9fafb;
    --mt-secondary-hover: #f3f4f6;
    
    --mt-text-main: #000000;
    --mt-text-muted: #6b7280;
    
    --mt-border: #d1d5db;
    
    --mt-success: #059669;
    --mt-error: #dc2626;
}
</style>
```

---

## Best Practices

### 1. Scope Your Theme

If embedding multiple themed components, use a data attribute or class:

```html
<style>
    [data-theme="ocean"] {
        --mt-primary: #0891b2;
        --mt-primary-hover: #0e7490;
        /* etc... */
    }
</style>

<div id="app-container" data-theme="ocean"></div>
```

### 2. Test Contrast

Ensure sufficient contrast between text and backgrounds for accessibility:
- Text on backgrounds should meet WCAG AA standards (4.5:1 ratio)
- Use tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### 3. Maintain Consistency

When overriding colors, update related variants together:

```css
/* Good - consistent color family */
--mt-primary: #0891b2;
--mt-primary-hover: #0e7490;      /* darker shade */
--mt-primary-light: #cffafe;      /* lighter shade */

/* Avoid - mismatched colors */
--mt-primary: #0891b2;
--mt-primary-hover: #f97316;      /* completely different color */
```

### 4. Partial Theming

You don't need to override all variables. Customize only what you need:

```css
/* Just change the primary color and let other values adapt */
:root {
    --mt-primary: #0ea5e9;
    --mt-primary-hover: #0284c7;
}
```

### 5. Dark Mode Detection

Use media queries to auto-switch themes based on user preference:

```html
<style>
    /* Light mode (default) */
    :root {
        --mt-primary: #4f46e5;
        --mt-bg: #f8fafc;
        --mt-surface: #ffffff;
        --mt-text-main: #0f172a;
    }
    
    /* Dark mode */
    @media (prefers-color-scheme: dark) {
        :root {
            --mt-primary: #6366f1;
            --mt-bg: #0f172a;
            --mt-surface: #1e293b;
            --mt-text-main: #f1f5f9;
            --mt-text-muted: #94a3b8;
            --mt-border: #334155;
        }
    }
</style>
```

---

## Advanced Customization

### Custom Fonts

Override the font families:

```css
:root {
    --mt-font: 'Inter', 'Helvetica Neue', sans-serif;
    --mt-font-mono: 'Fira Code', 'Courier New', monospace;
}
```

Don't forget to load the fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
```

### Rounded vs Sharp

Adjust border radius for different aesthetics:

```css
/* Very rounded (default) */
:root {
    --mt-radius: 1rem;
    --mt-radius-lg: 1.5rem;
}

/* Sharp/minimal */
:root {
    --mt-radius: 0.25rem;
    --mt-radius-lg: 0.5rem;
}

/* Completely square */
:root {
    --mt-radius: 0;
    --mt-radius-sm: 0;
    --mt-radius-lg: 0;
    --mt-radius-xl: 0;
}
```

### Animation Speed

Control transition timings:

```css
/* Slower, more deliberate */
:root {
    --mt-transition: all 0.4s;
    --mt-transition-slow: all 0.6s;
}

/* Instant, no animations */
:root {
    --mt-transition: none;
    --mt-transition-fast: none;
    --mt-transition-slow: none;
}
```

### Shadows

Adjust shadow intensity:

```css
/* Subtle shadows */
:root {
    --mt-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
    --mt-shadow-lg: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

/* No shadows (flat design) */
:root {
    --mt-shadow: none;
    --mt-shadow-sm: none;
    --mt-shadow-lg: none;
    --mt-shadow-xl: none;
}

/* Dramatic shadows */
:root {
    --mt-shadow: 0 10px 40px rgb(0 0 0 / 0.2);
    --mt-shadow-lg: 0 20px 60px rgb(0 0 0 / 0.3);
}
```

### Per-Component Overrides

Target specific components using their class names:

```css
/* Make only the header a different color */
.mt-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Customize play button specifically */
.mt-play-btn.play {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    box-shadow: 0 10px 40px rgba(245, 87, 108, 0.4);
}

/* Change card hover effect */
.mt-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgb(0 0 0 / 0.15);
}
```

---

## Embedding Multiple Instances

If you're embedding multiple Morse trainers with different themes on one page:

```html
<style>
    /* Theme 1 */
    #trainer-1 {
        --mt-primary: #0891b2;
        --mt-bg: #ecfeff;
    }
    
    /* Theme 2 */
    #trainer-2 {
        --mt-primary: #f97316;
        --mt-bg: #fff7ed;
    }
</style>

<div id="trainer-1"></div>
<div id="trainer-2"></div>

<script type="module">
    import { MorseTrainer } from './morse-trainer.js';
    new MorseTrainer(document.getElementById('trainer-1'));
    new MorseTrainer(document.getElementById('trainer-2'));
</script>
```

---

## Troubleshooting

### Theme Not Applying

1. **Check selector specificity**: Your overrides should be in `:root` or on the container element
2. **Check load order**: Your theme CSS should come AFTER `morse-trainer.css`
3. **Check syntax**: Ensure variable names start with `--mt-`

### Colors Look Wrong

1. **Verify contrast**: Some color combinations may not have enough contrast
2. **Check all variants**: Update hover/light/dark variants of colors together
3. **Test in different browsers**: CSS variable support is universal in modern browsers

### Performance Issues

1. **Avoid complex gradients** on frequently animated elements
2. **Use `transform` instead of `margin/padding`** for animations
3. **Simplify shadows** if experiencing slowness

---

## Questions or Issues?

If you have questions about theming or would like to share your custom theme, please open an issue on GitHub or contribute to the project!

---

## License

This theming system is part of Morse Master and follows the same license as the project.
