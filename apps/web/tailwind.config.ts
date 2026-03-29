import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        up: 'var(--price-up)',
        'up-bg': 'var(--price-up-soft)',
        down: 'var(--price-down)',
        'down-bg': 'var(--price-down-soft)',
        accent: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
        },
        tier: {
          bronze: '#CD7F32',
          silver: '#C0C0C0',
          gold: '#FFD700',
          diamond: '#00BFFF',
          legendary: '#A855F7',
        },
        surface: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          hover: 'var(--bg-hover)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 0 3px rgba(0,0,0,0.02)',
        'soft-hover': '0 8px 30px -4px rgba(0, 0, 0, 0.08), 0 0 5px rgba(0,0,0,0.03)',
        'glow-up': '0 0 20px -5px var(--price-up-soft)',
        'glow-down': '0 0 20px -5px var(--price-down-soft)',
        'glow-white': '0 0 20px -5px rgba(255, 255, 255, 0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      }
    },
  },
  plugins: [],
};

export default config;
