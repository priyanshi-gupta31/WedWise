/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // WedWise Luxury Wedding Palette
        canvas: '#FFF7ED',       // Warm Ivory canvas
        paper: '#FFFFFF',        // Pure paper
        ivory: {
          DEFAULT: '#FFF7ED',    // Warm Ivory
          50: '#FFFAF5',
          100: '#FFF7ED',
          200: '#FEEDDD',
          300: '#FDE0CA',
        },
        wine: {
          DEFAULT: '#641F35',    // Deep Royal Wine / Burgundy
          dark: '#4A1425',
          light: '#852C47',
          soft: '#F5E8EB',
          50: '#FAF1F3',
          100: '#F5E8EB',
          200: '#E8C5CD',
          500: '#641F35',
          600: '#52172A',
          700: '#3D0F1E',
          800: '#2C0914',
        },
        coral: {
          DEFAULT: '#E86A5B',    // Festive Terracotta Coral
          dark: '#C85243',
          light: '#F28B7E',
          soft: '#FDEEEB',
          50: '#FEF6F5',
          100: '#FDEEEB',
          200: '#FBD2CC',
          500: '#E86A5B',
          600: '#D25545',
          700: '#B04132',
        },
        peach: {
          DEFAULT: '#F6C6B6',    // Soft Romantic Peach / Blush
          light: '#FAE0D7',
          soft: '#FDF3EE',
          dark: '#E2A592',
          50: '#FDF7F4',
          100: '#FBF0EB',
          200: '#F6C6B6',
          300: '#EDB09D',
        },
        plum: {
          DEFAULT: '#29202A',    // Dark Plum / Deep Charcoal Ink
          dark: '#1C151D',
          light: '#423444',
          muted: '#615163',
          subtle: '#8C7A8E',
          50: '#F7F6F7',
          100: '#ECE9EC',
          800: '#29202A',
          900: '#1C151D',
        },
        sage: {
          DEFAULT: '#87957D',    // Soft Ceremonial Sage
          light: '#E6EAE3',
          soft: '#F1F4F0',
          dark: '#5D6B53',
          border: '#CAD4C4',
          50: '#F5F7F4',
          100: '#EAF0E8',
          500: '#87957D',
          600: '#6E7D64',
        },
        champagne: {
          DEFAULT: '#D6B36A',    // Champagne Gold Accent
          dark: '#B8944B',
          light: '#E6CC91',
          soft: '#FAF4E6',
          50: '#FCFAF5',
          100: '#F7EED9',
          200: '#EFDDB7',
          500: '#D6B36A',
          600: '#B8944B',
        },
        gold: {
          DEFAULT: '#D6B36A',
          soft: '#FAF4E6',
          light: '#E6CC91',
          dark: '#B8944B',
        },
        ink: {
          DEFAULT: '#29202A',
          muted: '#615163',
          subtle: '#8C7A8E',
        },
        border: {
          hairline: '#F1E4D6',
          soft: '#E8D9C8',
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 2px 8px -2px rgba(41, 32, 42, 0.04), 0 1px 3px -1px rgba(41, 32, 42, 0.02)',
        'paper': '0 4px 16px -3px rgba(41, 32, 42, 0.05), 0 2px 6px -2px rgba(41, 32, 42, 0.03)',
        'card': '0 8px 24px -4px rgba(41, 32, 42, 0.07), 0 3px 8px -2px rgba(41, 32, 42, 0.03)',
        'elevated': '0 16px 36px -6px rgba(100, 31, 53, 0.12), 0 6px 14px -3px rgba(41, 32, 42, 0.06)',
        'wine': '0 12px 30px -4px rgba(100, 31, 53, 0.25)',
        'coral': '0 12px 28px -4px rgba(232, 106, 91, 0.28)',
        'modal': '0 24px 60px -12px rgba(41, 32, 42, 0.22), 0 8px 24px -6px rgba(41, 32, 42, 0.12)',
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '20px',
        '3xl': '28px',
        '4xl': '36px',
      }
    },
  },
  plugins: [],
}
