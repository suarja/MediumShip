/* global React, Phone, StatusBar, BrandHeader, TabBar, Kicker, ContentRow, TAB_ITEMS */
// variations.jsx — User flow, White-label matrix, 3 client variations

/* ============================================================
   User flow plate
   ============================================================ */
const FlowStep = ({ n, label, children }) => (
  <div className="flow__step">
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span className="n">— {n}</span>
      <span className="l">{label}</span>
    </div>
    {children}
  </div>
);

/* Mini phones for the flow — just visual summaries of each screen */
const MiniOnboarding = () => (
  <Phone small>
    <StatusBar />
    <div className="scr">
      <div className="onb" style={{ padding: '0 12px 14px' }}>
        <div className="onb__media" style={{ aspectRatio: 1, margin: '6px 0 12px' }}>
          <div className="stamp" style={{ fontSize: 14, top: 8, left: 8 }}><i>Civica</i><span className="dot"></span></div>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 14, margin: '0 0 6px', lineHeight: 1.05 }}>
          Votre média <i>dans votre poche.</i>
        </h1>
        <div style={{ marginTop: 'auto', height: 22, borderRadius: 999, background: 'var(--brand-ink)' }}></div>
      </div>
    </div>
  </Phone>
);

const MiniHome = () => (
  <Phone small>
    <StatusBar />
    <div className="scr">
      <div className="bhdr" style={{ padding: '4px 10px 8px' }}>
        <div className="bhdr__logo" style={{ fontSize: 12 }}>
          <i>Civica</i><span className="dot" style={{ width: 3, height: 3 }}></span>
        </div>
        <span className="bhdr__av" style={{ width: 18, height: 18 }}></span>
      </div>
      <div style={{ padding: '0 10px', flex: 1 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          <span style={{ background: 'var(--brand-ink)', color: 'var(--brand-bg)', fontSize: 7, padding: '2px 6px', borderRadius: 999, fontFamily: 'var(--font-mono)', letterSpacing: '.06em' }}>TOUS</span>
          <span style={{ border: '1px solid var(--brand-rule-2)', fontSize: 7, padding: '2px 6px', borderRadius: 999, fontFamily: 'var(--font-mono)' }}>ANALYSES</span>
          <span style={{ border: '1px solid var(--brand-rule-2)', fontSize: 7, padding: '2px 6px', borderRadius: 999, fontFamily: 'var(--font-mono)' }}>AUDIO</span>
        </div>
        <div style={{ background: 'var(--brand-ink)', color: 'var(--brand-bg)', borderRadius: 8, height: 90, padding: 8, marginBottom: 8, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 6.5, color: 'var(--brand-accent)', fontFamily: 'var(--font-mono)', letterSpacing: '.1em' }}>◉ ANALYSE</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, lineHeight: 1.05, marginTop: 4 }}>L'économie du soin.</div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
          <span style={{ width: 30, height: 30, borderRadius: 6, background: 'linear-gradient(135deg, #E0CBA8, #B47A2A)' }}></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 6, color: 'var(--brand-accent)', fontFamily: 'var(--font-mono)' }}>PODCAST</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 8.5, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Avec Léa Bardin</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ width: 30, height: 30, borderRadius: 6, background: 'linear-gradient(135deg, #C97349, #B14424)' }}></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 6, color: 'var(--brand-accent)', fontFamily: 'var(--font-mono)' }}>VIDÉO</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 8.5, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Démocratie locale</div>
          </div>
        </div>
      </div>
      <div style={{ height: 24, background: 'color-mix(in oklab, var(--brand-bg) 92%, white)', borderTop: '1px solid var(--brand-rule)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 8px' }}>
        {['◉', '▷', '☷', '✦', '○'].map((i, idx) => (
          <span key={idx} style={{ fontSize: 8, color: idx === 0 ? 'var(--brand-accent)' : 'var(--brand-ink-soft)' }}>{i}</span>
        ))}
      </div>
    </div>
  </Phone>
);

const MiniArticle = () => (
  <Phone small>
    <StatusBar />
    <div className="scr">
      <div style={{ height: 100, background: 'linear-gradient(135deg, var(--brand-accent), #6B2417)' }}></div>
      <div style={{ padding: 10, flex: 1 }}>
        <div style={{ fontSize: 6.5, color: 'var(--brand-accent)', fontFamily: 'var(--font-mono)', letterSpacing: '.1em' }}>◉ ANALYSE</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 13, lineHeight: 1.1, margin: '6px 0' }}>
          L'économie <i>du soin</i>.
        </h2>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--brand-rule)' }}>
          <span style={{ width: 16, height: 16, borderRadius: 999, background: 'linear-gradient(135deg, #C97349, #6B2417)' }}></span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 8 }}>Élise Brun</span>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--brand-ink-2)', lineHeight: 1.5, marginTop: 6 }}>
          Et si nous reconnaissions enfin que prendre soin constitue le travail le plus essentiel d'une société ?
        </div>
      </div>
    </div>
  </Phone>
);

const MiniPlayer = () => (
  <Phone small>
    <StatusBar dark />
    <div className="scr scr--dark" style={{ background: '#14110E', padding: '4px 12px 10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 6, color: 'rgba(244,241,232,.5)', fontFamily: 'var(--font-mono)', letterSpacing: '.1em', marginBottom: 8 }}>
        <span>↓ LECTURE</span>
        <span>⋯</span>
      </div>
      <div style={{ aspectRatio: 1, borderRadius: 8, background: 'radial-gradient(circle at 70% 30%, rgba(200,150,74,.5), transparent 50%), linear-gradient(135deg, var(--brand-accent), #6B2417)', position: 'relative', marginBottom: 10 }}>
        <div style={{ position: 'absolute', left: 8, bottom: 8, right: 8, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 10, color: '#fff', lineHeight: 1.1 }}>
          L'économie du soin.
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: '#F4F1E8' }}>L'économie du soin.</div>
      <div style={{ fontSize: 7, color: 'rgba(244,241,232,.5)' }}>Civica</div>
      <div style={{ height: 2, background: 'rgba(244,241,232,.12)', borderRadius: 999, position: 'relative', marginTop: 8 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '42%', background: 'var(--brand-accent)', borderRadius: 999 }}></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: 14 }}>
        <span style={{ color: 'rgba(244,241,232,.55)', fontSize: 9 }}>⏮</span>
        <span style={{ width: 28, height: 28, borderRadius: 999, background: '#F4F1E8', color: '#14110E', display: 'grid', placeItems: 'center', fontSize: 10 }}>▶</span>
        <span style={{ color: 'rgba(244,241,232,.55)', fontSize: 9 }}>⏭</span>
      </div>
    </div>
  </Phone>
);

const MiniPremium = () => (
  <Phone small>
    <StatusBar dark />
    <div className="scr" style={{ background: '#14110E', color: '#F4F1E8', padding: '6px 12px 10px' }}>
      <div style={{ fontSize: 7, color: 'rgba(244,241,232,.55)', fontFamily: 'var(--font-mono)', letterSpacing: '.1em', marginBottom: 8 }}>‹ SOUTENIR</div>
      <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--brand-premium)', color: '#14110E', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 12, marginBottom: 8 }}>C</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, lineHeight: 1.05, marginBottom: 4 }}>
        Soutenez. <i style={{ color: 'var(--brand-premium)' }}>Recevez plus.</i>
      </div>
      <div style={{ fontSize: 7.5, color: 'rgba(244,241,232,.6)', marginBottom: 10, lineHeight: 1.4 }}>
        Votre soutien finance le travail éditorial.
      </div>
      {[
        { nm: 'Mensuel', pr: '9 €' },
        { nm: 'Annuel', pr: '79 €', on: true, b: 'LE PLUS SOUTENU' },
        { nm: 'Bienfaiteur', pr: '15 €' },
      ].map(p => (
        <div key={p.nm} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 8px',
          background: p.on ? 'rgba(200,150,74,.08)' : 'rgba(244,241,232,.06)',
          border: `1px solid ${p.on ? 'var(--brand-premium)' : 'rgba(244,241,232,.1)'}`,
          borderRadius: 6,
          marginBottom: 4,
        }}>
          <div>
            {p.b && <div style={{ background: 'var(--brand-premium)', color: '#14110E', fontFamily: 'var(--font-mono)', fontSize: 5.5, letterSpacing: '.1em', padding: '1px 4px', borderRadius: 2, marginBottom: 2, display: 'inline-block', fontWeight: 700 }}>{p.b}</div>}
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 9 }}>{p.nm}</div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10 }}>{p.pr}</div>
        </div>
      ))}
    </div>
  </Phone>
);

const MiniLibrary = () => (
  <Phone small>
    <StatusBar />
    <div className="scr">
      <div style={{ padding: '4px 10px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 8 }}>‹</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 10 }}>Bibliothèque</span>
        <span></span>
      </div>
      <div style={{ padding: '0 10px', flex: 1 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          <span style={{ background: 'var(--brand-ink)', color: 'var(--brand-bg)', fontSize: 6.5, padding: '2px 5px', borderRadius: 999, fontFamily: 'var(--font-mono)' }}>TOUT</span>
          <span style={{ border: '1px solid var(--brand-rule-2)', fontSize: 6.5, padding: '2px 5px', borderRadius: 999, fontFamily: 'var(--font-mono)' }}>ARTICLES</span>
          <span style={{ border: '1px solid var(--brand-rule-2)', fontSize: 6.5, padding: '2px 5px', borderRadius: 999, fontFamily: 'var(--font-mono)' }}>AUDIO</span>
        </div>
        {[
          { c: 'ARTICLE', t: "Pouvoir d'achat", g: 'linear-gradient(135deg, #E0CBA8, #B47A2A)' },
          { c: 'PODCAST', t: 'Avec Léa Bardin', g: 'linear-gradient(135deg, #2A2521, #14110E)' },
          { c: 'VIDÉO', t: 'Démocratie locale', g: 'linear-gradient(135deg, #C97349, #B14424)' },
          { c: 'ANALYSE', t: "L'économie du soin", g: 'linear-gradient(135deg, #6B8E5A, #3F5635)' },
        ].map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '5px 0' }}>
            <span style={{ width: 28, height: 28, borderRadius: 5, background: it.g }}></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 6, color: 'var(--brand-accent)', fontFamily: 'var(--font-mono)', letterSpacing: '.1em' }}>{it.c}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 8.5, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.t}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </Phone>
);

const MiniProfile = () => (
  <Phone small>
    <StatusBar />
    <div className="scr">
      <div style={{ padding: '4px 10px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span></span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 10 }}>Profil</span>
        <span style={{ fontSize: 8 }}>⚙</span>
      </div>
      <div style={{ padding: '0 10px' }}>
        <div style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-rule)', borderRadius: 8, padding: 8, display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
          <span style={{ width: 26, height: 26, borderRadius: 999, background: 'linear-gradient(135deg, var(--brand-accent), #6B2417)' }}></span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 10 }}>Camille R.</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 6, color: 'var(--brand-premium)', letterSpacing: '.08em' }}>★ BIENFAITEUR</div>
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 6, color: 'var(--brand-ink-soft)', letterSpacing: '.1em', marginBottom: 4 }}>— ABONNEMENT</div>
        {[
          { ic: '★', t: 'Plan Annuel · Bienfaiteur' },
          { ic: '↓', t: 'Téléchargements hors-ligne' },
          { ic: '🔔', t: 'Notifications · 3 actives' },
          { ic: '⎘', t: 'Cercle local · Paris' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: 6, padding: '5px 0', borderTop: i > 0 ? '1px solid var(--brand-rule)' : 'none', alignItems: 'center' }}>
            <span style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--brand-accent-soft)', color: 'var(--brand-accent)', display: 'grid', placeItems: 'center', fontSize: 8 }}>{r.ic}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 8.5 }}>{r.t}</span>
          </div>
        ))}
      </div>
    </div>
  </Phone>
);

const UserFlow = () => (
  <div className="flow">
    <div className="flow__head">
      <span className="kicker kicker--accent">◉ USER FLOW</span>
      <h3>Le parcours utilisateur, <i>de bout en bout.</i></h3>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--brand-ink-soft)', maxWidth: '60ch', lineHeight: 1.5 }}>
        Sept étapes-clés du téléchargement à l'engagement membre. Toutes les apps Civica suivent cette trame —
        seules les marques changent.
      </p>
    </div>
    <div className="flow__row">
      <FlowStep n="01" label="Onboarding"><MiniOnboarding /></FlowStep>
      <span className="flow__arrow">→</span>
      <FlowStep n="02" label="Home"><MiniHome /></FlowStep>
      <span className="flow__arrow">→</span>
      <FlowStep n="03" label="Article"><MiniArticle /></FlowStep>
      <span className="flow__arrow">→</span>
      <FlowStep n="04" label="Player"><MiniPlayer /></FlowStep>
      <span className="flow__arrow">→</span>
      <FlowStep n="05" label="Premium"><MiniPremium /></FlowStep>
      <span className="flow__arrow">→</span>
      <FlowStep n="06" label="Library"><MiniLibrary /></FlowStep>
      <span className="flow__arrow">→</span>
      <FlowStep n="07" label="Profile"><MiniProfile /></FlowStep>
    </div>
  </div>
);

/* ============================================================
   White-label matrix
   ============================================================ */
const CHANGES = [
  { i: 'Logo & app icon',  d: 'Marque, splash, icône iOS & Android.' },
  { i: 'Couleurs',         d: 'Palette complète : surfaces, accent, premium.' },
  { i: 'Typographies',     d: 'Display éditoriale + corps de texte.' },
  { i: 'Iconographie',     d: 'Style des icônes et illustrations.' },
  { i: 'Catégories',       d: 'Architecture du home feed, vocabulaire.' },
  { i: 'Style des images', d: 'Tonalité photo, traitement, ratios.' },
  { i: 'Ton éditorial',    d: 'Voix de marque, microcopy, CTA.' },
  { i: 'Nom des sections', d: 'Tabs et libellés adaptés au client.' },
  { i: 'Offre premium',    d: 'Paliers, prix, bénéfices, paywall.' },
];

const FIXED = [
  { i: 'Navigation',      d: 'Bottom tab bar, hiérarchie, transitions natives.' },
  { i: 'Structure écrans',d: 'Home, détail, player, bibliothèque, agenda.' },
  { i: 'Player audio',    d: 'Lecture, vitesse, hors-ligne, file d\u2019attente.' },
  { i: 'Cartes de contenu', d: 'Composants article, podcast, vidéo, événement.' },
  { i: 'Paywall',         d: 'Plans, conversion, abonnements natifs iOS/Android.' },
  { i: 'Profil membre',   d: 'Statut, abonnement, préférences, téléchargements.' },
  { i: 'Notifications',   d: 'Centre, push segmenté, deeplinks.' },
  { i: 'Bibliothèque',    d: 'Sauvegardés, hors-ligne, filtres.' },
];

const WhiteLabelMatrix = () => (
  <div className="wl-table">
    <div className="wl-col">
      <div className="head">
        <span className="kicker kicker--accent">◉ CE QUI CHANGE</span>
        <h3>Ce que vous personnalisez.</h3>
      </div>
      <ul>
        {CHANGES.map(r => (
          <li key={r.i}><span className="i">{r.i}</span><span className="d">{r.d}</span></li>
        ))}
      </ul>
    </div>
    <div className="wl-col">
      <div className="head">
        <span className="kicker">◉ CE QUI RESTE FIXE</span>
        <h3>Le socle que vous n'avez pas à construire.</h3>
      </div>
      <ul>
        {FIXED.map(r => (
          <li key={r.i}><span className="i">{r.i}</span><span className="d">{r.d}</span></li>
        ))}
      </ul>
    </div>
  </div>
);

/* ============================================================
   Variation header
   ============================================================ */
const VariationHead = () => (
  <div className="var-head">
    <span className="kicker">◉ CLIENT VARIATIONS</span>
    <h3>Un socle. <i>Trois marques.</i></h3>
    <p>
      Trois exemples du même socle Civica appliqué à trois clients : un média citoyen,
      une chaîne YouTube d'éducation, un podcast culturel indépendant.
      Mêmes écrans, mêmes composants — couleurs, typographie, catégories et ton adaptés.
    </p>
  </div>
);

/* ============================================================
   Variant home (one component, themed via CSS vars)
   ============================================================ */

const VARIANTS = [
  {
    id: 'pivot',
    brand: 'Pivot',
    vertical: 'Média citoyen',
    desc: 'Analyses, débats, programme 2027, cercles locaux.',
    theme: {
      '--brand-bg': '#F2EEE3',
      '--brand-surface': '#FFFFFF',
      '--brand-ink': '#1A1310',
      '--brand-ink-2': '#46413A',
      '--brand-ink-soft': '#7A746A',
      '--brand-accent': '#B14424',
      '--brand-accent-soft': 'rgba(177,68,36,.12)',
      '--brand-premium': '#C8964A',
      '--brand-rule': 'rgba(26,19,16,.08)',
      '--brand-rule-2': 'rgba(26,19,16,.14)',
      '--font-display': '"Newsreader", Georgia, serif',
      '--font-body': '"Hanken Grotesk", system-ui, sans-serif',
    },
    logo: 'Pivot',
    italic: true,
    tabs: [
      { i: '◉', l: 'Une' },
      { i: '✎', l: 'Analyses' },
      { i: '☷', l: 'Agenda' },
      { i: '✦', l: 'Soutenir' },
      { i: '○', l: 'Profil' },
    ],
    chips: ['Tout', 'Analyses', 'Débats', 'Agenda'],
    heroKicker: '◉ Programme 2027',
    heroTitle: 'Le grand débat — fiscalité 2027.',
    heroMeta: '32 MIN · LIVE CE SOIR',
    items: [
      { k: 'Analyse · Aujourd\u2019hui', t: 'Pouvoir d\u2019achat : ce que les chiffres ne disent pas', m: '18 min', tint: 'alt' },
      { k: 'Débat · S03 · E14', t: 'Démocratie locale, où en sommes-nous ?', m: '54 min · Audio', tint: 'br' },
    ],
    dna: ['#B14424', '#F2EEE3', '#C8964A'],
    pairing: 'Newsreader · Hanken Grotesk',
    tone: 'Mesuré · engagé · citoyen',
  },
  {
    id: 'studio',
    brand: 'Studio',
    vertical: 'Chaîne YouTube · éducation',
    desc: 'Cours, vidéos longues, lives, communauté apprenante.',
    theme: {
      '--brand-bg': '#F6F5F1',
      '--brand-surface': '#FFFFFF',
      '--brand-ink': '#0E0F12',
      '--brand-ink-2': '#2E3138',
      '--brand-ink-soft': '#6A6E78',
      '--brand-accent': '#2F4FD9',
      '--brand-accent-soft': 'rgba(47,79,217,.12)',
      '--brand-premium': '#16A36A',
      '--brand-rule': 'rgba(14,15,18,.08)',
      '--brand-rule-2': 'rgba(14,15,18,.14)',
      '--font-display': '"Geist", system-ui, sans-serif',
      '--font-body': '"Geist", system-ui, sans-serif',
    },
    logo: 'Studio°',
    italic: false,
    tabs: [
      { i: '◉', l: 'Cours' },
      { i: '▶', l: 'Vidéos' },
      { i: '●', l: 'Lives' },
      { i: '✦', l: 'Membres' },
      { i: '○', l: 'Profil' },
    ],
    chips: ['Tout', 'Cours', 'Vidéos', 'Lives', 'Modules'],
    heroKicker: '◉ Nouveau cours',
    heroTitle: 'Comprendre la macro · 8 vidéos · 4 h.',
    heroMeta: 'NIVEAU 1 · CERTIFIÉ',
    items: [
      { k: 'Vidéo · Long format', t: 'Inflation : le grand retour ?', m: '42 min', tint: 'dk' },
      { k: 'Live · Demain 20h', t: 'Q&R avec la communauté', m: 'Réservé membres', tint: 'gr' },
    ],
    dna: ['#2F4FD9', '#F6F5F1', '#16A36A'],
    pairing: 'Geist · Geist',
    tone: 'Pédagogue · direct · clair',
  },
  {
    id: 'mineur',
    brand: 'Mineur',
    vertical: 'Podcast indépendant · culture',
    desc: 'Épisodes, saisons, archives, abonnement bienfaiteur.',
    theme: {
      '--brand-bg': '#EFE9D7',
      '--brand-surface': '#FFFCF2',
      '--brand-ink': '#1E1610',
      '--brand-ink-2': '#3F352D',
      '--brand-ink-soft': '#7F7466',
      '--brand-accent': '#6F2618',
      '--brand-accent-soft': 'rgba(111,38,24,.12)',
      '--brand-premium': '#C7965A',
      '--brand-rule': 'rgba(30,22,16,.08)',
      '--brand-rule-2': 'rgba(30,22,16,.14)',
      '--font-display': '"Instrument Serif", Georgia, serif',
      '--font-body': '"Manrope", system-ui, sans-serif',
    },
    logo: 'Mineur',
    italic: true,
    tabs: [
      { i: '◉', l: 'À l\u2019écoute' },
      { i: '▷', l: 'Épisodes' },
      { i: '☱', l: 'Saisons' },
      { i: '✦', l: 'Soutenir' },
      { i: '○', l: 'Profil' },
    ],
    chips: ['Tout', 'Épisodes', 'Saisons', 'Notes'],
    heroKicker: '◉ Saison 04',
    heroTitle: 'E11 — La fin du silence.',
    heroMeta: '58 MIN · NOUVEAU',
    items: [
      { k: 'Épisode · S04 · E10', t: 'Marie Bardet, l\u2019art de la lenteur', m: '64 min', tint: 'br' },
      { k: 'Note · Lecture', t: 'Les références de l\u2019épisode 09', m: '6 min', tint: 'alt' },
    ],
    dna: ['#6F2618', '#EFE9D7', '#C7965A'],
    pairing: 'Instrument Serif · Manrope',
    tone: 'Intime · contemplatif · culturel',
  },
];

const VariantHome = ({ v }) => (
  <Phone themeVars={v.theme}>
    <StatusBar />
    <div className="scr">
      <div className="bhdr">
        <div className="bhdr__logo">
          {v.italic ? <i>{v.logo}</i> : v.logo}<span className="dot"></span>
        </div>
        <div className="bhdr__act">
          <span className="bhdr__ic">🔔</span>
          <span className="bhdr__av"></span>
        </div>
      </div>
      <div className="scr__body">
        <div className="chips" style={{ marginBottom: 14 }}>
          {v.chips.map((c, i) => (
            <span key={c} className={`chip ${i === 0 ? 'on' : ''}`}>{c}</span>
          ))}
        </div>
        <div className="hero-card">
          <div className="hero-card__media"></div>
          <div className="hero-card__body">
            <Kicker>{v.heroKicker}</Kicker>
            <h3 className="t">{v.heroTitle}</h3>
            <div className="m">
              <span className="play">▶</span>
              <span>{v.heroMeta}</span>
            </div>
          </div>
        </div>
        <div className="sh">
          <span className="sh__t serif">Derniers <i>contenus</i></span>
          <span className="sh__more">Voir tout →</span>
        </div>
        {v.items.map((it, i) => (
          <ContentRow key={i} kicker={it.k} title={it.t} meta={it.m} tint={it.tint} />
        ))}
      </div>
      <TabBar active={0} items={v.tabs} />
    </div>
  </Phone>
);

const VariantLabel = ({ v }) => (
  <div className="varlbl">
    <span className="t">{v.vertical}</span>
    <span className="nm">{v.brand}</span>
    <span className="d">{v.desc}</span>
    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.1em', color: 'var(--brand-ink-soft)', minWidth: 56, textTransform: 'uppercase' }}>Palette</span>
        <span className="dna">
          {v.dna.map((c, i) => <span key={i} className="sw" style={{ background: c }}></span>)}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.1em', color: 'var(--brand-ink-soft)', minWidth: 56, textTransform: 'uppercase' }}>Type</span>
        <span style={{ fontSize: 11, color: 'var(--brand-ink-2)' }}>{v.pairing}</span>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.1em', color: 'var(--brand-ink-soft)', minWidth: 56, textTransform: 'uppercase' }}>Ton</span>
        <span style={{ fontSize: 11, color: 'var(--brand-ink-2)' }}>{v.tone}</span>
      </div>
    </div>
  </div>
);

Object.assign(window, {
  UserFlow, WhiteLabelMatrix, VariationHead, VariantHome, VariantLabel, VARIANTS,
});
