import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Ai.telier V2 - Brutalismo Poético (Direct access)
        'void-black': '#0A0A0A',
        'warm-ivory': '#F5F2EB',
        'tech-olive': '#8dc75e',
        'twilight-violet': '#261833',
        'twilight-mist': 'rgba(38, 24, 51, 0.3)',
        'twilight-deep': '#1A1025',
        'twilight-glow': '#2E1A47',
        // Nested access (backward compat)
        void: {
          black: '#0A0A0A',
        },
        warm: {
          ivory: '#F5F2EB',
        },
        tech: {
          olive: '#8dc75e',
        },
        twilight: {
          violet: '#261833',
          mist: 'rgba(38, 24, 51, 0.3)',
          deep: '#1A1025',
          glow: '#2E1A47',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'Space Grotesk', 'sans-serif'],
        heading: ['var(--font-space-grotesk)', 'Space Grotesk', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        'display': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
        'h1': ['2.25rem', { lineHeight: '1.2', fontWeight: '600' }],
        'h2': ['1.875rem', { lineHeight: '1.25', fontWeight: '600' }],
        'h3': ['1.5rem', { lineHeight: '1.3', fontWeight: '500' }],
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'small': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'xs': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        'sidebar': '240px',
      },
      backgroundColor: {
        primary: '#0A0A0A',
        secondary: '#1A1025',
        accent: '#261833',
      },
      textColor: {
        primary: '#F5F2EB',
        secondary: 'rgba(245, 242, 235, 0.7)',
        muted: 'rgba(245, 242, 235, 0.5)',
        accent: '#8dc75e',
      },
      borderColor: {
        primary: 'rgba(245, 242, 235, 0.1)',
        accent: '#8dc75e',
      },
    },
  },
  plugins: [],
};

export default config;
