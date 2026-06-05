/* global React, Phone, StatusBar, TopBar, BrandHeader, TabBar, Kicker, ContentRow */
// screens.jsx — Civica 15 core screens

/* ---------- 01 · Onboarding 1 ---------- */
const Onboarding1 = () => (
  <Phone>
    <StatusBar />
    <div className="scr">
      <div className="onb">
        <div className="onb__media">
          <div className="stamp"><i>Civica</i><span className="dot"></span></div>
        </div>
        <h1 className="onb__title">Votre média <i>dans votre poche.</i></h1>
        <p className="onb__sub">
          Suivez, écoutez, lisez, soutenez. Tout votre média indépendant —
          dans une application qui vous appartient.
        </p>
        <div className="onb__cta">
          <span className="btn btn--primary btn--block btn--lg">Continuer</span>
          <span className="btn btn--ghost btn--block">Se connecter</span>
        </div>
        <div className="onb__dots">
          <span className="onb__dot on"></span>
          <span className="onb__dot"></span>
          <span className="onb__dot"></span>
        </div>
      </div>
    </div>
  </Phone>
);

/* ---------- 02 · Onboarding 2 ---------- */
const Onboarding2 = () => (
  <Phone>
    <StatusBar />
    <div className="scr">
      <div className="onb">
        <Kicker accent>◉ Tout ce qui compte</Kicker>
        <h1 className="onb__title" style={{ marginTop: 10 }}>Articles, podcasts, vidéos, <i>communauté.</i></h1>
        <div className="onb__list">
          <div className="onb__feat">
            <span className="ic">✎</span>
            <div><h4 className="t">Analyses & enquêtes</h4><p className="d">Long format, audio, vidéo — un seul fil.</p></div>
          </div>
          <div className="onb__feat">
            <span className="ic">▷</span>
            <div><h4 className="t">Player audio premium</h4><p className="d">Lecture continue, vitesse, hors-ligne.</p></div>
          </div>
          <div className="onb__feat">
            <span className="ic">☷</span>
            <div><h4 className="t">Agenda national & local</h4><p className="d">Rencontres, débats, événements près de chez vous.</p></div>
          </div>
          <div className="onb__feat">
            <span className="ic">✦</span>
            <div><h4 className="t">Soutenir & rejoindre</h4><p className="d">Adhésion, Discord, cercles locaux.</p></div>
          </div>
        </div>
        <div className="onb__cta">
          <span className="btn btn--primary btn--block btn--lg">Commencer</span>
        </div>
        <div className="onb__dots">
          <span className="onb__dot"></span>
          <span className="onb__dot on"></span>
          <span className="onb__dot"></span>
        </div>
      </div>
    </div>
  </Phone>
);

/* ---------- 03 · Home / Feed ---------- */
const HomeFeed = () => (
  <Phone>
    <StatusBar />
    <div className="scr">
      <BrandHeader />
      <div className="scr__body">
        <div className="chips" style={{ marginBottom: 14 }}>
          <span className="chip on">Tout</span>
          <span className="chip">Analyses</span>
          <span className="chip">Podcasts</span>
          <span className="chip">Vidéos</span>
          <span className="chip">Agenda</span>
        </div>

        <div className="hero-card">
          <div className="hero-card__media"></div>
          <div className="hero-card__body">
            <Kicker>◉ Édition du jour · Analyse</Kicker>
            <h3 className="t">L'économie du soin — <i>nouvelle priorité.</i></h3>
            <div className="m">
              <span className="play">▶</span>
              <span>22 MIN · PROGRAMME 2027</span>
            </div>
          </div>
        </div>

        <div className="sh">
          <span className="sh__t serif">Derniers <i>articles</i></span>
          <span className="sh__more">Tout voir →</span>
        </div>

        <ContentRow kicker="Analyse · Aujourd'hui" title="Pouvoir d'achat : ce que les chiffres ne disent pas" meta="18 min de lecture" tint="alt" />
        <ContentRow kicker="Podcast · S03 · E14" title="Avec Léa Bardin, économiste" meta="54 min · ★ Premium" tint="dk" premium />
        <ContentRow kicker="Vidéo · Débat" title="Démocratie locale, où en sommes-nous ?" meta="1 h 04 · Hier" tint="br" />
      </div>
      <TabBar active={0} />
    </div>
  </Phone>
);

/* ---------- 04 · Article detail ---------- */
const ArticleDetail = () => (
  <Phone>
    <StatusBar dark />
    <div className="scr">
      <div className="article">
        <div className="article__cover">
          <TopBar />
        </div>
        <div className="article__body">
          <Kicker accent>◉ Analyse · Programme 2027</Kicker>
          <h2 className="article__title">L'économie <i>du soin</i> — nouvelle priorité.</h2>
          <div className="article__meta">
            <span className="av"></span>
            <div>
              <div className="a">par Élise Brun</div>
              <div className="d">18 MIN · 14 MARS</div>
            </div>
          </div>
          <p className="article__lede">
            Et si nous reconnaissions enfin que prendre soin
            constitue le travail le plus essentiel d'une société ?
          </p>
          <p className="article__para">
            Pendant des décennies, l'économie a mesuré ce qui se vendait,
            jamais ce qui maintenait debout. Ce déséquilibre se paie
            aujourd'hui dans chaque hôpital, chaque école, chaque…
          </p>
          <div className="article__suggested">
            <Kicker>— À lire ensuite</Kicker>
            <ContentRow kicker="Enquête" title="Les soignants face au burn-out" meta="12 min" tint="alt" />
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 26, left: 16, right: 16, display: 'flex', gap: 8, zIndex: 10 }}>
        <span className="btn btn--primary" style={{ flex: 1 }}>♡ Sauvegarder</span>
        <span className="btn btn--ghost" style={{ flex: 1, background: 'var(--brand-surface)' }}>↗ Partager</span>
      </div>
    </div>
  </Phone>
);

/* ---------- 05 · Podcast episode detail ---------- */
const PodcastDetail = () => (
  <Phone>
    <StatusBar />
    <div className="scr">
      <TopBar title="Podcast" />
      <div className="pod">
        <div className="pod__cover">
          <span className="stamp">S03 · E14 · 54 MIN</span>
          <div className="ep">Avec Léa Bardin.</div>
        </div>
        <div>
          <span className="pod__show">Le grand entretien · Civica</span>
          <h3 className="pod__title">L'économie du soin — repenser nos priorités.</h3>
        </div>
        <p className="pod__d">
          La chercheuse Léa Bardin revient sur dix ans d'enquêtes
          sur le travail invisible, et propose une boussole pour 2027.
        </p>
        <div className="pod__chapters">
          <Kicker>— Chapitres</Kicker>
          <div className="ch"><span className="t">00:00</span><span className="l">Introduction</span></div>
          <div className="ch"><span className="t">08:24</span><span className="l">Mesurer ce qui ne se vend pas</span></div>
          <div className="ch"><span className="t">23:10</span><span className="l">Réformer les indicateurs</span></div>
          <div className="ch"><span className="t">41:02</span><span className="l">Trois propositions concrètes</span></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          <span className="btn btn--primary" style={{ flex: 1 }}>▶ Écouter</span>
          <span className="btn btn--ghost">♡</span>
          <span className="btn btn--ghost">↓</span>
        </div>
      </div>
    </div>
  </Phone>
);

/* ---------- 06 · Audio player ---------- */
const AudioPlayer = () => (
  <Phone>
    <StatusBar dark />
    <div className="scr scr--dark" style={{ background: '#14110E' }}>
      <div className="topbar" style={{ paddingTop: 4 }}>
        <span className="topbar__back" style={{ color: '#F4F1E8' }}>↓</span>
        <span className="topbar__title" style={{ color: 'rgba(244,241,232,.55)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em' }}>LECTURE EN COURS</span>
        <span className="topbar__act" style={{ color: '#F4F1E8' }}>⋯</span>
      </div>
      <div className="player">
        <div className="player__art">
          <div className="ep"><i>L'économie du soin —</i> repenser nos priorités.</div>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.14em', color: 'rgba(244,241,232,.5)', marginBottom: 6 }}>SAISON 03 · ÉPISODE 14</span>
        <h3 className="player__title">L'économie du soin.</h3>
        <p className="player__show">Le grand entretien · Civica</p>
        <div className="player__bar"></div>
        <div className="player__time"><span>22:48</span><span>−31:12</span></div>
        <div className="player__ctrls">
          <span className="b">1.0×</span>
          <span className="b">⏮</span>
          <span className="play">▶</span>
          <span className="b">⏭</span>
          <span className="b">⊟</span>
        </div>
        <div className="player__extras">
          <span>♡ AIMER</span>
          <span>↓ HORS-LIGNE</span>
          <span>≡ FILE</span>
        </div>
      </div>
    </div>
  </Phone>
);

/* ---------- 07 · Video detail ---------- */
const VideoDetail = () => (
  <Phone>
    <StatusBar dark />
    <div className="scr">
      <div className="vid">
        <div className="vid__player">
          <span className="premium">★ Premium</span>
          <span className="play">▶</span>
          <span className="duration">1:04:22</span>
        </div>
        <div className="vid__body">
          <Kicker accent>◉ Débat · Démocratie locale</Kicker>
          <h2 className="vid__title">Démocratie locale, où en sommes-nous ?</h2>
          <span className="vid__meta">1 H 04 · MARS · CIVICA STUDIO</span>
          <p className="vid__desc">
            Trois élus locaux, deux chercheurs, une réalité commune :
            comment redonner du pouvoir aux territoires sans tomber dans la fragmentation ?
          </p>
          <div className="chips" style={{ marginTop: 4 }}>
            <span className="chip">Démocratie</span>
            <span className="chip">Territoire</span>
            <span className="chip">Programme 2027</span>
          </div>
        </div>
        <div style={{ padding: '0 16px 14px', display: 'flex', gap: 8 }}>
          <span className="btn btn--premium" style={{ flex: 1 }}>★ Regarder en premium</span>
          <span className="btn btn--ghost" style={{ background: 'var(--brand-surface)' }}>♡</span>
        </div>
      </div>
    </div>
  </Phone>
);

/* ---------- 08 · Library ---------- */
const Library = () => (
  <Phone>
    <StatusBar />
    <div className="scr">
      <TopBar back="" title="Ma bibliothèque" />
      <div className="scr__body">
        <div className="chips lib__filter">
          <span className="chip on">Tout</span>
          <span className="chip">Articles</span>
          <span className="chip">Podcasts</span>
          <span className="chip">Vidéos</span>
          <span className="chip">Hors-ligne</span>
        </div>
        <div className="sh"><span className="sh__t serif">Sauvegardés</span><span className="sh__more">14 éléments</span></div>
        <ContentRow kicker="Article" title="Pouvoir d'achat : ce que les chiffres ne disent pas" meta="Sauvegardé hier" tint="alt" />
        <ContentRow kicker="Podcast · S03 · E14" title="Avec Léa Bardin, économiste" meta="54 min · disponible hors-ligne" tint="dk" premium />
        <ContentRow kicker="Vidéo · Débat" title="Démocratie locale, où en sommes-nous ?" meta="1 h 04 · ★ Premium" tint="br" />
        <ContentRow kicker="Analyse" title="L'économie du soin — nouvelle priorité" meta="18 min" tint="gr" />
      </div>
      <TabBar active={2} />
    </div>
  </Phone>
);

/* ---------- 09 · Agenda / Events ---------- */
const Agenda = () => (
  <Phone>
    <StatusBar />
    <div className="scr">
      <BrandHeader action="🗓" />
      <div className="scr__body">
        <div className="sh"><span className="sh__t serif">Prochains <i>rendez-vous</i></span></div>
        <div className="chips" style={{ marginBottom: 10 }}>
          <span className="chip on">À venir</span>
          <span className="chip">En ligne</span>
          <span className="chip">Près de moi</span>
        </div>
        <div className="event">
          <div className="event__date"><div className="d">24</div><div className="m">Mars</div></div>
          <div className="event__meta">
            <h4 className="event__t">Assemblée ouverte · Paris</h4>
            <span className="event__d">19h00 · La Bellevilloise · 180 inscrits</span>
            <span className="event__tags">CERCLE LOCAL · OUVERT</span>
          </div>
        </div>
        <div className="event">
          <div className="event__date"><div className="d">02</div><div className="m">Avril</div></div>
          <div className="event__meta">
            <h4 className="event__t">Atelier programme 2027</h4>
            <span className="event__d">20h00 · En visio · gratuit</span>
            <span className="event__tags">VISIO · MEMBRES</span>
          </div>
        </div>
        <div className="event">
          <div className="event__date"><div className="d">11</div><div className="m">Avril</div></div>
          <div className="event__meta">
            <h4 className="event__t">Débat live — économie du soin</h4>
            <span className="event__d">21h00 · YouTube live · ouvert à tous</span>
            <span className="event__tags">LIVE · GRATUIT</span>
          </div>
        </div>
        <div className="event">
          <div className="event__date"><div className="d">18</div><div className="m">Avril</div></div>
          <div className="event__meta">
            <h4 className="event__t">Cercle local · Lyon</h4>
            <span className="event__d">19h30 · Café associatif · 24 inscrits</span>
            <span className="event__tags">LYON · OUVERT</span>
          </div>
        </div>
      </div>
      <TabBar active={1} />
    </div>
  </Phone>
);

/* ---------- 10 · Community / Join ---------- */
const Community = () => (
  <Phone>
    <StatusBar />
    <div className="scr">
      <BrandHeader action="✦" />
      <div className="scr__body">
        <div className="comm__hero">
          <Kicker premium>◉ COMMUNAUTÉ CIVICA</Kicker>
          <h3 className="t">Rejoignez le <i>mouvement.</i></h3>
          <p className="s">12 400 membres actifs · 84 cercles locaux · 3 600 contributions ce mois.</p>
          <span className="btn btn--premium btn--block">Devenir membre · 9€ / mois</span>
        </div>
        <div className="comm__card">
          <div className="head"><span className="nm">Discord communautaire</span><span className="ic">#</span></div>
          <p className="d">Espace d'échange avec les rédactions, les chercheurs invités et les membres.</p>
          <div className="stat"><span><b>42</b> salons</span><span><b>1.2k</b> en ligne</span></div>
        </div>
        <div className="comm__card">
          <div className="head"><span className="nm">Cercle local · Paris</span><span className="ic">◉</span></div>
          <p className="d">Réunions mensuelles, ateliers, projets locaux. Rejoignez le cercle le plus proche.</p>
          <div className="stat"><span><b>84</b> cercles</span><span><b>Paris</b> · 320 membres</span></div>
        </div>
      </div>
      <TabBar active={1} />
    </div>
  </Phone>
);

/* ---------- 11 · Premium / Support ---------- */
const Premium = () => (
  <Phone>
    <StatusBar dark />
    <div className="scr">
      <div className="topbar"><span className="topbar__back">‹</span><span className="topbar__title">Soutenir Civica</span><span className="topbar__act"></span></div>
      <div className="scr__body" style={{ paddingTop: 4 }}>
        <div className="paywall">
          <div className="crest">C</div>
          <h3 className="t">Soutenez. <i>Recevez plus.</i></h3>
          <p className="d">Votre soutien finance le travail éditorial — et vous ouvre l'app complète.</p>
          <div className="plan">
            <div><div className="nm">Mensuel</div></div>
            <div className="pr">9 €<small> /mois</small></div>
          </div>
          <div className="plan on">
            <div>
              <span className="plan__badge">Le plus soutenu</span>
              <div className="nm">Annuel</div>
            </div>
            <div className="pr">79 €<small> /an · −27%</small></div>
          </div>
          <div className="plan">
            <div><div className="nm">Bienfaiteur</div></div>
            <div className="pr">15 €<small> /mois</small></div>
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--brand-ink-soft)', lineHeight: 1.6 }}>
          <div style={{ display: 'flex', gap: 8, padding: '4px 0' }}><span style={{ color: 'var(--brand-accent)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>✓</span><span>Toutes les analyses, podcasts et vidéos en avant-première</span></div>
          <div style={{ display: 'flex', gap: 8, padding: '4px 0' }}><span style={{ color: 'var(--brand-accent)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>✓</span><span>Accès Discord membres + cercles locaux</span></div>
          <div style={{ display: 'flex', gap: 8, padding: '4px 0' }}><span style={{ color: 'var(--brand-accent)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>✓</span><span>Newsletter hebdo · archives complètes</span></div>
        </div>
        <span className="btn btn--premium btn--block btn--lg" style={{ marginTop: 12 }}>Continuer · 79 € / an</span>
      </div>
    </div>
  </Phone>
);

/* ---------- 12 · Notifications center ---------- */
const Notifications = () => (
  <Phone>
    <StatusBar />
    <div className="scr">
      <TopBar back="" title="Notifications" action="✓" />
      <div className="scr__body">
        <div className="chips" style={{ marginBottom: 10 }}>
          <span className="chip on">Toutes</span>
          <span className="chip">Non lues</span>
          <span className="chip">Mentions</span>
        </div>
        <div className="list">
          <div className="list__row">
            <span className="ic">✎</span>
            <div className="meta">
              <h4 className="t">Nouvelle analyse · L'économie du soin</h4>
              <span className="d">Publié il y a 18 min · 22 min de lecture</span>
            </div>
            <span className="dot"></span>
          </div>
          <div className="list__row">
            <span className="ic">▷</span>
            <div className="meta">
              <h4 className="t">Podcast · Avec Léa Bardin</h4>
              <span className="d">S03 · E14 · 54 min · Aujourd'hui</span>
            </div>
            <span className="dot"></span>
          </div>
          <div className="list__row">
            <span className="ic">●</span>
            <div className="meta">
              <h4 className="t">Live dans 1 heure — Démocratie locale</h4>
              <span className="d">Débat en direct · 21h00</span>
            </div>
            <span className="dot"></span>
          </div>
          <div className="list__row">
            <span className="ic">☷</span>
            <div className="meta">
              <h4 className="t">Rappel · Assemblée ouverte Paris</h4>
              <span className="d">Demain 19h00 · La Bellevilloise</span>
            </div>
            <span className="v">DEMAIN</span>
          </div>
          <div className="list__row">
            <span className="ic">✦</span>
            <div className="meta">
              <h4 className="t">3 nouveaux fils sur le Discord</h4>
              <span className="d">Salon économie du soin</span>
            </div>
            <span className="v">HIER</span>
          </div>
        </div>
      </div>
      <TabBar active={0} />
    </div>
  </Phone>
);

/* ---------- 13 · Profile / Account ---------- */
const Profile = () => (
  <Phone>
    <StatusBar />
    <div className="scr">
      <div className="p2">
        <div className="p2__top">
          <span className="ttl serif">Profil</span>
          <span className="ic">⚙</span>
        </div>
        <div className="p2__body">
          <div className="p2__id">
            <span className="p2__av"></span>
            <div style={{ flex: 1 }}>
              <h3 className="nm">Camille Renard</h3>
              <span className="p2__status">Membre · Bienfaiteur</span>
              <span className="p2__since">Synchro prête · adhérente depuis mars 2024</span>
            </div>
          </div>

          <div className="p2__resume">
            <span className="k">◐ Reprendre · synchronisé</span>
            <div className="row2">
              <span className="cov"></span>
              <div style={{ minWidth: 0 }}>
                <div className="t">L'économie du soin</div>
                <div className="sub">Épisode · 22:48 restant · 62 %</div>
              </div>
              <span className="play">▶</span>
            </div>
            <div className="bar"></div>
          </div>

          <div className="p2__stats">
            <div className="p2__stat"><span className="ic">⌖</span><span className="n">12</span><span className="l">Enregistrés</span></div>
            <div className="p2__stat"><span className="ic">↓</span><span className="n">4</span><span className="l">Hors-ligne</span></div>
            <div className="p2__stat"><span className="ic">◷</span><span className="n">31</span><span className="l">Historique</span></div>
          </div>

          <div className="p2__sec">
            <Kicker>— Ma bibliothèque</Kicker>
            <div className="p2row">
              <span className="ic">⌖</span>
              <div className="meta">
                <span className="t">Enregistrements <span className="gate gate--free">Gratuit</span></span>
                <span className="d">12 contenus mis de côté</span>
              </div>
              <span className="chev">›</span>
            </div>
            <div className="p2row">
              <span className="ic">↓</span>
              <div className="meta">
                <span className="t">Téléchargements <span className="gate gate--premium">Premium</span></span>
                <span className="d">4 épisodes · 1.2 Go hors-ligne</span>
              </div>
              <span className="chev">›</span>
            </div>
            <div className="p2row">
              <span className="ic">≣</span>
              <div className="meta">
                <span className="t">Mes listes <span className="gate gate--premium">Premium</span></span>
                <span className="d">3 listes personnelles</span>
              </div>
              <span className="chev">›</span>
            </div>
            <div className="p2row">
              <span className="ic">◷</span>
              <div className="meta">
                <span className="t">Historique &amp; progression <span className="gate gate--member">Membre</span></span>
                <span className="d">Reprise synchronisée sur vos appareils</span>
              </div>
              <span className="chev">›</span>
            </div>
          </div>

          <div className="p2__sec">
            <Kicker>— Compte</Kicker>
            <div className="p2row">
              <span className="ic">★</span>
              <div className="meta">
                <span className="t">Abonnement · Annuel</span>
                <span className="d">Renouvellement le 14 mars 2027</span>
              </div>
              <span className="chev">›</span>
            </div>
            <div className="p2row">
              <span className="ic">⚙</span>
              <div className="meta">
                <span className="t">Préférences &amp; notifications</span>
                <span className="d">Thème, langue, alertes push</span>
              </div>
              <span className="chev">›</span>
            </div>
          </div>
        </div>
      </div>
      <TabBar active={3} />
    </div>
  </Phone>
);

/* ---------- 14 · Search / Explore ---------- */
const Search = () => (
  <Phone>
    <StatusBar />
    <div className="scr">
      <div className="topbar"><span className="topbar__back">‹</span><span className="topbar__title">Explorer</span><span className="topbar__act"></span></div>
      <div className="scr__body">
        <div className="search">
          <span className="glass">⌕</span>
          <span>Chercher analyses, podcasts, événements…</span>
        </div>

        <div className="sh"><span className="sh__t serif">Catégories</span></div>
        <div className="search__cats">
          <div className="search__cat"><span className="ic">✎</span><span className="nm">Analyses</span><span className="ct">128 ARTICLES</span></div>
          <div className="search__cat"><span className="ic">▷</span><span className="nm">Podcasts</span><span className="ct">64 ÉPISODES</span></div>
          <div className="search__cat"><span className="ic">▶</span><span className="nm">Vidéos</span><span className="ct">42 DÉBATS</span></div>
          <div className="search__cat"><span className="ic">☷</span><span className="nm">Agenda</span><span className="ct">12 À VENIR</span></div>
        </div>

        <div className="sh" style={{ paddingTop: 4 }}><span className="sh__t serif">Tendances <i>cette semaine</i></span></div>
        <div className="search__trending">
          <span className="chip">Programme 2027</span>
          <span className="chip">Démocratie locale</span>
          <span className="chip">Économie du soin</span>
          <span className="chip">Pouvoir d'achat</span>
          <span className="chip">Cercles locaux</span>
          <span className="chip">Léa Bardin</span>
        </div>
      </div>
      <TabBar active={1} />
    </div>
  </Phone>
);

/* ---------- 15 · Category page ---------- */
const Category = () => (
  <Phone>
    <StatusBar />
    <div className="scr">
      <div className="topbar"><span className="topbar__back">‹</span><span className="topbar__title">Catégorie</span><span className="topbar__act">⌕</span></div>
      <div className="scr__body">
        <div className="cat__hero">
          <Kicker accent>◉ ANALYSES</Kicker>
          <h2 className="t">Programme <i>2027.</i></h2>
          <p className="d">Le travail éditorial qui prépare le cycle. Articles, débats, rencontres locales.</p>
          <div className="stats"><span>128 ARTICLES</span><span>·</span><span>14 DÉBATS</span><span>·</span><span>HEBDO</span></div>
        </div>
        <div className="chips" style={{ marginBottom: 8 }}>
          <span className="chip on">Récent</span>
          <span className="chip">Populaire</span>
          <span className="chip">★ Premium</span>
        </div>
        <ContentRow kicker="Analyse · Aujourd'hui" title="L'économie du soin — nouvelle priorité" meta="22 min · ★ Premium" tint="alt" premium />
        <ContentRow kicker="Enquête · 12 mars" title="Pouvoir d'achat : derrière les chiffres" meta="18 min" tint="br" />
        <ContentRow kicker="Tribune · 10 mars" title="Démocratie locale, où en sommes-nous ?" meta="9 min" tint="gr" />
        <ContentRow kicker="Analyse · 08 mars" title="Repenser nos indicateurs économiques" meta="14 min · ★ Premium" tint="dk" premium />
      </div>
      <TabBar active={0} />
    </div>
  </Phone>
);

Object.assign(window, {
  Onboarding1, Onboarding2, HomeFeed, ArticleDetail, PodcastDetail,
  AudioPlayer, VideoDetail, Library, Agenda, Community, Premium,
  Notifications, Profile, Search, Category,
});
