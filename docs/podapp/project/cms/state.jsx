/* global React */
// state.jsx — Shared store, sample data, palettes & type pairings

/* ---------- Palettes (mobile-facing) ---------- */
const PALETTES = [
  { id: 'boussole',  nm: 'Boussole',  d: 'Warm editorial',  chips: ['#1A1A1A', '#B14424', '#EFECE5'],
    vars: { '--m-bg':'#EFECE5', '--m-ink':'#1A1A1A', '--m-accent':'#B14424', '--m-muted':'#E6E2D7' } },
  { id: 'graphite',  nm: 'Graphite',  d: 'Premium dark',    chips: ['#14110E', '#C8964A', '#3A3A36'],
    vars: { '--m-bg':'#14110E', '--m-ink':'#F3EFE6', '--m-accent':'#C8964A', '--m-muted':'#2A2520' } },
  { id: 'cobalt',    nm: 'Cobalt',    d: 'Analytical news', chips: ['#0E1117', '#1E3A5F', '#F1F0EC'],
    vars: { '--m-bg':'#F1F0EC', '--m-ink':'#0E1117', '--m-accent':'#1E3A5F', '--m-muted':'#E2E2DE' } },
  { id: 'commune',   nm: 'Commune',   d: 'Warm ochre',      chips: ['#1F1F1A', '#B47A2A', '#EDE8DC'],
    vars: { '--m-bg':'#EDE8DC', '--m-ink':'#1F1F1A', '--m-accent':'#B47A2A', '--m-muted':'#E0DAC8' } },
  { id: 'onde',      nm: 'Onde',      d: 'Burgundy serif',  chips: ['#1A1310', '#6B2417', '#F4F1E8'],
    vars: { '--m-bg':'#F4F1E8', '--m-ink':'#1A1310', '--m-accent':'#6B2417', '--m-muted':'#ECE7DA' } },
  { id: 'papier',    nm: 'Papier',    d: 'Clinical white',  chips: ['#0F0F0F', '#2F7A4D', '#FFFFFF'],
    vars: { '--m-bg':'#FFFFFF', '--m-ink':'#0F0F0F', '--m-accent':'#2F7A4D', '--m-muted':'#F2F2F0' } },
];

const TYPOS = [
  { id: 'editorial', nm: 'Editorial', display: 'Newsreader', body: 'Hanken Grotesk',
    vars: { '--m-display': '"Newsreader", Georgia, serif', '--m-body': '"Hanken Grotesk", system-ui, sans-serif', '--m-display-style': 'italic', '--m-display-weight': '500' } },
  { id: 'literary', nm: 'Literary', display: 'Instrument Serif', body: 'Manrope',
    vars: { '--m-display': '"Instrument Serif", Georgia, serif', '--m-body': '"Manrope", system-ui, sans-serif', '--m-display-style': 'italic', '--m-display-weight': '400' } },
  { id: 'grotesque', nm: 'Grotesque', display: 'Geist', body: 'Geist',
    vars: { '--m-display': '"Geist", system-ui, sans-serif', '--m-body': '"Geist", system-ui, sans-serif', '--m-display-style': 'normal', '--m-display-weight': '600' } },
];

const CATEGORIES = ['Actualités', 'Analyses', 'Podcasts', 'Agenda', 'Bibliothèque', 'Économie', 'Culture'];

/* ---------- Sample content ---------- */
const initialItems = [
  {
    id: 'oklahoma-cannabis-report',
    type: 'episode', status: 'archived',
    title: 'Oklahoma Cannabis Report',
    slug: 'oklahoma-cannabis-report',
    summary: "Reportage radio sur l'économie du cannabis en Oklahoma.",
    tags: 'podcast, économie, oklahoma',
    category: 'Économie',
    body: '',
    audioUrl: 'https://stateimpact.npr.org/oklahoma/files/2022/04/Clip_1.mp3',
    durationOverride: '50 min',
    heroImage: 'oklahoma-cover.jpg',
    premium: false, premiumTimeOverride: '',
    updated: 'il y a 4 j',
  },
  {
    id: 'valencia-tuition-report',
    type: 'episode', status: 'archived',
    title: 'Valencia Tuition Report',
    slug: 'valencia-tuition-report',
    summary: "Reportage radio sur la hausse des frais de scolarité en Floride.",
    tags: 'éducation, floride, podcast',
    category: 'Actualités',
    audioUrl: 'https://stateimpact.npr.org/florida/files/2022/03/Valencia_1.mp3',
    durationOverride: '42 min',
    heroImage: 'valencia-cover.jpg',
    premium: false,
    updated: 'il y a 6 j',
  },
  {
    id: 'west-texas-boom-report',
    type: 'episode', status: 'archived',
    title: 'West Texas Boom Report',
    slug: 'west-texas-boom-report',
    summary: 'Reportage radio sur le boom pétrolier au Texas.',
    tags: 'pétrole, texas, économie',
    category: 'Économie',
    audioUrl: 'https://stateimpact.npr.org/texas/files/2022/05/WestTexas.mp3',
    durationOverride: '38 min',
    heroImage: 'texas-cover.jpg',
    premium: true,
    updated: 'il y a 2 sem.',
  },
  {
    id: 'economie-du-soin',
    type: 'article', status: 'published',
    title: "L'économie du soin — nouvelle priorité.",
    slug: 'economie-du-soin',
    summary: "Et si nous reconnaissions enfin que prendre soin constitue le travail le plus essentiel d'une société ?",
    tags: 'analyse, économie, société',
    category: 'Analyses',
    body: "Pendant des décennies, l'économie a mesuré ce qui se vendait, jamais ce qui maintenait debout. Ce déséquilibre se paie aujourd'hui dans chaque hôpital, chaque école, chaque foyer.\n\nLa chercheuse Léa Bardin propose une boussole : mesurer le travail invisible, intégrer le soin aux indicateurs nationaux, et réformer la fiscalité en conséquence.",
    url: 'https://mediumship.app/analyses/economie-du-soin',
    heroImage: 'soin-cover.jpg',
    premium: true, premiumTimeOverride: '72 h',
    updated: 'aujourd\u2019hui',
  },
  {
    id: 'pouvoir-achat-chiffres',
    type: 'article', status: 'draft',
    title: "Pouvoir d'achat : ce que les chiffres ne disent pas.",
    slug: 'pouvoir-achat-chiffres',
    summary: 'Une enquête sur les angles morts des statistiques officielles.',
    tags: 'enquête, économie, méthodologie',
    category: 'Analyses',
    body: "Les chiffres officiels disent que l'inflation ralentit. Mais derrière la moyenne se cache une réalité hétérogène…",
    heroImage: 'pouvoir-cover.jpg',
    premium: false,
    updated: 'hier',
  },
  {
    id: 'democratie-locale-debat',
    type: 'video', status: 'published',
    title: 'Démocratie locale, où en sommes-nous ?',
    slug: 'democratie-locale-debat',
    summary: 'Débat avec trois élus locaux et deux chercheurs.',
    tags: 'débat, démocratie, territoire',
    category: 'Actualités',
    youtubeUrl: 'https://youtube.com/watch?v=demo-democratie',
    videoSource: 'youtube',
    durationOverride: '1 h 04',
    heroImage: 'debat-cover.jpg',
    premium: true, premiumTimeOverride: '0 h',
    updated: 'il y a 3 j',
  },
];

/* ---------- Default feed sections ---------- */
const initialFeed = [
  { id: 'fs1', type: 'article', label: 'Latest stories' },
  { id: 'fs2', type: 'episode', label: 'New episodes' },
  { id: 'fs3', type: 'video',   label: 'Watch now' },
];

/* ---------- Tenant default state ---------- */
const initialTenant = {
  brandName: 'Mediumship',
  brandSlug: 'mediumship',
  palette: 'boussole',
  typo: 'editorial',
  visibility: { articles: true, episodes: true, videos: true, premium: true },
  feed: initialFeed,
};

/* ---------- Default templates per content type ---------- */
function templateFor(type) {
  const base = {
    id: 'new-' + Date.now(),
    type, status: 'draft',
    title: '', slug: '', summary: '', tags: '', category: 'Analyses',
    body: '', heroImage: '', url: '',
    premium: false, premiumTimeOverride: '',
    advanced: { canonicalUrl: '', publishedAt: '', author: '' },
    updated: 'à l\u2019instant',
  };
  if (type === 'episode') return { ...base, audioUrl: '', durationOverride: '' };
  if (type === 'video')   return { ...base, youtubeUrl: '', videoSource: 'youtube', durationOverride: '' };
  return base;
}

function slugify(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
}

Object.assign(window, {
  PALETTES, TYPOS, CATEGORIES,
  initialItems, initialTenant, templateFor, slugify,
});
