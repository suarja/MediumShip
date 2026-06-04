/* global React, PALETTES, TYPOS, MobilePhonePreview */
// preview.jsx — Public preview: phone showing live app + multiple screens

const { useState: useStateP } = React;

const SCREENS = [
  { id: 'home', n: '01', nm: 'Home / Feed', desc: 'L\u2019écran d\u2019accueil tel que vu par l\u2019utilisateur final.' },
  { id: 'article', n: '02', nm: 'Article detail', desc: 'Aperçu d\u2019un article publié, hero image et corps éditorial.' },
  { id: 'podcast', n: '03', nm: 'Episode detail', desc: 'Cover, durée, description, chapitres et lecture.' },
  { id: 'player', n: '04', nm: 'Audio player', desc: 'Lecteur immersif avec contrôles et file d\u2019attente.' },
  { id: 'paywall', n: '05', nm: 'Paywall premium', desc: 'Conversion abonné — plans et bénéfices.' },
];

function getTheme(tenant) {
  const p = PALETTES.find(x => x.id === tenant.palette) || PALETTES[0];
  const t = TYPOS.find(x => x.id === tenant.typo) || TYPOS[0];
  return { ...p.vars, ...t.vars };
}

function ArticleScreen({ tenant, items }) {
  const theme = getTheme(tenant);
  const article = items.find(i => i.type === 'article' && i.status === 'published') || items[0];
  return (
    <div className="phone phone--lg" style={theme}>
      <div className="phone__notch"></div>
      <div className="phone__home"></div>
      <div className="phone__screen">
        <div className="phone__sb"><span>9:41</span><span></span></div>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--m-bg)' }}>
          <div style={{ height: 180, background: 'linear-gradient(135deg, var(--m-accent), var(--m-ink))', position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg, transparent 0 6px, rgba(255,255,255,.06) 6px 7px)' }}></div>
            <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: 14 }}>
              <span>‹</span><span>⋯</span>
            </div>
          </div>
          <div style={{ padding: 20, color: 'var(--m-ink)', fontFamily: 'var(--m-body)' }}>
            <span style={{ fontFamily: 'var(--m-body)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--m-accent)' }}>◉ ANALYSE</span>
            <h2 style={{ fontFamily: 'var(--m-display)', fontStyle: 'var(--m-display-style)', fontWeight: 'var(--m-display-weight, 400)', fontSize: 22, lineHeight: 1.1, letterSpacing: '-.015em', margin: '10px 0 12px' }}>
              {article && article.title}
            </h2>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0 14px', borderBottom: '1px solid color-mix(in oklab, var(--m-ink) 10%, transparent)' }}>
              <span style={{ width: 28, height: 28, borderRadius: 999, background: 'linear-gradient(135deg, var(--m-accent), var(--m-ink))' }}></span>
              <div>
                <div style={{ fontFamily: 'var(--m-display)', fontSize: 13 }}>Élise Brun</div>
                <div style={{ fontFamily: 'var(--m-body)', fontSize: 10, letterSpacing: '.1em', color: 'color-mix(in oklab, var(--m-ink) 55%, transparent)', textTransform: 'uppercase' }}>18 MIN · MARS</div>
              </div>
            </div>
            <p style={{ fontFamily: 'var(--m-display)', fontStyle: 'italic', fontSize: 15.5, lineHeight: 1.5, color: 'color-mix(in oklab, var(--m-ink) 85%, transparent)', margin: '12px 0 8px' }}>
              {article && article.summary}
            </p>
            <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'color-mix(in oklab, var(--m-ink) 70%, transparent)', margin: 0 }}>
              {(article && article.body) ? article.body.slice(0, 200) + '…' : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PodcastScreen({ tenant, items }) {
  const theme = getTheme(tenant);
  const ep = items.find(i => i.type === 'episode' && i.status !== 'archived') || items.find(i => i.type === 'episode') || items[0];
  return (
    <div className="phone phone--lg" style={theme}>
      <div className="phone__notch"></div>
      <div className="phone__home"></div>
      <div className="phone__screen">
        <div className="phone__sb"><span>9:41</span><span></span></div>
        <div style={{ flex: 1, padding: '8px 22px 18px', background: 'var(--m-bg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'var(--m-ink)' }}>
            <span>‹</span>
            <span style={{ fontFamily: 'var(--m-display)', fontSize: 14 }}>Podcast</span>
            <span>⋯</span>
          </div>
          <div style={{ width: '100%', aspectRatio: 1, borderRadius: 14, background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,.18), transparent 50%), linear-gradient(135deg, var(--m-accent), var(--m-ink))', position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', top: 14, left: 14, fontFamily: 'var(--m-body)', fontSize: 10, letterSpacing: '.12em', color: 'rgba(255,255,255,.7)', textTransform: 'uppercase' }}>
              {ep && (ep.seasonEp || 'S03 · E14')} · {ep && (ep.durationOverride || '54 MIN')}
            </span>
            <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, fontFamily: 'var(--m-display)', fontStyle: 'italic', fontSize: 22, lineHeight: 1.05, color: '#fff' }}>
              {ep && ep.title}
            </div>
          </div>
          <div>
            <span style={{ fontFamily: 'var(--m-body)', fontSize: 10, letterSpacing: '.12em', color: 'var(--m-accent)', textTransform: 'uppercase' }}>{tenant.brandName.toUpperCase()} · LE GRAND ENTRETIEN</span>
            <h3 style={{ fontFamily: 'var(--m-display)', fontWeight: 'var(--m-display-weight)', fontSize: 18, lineHeight: 1.15, color: 'var(--m-ink)', margin: '4px 0' }}>
              {ep && ep.title}
            </h3>
          </div>
          <p style={{ fontSize: 12, color: 'color-mix(in oklab, var(--m-ink) 60%, transparent)', lineHeight: 1.5, margin: 0 }}>
            {ep && ep.summary}
          </p>
          <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
            <span style={{ flex: 1, height: 44, borderRadius: 999, background: 'var(--m-ink)', color: 'var(--m-bg)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 13 }}>▶ Écouter</span>
            <span style={{ width: 44, height: 44, borderRadius: 999, border: '1px solid color-mix(in oklab, var(--m-ink) 14%, transparent)', display: 'grid', placeItems: 'center', color: 'var(--m-ink)' }}>♡</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerScreen({ tenant, items }) {
  const theme = getTheme(tenant);
  const ep = items.find(i => i.type === 'episode') || items[0];
  return (
    <div className="phone phone--lg" style={{ ...theme, '--m-bg': '#161412' }}>
      <div className="phone__notch"></div>
      <div className="phone__home"></div>
      <div className="phone__screen">
        <div className="phone__sb" style={{ color: '#F3EFE6' }}><span>9:41</span><span></span></div>
        <div style={{ flex: 1, padding: '8px 28px 24px', background: '#161412', color: '#F3EFE6', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 18px', fontFamily: 'var(--m-body)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(243,239,230,.5)' }}>
            <span>↓ LECTURE</span>
            <span>⋯</span>
          </div>
          <div style={{ width: '100%', aspectRatio: 1, borderRadius: 16, background: 'radial-gradient(circle at 70% 30%, rgba(255,220,180,.35), transparent 50%), linear-gradient(135deg, var(--m-accent), #6B2417)', position: 'relative', overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ position: 'absolute', left: 18, bottom: 18, right: 18, fontFamily: 'var(--m-display)', fontStyle: 'italic', fontSize: 22, lineHeight: 1.05, color: '#fff' }}>
              {ep && ep.title}
            </div>
          </div>
          <span style={{ fontFamily: 'var(--m-body)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(243,239,230,.55)', marginBottom: 4 }}>{(ep && ep.seasonEp) || 'SAISON · ÉPISODE'}</span>
          <h3 style={{ fontFamily: 'var(--m-display)', fontWeight: 'var(--m-display-weight)', fontSize: 22, lineHeight: 1.1, margin: 0, color: '#F3EFE6' }}>
            {ep && ep.title}
          </h3>
          <p style={{ fontSize: 12.5, color: 'rgba(243,239,230,.55)', margin: '4px 0 18px' }}>{tenant.brandName} · Le grand entretien</p>
          <div style={{ height: 3, background: 'rgba(255,255,255,.12)', borderRadius: 999, position: 'relative', marginBottom: 6 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '42%', background: 'var(--m-accent)', borderRadius: 999 }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--m-body)', fontSize: 10, color: 'rgba(243,239,230,.45)', letterSpacing: '.04em', marginBottom: 18 }}>
            <span>22:48</span><span>−31:12</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <span style={{ color: 'rgba(243,239,230,.7)', fontSize: 14 }}>15</span>
            <span style={{ color: 'rgba(243,239,230,.7)', fontSize: 14 }}>⏮</span>
            <span style={{ width: 56, height: 56, borderRadius: 999, background: '#F3EFE6', color: '#161412', display: 'grid', placeItems: 'center', fontSize: 20 }}>▶</span>
            <span style={{ color: 'rgba(243,239,230,.7)', fontSize: 14 }}>⏭</span>
            <span style={{ color: 'rgba(243,239,230,.7)', fontSize: 14 }}>30</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaywallScreen({ tenant }) {
  const theme = getTheme(tenant);
  return (
    <div className="phone phone--lg" style={theme}>
      <div className="phone__notch"></div>
      <div className="phone__home"></div>
      <div className="phone__screen">
        <div className="phone__sb"><span>9:41</span><span></span></div>
        <div style={{ flex: 1, padding: '8px 26px 24px', background: 'linear-gradient(180deg, var(--m-bg), color-mix(in oklab, var(--m-bg) 90%, var(--m-accent) 10%))', color: 'var(--m-ink)' }}>
          <div style={{ padding: '10px 0 18px', fontFamily: 'var(--m-body)', fontSize: 11, color: 'color-mix(in oklab, var(--m-ink) 50%, transparent)' }}>✕ Fermer</div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--m-ink)', color: 'var(--m-bg)', display: 'grid', placeItems: 'center', fontFamily: 'var(--m-display)', fontStyle: 'italic', fontSize: 22, marginBottom: 18 }}>
            {tenant.brandName[0].toUpperCase()}
          </div>
          <span style={{ fontFamily: 'var(--m-body)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--m-accent)', marginBottom: 10, display: 'inline-block' }}>◉ Accès {tenant.brandName} Premium</span>
          <h3 style={{ fontFamily: 'var(--m-display)', fontWeight: 'var(--m-display-weight)', fontSize: 30, lineHeight: 1.02, letterSpacing: '-.018em', margin: '4px 0 8px' }}>
            Soutenez. <span style={{ fontStyle: 'italic' }}>Recevez plus.</span>
          </h3>
          <p style={{ fontSize: 13, color: 'color-mix(in oklab, var(--m-ink) 60%, transparent)', margin: '0 0 22px' }}>
            Tous les épisodes, les éditions longues, et la communauté.
          </p>
          {[
            { nm: 'Mensuel', pr: '7€', sub: '/mois' },
            { nm: 'Annuel', pr: '59€', sub: '/an · −30%', on: true, badge: 'LE CHOIX' },
          ].map(p => (
            <div key={p.nm} style={{
              background: p.on ? '#FFFCF4' : 'var(--m-bg)',
              border: `1.5px solid ${p.on ? 'var(--m-ink)' : 'color-mix(in oklab, var(--m-ink) 14%, transparent)'}`,
              borderRadius: 14, padding: '12px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 10, position: 'relative',
            }}>
              {p.badge && <span style={{ position: 'absolute', top: -8, right: 12, background: 'var(--m-accent)', color: '#fff', fontFamily: 'var(--m-body)', fontSize: 9, letterSpacing: '.12em', padding: '3px 7px', borderRadius: 4, textTransform: 'uppercase', fontWeight: 600 }}>{p.badge}</span>}
              <span style={{ fontFamily: 'var(--m-display)', fontSize: 17 }}>{p.nm}</span>
              <span style={{ fontFamily: 'var(--m-display)', fontSize: 17 }}>{p.pr}<span style={{ fontFamily: 'var(--m-body)', fontSize: 10, color: 'color-mix(in oklab, var(--m-ink) 50%, transparent)' }}>{p.sub}</span></span>
            </div>
          ))}
          <div style={{ marginTop: 16, fontSize: 12, color: 'color-mix(in oklab, var(--m-ink) 60%, transparent)', lineHeight: 1.6 }}>
            <div>✓ Tous les épisodes en avant-première</div>
            <div>✓ Éditions longues + archives complètes</div>
            <div>✓ Salon membres privé</div>
          </div>
          <div style={{ marginTop: 18, background: 'var(--m-ink)', color: 'var(--m-bg)', borderRadius: 999, height: 48, display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 500 }}>
            Continuer · 59€ / an
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ tenant, items }) {
  return <MobilePhonePreview tenant={tenant} items={items} large />;
}

const SCREEN_COMPONENTS = {
  home: HomeScreen,
  article: ArticleScreen,
  podcast: PodcastScreen,
  player: PlayerScreen,
  paywall: PaywallScreen,
};

function PreviewPage({ tenant, items }) {
  const [active, setActive] = useStateP('home');
  const screen = SCREENS.find(s => s.id === active);
  const Comp = SCREEN_COMPONENTS[active];

  return (
    <div className="page">
      <div className="preview-page">
        <aside className="preview-rail">
          <div className="preview-rail__h">— Écrans</div>
          <h3 className="preview-rail__t">5 écrans <i>clés.</i></h3>
          <div className="screen-list">
            {SCREENS.map(s => (
              <button key={s.id} className={active === s.id ? 'on' : ''} onClick={() => setActive(s.id)}>
                <span>{s.nm}</span>
                <span className="n">{s.n}</span>
              </button>
            ))}
          </div>
          <hr className="divider" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
            <div><strong style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>{tenant.brandName}</strong> · {tenant.brandSlug}</div>
            <div>Palette : <strong style={{ color: 'var(--ink)' }}>{tenant.palette}</strong></div>
            <div>Typo : <strong style={{ color: 'var(--ink)' }}>{tenant.typo}</strong></div>
            <div>{items.filter(i => i.status === 'published').length} contenus publiés sur {items.length}</div>
          </div>
          <hr className="divider" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn--ghost btn--block">Ouvrir en nouvel onglet</button>
            <button className="btn btn--primary btn--block">Envoyer un lien</button>
          </div>
        </aside>

        <section className="preview-stage">
          <div className="preview-stage__h">
            <div>
              <span className="lbl">— Écran {screen.n}</span>
              <h2 className="nm">{screen.nm}<i>.</i></h2>
            </div>
            <span className="pill pill--accent">{tenant.palette.toUpperCase()} · {tenant.typo.toUpperCase()}</span>
          </div>
          <Comp tenant={tenant} items={items} />
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)', textAlign: 'center', maxWidth: '50ch', lineHeight: 1.5 }}>
            {screen.desc}
          </p>
        </section>
      </div>
    </div>
  );
}

Object.assign(window, { PreviewPage });
