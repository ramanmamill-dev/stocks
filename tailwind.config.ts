import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00B386',
        success: '#00E6A0',
        warning: '#F0B90B',
        danger: '#F23645',
        background: '#f8f9fc',
        surface: '#ffffff',
      },
    },
  },
  plugins: [],
};

export default config;
