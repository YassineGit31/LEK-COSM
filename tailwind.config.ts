import type { Config } from 'tailwindcss'

// Les couleurs sont des variables CSS (voir app/globals.css) : clair par défaut, sombre avec la classe `dark` sur <html>.
// Thème BORDEAUX · BLANC · OR CHAMPAGNE — COSMÉTIQUE LE K (aucun noir).
//   sage  = Deep Burgundy  #722F37  boutons principaux, titres, identité
//   wine  = Dark Wine      #451D26  survols (hover) et accents forts
//   gold  = Champagne Gold #C9A96B  accents du logo, icônes, bordures
//   cream = Pure White     #FFFFFF  fond principal du site
//   sand  = Warm Ivory     #F8F5F0  sections secondaires, fonds produits
//   warm  = Warm Gray      #625A58  texte courant et informations secondaires
//   `ink / coal / ivory` = alias du back-office : ink = fond, coal = cartes, ivory = texte et bordures.
export default {
  content: ['./app/**/*.tsx', './components/**/*.tsx'],
  theme: {
    extend: {
      colors: {
        sage: 'rgb(var(--c-sage) / <alpha-value>)',
        wine: 'rgb(var(--c-wine) / <alpha-value>)',
        gold: 'rgb(var(--c-gold) / <alpha-value>)',
        cream: 'rgb(var(--c-cream) / <alpha-value>)',
        sand: 'rgb(var(--c-sand) / <alpha-value>)',
        warm: 'rgb(var(--c-warm) / <alpha-value>)',
        mist: 'rgb(var(--c-mist) / <alpha-value>)',
        taupe: 'rgb(var(--c-taupe) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        coal: 'rgb(var(--c-coal) / <alpha-value>)',
        ivory: 'rgb(var(--c-ivory) / <alpha-value>)',
      },
      // Ombres teintées bordeaux (jamais de noir)
      boxShadow: {
        sm: '0 1px 2px 0 rgba(114,47,55,.12)',
        DEFAULT: '0 1px 3px 0 rgba(114,47,55,.14), 0 1px 2px -1px rgba(114,47,55,.14)',
        md: '0 4px 8px -2px rgba(114,47,55,.14)',
        lg: '0 12px 28px -8px rgba(114,47,55,.26)',
        xl: '0 20px 40px -12px rgba(114,47,55,.28)',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
} satisfies Config
