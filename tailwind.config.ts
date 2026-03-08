import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#07070f',
        card: '#0a0a14',
        border: '#1c1c2e',
        'text-primary': '#e0e0ee',
        'text-secondary': '#778899',
        'text-muted': '#444466',
        unmissable: '#FF4500',
        priority: '#FFD700',
        watch: '#00BFFF',
        win: '#00E676',
        draw: '#FFD700',
        loss: '#FF1744',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
