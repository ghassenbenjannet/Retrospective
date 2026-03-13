import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0F172A',
        panel: '#111827',
        muted: '#94A3B8',
        brand: '#7C3AED'
      },
      boxShadow: {
        card: '0 10px 30px rgba(15, 23, 42, 0.18)'
      }
    }
  },
  plugins: []
} satisfies Config;
