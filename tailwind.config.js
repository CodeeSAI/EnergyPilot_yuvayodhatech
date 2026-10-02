/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0B0B0D",
        surface: {
          DEFAULT: "#141416",
          elevated: "#1B1B1F",
        },
        elevated: "#1B1B1F",
        coral: {
          DEFAULT: "#FF6B5A",
          hover: "#FF8070",
          pressed: "#E65A4A",
          tint: "rgba(255, 107, 90, 0.15)",
        },
        teal: {
          DEFAULT: "#14B8A6",
          hover: "#2DD4BF",
          pressed: "#0F9A8B",
          tint: "rgba(20, 184, 166, 0.15)",
        },
        primary: {
          DEFAULT: "#14B8A6",
          hover: "#2DD4BF",
          pressed: "#0F9A8B",
        },
        secondary: {
          DEFAULT: "#FF6B5A",
          hover: "#FF8070",
          pressed: "#E65A4A",
        },
        tertiary: {
          DEFAULT: "#FF6B5A",
          hover: "#FF8070",
        },
        text: {
          primary: "#F5F5F4",
          secondary: "#A8A29E",
          muted: "#78716C",
        },
        "on-surface": "#F5F5F4",
        "on-surface-variant": "#A8A29E",
        outline: {
          DEFAULT: "#78716C",
          variant: "rgba(255, 255, 255, 0.08)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        grotesk: ["'Space Grotesk'", "sans-serif"],
        heading: ["'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      spacing: {
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2rem",
      },
      boxShadow: {
        'card-elevated': '0 20px 40px -15px rgba(0,0,0,0.7), 0 0 1px 1px rgba(255,255,255,0.08)',
        'teal-glow': '0 0 20px rgba(20, 184, 166, 0.3)',
        'coral-glow': '0 0 25px rgba(255, 107, 90, 0.35)',
      },
      keyframes: {
        fadeLift: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        coralPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 107, 90, 0.4), 0 12px 32px rgba(0,0,0,0.6)' },
          '50%': { boxShadow: '0 0 24px 6px rgba(255, 107, 90, 0.25), 0 12px 32px rgba(0,0,0,0.6)' },
        },
      },
      animation: {
        'fade-lift': 'fadeLift 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'coral-pulse': 'coralPulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
