/* global React, Phone, StatusBar */
// variants.jsx — "Un socle, plusieurs identités"
// Three branded variants of the same product to prove the white-label promise.

const VARIANTS = [
  {
    id: 'onde',
    badge: '— Variante 01',
    brand: "L'Onde",
    tagline: 'Média indépendant premium',
    desc: 'Récits longs, voix éditoriale, lettre du dimanche.',
    theme: {
      '--bf-bg': '#F4F1E8',
      '--bf-card': '#FFFFFF',
      '--bf-ink': '#1A1A1A',
      '--bf-accent': '#6B2417',
      '--bf-muted': '#ECE7DA',
      '--bf-display': '"Newsreader", Georgia, serif',
      '--bf-body': '"Hanken Grotesk", system-ui, sans-serif',
      '--bf-display-style': 'italic',
    },
    logo: { name: 'L', mark: '\u2019Onde', italic: true },
    tabs: ['Une', 'Récits', 'Podcasts', 'Lettre'],
    activeTab: 0,
    heroEyebrow: '◉ Lecture du jour',
    heroTitle: "Le siècle de l'intime, saison 2.",
    heroMeta: ['ÉPISODE 03', '28 MIN'],
    items: [
      { cat: 'Récit', t: 'La maison sans lumière', d: '22 min de lecture', tint: 'linear-gradient(135deg,#D8D2C2,#B8B0A0)' },
      { cat: 'Podcast', t: 'Avec Élise Bardin', d: '54 min · hier', tint: 'linear-gradient(135deg,#E8DDD0,#C4A98C)' },
      { cat: 'Lettre · Premium', t: "L'Onde du dimanche", d: 'Réservé membres', tint: 'linear-gradient(135deg,#2A2A2A,#4A4541)' },
    ],
    dna: [
      { k: 'Couleur', v: 'Bourgogne · sable', sw: ['#6B2417', '#F4F1E8'] },
      { k: 'Type', v: 'Serif éditoriale' },
      { k: 'Ton', v: 'Mesuré · littéraire' },
    ],
  },
  {
    id: 'boussole',
    badge: '— Variante 02',
    brand: 'Boussole',
    tagline: 'Cycle 2027 · décryptage citoyen',
    desc: 'Live, analyses, débrief du cycle électoral.',
    theme: {
      '--bf-bg': '#F1F0EC',
      '--bf-card': '#FFFFFF',
      '--bf-ink': '#0E1117',
      '--bf-accent': '#1E3A5F',
      '--bf-muted': '#E2E2DE',
      '--bf-display': '"Geist", system-ui, sans-serif',
      '--bf-body': '"Geist", system-ui, sans-serif',
      '--bf-display-style': 'normal',
      '--bf-display-weight': '600',
    },
    logo: { name: 'Boussole', mark: '°', italic: false },
    tabs: ['Live', 'Cycle 2027', 'Débrief', 'Analyses'],
    activeTab: 1,
    heroEyebrow: '● EN DIRECT — CE SOIR',
    heroTitle: 'Débat des candidats · fiscalité.',
    heroMeta: ['21H00', 'PLATEAU PARIS'],
    items: [
      { cat: 'Analyse · 14:32', t: 'Ce que dit (vraiment) le sondage IFOP', d: '12 min · Cycle 2027', tint: 'linear-gradient(135deg,#D5D9DE,#A8B0BA)' },
      { cat: 'Débrief', t: 'Édition du matin · 06 min', d: 'Audio express · aujourd\u2019hui', tint: 'linear-gradient(135deg,#1E3A5F,#0E1B30)' },
      { cat: 'Cartographie', t: 'Intentions de vote · mars', d: 'Mis à jour aujourd\u2019hui', tint: 'linear-gradient(135deg,#3A4654,#1E2A38)' },
    ],
    dna: [
      { k: 'Couleur', v: 'Cobalt · papier', sw: ['#1E3A5F', '#F1F0EC'] },
      { k: 'Type', v: 'Grotesque condensé' },
      { k: 'Ton', v: 'Urgent · analytique' },
    ],
  },
  {
    id: 'commune',
    badge: '— Variante 03',
    brand: 'Commune',
    tagline: 'Communauté engagée',
    desc: 'Agenda, Discord, appels à contribution.',
    theme: {
      '--bf-bg': '#EDE8DC',
      '--bf-card': '#FFFCF4',
      '--bf-ink': '#1F1F1A',
      '--bf-accent': '#B47A2A',
      '--bf-muted': '#E0DAC8',
      '--bf-display': '"Manrope", system-ui, sans-serif',
      '--bf-body': '"Manrope", system-ui, sans-serif',
      '--bf-display-style': 'normal',
      '--bf-display-weight': '700',
    },
    logo: { name: 'Commune', mark: '·', italic: false },
    tabs: ['Agenda', 'Discord', 'Soutenir', 'Membres'],
    activeTab: 0,
    heroEyebrow: '◉ PROCHAIN RASSEMBLEMENT',
    heroTitle: 'Paris, 24 mars — Assemblée ouverte.',
    heroMeta: ['180 INSCRITS', '19H00'],
    items: [
      { cat: 'Agenda', t: 'Atelier ouvert · jeudi 20h', d: 'En visio · gratuit', tint: 'linear-gradient(135deg,#D4C9B0,#A89B7C)' },
      { cat: 'Discord', t: '8 nouveaux fils cette semaine', d: 'Salon membres', tint: 'linear-gradient(135deg,#7B8E55,#4E5D34)' },
      { cat: 'Soutenir', t: 'Campagne de mars · 64 %', d: 'Appel à contribution', tint: 'linear-gradient(135deg,#B47A2A,#7E5414)' },
    ],
    dna: [
      { k: 'Couleur', v: 'Ocre · sable chaud', sw: ['#B47A2A', '#EDE8DC'] },
      { k: 'Type', v: 'Humaniste · ronde' },
      { k: 'Ton', v: 'Chaleureux · engageant' },
    ],
  },
];

const BrandedFeed = ({ variant }) => {
  const v = variant;
  return (
    <Phone label={`Démo ${v.brand}`}>
      <StatusBar />
      <div className="app-content" style={v.theme}>
        <div className="bfeed">
          <div className="bfeed__hdr">
            <div className="bfeed__logo">
              {v.logo.italic ? <i>{v.logo.name}</i> : v.logo.name}{v.logo.mark}
            </div>
            <div className="bfeed__av"></div>
          </div>
          <div className="bfeed__tabs">
            {v.tabs.map((tab, i) => (
              <span key={tab} className={i === v.activeTab ? 'on' : ''}>{tab}</span>
            ))}
          </div>
          <div className="bfeed__hero">
            <div className="label">{v.heroEyebrow}</div>
            <div className="t">{v.heroTitle}</div>
            <div className="m">
              <span className="play">▶</span>
              {v.heroMeta.map((m, i) => <span key={i}>{m}{i < v.heroMeta.length - 1 ? ' ·' : ''}</span>)}
            </div>
          </div>
          <div className="bfeed__list">
            {v.items.map((it, i) => (
              <div className="bfeed__item" key={i}>
                <div className="ph" style={{ background: it.tint }}></div>
                <div className="meta">
                  <span className="cat">{it.cat}</span>
                  <span className="t">{it.t}</span>
                  <span className="d">{it.d}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Phone>
  );
};

const CHANGES = [
  { i: 'Logo & icône',   d: 'Marque, splash screen, app icon iOS/Android.' },
  { i: 'Couleur',        d: 'Palette complète, accent, fond, surfaces.' },
  { i: 'Typographie',    d: 'Display éditoriale + corps de texte.' },
  { i: 'Catégories',     d: 'Architecture du home feed, vocabulaire.' },
  { i: 'Ton éditorial',  d: 'Voix de marque, microcopy, CTA.' },
  { i: 'Offre premium',  d: 'Paliers, prix, durées d\u2019essai, bénéfices.' },
];

const FIXED = [
  { i: 'Navigation',     d: 'Tabs, hiérarchie, transitions natives iOS/Android.' },
  { i: 'Player audio',   d: 'Lecture continue, vitesse, hors-ligne, chapitres.' },
  { i: 'Paywall',        d: 'Plans, conversion, abonnements natifs.' },
  { i: 'Home feed',      d: 'Structure, cards, hero éditorial, infinite scroll.' },
  { i: 'Espace membres', d: 'Profil, préférences, gestion d\u2019abonnement.' },
  { i: 'Notifications',  d: 'Push segmenté, deeplinks, planification.' },
];

const Variants = () => (
  <section className="section variants" id="variants">
    <div className="wrap">
      <header className="variants__head">
        <div className="eyebrow"><span className="dot">◉</span>Démonstration · white-label</div>
        <h2 className="h-section serif">Un socle. <i>Plusieurs identités.</i></h2>
        <p className="lede">
          Le même produit, la même architecture — trois directions de marque,
          trois tonalités, trois audiences. Toutes livrables en 14 jours.
        </p>
      </header>

      <div className="variants__strip">
        {VARIANTS.map(v => (
          <article className="variant" key={v.id}>
            <div className="variant__badge mono">{v.badge}</div>
            <div className="variant__phone"><BrandedFeed variant={v} /></div>
            <div className="variant__meta">
              <h3 className="variant__brand serif">{v.brand}</h3>
              <p className="variant__tagline">{v.tagline}</p>
              <p className="variant__desc">{v.desc}</p>
              <div className="variant__dna">
                {v.dna.map(d => (
                  <div className="variant__dna-row" key={d.k}>
                    <span className="k">{d.k}</span>
                    <span className="v">
                      {d.sw && <span className="dna-sw-row">{d.sw.map((c, i) => (
                        <span key={i} className="dna-sw" style={{ background: c }}></span>
                      ))}</span>}
                      <span>{d.v}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="variants__matrix">
        <div className="vm-col vm-col--change">
          <div className="eyebrow"><span className="dot">◉</span>Ce qui change</div>
          <h3 className="h-3 serif">Ce que vous personnalisez.</h3>
          <ul>
            {CHANGES.map(r => (
              <li key={r.i}>
                <span className="i">{r.i}</span>
                <span className="d">{r.d}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="vm-col vm-col--fixed">
          <div className="eyebrow"><span className="dot">◉</span>Ce qui reste fixe</div>
          <h3 className="h-3 serif">Le socle que vous n'avez pas à construire.</h3>
          <ul>
            {FIXED.map(r => (
              <li key={r.i}>
                <span className="i">{r.i}</span>
                <span className="d">{r.d}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

Object.assign(window, { BrandedFeed, Variants, VARIANTS });
