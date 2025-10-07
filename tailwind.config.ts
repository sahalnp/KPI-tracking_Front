import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(0, 0%, 100%)", // Force white background
        foreground: "hsl(222.2, 84%, 4.9%)", // Dark text
        card: "hsl(0, 0%, 100%)", // White cards
        "card-foreground": "hsl(222.2, 84%, 4.9%)",
        popover: "hsl(0, 0%, 100%)", // White popover
        "popover-foreground": "hsl(222.2, 84%, 4.9%)",
        primary: "hsl(222.2, 47.4%, 11.2%)",
        "primary-foreground": "hsl(210, 40%, 98%)",
        secondary: "hsl(210, 40%, 96%)",
        "secondary-foreground": "hsl(222.2, 84%, 4.9%)",
        muted: "hsl(210, 40%, 96%)",
        "muted-foreground": "hsl(215.4, 16.3%, 46.9%)",
        accent: "hsl(210, 40%, 96%)",
        "accent-foreground": "hsl(222.2, 84%, 4.9%)",
        destructive: "hsl(0, 62.8%, 30.6%)",
        "destructive-foreground": "hsl(210, 40%, 98%)",
        border: "hsl(214.3, 31.8%, 91.4%)",
        input: "hsl(214.3, 31.8%, 91.4%)",
        ring: "hsl(222.2, 84%, 4.9%)",
        sidebar: "hsl(0, 0%, 100%)",
        "sidebar-foreground": "hsl(222.2, 84%, 4.9%)",
        "sidebar-primary": "hsl(222.2, 47.4%, 11.2%)",
        "sidebar-primary-foreground": "hsl(210, 40%, 98%)",
        "sidebar-accent": "hsl(210, 40%, 96%)",
        "sidebar-accent-foreground": "hsl(222.2, 84%, 4.9%)",
        "sidebar-border": "hsl(214.3, 31.8%, 91.4%)",
        "sidebar-ring": "hsl(222.2, 84%, 4.9%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindAnimate],
};

export default config;