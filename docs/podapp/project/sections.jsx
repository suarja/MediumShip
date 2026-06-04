/* global React */
// sections.jsx — landing page sections for Mediumship

const Nav = () => (
  <header className="nav">
    <div className="wrap nav__row">
      <a href="#" className="brand">Mediumship<span className="brand__dot"></span></a>
      <nav className="nav__links">
        <a href="#preuve">L'app</a>
        <a href="#solution">Pourquoi</a>
        <a href="#features">Fonctionnalités</a>
        <a href="#wl">White-label</a>
        <a href="#variants">Variantes</a>
        <a href="#process">Process</a>
      </nav>
      <div className="nav__cta-group">
        <a href="cms/index.html" className="btn btn--ghost nav__login" title="Accéder au CMS">
          <span className="nav__login-dot"></span>
          CMS
        </a>
        <a href="#cta" className="btn btn--primary nav__cta">
          Booker un appel
          <span className="arr">→</span>
        </a>
      </div>
    </div>
  </header>
);

const Hero = () => (
  <section className="section hero">
    <div className="wrap hero__grid">
      <div>
        <div className="eyebrow hero__eyebrow"><span className="dot">◉</span>Studio d'apps mobiles white-label · pour médias et créateurs</div>
        <h1 className="h-display serif">
          Transformez votre audience en <i>média propriétaire.</i>
        </h1>
        <p className="lede hero__lede">
          Mediumship conçoit votre application iOS et Android premium —
          contenu, podcasts, vidéos, abonnements. Vous gardez l'audience.
          Nous nous occupons du reste.
        </p>
        <div className="hero__cta">
          <a href="#cta" className="btn btn--primary btn--big">Booker un appel découverte<span className="arr">→</span></a>
          <a href="#preuve" className="btn btn--ghost btn--big">Voir l'app démo</a>
        </div>
        <div className="hero__meta">
          <div>
            <div className="k serif">14 j.</div>
            <div className="v">De la maquette au store</div>
          </div>
          <div>
            <div className="k serif">100%</div>
            <div className="v">Sous votre marque</div>
          </div>
          <div>
            <div className="k serif">iOS<span style={{opacity:.4}}> · </span>And.</div>
            <div className="v">Apps natives livrées</div>
          </div>
        </div>
      </div>
      <div className="hero__phone">
        <HomeFeed large />
      </div>
    </div>
  </section>
);

const Gallery = () => (
  <section className="section section--tight" id="preuve">
    <div className="wrap">
      <div className="gallery">
        <div className="gallery__head">
          <div>
            <div className="eyebrow" style={{ color: 'color-mix(in oklab, var(--bg) 60%, transparent)', marginBottom: 16 }}>
              <span className="dot">◉</span>Aperçu produit
            </div>
            <h2 className="h-section serif">Une app pensée comme <i>un magazine vivant.</i></h2>
          </div>
          <p className="lede" style={{ minWidth: 280 }}>
            Trois écrans extraits de la démo Mediumship — votre version sera identique en architecture,
            personnalisée en marque.
          </p>
        </div>
        <div className="gallery__strip">
          <div className="gallery__col">
            <HomeFeed />
            <div className="gallery__caption">
              <div className="l serif">Home feed</div>
              <div className="s">Catégories, contenu éditorial, fil quotidien</div>
            </div>
          </div>
          <div className="gallery__col">
            <PodcastPlayer />
            <div className="gallery__caption">
              <div className="l serif">Player audio</div>
              <div className="s">Lecture continue, vitesse, notes d'épisode</div>
            </div>
          </div>
          <div className="gallery__col">
            <Paywall />
            <div className="gallery__caption">
              <div className="l serif">Abonnement</div>
              <div className="s">Paywall natif iOS/Android, conversion soignée</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ProblemSolution = () => (
  <section className="section section--tight" id="solution">
    <div className="wrap">
      <div className="split">
        <div className="split__col split__col--problem">
          <div className="eyebrow"><span className="dot">◉</span>Le problème</div>
          <h3 className="h-section serif">Vous construisez sur du <i>terrain loué.</i></h3>
          <p className="lede">
            YouTube, Spotify, Patreon, Substack. Chaque plateforme prend une commission,
            change ses règles, et garde la relation avec votre public.
          </p>
          <ul className="bullets">
            <li><span className="x">01</span><span>Algorithme qui décide qui vous voit (ou pas)</span></li>
            <li><span className="x">02</span><span>Vous ne possédez pas vos abonnés</span></li>
            <li><span className="x">03</span><span>30 à 45% de commission sur vos revenus</span></li>
            <li><span className="x">04</span><span>Aucun contrôle sur l'expérience</span></li>
          </ul>
        </div>
        <div className="split__col split__col--solution">
          <div className="eyebrow"><span className="dot" style={{color:'var(--accent)'}}>◉</span>La solution</div>
          <h3 className="h-section serif">Votre app. Votre audience. <i>Vos règles.</i></h3>
          <p className="lede">
            Mediumship vous livre une application native sous votre marque, prête à publier.
            Un socle produit éprouvé, personnalisé en 14 jours.
          </p>
          <ul className="bullets">
            <li><span className="x">✓</span><span>Votre marque, votre direction artistique</span></li>
            <li><span className="x">✓</span><span>Vos abonnés, vos données, vos revenus</span></li>
            <li><span className="x">✓</span><span>Notifications push natives, conversion 5×</span></li>
            <li><span className="x">✓</span><span>Maintenance et évolutions incluses</span></li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const FEATURES = [
  { n: '01', t: ['Contenu', { italic: 'éditorial' }, ' multi-format'], d: 'Articles longs, vidéos, podcasts, newsletter — un seul flux orchestré.' },
  { n: '02', t: ['Espace ', { italic: 'membres' }, ' & abonnements'], d: 'Paywalls natifs, gestion des abonnés, accès gradué premium.' },
  { n: '03', t: ['Player audio ', { italic: 'pro' }], d: 'Lecture continue, vitesse, notes d\'épisode, hors-ligne, chapitres.' },
  { n: '04', t: ['Notifications ', { italic: 'push' }], d: 'Segmentation par catégorie, programmation, deeplinks intelligents.' },
  { n: '05', t: ['Personnalisation ', { italic: 'totale' }], d: 'Couleurs, typographie, icône, ton éditorial — votre marque, partout.' },
  { n: '06', t: ['Stats & ', { italic: 'rétention' }], d: 'Dashboards clairs, cohortes, conversion, churn premium.' },
];

const Features = () => (
  <section className="section features" id="features">
    <div className="wrap">
      <div className="features__head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 16 }}><span className="dot">◉</span>Fonctionnalités</div>
          <h2 className="h-section serif">Un socle produit <i>complet,</i><br/>prêt à publier.</h2>
        </div>
        <p className="lede">
          Tout ce qu'un média propriétaire moderne doit offrir, sans devoir développer
          ou maintenir quoi que ce soit en interne.
        </p>
      </div>
      <div className="features__grid">
        {FEATURES.map((f) => (
          <article className="feat" key={f.n}>
            <div className="feat__num">— {f.n}</div>
            <h3 className="feat__t">
              {f.t.map((part, i) =>
                typeof part === 'string'
                  ? <React.Fragment key={i}>{part}</React.Fragment>
                  : <em key={i}>{part.italic}</em>
              )}
            </h3>
            <p className="feat__d">{f.d}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const WhiteLabel = () => (
  <section className="section wl" id="wl">
    <div className="wrap">
      <div className="wl__grid">
        <div className="wl__copy">
          <div className="eyebrow" style={{ marginBottom: 16 }}><span className="dot">◉</span>Comment la personnalisation fonctionne</div>
          <h2 className="h-section serif">Un socle premium.<br/><i>Votre marque, partout.</i></h2>
          <p className="lede">
            Mediumship n'est pas un constructeur drag-and-drop. C'est un produit éprouvé,
            redécliné chaque fois autour de votre identité — logo, palette, typographie,
            ton éditorial, hiérarchie du home feed, offre premium.
          </p>
          <div className="wl__steps">
            <span className="wl__step"><span className="n">01</span> Brief</span>
            <span className="wl__step"><span className="n">02</span> Design</span>
            <span className="wl__step"><span className="n">03</span> Build</span>
            <span className="wl__step"><span className="n">04</span> Launch</span>
          </div>
        </div>
        <div className="wl__matrix" role="table" aria-label="Éléments personnalisables">
          <div className="wl__row">
            <div className="k">Logo & icône</div>
            <div className="v"><b>Votre logo</b>, app icon iOS/Android, splash screen</div>
          </div>
          <div className="wl__row">
            <div className="k">Couleurs</div>
            <div className="v swatches">
              <span className="wl__sw" style={{ background: 'var(--ink)' }}></span>
              <span className="wl__sw" style={{ background: 'var(--accent)' }}></span>
              <span className="wl__sw" style={{ background: 'var(--bg-alt)' }}></span>
              <span className="wl__sw" style={{ background: '#fff' }}></span>
              <span style={{ marginLeft: 10, fontSize: 12.5, color: 'var(--ink-soft)' }}>Palette complète personnalisée</span>
            </div>
          </div>
          <div className="wl__row">
            <div className="k">Typographie</div>
            <div className="v" style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1 }}>Display</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-soft)' }}>+ corps de texte</span>
            </div>
          </div>
          <div className="wl__row">
            <div className="k">Ton éditorial</div>
            <div className="v">Voix de marque, micro-copy, vocabulaire des catégories</div>
          </div>
          <div className="wl__row">
            <div className="k">Home feed</div>
            <div className="v">
              <span className="wl__pill">À la une</span>{' '}
              <span className="wl__pill">Écouter</span>{' '}
              <span className="wl__pill">Lire</span>{' '}
              <span className="wl__pill">Premium</span>
            </div>
          </div>
          <div className="wl__row">
            <div className="k">Catégories</div>
            <div className="v">Vos rubriques, vos sections, votre architecture éditoriale</div>
          </div>
          <div className="wl__row">
            <div className="k">Offre premium</div>
            <div className="v">Paliers, prix, durées d'essai, bénéfices, paywall sur-mesure</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const STEPS = [
  { n: '01', t: 'Brief & cadrage', d: 'Audience, contenus, ambitions, offre premium. On définit ensemble la promesse de l\'app.', dur: 'Semaine 1' },
  { n: '02', t: 'Design sur-mesure', d: 'Maquettes hi-fi de votre app, sous votre marque, prêtes à valider avant développement.', dur: 'Semaine 1—2' },
  { n: '03', t: 'Build & intégration', d: 'Configuration de votre socle, import de vos contenus, branchement abonnements et notifications.', dur: 'Semaine 2' },
  { n: '04', t: 'Mise en ligne', d: 'Soumission App Store et Play Store, déploiement, formation de votre équipe.', dur: 'Semaine 2—3' },
];

const Process = () => (
  <section className="section" id="process">
    <div className="wrap">
      <div className="process__head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 16 }}><span className="dot">◉</span>Process</div>
          <h2 className="h-section serif">Du brief au store en <i>14 jours.</i></h2>
        </div>
        <p className="lede" style={{ maxWidth: 360 }}>
          Une équipe dédiée, un calendrier serré, aucune surprise. Vous validez chaque étape.
        </p>
      </div>
      <div className="process__grid">
        {STEPS.map((s) => (
          <div className="step" key={s.n}>
            <div className="step__n">— {s.n}</div>
            <h3 className="step__t serif">{s.t}</h3>
            <p className="step__d">{s.d}</p>
            <div className="step__dur">{s.dur}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FinalCTA = () => (
  <section className="section" id="cta">
    <div className="wrap">
      <div className="cta">
        <div className="eyebrow" style={{ color: 'color-mix(in oklab, var(--bg) 60%, transparent)', marginBottom: 24 }}>
          <span className="dot">◉</span>Prêt à lancer votre app ?
        </div>
        <h2 className="h-section serif">Discutons de votre <em>média propriétaire.</em></h2>
        <p className="lede cta__lede">
          30 minutes pour comprendre votre audience, votre contenu et vos ambitions.
          Vous repartez avec un plan, qu'on travaille ensemble ou non.
        </p>
        <div className="cta__row">
          <a href="#" className="btn btn--accent btn--big">Booker un appel découverte<span className="arr">→</span></a>
          <a href="#" className="btn btn--ghost btn--big">Recevoir le dossier PDF</a>
        </div>
        <div className="cta__sig">— MEDIUMSHIP · STUDIO D'APPS POUR MÉDIAS &amp; CRÉATEURS</div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="footer">
    <div className="wrap">
      <div className="footer__row">
        <div className="footer__col footer__brand">
          <div className="brand" style={{ fontSize: 24 }}>Mediumship<span className="brand__dot"></span></div>
          <p>Studio d'applications mobiles white-label pour médias indépendants, créateurs et podcasteurs.</p>
        </div>
        <div className="footer__col">
          <h4>Produit</h4>
          <a href="#preuve">Aperçu</a>
          <a href="#features">Fonctionnalités</a>
          <a href="#wl">White-label</a>
        </div>
        <div className="footer__col">
          <h4>Studio</h4>
          <a href="#">Approche</a>
          <a href="#">Réalisations</a>
          <a href="#">Journal</a>
        </div>
        <div className="footer__col">
          <h4>Contact</h4>
          <a href="mailto:studio@mediumship.app">studio@mediumship.app</a>
          <a href="#cta">Booker un appel</a>
        </div>
      </div>
      <div className="footer__bottom">
        <span>© 2026 Mediumship Studio · Paris</span>
        <span className="mono">v1.0 — démo white-label</span>
      </div>
    </div>
  </footer>
);

Object.assign(window, { Nav, Hero, Gallery, ProblemSolution, Features, WhiteLabel, Process, FinalCTA, Footer });
