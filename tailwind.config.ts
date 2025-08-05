import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme inspired by logo coral/flame colors
        coral: {
          400: '#ff6b6b',
          500: '#ff5252',
          600: '#e53e3e',
        },
        slate: {
          850: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-card': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-coral': 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
      },
    },
  },
  plugins: [],
};
export default config;
