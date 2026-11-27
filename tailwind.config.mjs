import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: {
    files: [
      './src/{layouts,pages,components}/**/*.{astro,tsx}',
      '!./src/components/ui/GlassFolder.tsx',
    ],
    transform: {
      astro: (content) =>
        content
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<script[\s\S]*?<\/script>/gi, ''),
    },
  },
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--sans)"],
        mono: ["var(--mono)"],
      },
      fontSize: {
        xs: ["var(--type-caption)", { lineHeight: "1.35" }],
        sm: ["var(--type-ui)", { lineHeight: "1.45" }],
        lg: ["var(--type-lead)", { lineHeight: "1.45" }],
        xl: ["var(--type-subhead)", { lineHeight: "1.22" }],
        "2xl": ["var(--type-card-title)", { lineHeight: "1.16" }],
        "3xl": ["var(--type-section-title)", { lineHeight: "1.12" }],
        "4xl": ["var(--type-display)", { lineHeight: "1.08" }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--ui-accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
