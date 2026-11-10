/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          base: '#0B0C0E',
          elevated: '#111317',
          overlay: '#171A20',
          hover: '#1E222A',
        },
        hairline: {
          subtle: 'rgba(255,255,255,0.05)',
          light: 'rgba(255,255,255,0.09)',
          focus: 'rgba(212,196,168,0.4)',
        },
        titanium: {
          50: '#F2F2F3',
          300: '#A8ADB5',
          400: '#8A8F98',
          500: '#686D76',
          600: '#525660',
        },
        text: {
          primary: '#F2F2F3',
          secondary: '#8A8F98',
          tertiary: '#525660',
        },
        champagne: {
          DEFAULT: '#D4C4A8',
          light: '#E5D9C5',
          muted: '#C4A47C',
        },
        delivered: {
          DEFAULT: '#10B981',
          surface: 'rgba(16,185,129,0.08)',
          border: 'rgba(16,185,129,0.2)',
        },
        processing: {
          DEFAULT: '#38BDF8',
          surface: 'rgba(56,189,248,0.08)',
        },
        failed: {
          DEFAULT: '#BE123C',
          surface: 'rgba(190,18,60,0.1)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"DM Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        matte: '0 1px 2px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.025)',
        drawer: '-20px 0 60px rgba(0,0,0,0.42)',
        champagne: '0 0 0 1px rgba(212,196,168,0.12), 0 4px 16px rgba(0,0,0,0.24)',
      },
      keyframes: {
        'drawer-in': {
          from: { transform: 'translateX(18px)', opacity: '0.7' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'banner-in': {
          from: { transform: 'translateY(-12px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'quiet-pulse': {
          '0%, 100%': { opacity: '0.65' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'drawer-in': 'drawer-in 220ms ease-out both',
        'banner-in': 'banner-in 420ms cubic-bezier(0.2,0.8,0.2,1) both',
        'quiet-pulse': 'quiet-pulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
