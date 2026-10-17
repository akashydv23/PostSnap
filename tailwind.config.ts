import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'postsnap': {
          primary: '#1d9bf0',
          dark: '#0f1419',
          light: '#ffffff',
          gray: '#536471',
          'light-gray': '#eff3f4',
          border: '#cfd9de',
          success: '#00ba7c',
          warning: '#f59e0b',
          error: '#f4212e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
