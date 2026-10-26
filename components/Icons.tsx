// Jeu d'icônes en trait fin (1.5px), cohérent avec le logo. Aucune dépendance externe.
const P: Record<string, React.ReactNode> = {
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />,
  bag: <><path d="M5.5 8.5h13l-1 11.5h-11l-1-11.5Z" /><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" /></>,
  menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
  close: <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>,
  pin: <><path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10Z" /><circle cx="12" cy="11" r="2.2" /></>,
  truck: <><path d="M3 6.5h11v9H3z" /><path d="M14 10h4l3 3v2.5h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  cash: <><rect x="3" y="6.5" width="18" height="11" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6.5 9.5v.01M17.5 14.5v.01" /></>,
  headset: <><path d="M5 14v-2a7 7 0 0 1 14 0v2" /><rect x="3.5" y="13.5" width="3.5" height="5" rx="1.5" /><rect x="17" y="13.5" width="3.5" height="5" rx="1.5" /><path d="M19 18.5c0 1.5-2 2.5-5 2.5" /></>,
  box: <><path d="M4 8 12 4l8 4v8l-8 4-8-4V8Z" /><path d="m4 8 8 4 8-4" /><path d="M12 12v8" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="m20 20-4.2-4.2" /></>,
  chevron: <path d="m9 6 6 6-6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  instagram: <><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><path d="M16.8 7.2v.01" /></>,
  whatsapp: <><path d="M4 20l1.2-4.2A8 8 0 1 1 8.3 18.9L4 20Z" /><path d="M9.2 9c.3 2.6 2.3 4.6 5 5.2l1.1-1.2-1.9-.9-.8.7c-.9-.4-1.6-1.1-2-2l.7-.8-.9-1.9L9.2 9Z" /></>,
  face: <><path d="M7 11a5 5 0 0 1 10 0v2a5 5 0 0 1-10 0v-2Z" /><path d="M9.8 11.2v.01M14.2 11.2v.01" /><path d="M10 14.5c.6.6 1.3.9 2 .9s1.4-.3 2-.9" /><path d="M7 11c1.2-.2 3.3-1.2 4.2-3 1 1.6 3.4 2.6 5.8 3" /></>,
  lipstick: <><rect x="8" y="12" width="8" height="8" rx="1" /><path d="M9 12V9h6v3" /><path d="M10 9V4.5l4 1.8V9" /></>,
  hair: <><path d="M9 4c-3 3-3 7 0 10s2 5-1 6" /><path d="M13.5 4c-3 3-3 7 0 10s2 5-1 6" /><path d="M18 5c-2.5 3-2.5 6.5 0 9.5s1.6 4.5-.8 5.5" /></>,
  perfume: <><rect x="6.5" y="10" width="11" height="10" rx="2" /><path d="M10 10V7.5h4V10" /><path d="M9.5 4.5h5v3h-5z" /><path d="M10 15h4" /></>,
  body: <><rect x="8" y="9" width="8" height="11.5" rx="2" /><path d="M10.5 9V6.5h3V9" /><path d="M10.5 6.5V4.5H15" /><path d="M10.5 14h3" /></>,
  man: <><circle cx="12" cy="9" r="4" /><path d="M8.5 8c.5-2.3 2-3.5 3.5-3.5s3 1.2 3.5 3.5" /><path d="M5 20c.6-3.4 3.4-5.5 7-5.5s6.4 2.1 7 5.5" /></>,
  leaf: <><path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14Z" /><path d="M5 19 13 11" /></>,
}
export type IconName = keyof typeof P
export default function Icon({ name, className = 'h-5 w-5', filled = false }: { name: IconName | string; className?: string; filled?: boolean }) {
  return (<svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{P[name]}</svg>)
}
