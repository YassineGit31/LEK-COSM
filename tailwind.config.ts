import type { Config } from 'tailwindcss'

// Palette COSMÉTIQUE LE K (aucun noir).
// `ink / coal / ivory` sont conservés comme alias SÉMANTIQUES pour que le back-office
// existant (qui les utilise partout) bascule automatiquement sur la nouvelle charte :
//   ink = fond de page, coal = surfaces/cartes, ivory = texte et bordures.
export default {
  content: ['./app/**/*.tsx', './components/**/*.tsx'],
  theme: {
    extend: {
      colors: {
        sage: '#2E5D4E',
        sand: '#D9C9B2',
        cream: '#F8F6F2',
        gold: '#C9A96B',
        mist: '#A7B6A5',
        taupe: '#8B8073',
        ink: '#F8F6F2',
        coal: '#FFFFFF',
        ivory: '#2E5D4E',
      },
      // Ombres teintées vert sauge (jamais de noir)
      boxShadow: {
        sm: '0 1px 2px 0 rgba(46,93,78,.14)',
        DEFAULT: '0 1px 3px 0 rgba(46,93,78,.16), 0 1px 2px -1px rgba(46,93,78,.16)',
        md: '0 4px 8px -2px rgba(46,93,78,.16)',
        lg: '0 12px 28px -8px rgba(46,93,78,.28)',
        xl: '0 20px 40px -12px rgba(46,93,78,.30)',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
} satisfies Config
