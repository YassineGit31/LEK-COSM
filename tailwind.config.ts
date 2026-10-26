import type { Config } from 'tailwindcss'

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
        sage: '#722F37',
        wine: '#451D26',
        gold: '#C9A96B',
        cream: '#FFFFFF',
        sand: '#F8F5F0',
        warm: '#625A58',
        mist: '#EFE6D2',    // champagne très clair (pastilles, bandeaux)
        taupe: '#7C7370',   // placeholders, icônes discrètes
        ink: '#F8F5F0',     // admin : fond de page
        coal: '#FFFFFF',    // admin : cartes et panneaux
        ivory: '#722F37',   // admin : texte et bordures
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