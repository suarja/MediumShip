/* global React */
// components.jsx — Civica primitives: iPhone bezel, atoms, design system specimen

const Phone = ({ children, small = false, themeVars }) => (
  <div className={`iphone ${small ? 'iphone--sm' : ''}`} style={themeVars}>
    <div className="iphone__notch"></div>
    <div className="iphone__home"></div>
    <div className="iphone__screen">{children}</div>
  </div>
);

const StatusBar = ({ dark = false }) => (
  <div className={`sb ${dark ? 'sb--dark' : ''}`}>
    <span>9:41</span>
    <span className="sb__r">
      <svg width="14" height="9" viewBox="0 0 16 10" fill="none">
        <path d="M1 6.5a3 3 0 0 1 5 0M0 4a6 6 0 0 1 8 0M0 1.5a9 9 0 0 1 11 0" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
      <svg width="20" height="10" viewBox="0 0 22 11" fill="none">
        <rect x="1" y="1" width="17" height="9" rx="2" stroke="currentColor" />
        <rect x="3" y="3" width="13" height="5" rx="1" fill="currentColor" />
        <rect x="19" y="4" width="2" height="3" rx="1" fill="currentColor" />
      </svg>
    </span>
  </div>
);

const TopBar = ({ back, title, action, dark = false }) => (
  <div className="topbar">
    <span className="topbar__back">{back || '‹'}</span>
    {title && <span className="topbar__title">{title}</span>}
    <span className="topbar__act">{action || '⋯'}</span>
  </div>
);

const BrandHeader = ({ logo = "Civica", italicMark = true, av = true, action = '🔔' }) => (
  <div className="bhdr">
    <div className="bhdr__logo">
      {italicMark ? <i>{logo}</i> : logo}<span className="dot"></span>
    </div>
    <div className="bhdr__act">
      <span className="bhdr__ic">{action}</span>
      {av && <span className="bhdr__av"></span>}
    </div>
  </div>
);

const TAB_ITEMS = [
  { i: '◉', l: 'Une' },
  { i: '▷', l: 'Écouter' },
  { i: '☷', l: 'Agenda' },
  { i: '✦', l: 'Membres' },
  { i: '○', l: 'Profil' },
];

const TabBar = ({ active = 0, items = TAB_ITEMS, dark = false }) => (
  <div className={`tabbar ${dark ? 'tabbar--dark' : ''}`}>
    {items.map((tab, i) => (
      <div className={`tab ${i === active ? 'on' : ''}`} key={tab.l}>
        <span className="tab__i">{tab.i}</span>
        <span className="tab__l">{tab.l}</span>
      </div>
    ))}
  </div>
);

const Kicker = ({ children, accent = false, premium = false, live = false }) => (
  <span className={`kicker ${accent ? 'kicker--accent' : ''} ${premium ? 'kicker--premium' : ''} ${live ? 'kicker--live' : ''}`}>
    {children}
  </span>
);

const ContentRow = ({ kicker, title, meta, tint = '', premium = false }) => (
  <div className="row">
    <div className={`row__media ${tint}`}>{premium && <span className="badge-prem">★</span>}</div>
    <div className="row__meta">
      <span className="k">{kicker}</span>
      <h4 className="row__t">{title}</h4>
      <span className="row__d">{meta}</span>
    </div>
  </div>
);

Object.assign(window, {
  Phone, StatusBar, TopBar, BrandHeader, TabBar, Kicker, ContentRow, TAB_ITEMS,
});

/* ============================================================
   Design system specimen artboard
   ============================================================ */

const DesignSystemSpec = () => (
  <div className="ds">
    {/* Colors */}
    <div className="ds__block">
      <div className="ds__h">— Tokens · couleurs</div>
      <div className="ds__swatch-grid">
        <div className="ds__swatch" style={{ background: 'var(--brand-bg)', color: 'var(--brand-ink)' }}>
          <div></div>
          <div><div className="name">Background</div><div className="var">--brand-background</div></div>
        </div>
        <div className="ds__swatch dark" style={{ background: 'var(--brand-ink)' }}>
          <div></div>
          <div><div className="name">Ink</div><div className="var">--brand-text</div></div>
        </div>
        <div className="ds__swatch dark" style={{ background: 'var(--brand-accent)' }}>
          <div></div>
          <div><div className="name">Accent</div><div className="var">--brand-accent</div></div>
        </div>
        <div className="ds__swatch" style={{ background: 'var(--brand-premium)', color: 'var(--brand-ink)' }}>
          <div></div>
          <div><div className="name">Premium</div><div className="var">--brand-premium</div></div>
        </div>
        <div className="ds__swatch" style={{ background: 'var(--brand-surface)', color: 'var(--brand-ink)' }}>
          <div></div>
          <div><div className="name">Surface</div><div className="var">--brand-surface</div></div>
        </div>
        <div className="ds__swatch" style={{ background: 'var(--brand-muted)', color: 'var(--brand-ink)' }}>
          <div></div>
          <div><div className="name">Muted</div><div className="var">--brand-muted</div></div>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <div className="ds__h">— Radii</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <div style={{ width: 56, height: 56, background: 'var(--brand-bg)', border: '1px solid var(--brand-rule-2)', borderRadius: 14, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--brand-ink-soft)' }}>14</div>
          <div style={{ width: 56, height: 56, background: 'var(--brand-bg)', border: '1px solid var(--brand-rule-2)', borderRadius: 18, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--brand-ink-soft)' }}>18</div>
          <div style={{ width: 56, height: 56, background: 'var(--brand-bg)', border: '1px solid var(--brand-rule-2)', borderRadius: 999, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--brand-ink-soft)' }}>999</div>
        </div>
      </div>
    </div>

    {/* Typography */}
    <div className="ds__block">
      <div className="ds__h">— Typographies</div>
      <div className="ds__type-row">
        <span className="lbl">Display 28</span>
        <span className="val" style={{ fontSize: 28, lineHeight: 1, letterSpacing: '-.02em' }}>
          <i>Newsreader</i> · italic
        </span>
      </div>
      <div className="ds__type-row">
        <span className="lbl">Title 20</span>
        <span className="val" style={{ fontSize: 20, lineHeight: 1.05 }}>Newsreader 400</span>
      </div>
      <div className="ds__type-row">
        <span className="lbl">Heading 16</span>
        <span className="val" style={{ fontSize: 16, lineHeight: 1.1 }}>Newsreader 500</span>
      </div>
      <div className="ds__type-row">
        <span className="lbl">Body 13</span>
        <span className="val" style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--brand-ink-2)' }}>
          Corps de texte lisible — 13px, --font-body.
        </span>
      </div>
      <div className="ds__type-row">
        <span className="lbl">Caption 11</span>
        <span className="val" style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--brand-ink-soft)' }}>
          Caption secondaire · --font-body.
        </span>
      </div>
      <div className="ds__type-row">
        <span className="lbl">Mono 9</span>
        <span className="val" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.12em', color: 'var(--brand-accent)' }}>
          KICKER · LABEL · META
        </span>
      </div>

      <div style={{ marginTop: 22 }}>
        <div className="ds__h">— Pairing recommandé</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--brand-ink-soft)' }}>--font-heading</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18 }}>Display · italic</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--brand-ink-soft)', marginTop: 8 }}>--font-body</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14 }}>Corps de texte courant</div>
        </div>
      </div>
    </div>

    {/* Components */}
    <div className="ds__block">
      <div className="ds__h">— Composants</div>
      <div className="ds__components">
        <div className="ds__comp">
          <div className="lbl">Boutons</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="btn btn--primary">Continuer</span>
            <span className="btn btn--accent">Soutenir</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            <span className="btn btn--ghost">En savoir +</span>
            <span className="btn btn--premium">Devenir membre</span>
          </div>
        </div>
        <div className="ds__comp">
          <div className="lbl">Tabs · Chips</div>
          <div className="chips" style={{ marginBottom: 8 }}>
            <span className="chip on">Tous</span>
            <span className="chip">Articles</span>
            <span className="chip">Podcasts</span>
            <span className="chip">Vidéos</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Kicker accent>◉ Catégorie</Kicker>
            <Kicker premium>★ Premium</Kicker>
            <Kicker live>EN DIRECT</Kicker>
          </div>
        </div>
        <div className="ds__comp">
          <div className="lbl">Bottom navigation</div>
          <div style={{ background: 'var(--brand-bg)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--brand-rule)' }}>
            <div className="tabbar" style={{ padding: '8px 12px 10px' }}>
              {TAB_ITEMS.map((tab, i) => (
                <div className={`tab ${i === 0 ? 'on' : ''}`} key={tab.l}>
                  <span className="tab__i">{tab.i}</span>
                  <span className="tab__l">{tab.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="ds__comp">
          <div className="lbl">Card · Content row</div>
          <div style={{ background: 'var(--brand-bg)', borderRadius: 10, padding: '0 12px' }}>
            <ContentRow kicker="Analyse" title="Le grand entretien" meta="22 min · aujourd'hui" tint="alt" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { DesignSystemSpec });
