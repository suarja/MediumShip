/* global React */
// proto-screens.jsx — content-only, navigable screens for the demo prototype.
// Each screen lives inside .proto-view; the shell adds status bar + tab bar + sheets.

const NavCtx = React.createContext(null);
const useNav = () => React.useContext(NavCtx);

/* ---------- atoms ---------- */
const K = ({ children, accent, premium, live }) => (
  <span className={`kicker ${accent ? 'kicker--accent' : ''} ${premium ? 'kicker--premium' : ''} ${live ? 'kicker--live' : ''}`}>{children}</span>
);

// Tappable content row; opens content (handles premium gating in shell)
const Row = ({ item, tint }) => {
  const nav = useNav();
  const locked = item.premium && nav.member !== 'premium';
  return (
    <div className="row tap" onClick={() => nav.openContent(item)}>
      <div className={`row__media ${tint || ''}`}>
        {item.premium && <span className="badge-prem">★</span>}
      </div>
      <div className="row__meta">
        <span className="k">{item.kicker}</span>
        <h4 className="row__t">{item.title}</h4>
        <span className="row__d">{item.meta}{locked ? ' · ★ Premium' : ''}</span>
      </div>
    </div>
  );
};

/* ---------- content data ---------- */
const C = {
  soin:    { id: 'soin', kind: 'article', kicker: "Analyse · Aujourd'hui", title: "L'économie du soin — nouvelle priorité", meta: '18 min de lecture', premium: true },
  pouvoir: { id: 'pouvoir', kind: 'article', kicker: 'Enquête · 12 mars', title: "Pouvoir d'achat : ce que les chiffres ne disent pas", meta: '18 min', premium: false },
  bardin:  { id: 'bardin', kind: 'podcast', kicker: 'Podcast · S03 · E14', title: 'Avec Léa Bardin, économiste', meta: '54 min', premium: true },
  demo:    { id: 'demo', kind: 'podcast', kicker: 'Podcast · S03 · E12', title: 'Le travail invisible', meta: '47 min', premium: false },
  debat:   { id: 'debat', kind: 'video', kicker: 'Vidéo · Débat', title: 'Démocratie locale, où en sommes-nous ?', meta: '1 h 04', premium: true },
  indic:   { id: 'indic', kind: 'article', kicker: 'Analyse · 08 mars', title: 'Repenser nos indicateurs économiques', meta: '14 min', premium: true },
};

/* ============================================================
   ROOT — Accueil / Home feed
   ============================================================ */
const HomeRoot = () => {
  const nav = useNav();
  return (
    <>
      <div className="bhdr">
        <div className="bhdr__logo"><i>{nav.brand.name}</i><span className="dot"></span></div>
        <div className="bhdr__act">
          <span className="bhdr__ic tap" onClick={() => nav.push('notifications')}>🔔</span>
          <span className="bhdr__av tap" onClick={() => nav.go('profile')}></span>
        </div>
      </div>
      <div className="proto-pad">
        <div className="chips" style={{ marginBottom: 14 }}>
          <span className="chip on">Tout</span>
          <span className="chip tap" onClick={() => nav.push('category')}>Analyses</span>
          <span className="chip tap" onClick={() => nav.push('category')}>Podcasts</span>
          <span className="chip tap" onClick={() => nav.push('category')}>Vidéos</span>
          <span className="chip tap" onClick={() => nav.push('agenda')}>Agenda</span>
        </div>

        <div className="hero-card tap" onClick={() => nav.openContent(C.soin)}>
          <div className="hero-card__media"></div>
          <div className="hero-card__body">
            <K>◉ Édition du jour · Analyse</K>
            <h3 className="t">L'économie du soin — <i>nouvelle priorité.</i></h3>
            <div className="m"><span className="play">▶</span><span>22 MIN · PROGRAMME 2027</span></div>
          </div>
        </div>

        <div className="sh">
          <span className="sh__t serif">Derniers <i>articles</i></span>
          <span className="sh__more tap" onClick={() => nav.push('category')}>Tout voir →</span>
        </div>
        <Row item={C.pouvoir} tint="alt" />
        <Row item={C.bardin} tint="dk" />
        <Row item={C.debat} tint="br" />

        <div className="sh">
          <span className="sh__t serif">Collections <i>éditoriales</i></span>
          <span className="sh__more tap" onClick={() => nav.push('collections')}>Tout voir →</span>
        </div>
        <div className="ecoll">
          <div className="ecoll__card tap" onClick={() => nav.push('collections')}>
            <span className="bg a"></span>
            <div className="meta">
              <span className="by">◆ Par la rédaction</span>
              <h3 className="nm">Le grand entretien</h3>
              <span className="ct">Série · 14 épisodes · audio</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ============================================================
   ROOT — Explorer
   ============================================================ */
const ExploreRoot = () => {
  const nav = useNav();
  return (
    <>
      <div className="proto-top">
        <span className="proto-top__title serif" style={{ paddingLeft: 6 }}>Explorer</span>
        <span className="proto-top__act"></span>
      </div>
      <div className="proto-pad">
        <div className="search tap" onClick={() => nav.toast('Recherche — démo')}>
          <span className="glass">⌕</span>
          <span>Chercher analyses, podcasts, événements…</span>
        </div>

        <div className="sh"><span className="sh__t serif">Catégories</span></div>
        <div className="search__cats">
          <div className="search__cat tap" onClick={() => nav.push('category')}><span className="ic">✎</span><span className="nm">Analyses</span><span className="ct">128 ARTICLES</span></div>
          <div className="search__cat tap" onClick={() => nav.push('category')}><span className="ic">▷</span><span className="nm">Podcasts</span><span className="ct">64 ÉPISODES</span></div>
          <div className="search__cat tap" onClick={() => nav.push('category')}><span className="ic">▶</span><span className="nm">Vidéos</span><span className="ct">42 DÉBATS</span></div>
          <div className="search__cat tap" onClick={() => nav.push('agenda')}><span className="ic">☷</span><span className="nm">Agenda</span><span className="ct">12 À VENIR</span></div>
        </div>

        <div className="sh"><span className="sh__t serif">Modules</span></div>
        <div className="search__cats">
          <div className="search__cat tap" onClick={() => nav.push('collections')}><span className="ic">◆</span><span className="nm">Collections</span><span className="ct">PAR LA RÉDACTION</span></div>
          <div className="search__cat tap" onClick={() => nav.push('community')}><span className="ic">✦</span><span className="nm">Communauté</span><span className="ct">DISCORD · CERCLES</span></div>
        </div>

        <div className="sh" style={{ paddingTop: 4 }}><span className="sh__t serif">Tendances <i>cette semaine</i></span></div>
        <div className="search__trending">
          {['Programme 2027', 'Démocratie locale', 'Économie du soin', "Pouvoir d'achat", 'Léa Bardin'].map(t => (
            <span className="chip tap" key={t} onClick={() => nav.push('category')}>{t}</span>
          ))}
        </div>
      </div>
    </>
  );
};

/* ============================================================
   ROOT — Bibliothèque (guest gate vs member)
   ============================================================ */
const LibraryRoot = () => {
  const nav = useNav();
  if (nav.member === 'guest') {
    return (
      <>
        <div className="proto-top"><span className="proto-top__title serif" style={{ paddingLeft: 6 }}>Bibliothèque</span><span className="proto-top__act"></span></div>
        <div className="gate-screen">
          <div className="crest">{nav.brand.name[0]}</div>
          <h3>Votre bibliothèque, <i>partout.</i></h3>
          <p>Connectez-vous pour enregistrer, télécharger hors-ligne et retrouver votre progression sur tous vos appareils.</p>
          <span className="btn btn--primary btn--block btn--lg" onClick={() => nav.setMember('member')}>Se connecter</span>
          <span className="btn btn--ghost btn--block" onClick={() => nav.go('home')}>Continuer en invité</span>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="proto-top"><span className="proto-top__title serif" style={{ paddingLeft: 6 }}>Bibliothèque</span><span className="proto-top__act tap" onClick={() => nav.toast('Recherche — démo')}>⌕</span></div>
      <div className="proto-pad">
        <div className="chips" style={{ marginBottom: 12 }}>
          <span className="chip on">Tout</span>
          <span className="chip">Articles</span>
          <span className="chip">Podcasts</span>
          <span className="chip">Hors-ligne</span>
        </div>

        <div className="sh"><span className="sh__t serif">Reprendre</span></div>
        <div className="p2__resume tap" onClick={() => nav.openContent(C.soin)}>
          <span className="k">◐ Reprendre · synchronisé</span>
          <div className="row2">
            <span className="cov"></span>
            <div style={{ minWidth: 0 }}><div className="t">L'économie du soin</div><div className="sub">Épisode · 22:48 restant · 62 %</div></div>
            <span className="play">▶</span>
          </div>
          <div className="bar"></div>
        </div>

        <div className="sh"><span className="sh__t serif">Enregistrés <span className="gate gate--free">Gratuit</span></span></div>
        <Row item={C.pouvoir} tint="alt" />
        <Row item={C.demo} tint="dk" />

        <div className="sh">
          <span className="sh__t serif">Mes listes <span className="gate gate--premium">Premium</span></span>
          <span className="sh__more tap" onClick={() => nav.push('lists')}>Gérer →</span>
        </div>
        <div className="pcoll">
          <div className="pcoll__item tap" onClick={() => nav.push('lists')}>
            <span className="pcoll__stack"><i></i><i></i><i></i></span>
            <div style={{ minWidth: 0 }}><div className="nm">À écouter en voiture</div><div className="d">9 épisodes · privée</div></div>
            <span className="chev">›</span>
          </div>
        </div>

        <div className="sh"><span className="sh__t serif">Hors-ligne <span className="gate gate--premium">Premium</span></span></div>
        <div className="comm__card tap" onClick={() => nav.requirePremium('offline', () => nav.toast('Téléchargement lancé'))}>
          <div className="head"><span className="nm">Télécharger pour écouter sans réseau</span><span className="ic">↓</span></div>
          <p className="d">4 épisodes disponibles hors-ligne · 1.2 Go.</p>
        </div>
      </div>
    </>
  );
};

/* ============================================================
   ROOT — Profil (guest gate vs member)
   ============================================================ */
const ProfileRoot = () => {
  const nav = useNav();
  if (nav.member === 'guest') {
    return (
      <>
        <div className="proto-top"><span className="proto-top__title serif" style={{ paddingLeft: 6 }}>Profil</span><span className="proto-top__act"></span></div>
        <div className="gate-screen">
          <div className="crest">{nav.brand.name[0]}</div>
          <h3>Rejoignez <i>{nav.brand.name}.</i></h3>
          <p>Créez un compte gratuit pour enregistrer vos contenus et suivre votre progression. Premium débloque l'offline et les listes.</p>
          <span className="btn btn--primary btn--block btn--lg" onClick={() => nav.setMember('member')}>Créer un compte</span>
          <span className="btn btn--premium btn--block" onClick={() => nav.openSheet('paywall', { reason: 'support' })}>Découvrir Premium</span>
        </div>
      </>
    );
  }
  const premium = nav.member === 'premium';
  return (
    <>
      <div className="p2__top"><span className="ttl serif">Profil</span><span className="ic tap" onClick={() => nav.toast('Réglages — démo')}>⚙</span></div>
      <div className="proto-pad">
        <div className="p2__id">
          <span className="p2__av"></span>
          <div style={{ flex: 1 }}>
            <h3 className="nm">Camille Renard</h3>
            <span className="p2__status">{premium ? 'Membre · Bienfaiteur' : 'Membre · Gratuit'}</span>
            <span className="p2__since">{premium ? 'Synchro prête · depuis mars 2024' : 'Compte gratuit · passez Premium'}</span>
          </div>
        </div>

        <div className="p2__resume tap" onClick={() => nav.openContent(C.soin)}>
          <span className="k">◐ Reprendre · synchronisé</span>
          <div className="row2">
            <span className="cov"></span>
            <div style={{ minWidth: 0 }}><div className="t">L'économie du soin</div><div className="sub">Épisode · 22:48 restant · 62 %</div></div>
            <span className="play">▶</span>
          </div>
          <div className="bar"></div>
        </div>

        <div className="p2__stats">
          <div className="p2__stat"><span className="ic">⌖</span><span className="n">12</span><span className="l">Enregistrés</span></div>
          <div className="p2__stat"><span className="ic">↓</span><span className="n">{premium ? 4 : 0}</span><span className="l">Hors-ligne</span></div>
          <div className="p2__stat"><span className="ic">◷</span><span className="n">31</span><span className="l">Historique</span></div>
        </div>

        <div className="p2__sec">
          <K>— Ma bibliothèque</K>
          <div className="p2row tap" onClick={() => nav.go('library')}>
            <span className="ic">⌖</span>
            <div className="meta"><span className="t">Enregistrements <span className="gate gate--free">Gratuit</span></span><span className="d">12 contenus mis de côté</span></div>
            <span className="chev">›</span>
          </div>
          <div className="p2row tap" onClick={() => nav.requirePremium('offline', () => nav.go('library'))}>
            <span className="ic">↓</span>
            <div className="meta"><span className="t">Téléchargements <span className="gate gate--premium">Premium</span></span><span className="d">{premium ? '4 épisodes · 1.2 Go' : 'Réservé aux membres Premium'}</span></div>
            <span className="chev">›</span>
          </div>
          <div className="p2row tap" onClick={() => nav.push('lists')}>
            <span className="ic">≣</span>
            <div className="meta"><span className="t">Mes listes <span className="gate gate--premium">Premium</span></span><span className="d">{premium ? '3 listes personnelles' : '1 liste · illimité avec Premium'}</span></div>
            <span className="chev">›</span>
          </div>
          <div className="p2row">
            <span className="ic">◷</span>
            <div className="meta"><span className="t">Historique &amp; progression <span className="gate gate--member">Membre</span></span><span className="d">Reprise synchronisée sur vos appareils</span></div>
            <span className="chev">›</span>
          </div>
        </div>

        <div className="p2__sec">
          <K>— Compte</K>
          {premium ? (
            <div className="p2row"><span className="ic">★</span><div className="meta"><span className="t">Abonnement · Annuel</span><span className="d">Renouvellement le 14 mars 2027</span></div><span className="chev">›</span></div>
          ) : (
            <div className="p2row tap" onClick={() => nav.openSheet('paywall', { reason: 'support' })}><span className="ic">★</span><div className="meta"><span className="t">Passer Premium</span><span className="d">Offline, listes illimitées, salon membres</span></div><span className="chev">›</span></div>
          )}
          <div className="p2row tap" onClick={() => nav.setMember('guest')}><span className="ic">⎋</span><div className="meta"><span className="t">Se déconnecter</span><span className="d">Repasser en mode invité</span></div><span className="chev">›</span></div>
        </div>
      </div>
    </>
  );
};

/* ============================================================
   PUSHED views
   ============================================================ */
const ArticleView = ({ item }) => {
  const nav = useNav();
  const it = item || C.soin;
  return (
    <>
      <div className="article" style={{ minHeight: '100%' }}>
        <div className="article__cover" style={{ height: 200 }}>
          <div className="proto-top">
            <span className="proto-top__back" style={{ color: '#fff' }} onClick={nav.pop}>‹</span>
            <span className="proto-top__act" style={{ color: '#fff' }} onClick={() => nav.toast('Partager — démo')}>↗</span>
          </div>
        </div>
        <div className="article__body">
          <K accent>◉ Analyse · Programme 2027</K>
          <h2 className="article__title">{it.title}</h2>
          <div className="article__meta">
            <span className="av"></span>
            <div><div className="a">par Élise Brun</div><div className="d">18 MIN · 14 MARS</div></div>
          </div>
          <p className="article__lede">Et si nous reconnaissions enfin que prendre soin constitue le travail le plus essentiel d'une société ?</p>
          <p className="article__para">Pendant des décennies, l'économie a mesuré ce qui se vendait, jamais ce qui maintenait debout. Ce déséquilibre se paie aujourd'hui dans chaque hôpital, chaque école, chaque foyer.</p>
          <p className="article__para">La chercheuse Léa Bardin propose une boussole : mesurer le travail invisible, intégrer le soin aux indicateurs nationaux, et réformer la fiscalité.</p>
          <div className="article__suggested">
            <K>— À lire ensuite</K>
            <Row item={C.pouvoir} tint="alt" />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <span className="btn btn--primary tap" style={{ flex: 1 }} onClick={() => nav.toast('Enregistré')}>♡ Sauvegarder</span>
            <span className="btn btn--ghost tap" style={{ flex: 1, background: 'var(--brand-surface)' }} onClick={() => nav.toast('Partager — démo')}>↗ Partager</span>
          </div>
        </div>
      </div>
    </>
  );
};

const PodcastView = ({ item }) => {
  const nav = useNav();
  const it = item || C.bardin;
  return (
    <>
      <div className="proto-top">
        <span className="proto-top__back" onClick={nav.pop}>‹</span>
        <span className="proto-top__title">Podcast</span>
        <span className="proto-top__act" onClick={() => nav.toast('Options — démo')}>⋯</span>
      </div>
      <div className="pod">
        <div className="pod__cover">
          <span className="stamp">S03 · E14 · 54 MIN</span>
          <div className="ep">Avec Léa Bardin.</div>
        </div>
        <div>
          <span className="pod__show">Le grand entretien · {nav.brand.name}</span>
          <h3 className="pod__title">{it.title}</h3>
        </div>
        <p className="pod__d">La chercheuse Léa Bardin revient sur dix ans d'enquêtes sur le travail invisible, et propose une boussole pour 2027.</p>
        <div className="pod__chapters">
          <K>— Chapitres</K>
          <div className="ch"><span className="t">00:00</span><span className="l">Introduction</span></div>
          <div className="ch"><span className="t">08:24</span><span className="l">Mesurer ce qui ne se vend pas</span></div>
          <div className="ch"><span className="t">23:10</span><span className="l">Réformer les indicateurs</span></div>
          <div className="ch"><span className="t">41:02</span><span className="l">Trois propositions concrètes</span></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <span className="btn btn--primary tap" style={{ flex: 1 }} onClick={() => nav.playEpisode(it)}>▶ Écouter</span>
          <span className="btn btn--ghost tap" onClick={() => nav.toast('Enregistré')}>♡</span>
          <span className="btn btn--ghost tap" onClick={() => nav.requirePremium('offline', () => nav.toast('Téléchargement lancé'))}>↓</span>
        </div>
      </div>
    </>
  );
};

const PlayerView = ({ item }) => {
  const nav = useNav();
  const it = item || C.bardin;
  return (
    <div className="player" style={{ paddingTop: 4 }}>
      <div className="topbar" style={{ paddingTop: 4 }}>
        <span className="topbar__back tap" style={{ color: '#F4F1E8' }} onClick={nav.pop}>↓</span>
        <span className="topbar__title" style={{ color: 'rgba(244,241,232,.55)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em' }}>LECTURE EN COURS</span>
        <span className="topbar__act" style={{ color: '#F4F1E8' }}>⋯</span>
      </div>
      <div className="player__art"><div className="ep"><i>{it.title}</i></div></div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', color: 'rgba(244,241,232,.5)', marginBottom: 6 }}>SAISON 03 · ÉPISODE 14</span>
      <h3 className="player__title">{it.title}</h3>
      <p className="player__show">Le grand entretien · {nav.brand.name}</p>
      <div className="player__bar"></div>
      <div className="player__time"><span>22:48</span><span>−31:12</span></div>
      <div className="player__ctrls">
        <span className="b">1.0×</span>
        <span className="b tap">⏮</span>
        <span className="play tap" onClick={() => nav.toast('Lecture — démo')}>▶</span>
        <span className="b tap">⏭</span>
        <span className="b">⊟</span>
      </div>
      <div className="player__extras">
        <span className="tap" onClick={() => nav.toast('Aimé')}>♡ AIMER</span>
        <span className="tap" onClick={() => nav.requirePremium('offline', () => nav.toast('Téléchargement lancé'))}>↓ HORS-LIGNE</span>
        <span>≡ FILE</span>
      </div>
    </div>
  );
};

const VideoView = ({ item }) => {
  const nav = useNav();
  const it = item || C.debat;
  const locked = it.premium && nav.member !== 'premium';
  return (
    <>
      <div className="vid">
        <div className="vid__player">
          <div className="proto-top" style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 5 }}>
            <span className="proto-top__back" style={{ color: '#fff' }} onClick={nav.pop}>‹</span>
            <span className="proto-top__act" style={{ color: '#fff' }}></span>
          </div>
          {it.premium && <span className="premium">★ Premium</span>}
          <span className="play tap" onClick={() => locked ? nav.openSheet('paywall', { reason: 'content', item: it }) : nav.toast('Lecture — démo')}>▶</span>
          <span className="duration">1:04:22</span>
        </div>
        <div className="vid__body">
          <K accent>◉ Débat · Démocratie locale</K>
          <h2 className="vid__title">{it.title}</h2>
          <span className="vid__meta">1 H 04 · MARS · STUDIO</span>
          <p className="vid__desc">Trois élus locaux, deux chercheurs : comment redonner du pouvoir aux territoires sans tomber dans la fragmentation ?</p>
          <div className="chips" style={{ marginTop: 4 }}>
            <span className="chip">Démocratie</span><span className="chip">Territoire</span><span className="chip">2027</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {locked
              ? <span className="btn btn--premium tap" style={{ flex: 1 }} onClick={() => nav.openSheet('paywall', { reason: 'content', item: it })}>★ Regarder en premium</span>
              : <span className="btn btn--primary tap" style={{ flex: 1 }} onClick={() => nav.toast('Lecture — démo')}>▶ Regarder</span>}
            <span className="btn btn--ghost tap" style={{ background: 'var(--brand-surface)' }} onClick={() => nav.toast('Enregistré')}>♡</span>
          </div>
        </div>
      </div>
    </>
  );
};

const CategoryView = () => {
  const nav = useNav();
  return (
    <>
      <div className="proto-top">
        <span className="proto-top__back" onClick={nav.pop}>‹</span>
        <span className="proto-top__title">Catégorie</span>
        <span className="proto-top__act" onClick={() => nav.toast('Recherche — démo')}>⌕</span>
      </div>
      <div className="proto-pad">
        <div className="cat__hero">
          <K accent>◉ ANALYSES</K>
          <h2 className="t">Programme <i>2027.</i></h2>
          <p className="d">Le travail éditorial qui prépare le cycle. Articles, débats, rencontres locales.</p>
          <div className="stats"><span>128 ARTICLES</span><span>·</span><span>14 DÉBATS</span><span>·</span><span>HEBDO</span></div>
        </div>
        <div className="chips" style={{ marginBottom: 8 }}>
          <span className="chip on">Récent</span><span className="chip">Populaire</span><span className="chip">★ Premium</span>
        </div>
        <Row item={C.soin} tint="alt" />
        <Row item={C.pouvoir} tint="br" />
        <Row item={C.debat} tint="gr" />
        <Row item={C.indic} tint="dk" />
      </div>
    </>
  );
};

const CollectionsView = () => {
  const nav = useNav();
  return (
    <>
      <div className="proto-top"><span className="proto-top__back" onClick={nav.pop}>‹</span><span className="proto-top__title serif">Collections</span><span className="proto-top__act">⌕</span></div>
      <div className="proto-pad">
        <p className="coll__intro">Des parcours thématiques construits par la rédaction — séries, dossiers et formats au long cours.</p>
        <div className="ecoll">
          <div className="ecoll__card tap" onClick={() => nav.openContent(C.bardin)}><span className="bg a"></span><div className="meta"><span className="by">◆ Par la rédaction</span><h3 className="nm">Le grand entretien</h3><span className="ct">Série · 14 épisodes · audio</span></div></div>
          <div className="ecoll__card tap" onClick={() => nav.push('category')}><span className="bg b"></span><div className="meta"><span className="by">◆ Dossier</span><h3 className="nm">Programme 2027</h3><span className="ct">32 contenus · MAJ hebdo</span></div></div>
          <div className="ecoll__card tap" onClick={() => nav.openContent(C.debat)}><span className="bg c"></span><div className="meta"><span className="by">◆ Format</span><h3 className="nm">L'économie autrement</h3><span className="ct">Série · 8 vidéos · ★ premium</span></div></div>
        </div>
      </div>
    </>
  );
};

const ListsView = () => {
  const nav = useNav();
  const premium = nav.member === 'premium';
  return (
    <>
      <div className="proto-top"><span className="proto-top__back" onClick={nav.pop}>‹</span><span className="proto-top__title serif">Mes listes</span><span className="proto-top__act"></span></div>
      <div className="proto-pad">
        <p className="coll__intro">Vos propres listes — distinctes des collections de la rédaction. Organisez ce que vous gardez.</p>
        <div className="pcoll">
          <div className="pcoll__create tap" onClick={() => premium ? nav.toast('Nouvelle liste') : nav.openSheet('paywall', { reason: 'lists' })}>
            <span className="pl">+</span>
            <div><div className="t">Créer une liste</div><div className="d">Regroupez articles, épisodes et vidéos</div></div>
          </div>
          <div className="pcoll__item tap" onClick={() => nav.toast('Liste ouverte')}>
            <span className="pcoll__stack"><i></i><i></i><i></i></span>
            <div style={{ minWidth: 0 }}><div className="nm">À écouter en voiture</div><div className="d">9 épisodes · privée</div></div>
            <span className="chev">›</span>
          </div>
          {premium && (
            <div className="pcoll__item tap" onClick={() => nav.toast('Liste ouverte')}>
              <span className="pcoll__stack"><i></i><i></i><i></i></span>
              <div style={{ minWidth: 0 }}><div className="nm">Économie — à relire</div><div className="d">6 contenus · privée</div></div>
              <span className="chev">›</span>
            </div>
          )}
          {!premium && (
            <div className="pcoll__lockmsg">
              <div className="t">Listes illimitées avec Premium</div>
              <div className="d">Les membres gratuits créent 1 liste. Passez Premium pour des listes illimitées et la synchro multi-appareils.</div>
              <span className="btn btn--premium btn--sm tap" style={{ alignSelf: 'flex-start' }} onClick={() => nav.openSheet('paywall', { reason: 'lists' })}>Voir Premium</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const AgendaView = () => {
  const nav = useNav();
  const evs = [
    { d: '24', m: 'Mars', t: 'Assemblée ouverte · Paris', s: '19h00 · La Bellevilloise · 180 inscrits', tg: 'CERCLE LOCAL · OUVERT' },
    { d: '02', m: 'Avril', t: 'Atelier programme 2027', s: '20h00 · En visio · gratuit', tg: 'VISIO · MEMBRES' },
    { d: '11', m: 'Avril', t: 'Débat live — économie du soin', s: '21h00 · YouTube live · ouvert à tous', tg: 'LIVE · GRATUIT' },
    { d: '18', m: 'Avril', t: 'Cercle local · Lyon', s: '19h30 · Café associatif · 24 inscrits', tg: 'LYON · OUVERT' },
  ];
  return (
    <>
      <div className="proto-top"><span className="proto-top__back" onClick={nav.pop}>‹</span><span className="proto-top__title serif">Agenda</span><span className="proto-top__act">🗓</span></div>
      <div className="proto-pad">
        <div className="chips" style={{ marginBottom: 10 }}>
          <span className="chip on">À venir</span><span className="chip">En ligne</span><span className="chip">Près de moi</span>
        </div>
        {evs.map((e, i) => (
          <div className="event tap" key={i} onClick={() => nav.toast('Événement — démo')}>
            <div className="event__date"><div className="d">{e.d}</div><div className="m">{e.m}</div></div>
            <div className="event__meta"><h4 className="event__t">{e.t}</h4><span className="event__d">{e.s}</span><span className="event__tags">{e.tg}</span></div>
          </div>
        ))}
      </div>
    </>
  );
};

const CommunityView = () => {
  const nav = useNav();
  return (
    <>
      <div className="proto-top"><span className="proto-top__back" onClick={nav.pop}>‹</span><span className="proto-top__title serif">Communauté</span><span className="proto-top__act">⋯</span></div>
      <div className="proto-pad">
        <div className="comm__hero">
          <K premium>◉ REJOINDRE</K>
          <h3 className="t">Prolongez la conversation <i>hors de l'app.</i></h3>
          <p className="s">12 400 membres · 84 cercles locaux · accès libre ou réservé selon le module.</p>
          <span className="btn btn--accent btn--block tap" onClick={() => nav.toast('Lien communauté — démo')}>Rejoindre la communauté</span>
        </div>
        <div className="comm__card tap" onClick={() => nav.toast('Discord — démo')}>
          <div className="head"><span className="nm">Discord communautaire</span><span className="ic">#</span></div>
          <p className="d">Échangez avec les rédactions et les membres. Lien ouvert à tous.</p>
          <div className="stat"><span><b>42</b> salons</span><span className="gate gate--free" style={{ marginLeft: 'auto' }}>Gratuit</span></div>
        </div>
        <div className="comm__card tap" onClick={() => nav.requirePremium('members', () => nav.toast('Salon membres ouvert'))}>
          <div className="head"><span className="nm">Salon membres</span><span className="ic">✦</span></div>
          <p className="d">Espace réservé : AMA, coulisses, votes éditoriaux.</p>
          <div className="stat"><span><b>8</b> fils actifs</span><span className="gate gate--premium" style={{ marginLeft: 'auto' }}>Premium</span></div>
        </div>
      </div>
    </>
  );
};

const NotificationsView = () => {
  const nav = useNav();
  return (
    <>
      <div className="proto-top"><span className="proto-top__back" onClick={nav.pop}>‹</span><span className="proto-top__title">Notifications</span><span className="proto-top__act" onClick={() => nav.toast('Tout lu')}>✓</span></div>
      <div className="proto-pad">
        <div className="chips" style={{ marginBottom: 10 }}><span className="chip on">Toutes</span><span className="chip">Non lues</span></div>
        <div className="list">
          <div className="list__row tap" onClick={() => nav.openContent(C.soin)}><span className="ic">✎</span><div className="meta"><h4 className="t">Nouvelle analyse · L'économie du soin</h4><span className="d">Il y a 18 min · 22 min de lecture</span></div><span className="dot"></span></div>
          <div className="list__row tap" onClick={() => nav.openContent(C.bardin)}><span className="ic">▷</span><div className="meta"><h4 className="t">Podcast · Avec Léa Bardin</h4><span className="d">S03 · E14 · 54 min</span></div><span className="dot"></span></div>
          <div className="list__row tap" onClick={() => nav.push('agenda')}><span className="ic">●</span><div className="meta"><h4 className="t">Live dans 1 heure — Démocratie locale</h4><span className="d">Débat en direct · 21h00</span></div><span className="dot"></span></div>
          <div className="list__row tap" onClick={() => nav.push('agenda')}><span className="ic">☷</span><div className="meta"><h4 className="t">Rappel · Assemblée ouverte Paris</h4><span className="d">Demain 19h00</span></div><span className="v">DEMAIN</span></div>
        </div>
      </div>
    </>
  );
};

/* ---------- Sheets ---------- */
const PaywallSheet = ({ payload }) => {
  const nav = useNav();
  const reason = (payload && payload.reason) || 'support';
  const copy = {
    offline:  { k: '◉ Téléchargement hors-ligne · Premium', t: <>Écoutez <i>partout,</i> même sans réseau.</>, d: "Le téléchargement hors-ligne est réservé aux membres Premium. La lecture en ligne reste gratuite." },
    lists:    { k: '◉ Listes illimitées · Premium', t: <>Organisez <i>sans limite.</i></>, d: "Les listes personnelles illimitées et la synchro multi-appareils sont réservées à Premium." },
    members:  { k: '◉ Salon membres · Premium', t: <>Entrez dans <i>les coulisses.</i></>, d: "Le salon membres (AMA, votes, coulisses) est réservé aux abonnés Premium." },
    content:  { k: '◉ Contenu premium', t: <>Soutenez. <i>Accédez à tout.</i></>, d: "Ce contenu est réservé aux membres Premium. Votre abonnement finance le travail éditorial." },
    support:  { k: `◉ Accès ${nav.brand.name} Premium`, t: <>Soutenez. <i>Recevez plus.</i></>, d: "Tous les contenus, l'offline, les listes et le salon membres." },
  }[reason];
  return (
    <div className="proto-sheetwrap">
      <div className="dim" onClick={nav.closeSheet}></div>
      <div className="sheet">
        <div className="sheet__grab"></div>
        <div className="sheet__crest">{nav.brand.name[0]}</div>
        <span className="sheet__k">{copy.k}</span>
        <h3 className="sheet__t">{copy.t}</h3>
        <p className="sheet__d">{copy.d}</p>
        <div className="sheet__benefits">
          <div className="b"><span className="c">✓</span><span>Téléchargements illimités hors-ligne</span></div>
          <div className="b"><span className="c">✓</span><span>Reprise synchronisée sur vos appareils</span></div>
          <div className="b"><span className="c">✓</span><span>Listes personnelles illimitées + salon membres</span></div>
        </div>
        <div className="sheet__cta tap" onClick={() => { nav.setMember('premium'); nav.closeSheet(); nav.toast('Bienvenue en Premium ✦'); }}>Devenir membre · 59 € / an</div>
        <div className="sheet__alt tap" onClick={nav.closeSheet}>PLUS TARD — CONTINUER GRATUITEMENT</div>
      </div>
    </div>
  );
};

Object.assign(window, {
  NavCtx, useNav,
  HomeRoot, ExploreRoot, LibraryRoot, ProfileRoot,
  ArticleView, PodcastView, PlayerView, VideoView, CategoryView,
  CollectionsView, ListsView, AgendaView, CommunityView, NotificationsView,
  PaywallSheet,
});
