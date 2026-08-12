import type {Config} from 'tailwindcss';

export default {
  darkMode:'class',
  content:['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],
  theme:{
    extend:{
      fontFamily:{
        sans:['var(--font-source-sans)','ui-sans-serif','system-ui','sans-serif'],
        mono:['var(--font-ibm-mono)','ui-monospace','SFMono-Regular','Menlo','monospace'],
      },
      colors:{
        accent:{
          DEFAULT:'var(--accent)',
          soft:'var(--accent-soft)',
        },
      },
      maxWidth:{
        prose:'42rem',
        shell:'1400px',
      },
    },
  },
  plugins:[],
} satisfies Config;
