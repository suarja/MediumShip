/* global React */
// screens.jsx — three iPhone screens for Mediumship demo
// Exports: Phone (bezel wrapper) + HomeFeed, PodcastPlayer, Paywall

const Phone = ({ children, large = false, label }) => (
  <div className={`phone ${large ? 'phone--lg' : ''}`} aria-label={label || 'iPhone mockup'}>
    <div className="phone__notch"></div>
    <div className="phone__home"></div>
    <div className="phone__screen">
      {children}
    </div>
  </div>
);

const StatusBar = ({ dark }) => (
  <div className="phone__statusbar" style={dark ? { color: '#F3EFE6' } : {}}>
    <span>9:41</span>
    <span className="phone__sb-r">
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><path d="M1 6.5a3 3 0 0 1 5 0M0 4a6 6 0 0 1 8 0M0 1.5a9 9 0 0 1 11 0" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
      <svg width="22" height="11" viewBox="0 0 22 11" fill="none"><rect x="1" y="1" width="17" height="9" rx="2" stroke="currentColor"/><rect x="3" y="3" width="13" height="5" rx="1" fill="currentColor"/><rect x="19" y="4" width="2" height="3" rx="1" fill="currentColor"/></svg>
    </span>
  </div>
);

/* ---------- Screen 1 — Home feed ---------- */
const HomeFeed = ({ large = false }) => (
  <Phone large={large} label="Home feed">
    <StatusBar />
    <div className="app-content">
      <div className="feed">
        <div className="feed__hdr">
          <div className="logo">Mediumship<span className="d">.</span></div>
          <div className="av"></div>
        </div>
        <div className="feed__tabs">
          <span className="on">À la une</span>
          <span>Écouter</span>
          <span>Lire</span>
          <span>Premium</span>
        </div>
        <div className="feed__hero">
          <div className="label">◉ Épisode du jour</div>
          <div className="t">La fin de l'économie d'attention.</div>
          <div className="m">
            <span className="play">▶</span>
            <span>42 MIN · S04E11</span>
          </div>
        </div>
        <div className="feed__list">
          <div className="feed__item">
            <div className="ph"></div>
            <div className="meta">
              <span className="cat">Long format</span>
              <span className="t">Bâtir une audience qui paie</span>
              <span className="d">18 min de lecture</span>
            </div>
          </div>
          <div className="feed__item alt">
            <div className="ph"></div>
            <div className="meta">
              <span className="cat">Podcast · S04</span>
              <span className="t">Les nouveaux médias propriétaires</span>
              <span className="d">52 min · Hier</span>
            </div>
          </div>
          <div className="feed__item alt2">
            <div className="ph"></div>
            <div className="meta">
              <span className="cat">Vidéo · Premium</span>
              <span className="t">Masterclass : la fidélisation</span>
              <span className="d">1 h 04 · Réservé membres</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Phone>
);

/* ---------- Screen 2 — Podcast player ---------- */
const PodcastPlayer = ({ large = false }) => (
  <Phone large={large} label="Podcast player">
    <StatusBar dark />
    <div className="app-content" style={{ background: '#161412' }}>
      <div className="player">
        <div className="player__top">
          <span>↓ Lecture en cours</span>
          <span>•••</span>
        </div>
        <div className="player__art">
          <div className="ep">La fin de l'économie d'attention.</div>
        </div>
        <div className="player__ep-label">SAISON 04 · ÉPISODE 11</div>
        <h3 className="player__title">La fin de l'économie d'attention.</h3>
        <p className="player__show">Mediumship · Le grand entretien</p>
        <div className="player__bar"></div>
        <div className="player__time"><span>16:04</span><span>−25:38</span></div>
        <div className="player__ctrls">
          <span className="b">15</span>
          <span className="b">⏮</span>
          <span className="play">▶</span>
          <span className="b">⏭</span>
          <span className="b">30</span>
        </div>
        <div className="player__extras">
          <span>♡ Aimer</span>
          <span>↗ Partager</span>
          <span>✎ Notes</span>
        </div>
      </div>
    </div>
  </Phone>
);

/* ---------- Screen 3 — Paywall ---------- */
const Paywall = ({ large = false }) => (
  <Phone large={large} label="Paywall premium">
    <StatusBar />
    <div className="app-content">
      <div className="pw">
        <div className="pw__close">✕ Fermer</div>
        <div className="pw__crest">M</div>
        <div className="pw__eyebrow">◉ Accès Mediumship Premium</div>
        <h3 className="pw__title">Soutenez le travail. <i>Recevez plus.</i></h3>
        <p className="pw__sub">Les coulisses, les éditions longues, et la communauté.</p>

        <div className="pw__plans">
          <div className="pw__plan">
            <div className="nm">Mensuel</div>
            <div className="pr">7€<small> /mois</small></div>
          </div>
          <div className="pw__plan on">
            <div className="bd">Le choix</div>
            <div className="nm">Annuel</div>
            <div className="pr">59€<small> /an · −30%</small></div>
          </div>
        </div>

        <div className="pw__benefits">
          <div className="b"><span className="c">✓</span><span>Tous les épisodes en avant-première</span></div>
          <div className="b"><span className="c">✓</span><span>Éditions longues + archives complètes</span></div>
          <div className="b"><span className="c">✓</span><span>Salon membres privé</span></div>
        </div>

        <div className="pw__cta">Continuer · 59€ / an</div>
        <div className="pw__fine">Renouvellement automatique · Annulez à tout moment.</div>
      </div>
    </div>
  </Phone>
);

Object.assign(window, { Phone, StatusBar, HomeFeed, PodcastPlayer, Paywall });
