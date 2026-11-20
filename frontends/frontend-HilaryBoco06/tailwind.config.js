/** Palette « Ocean Blue » : bleu océan, marine, lagon, turquoise, ciel, écume et sable. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ocean: {
          950: "#051f33",
          900: "#082C46", // bleu marine
          800: "#063B5C", // bleu océan profond
          700: "#0b4f78",
          500: "#2b7fa8",
        },
        lagon: {
          300: "#A9DDEB", // bleu ciel
          400: "#55C9D0", // bleu turquoise
          500: "#18A7B5", // bleu lagon
          600: "#0f7f8b", // lagon foncé : texte et fonds sous texte blanc (contraste AA)
          700: "#0b6670",
        },
        ciel: "#A9DDEB",
        ecume: { 50: "#F4FAFC", 100: "#E6F4F8", 200: "#d3ebf2" },
        sand: { 200: "#F1E6D2", 300: "#e4d3b5", 500: "#b99b6b" },
        ink: "#0b2336",
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(8,44,70,.06), 0 8px 24px -12px rgba(8,44,70,.18)",
        lift: "0 2px 4px rgba(8,44,70,.08), 0 24px 48px -20px rgba(6,59,92,.35)",
        glow: "0 8px 30px -8px rgba(24,167,181,.55)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        drift: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(6px)" },
        },
        float: {
          "0%,100%": { transform: "translate(0,0) rotate(0deg)" },
          "50%": { transform: "translate(6px,-8px) rotate(-2deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up .8s cubic-bezier(.2,.7,.2,1) both",
        drift: "drift 2.4s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
