/* global React, ReactDOM, NavCtx,
   HomeRoot, ExploreRoot, LibraryRoot, ProfileRoot,
   ArticleView, PodcastView, PlayerView, VideoView, CategoryView,
   CollectionsView, ListsView, AgendaView, CommunityView, NotificationsView,
   PaywallSheet */

// proto-app.jsx — interactive prototype shell: nav state machine, theming, demo panel.

const { useState, useEffect, useRef, useCallback } = React;

/* ---------- Brand presets (white-label) ---------- */
const BRANDS = {
  mediumship: {
    name: 'Mediumship', kind: 'Média premium', logoBg: '#B14424',
    vars: {
      '--brand-bg': '#EFECE5', '--brand-surface': '#FFFFFF', '--brand-surface-2': '#FAF7EE',
      '--brand-ink': '#14110E', '--brand-ink-2': '#46413A', '--brand-ink-soft': '#7A746A', '--brand-muted': '#B7B1A4',
      '--brand-rule': 'rgba(20,17,14,.08)', '--brand-rule-2': 'rgba(20,17,14,.14)',
      '--brand-accent': '#B14424', '--brand-accent-soft': 'rgba(177,68,36,.12)', '--brand-premium': '#C8964A',
      '--font-display': '"Newsreader", Georgia, serif', '--font-body': '"Hanken Grotesk", system-ui, sans-serif', '--font-mono': '"JetBrains Mono", monospace',
    },
    swatch: ['#14110E', '#B14424', '#EFECE5'],
  },
  pivot: {
    name: 'Pivot', kind: 'Média citoyen', logoBg: '#B14424',
    vars: {
      '--brand-bg': '#F2EEE3', '--brand-surface': '#FFFFFF', '--brand-surface-2': '#FAF7EE',
      '--brand-ink': '#1A1310', '--brand-ink-2': '#46413A', '--brand-ink-soft': '#7A746A', '--brand-muted': '#B7B1A4',
      '--brand-rule': 'rgba(26,19,16,.08)', '--brand-rule-2': 'rgba(26,19,16,.14)',
      '--brand-accent': '#B14424', '--brand-accent-soft': 'rgba(177,68,36,.12)', '--brand-premium': '#C8964A',
      '--font-display': '"Newsreader", Georgia, serif', '--font-body': '"Hanken Grotesk", system-ui, sans-serif', '--font-mono': '"JetBrains Mono", monospace',
    },
    swatch: ['#1A1310', '#B14424', '#C8964A'],
  },
  studio: {
    name: 'Studio', kind: 'YouTube · édu', logoBg: '#2F4FD9',
    vars: {
      '--brand-bg': '#F6F5F1', '--brand-surface': '#FFFFFF', '--brand-surface-2': '#F1F0EC',
      '--brand-ink': '#0E0F12', '--brand-ink-2': '#2E3138', '--brand-ink-soft': '#6A6E78', '--brand-muted': '#B5B7BD',
      '--brand-rule': 'rgba(14,15,18,.08)', '--brand-rule-2': 'rgba(14,15,18,.14)',
      '--brand-accent': '#2F4FD9', '--brand-accent-soft': 'rgba(47,79,217,.12)', '--brand-premium': '#16A36A',
      '--font-display': '"Geist", system-ui, sans-serif', '--font-body': '"Geist", system-ui, sans-serif', '--font-mono': '"JetBrains Mono", monospace',
    },
    swatch: ['#0E0F12', '#2F4FD9', '#16A36A'],
  },
  mineur: {
    name: 'Mineur', kind: 'Podcast culture', logoBg: '#6F2618',
    vars: {
      '--brand-bg': '#EFE9D7', '--brand-surface': '#FFFCF2', '--brand-surface-2': '#F4EFDF',
      '--brand-ink': '#1E1610', '--brand-ink-2': '#3F352D', '--brand-ink-soft': '#7F7466', '--brand-muted': '#B7AE9A',
      '--brand-rule': 'rgba(30,22,16,.08)', '--brand-rule-2': 'rgba(30,22,16,.14)',
      '--brand-accent': '#6F2618', '--brand-accent-soft': 'rgba(111,38,24,.12)', '--brand-premium': '#C7965A',
      '--font-display': '"Instrument Serif", Georgia, serif', '--font-body': '"Manrope", system-ui, sans-serif', '--font-mono': '"JetBrains Mono", monospace',
    },
    swatch: ['#1E1610', '#6F2618', '#C7965A'],
  },
};

const TABS = [
  { id: 'home', i: '◉', l: 'Accueil' },
  { id: 'explore', i: '⌕', l: 'Explorer' },
  { id: 'library', i: '▤', l: 'Biblio' },
  { id: 'profile', i: '○', l: 'Profil' },
];

const MEDIA_ROOTS = { home: HomeRoot, explore: ExploreRoot, library: LibraryRoot, profile: ProfileRoot };
const MEDIA_VIEWS = {
  article: ArticleView, podcast: PodcastView, player: PlayerView, video: VideoView,
  category: CategoryView, collections: CollectionsView, lists: ListsView,
  agenda: AgendaView, community: CommunityView, notifications: NotificationsView,
};
const DARK_VIEWS = new Set(['player']);

/* ---------- Boussole vertical (documentary) ---------- */
const BP = (typeof window !== 'undefined' && window.BOUSSOLE_PROTO) || { roots: {}, views: {}, vars: {} };
const BOUSSOLE_BRAND = {
  name: 'Boussole', kind: 'Citoyenne · 2027', logoBg: '#20457A',
  vars: BP.vars,
  swatch: ['#16130E', '#20457A', '#F4F1E8'],
};
// Player view falls back to the media player (it's brand-vars themed).
const BOUSSOLE_ROOTS = BP.roots;
const BOUSSOLE_VIEWS = { ...BP.views, player: PlayerView };

/* ---------- Fit-to-height ---------- */
function useFit(ref) {
  useEffect(() => {
    const fit = () => {
      if (!ref.current) return;
      const margin = 80;
      const avail = window.innerHeight - margin;
      const h = 784; // phone height + padding
      const scale = Math.min(1, Math.max(0.55, avail / h));
      ref.current.style.setProperty('--proto-scale', scale.toFixed(3));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [ref]);
}

function App() {
  const [vertical, setVerticalState] = useState('media'); // 'media' | 'boussole'
  const [brandKey, setBrandKey] = useState('mediumship');
  const [member, setMember] = useState('guest'); // guest | member | premium
  const [tab, setTab] = useState('home');
  const [stack, setStack] = useState([]); // [{key, item}]
  const [sheet, setSheet] = useState(null); // {key, payload}
  const [toast, setToastState] = useState(null);
  const [nowPlaying, setNowPlaying] = useState(null);
  const viewRef = useRef(null);
  const fitRef = useRef(null);
  useFit(fitRef);

  const isBoussole = vertical === 'boussole';
  const brand = isBoussole ? BOUSSOLE_BRAND : BRANDS[brandKey];
  const ROOTS = isBoussole ? BOUSSOLE_ROOTS : MEDIA_ROOTS;
  const VIEWS = isBoussole ? BOUSSOLE_VIEWS : MEDIA_VIEWS;

  // Scroll to top whenever the view changes
  useEffect(() => { if (viewRef.current) viewRef.current.scrollTop = 0; }, [tab, stack.length, brandKey, vertical]);

  const setVertical = (v) => {
    setVerticalState(v);
    setStack([]); setSheet(null); setTab('home'); setNowPlaying(null);
  };

  const toastTimer = useRef(null);
  const showToast = useCallback((msg) => {
    setToastState(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastState(null), 1800);
  }, []);

  const nav = {
    brand, member,
    setMember: (m) => { setMember(m); },
    go: (t) => { setStack([]); setSheet(null); setTab(t); },
    push: (key, item) => setStack((s) => [...s, { key, item }]),
    pop: () => setStack((s) => s.slice(0, -1)),
    openSheet: (key, payload) => setSheet({ key, payload }),
    closeSheet: () => setSheet(null),
    toast: showToast,
    openContent: (item) => {
      if (item.premium && member !== 'premium') { setSheet({ key: 'paywall', payload: { reason: 'content', item } }); return; }
      const k = item.kind === 'podcast' ? 'podcast' : item.kind === 'video' ? 'video' : 'article';
      setStack((s) => [...s, { key: k, item }]);
    },
    playEpisode: (item) => { setNowPlaying(item); setStack((s) => [...s, { key: 'player', item }]); },
    requirePremium: (feature, onOk) => {
      if (member === 'premium') { onOk && onOk(); } else { setSheet({ key: 'paywall', payload: { reason: feature } }); }
    },
  };

  const isRoot = stack.length === 0;
  const top = stack[stack.length - 1];
  const ActiveComp = isRoot ? ROOTS[tab] : VIEWS[top.key];
  const dark = !isRoot && DARK_VIEWS.has(top.key);
  const animKey = isRoot ? `root-${tab}` : `view-${stack.length}-${top.key}`;

  return (
    <NavCtx.Provider value={nav}>
      <div className="proto-stage">
        <div className="proto-fit" ref={fitRef}>
          <div className="proto-phone">
            <div className="proto-notch"></div>
            <div className="proto-home"></div>
            <div className={`proto-screen ${dark ? 'dark' : ''}`} style={brand.vars}>
              <div className="proto-sb">
                <span>9:41</span>
                <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><path d="M1 6.5a3 3 0 0 1 5 0M0 4a6 6 0 0 1 8 0M0 1.5a9 9 0 0 1 11 0" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
                  <svg width="22" height="11" viewBox="0 0 22 11" fill="none"><rect x="1" y="1" width="17" height="9" rx="2" stroke="currentColor" /><rect x="3" y="3" width="13" height="5" rx="1" fill="currentColor" /><rect x="19" y="4" width="2" height="3" rx="1" fill="currentColor" /></svg>
                </span>
              </div>

              <div className="proto-view" ref={viewRef}>
                <div key={animKey} className={isRoot ? 'proto-anim-fade' : 'proto-anim-push'}>
                  <ActiveComp item={top && top.item} />
                </div>
              </div>

              {/* Mini player + tab bar only on root screens */}
              {isRoot && (
                <>
                  {nowPlaying && (
                    <div className="miniplayer tap" onClick={() => nav.push('player', nowPlaying)}>
                      <span className="cov"></span>
                      <div style={{ minWidth: 0 }}>
                        <div className="t">{nowPlaying.title}</div>
                        <div className="s">{brand.name} · en lecture</div>
                      </div>
                      <span className="pp">▶</span>
                    </div>
                  )}
                  <div className="tabbar">
                    {TABS.map((t) => (
                      <div key={t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => nav.go(t.id)}>
                        <span className="tab__i">{t.i}</span>
                        <span className="tab__l">{t.l}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Sheets */}
              {sheet && sheet.key === 'paywall' && <PaywallSheet payload={sheet.payload} />}

              {/* Toast */}
              {toast && <div className="proto-toast">{toast}</div>}
            </div>
          </div>
        </div>

        {/* ---------- Demo panel ---------- */}
        <aside className="demo">
          <div className="demo__brandline">
            <span className="demo__logo" style={{ background: brand.logoBg }}>{brand.name[0]}</span>
            <div>
              <div className="demo__title">Démo client</div>
              <div className="demo__sub">Prototype · {brand.name}</div>
            </div>
          </div>

          <div className="demo__sec">
            <div className="demo__h">— Verticale</div>
            <div className="demo-seg">
              <button className={!isBoussole ? 'on' : ''} onClick={() => setVertical('media')}>Média</button>
              <button className={isBoussole ? 'on member' : ''} onClick={() => setVertical('boussole')}>Boussole 2027</button>
            </div>
            <p className="demo__note">
              {!isBoussole && <>App média générique : home feed éditorial, podcasts, vidéos, paywall. <b>Reskinnable</b> par marque.</>}
              {isBoussole && <>Variante <b>documentaire citoyenne</b> : dossiers, propositions, candidats, sources. Même socle, même CMS.</>}
            </p>
          </div>

          {!isBoussole && (
            <div className="demo__sec">
              <div className="demo__h">— Marque (white-label)</div>
              <div className="demo__brands">
                {Object.entries(BRANDS).map(([key, b]) => (
                  <button key={key} className={`demo-brand ${brandKey === key ? 'on' : ''}`} onClick={() => setBrandKey(key)}>
                    <div className="demo-brand__top">
                      <span className="demo-brand__mark" style={{ background: b.logoBg, fontFamily: b.vars['--font-display'] }}>{b.name[0]}</span>
                      <span className="demo-brand__nm" style={{ fontFamily: b.vars['--font-display'] }}>{b.name}</span>
                    </div>
                    <div className="demo-brand__sw">{b.swatch.map((c, i) => <span key={i} style={{ background: c }}></span>)}</div>
                    <span className="demo-brand__kind">{b.kind}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isBoussole && (
            <div className="demo__sec">
              <div className="demo__h">— Identité</div>
              <div className="demo-brand on" style={{ width: '100%', textAlign: 'left' }}>
                <div className="demo-brand__top">
                  <span className="demo-brand__mark" style={{ background: BOUSSOLE_BRAND.logoBg, fontFamily: BOUSSOLE_BRAND.vars['--font-display'] }}>B</span>
                  <span className="demo-brand__nm" style={{ fontFamily: BOUSSOLE_BRAND.vars['--font-display'] }}>{BOUSSOLE_BRAND.name}</span>
                </div>
                <div className="demo-brand__sw">{BOUSSOLE_BRAND.swatch.map((c, i) => <span key={i} style={{ background: c }}></span>)}</div>
                <span className="demo-brand__kind">{BOUSSOLE_BRAND.kind}</span>
              </div>
            </div>
          )}

          <div className="demo__sec">
            <div className="demo__h">— État utilisateur</div>
            <div className="demo-seg">
              <button className={member === 'guest' ? 'on' : ''} onClick={() => setMember('guest')}>Invité</button>
              <button className={member === 'member' ? 'on member' : ''} onClick={() => setMember('member')}>Membre</button>
              <button className={member === 'premium' ? 'on premium' : ''} onClick={() => setMember('premium')}>Premium</button>
            </div>
            <p className="demo__note">
              {member === 'guest' && <>Mode <b>invité</b> : lecture publique, pas de bibliothèque. Le login se déclenche juste-à-temps.</>}
              {member === 'member' && <>Mode <b>membre</b> : enregistrements + progression sync. Offline et listes restent Premium.</>}
              {member === 'premium' && <>Mode <b>Premium</b> : tout est débloqué — offline, listes illimitées, salon membres.</>}
            </p>
          </div>

          <div className="demo__sec">
            <div className="demo__h">— Scénarios rapides</div>
            <div className="demo__chips">
              {!isBoussole && <>
                <button className="demo-chip" onClick={() => { nav.go('home'); }}>Accueil</button>
                <button className="demo-chip" onClick={() => { setMember('guest'); nav.go('library'); }}>Gate invité</button>
                <button className="demo-chip" onClick={() => { setMember('member'); setStack([{ key: 'player', item: { title: 'L\u2019économie du soin' } }]); setNowPlaying({ title: 'L\u2019économie du soin' }); }}>Player</button>
                <button className="demo-chip" onClick={() => { nav.go('home'); setSheet({ key: 'paywall', payload: { reason: 'offline' } }); }}>Paywall</button>
                <button className="demo-chip" onClick={() => { setMember('premium'); nav.go('profile'); }}>Profil premium</button>
              </>}
              {isBoussole && <>
                <button className="demo-chip" onClick={() => { nav.go('home'); }}>Comprendre 2027</button>
                <button className="demo-chip" onClick={() => { setStack([{ key: 'dossier', item: { title: 'Présidentielle 2027' } }]); }}>Dossier</button>
                <button className="demo-chip" onClick={() => { setStack([{ key: 'insight', item: { title: 'Taxer les hauts patrimoines ?' } }]); }}>Proposition</button>
                <button className="demo-chip" onClick={() => { setStack([{ key: 'entity', item: { title: 'Candidat·e A' } }]); }}>Fiche candidat</button>
                <button className="demo-chip" onClick={() => { setStack([{ key: 'compare', item: {} }]); }}>Comparer</button>
                <button className="demo-chip" onClick={() => { setStack([{ key: 'sources', item: {} }]); }}>Sources</button>
              </>}
            </div>
          </div>

          <div className="demo__foot">
            <button className="btn2" onClick={() => { setVerticalState('media'); setBrandKey('mediumship'); setMember('guest'); setTab('home'); setStack([]); setSheet(null); setNowPlaying(null); }}>Réinitialiser</button>
          </div>
          <div className="demo__hint">Cliquez dans l'app · onglets, contenus, premium</div>
        </aside>
      </div>
    </NavCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
