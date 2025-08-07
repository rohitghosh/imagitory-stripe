import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Clean imaginory-style color palette
        background: "#FEFEF7", // Warm off-white
        foreground: "#2C3E50", // Dark blue-gray for text
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#2C3E50",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#2C3E50",
        },
        primary: {
          DEFAULT: "#FFD93D", // Bright yellow for buttons
          foreground: "#2C3E50",
        },
        secondary: {
          DEFAULT: "#F1F3F4", // Light gray for progress backgrounds
          foreground: "#2C3E50",
        },
        accent: {
          DEFAULT: "#4ECDC4", // Teal blue (minimal use)
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F8F9FA",
          foreground: "#7F8C8D",
        },
        destructive: {
          DEFAULT: "#FF6B6B",
          foreground: "#FFFFFF",
        },
        border: "#E9ECEF",
        input: "#E9ECEF",
        ring: "#FFD93D",
        // Clean imaginory colors - minimal palette
        imaginory: {
          yellow: "#FFD93D", // Main button color
          orange: "#FF6B6B", // Minimal accent
          blue: "#4ECDC4", // Minimal accent
          green: "#95E1D3", // Minimal accent
          pink: "#FFB6C1", // Minimal accent
          purple: "#DDA0DD", // Minimal accent
          black: "#2C3E50", // Main text color
          white: "#FFFFFF", // Clean white
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'handwritten': ['Caveat', 'cursive'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
        'heading': ['Inter', 'system-ui', 'sans-serif'],
        'notes': ['Caveat', 'cursive'],
        'playful': ['Caveat', 'cursive'],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "bounce-gentle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "twinkle": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.1)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "blob": {
          "0%, 100%": { borderRadius: "50% 30% 70% 40% / 60% 40% 60% 40%" },
          "25%": { borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%" },
          "50%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" },
          "75%": { borderRadius: "70% 60% 30% 40% / 50% 60% 70% 60%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-gentle": "bounce-gentle 2s ease-in-out infinite",
        "twinkle": "twinkle 2s ease-in-out infinite",
        "wiggle": "wiggle 1s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "blob": "blob 4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
