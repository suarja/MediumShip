/* global React */
// proto-boussole.jsx — navigable documentary screens for the prototype's
// "Boussole citoyenne 2027" vertical. Content-only; uses NavCtx from proto-screens.jsx.

// Babel scripts have isolated scope: pull shared helpers from window.
const useNav = window.useNav;

const BOUSSOLE_VARS = {
  '--brand-bg': '#F4F1E8', '--brand-surface': '#FFFFFF', '--brand-surface-2': '#FAF7EE',
  '--brand-ink': '#16130E', '--brand-ink-2': '#3C372F', '--brand-ink-soft': '#756E62', '--brand-muted': '#B3AC9D',
  '--brand-rule': 'rgba(22,19,14,.08)', '--brand-rule-2': 'rgba(22,19,14,.14)',
  '--brand-accent': '#20457A', '--brand-accent-soft': 'rgba(32,69,122,.12)', '--brand-premium': '#C8964A',
  '--font-display': '"Newsreader", Georgia, serif', '--font-body': '"Hanken Grotesk", system-ui, sans-serif', '--font-mono': '"JetBrains Mono", monospace',
};

const SB = ({ type, children }) => <span className={`srcbadge srcbadge--${type}`}>{children}</span>;
const BK = ({ children, accent }) => <span className={`kicker ${accent ? 'kicker--accent' : ''}`}>{children}</span>;

/* documentary content set */
const B = {
  presidentielle: { id: 'presidentielle', kind: 'dossier', title: 'Présidentielle 2027' },
  eco: { id: 'eco', kind: 'thematique', title: 'Économie' },
  taxe: { id: 'taxe', kind: 'insight', title: 'Faut-il taxer davantage les hauts patrimoines ?' },
  candidatA: { id: 'candidatA', kind: 'entity', title: 'Candidat·e A' },
  dette: { id: 'dette', kind: 'article', kicker: 'Analyse · Économie', title: 'Comprendre la dette publique en 5 points', meta: '12 min · sourcé', premium: false },
  conseil: { id: 'conseil', kind: 'video', kicker: 'Vidéo · Institutions', title: 'À quoi sert le Conseil constitutionnel ?', meta: '8 min · explicatif', premium: false },
  transition: { id: 'transition', kind: 'podcast', kicker: 'Podcast · Écologie', title: 'Transition : les chiffres derrière les promesses', meta: '34 min', premium: false },
};

const BRow = ({ item, tint }) => {
  const nav = useNav();
  return (
    <div className="row tap" onClick={() => nav.openContent(item)}>
      <div className={`row__media ${tint || ''}`}></div>
      <div className="row__meta">
        <span className="k">{item.kicker}</span>
        <h4 className="row__t">{item.title}</h4>
        <span className="row__d">{item.meta}</span>
      </div>
    </div>
  );
};

/* ---------- ROOT · Comprendre (home) ---------- */
const BHomeRoot = () => {
  const nav = useNav();
  return (
    <>
      <div className="bhdr">
        <div className="bhdr__logo"><i>Boussole</i><span className="dot"></span></div>
        <div className="bhdr__act"><span className="bhdr__ic tap" onClick={() => nav.push('sources')}>◆</span><span className="bhdr__av tap" onClick={() => nav.go('profile')}></span></div>
      </div>
      <div className="proto-pad">
        <div className="chips" style={{ marginBottom: 14 }}>
          <span className="chip on">À la une</span>
          <span className="chip tap" onClick={() => nav.go('explore')}>Dossiers</span>
          <span className="chip tap" onClick={() => nav.go('explore')}>Thématiques</span>
          <span className="chip tap" onClick={() => nav.push('sources')}>Sources</span>
        </div>

        <div className="bdossier tap" style={{ marginBottom: 14 }} onClick={() => nav.push('dossier', B.presidentielle)}>
          <span className="bg"></span>
          <div className="meta">
            <span className="k">◆ Dossier · à la une</span>
            <h3 className="t">Présidentielle <i>2027.</i></h3>
            <div className="prog"><span>12 contenus</span><span className="bar" style={{ '--p': '30%' }}></span><span>30%</span></div>
          </div>
        </div>

        <div className="sh"><span className="sh__t serif">Proposition <i>du jour</i></span></div>
        <div className="insight tap" style={{ marginBottom: 14 }} onClick={() => nav.push('insight', B.taxe)}>
          <span className="k">◉ Proposition · Économie</span>
          <h4 className="insight__q">Faut-il taxer davantage les hauts patrimoines ?</h4>
          <p className="insight__d">Une mesure clivante du débat fiscal. Trois familles de positions, plusieurs sources officielles.</p>
          <div className="insight__foot"><span className="meta">5 SOURCES · 3 POSITIONS</span><span className="insight__bk" onClick={(e) => { e.stopPropagation(); nav.toast('Sauvegardé'); }}>♡</span></div>
        </div>

        <div className="sh"><span className="sh__t serif">Pour <i>comprendre</i></span><span className="sh__more tap" onClick={() => nav.push('thematique', B.eco)}>Tout voir →</span></div>
        <BRow item={B.dette} tint="alt" />
        <BRow item={B.conseil} tint="dk" />
        <BRow item={B.transition} tint="br" />

        <div className="callout tap" style={{ marginTop: 14 }} onClick={() => nav.go('explore')}>
          <span className="k">◉ Comprendre avant de choisir</span>
          <span className="d">Explorez les thématiques : propositions, positions et sources, sans bruit médiatique.</span>
        </div>
        <span className="btn btn--primary btn--block tap" style={{ marginTop: 12 }} onClick={() => nav.go('explore')}>Explorer les thématiques</span>
      </div>
    </>
  );
};

/* ---------- ROOT · Explorer (thématiques + dossiers) ---------- */
const BExploreRoot = () => {
  const nav = useNav();
  const T = [['✎', 'Économie', '24'], ['♁', 'Santé', '12'], ['✦', 'Éducation', '9'], ['⚖', 'Sécurité', '11'], ['◉', 'Institutions', '15'], ['☘', 'Écologie', '18'], ['✈', 'International', '8'], ['⚒', 'Travail', '10']];
  return (
    <>
      <div className="proto-top"><span className="proto-top__title serif" style={{ paddingLeft: 6 }}>Explorer</span><span className="proto-top__act tap" onClick={() => nav.toast('Recherche — démo')}>⌕</span></div>
      <div className="proto-pad">
        <div className="search tap" onClick={() => nav.toast('Recherche — démo')}><span className="glass">⌕</span><span>Chercher un sujet, une proposition…</span></div>

        <div className="sh"><span className="sh__t serif">Dossiers</span><span className="sh__more tap" onClick={() => nav.push('dossier', B.presidentielle)}>Tout voir →</span></div>
        <div className="ecoll" style={{ marginBottom: 8 }}>
          <div className="ecoll__card tap" style={{ minHeight: 96 }} onClick={() => nav.push('dossier', B.presidentielle)}><span className="bg a"></span><div className="meta"><span className="by">◆ Dossier central</span><h3 className="nm">Présidentielle 2027</h3><span className="ct">12 contenus · 30%</span></div></div>
        </div>

        <div className="sh"><span className="sh__t serif">Thématiques</span></div>
        <div className="search__cats">
          {T.map((c, i) => (
            <div className="search__cat tap" key={i} onClick={() => nav.push('thematique', B.eco)}><span className="ic">{c[0]}</span><span className="nm">{c[1]}</span><span className="ct">{c[2]} CONTENUS</span></div>
          ))}
        </div>

        <div className="sh" style={{ paddingTop: 4 }}><span className="sh__t serif">Aller plus loin</span></div>
        <div className="search__cats">
          <div className="search__cat tap" onClick={() => nav.push('compare', B.eco)}><span className="ic">⇄</span><span className="nm">Comparer</span><span className="ct">LES POSITIONS</span></div>
          <div className="search__cat tap" onClick={() => nav.push('sources')}><span className="ic">◆</span><span className="nm">Sources</span><span className="ct">OFFICIELLES · RAPPORTS</span></div>
        </div>
      </div>
    </>
  );
};

/* ---------- ROOT · Bibliothèque ---------- */
const BLibraryRoot = () => {
  const nav = useNav();
  if (nav.member === 'guest') {
    return (
      <>
        <div className="proto-top"><span className="proto-top__title serif" style={{ paddingLeft: 6 }}>Bibliothèque</span><span className="proto-top__act"></span></div>
        <div className="gate-screen">
          <div className="crest">B</div>
          <h3>Gardez vos repères <i>à portée.</i></h3>
          <p>Connectez-vous pour sauvegarder propositions, fiches et analyses, et suivre votre progression dans les dossiers.</p>
          <span className="btn btn--primary btn--block btn--lg tap" onClick={() => nav.setMember('member')}>Se connecter</span>
          <span className="btn btn--ghost btn--block tap" onClick={() => nav.go('home')}>Continuer en invité</span>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="proto-top"><span className="proto-top__title serif" style={{ paddingLeft: 6 }}>Bibliothèque</span><span className="proto-top__act tap" onClick={() => nav.toast('Recherche — démo')}>⌕</span></div>
      <div className="proto-pad">
        <div className="chips" style={{ marginBottom: 12 }}>
          <span className="chip on">Tout</span><span className="chip">Propositions</span><span className="chip">Candidats</span><span className="chip">Dossiers</span><span className="chip">Médias</span>
        </div>
        <div className="sh"><span className="sh__t serif">Reprendre</span></div>
        <div className="bprog tap" style={{ marginBottom: 14 }} onClick={() => nav.push('dossier', B.presidentielle)}>
          <span className="k">◐ Dossier en cours</span>
          <h4 className="t">Présidentielle 2027 — « Le rôle du Parlement »</h4>
          <div className="bar" style={{ '--p': '30%' }}></div>
          <span className="pct">4 / 12 contenus · 30%</span>
        </div>
        <div className="sh"><span className="sh__t serif">Sauvegardés <span className="gate gate--free">Gratuit</span></span></div>
        <div className="insight tap" style={{ marginBottom: 10 }} onClick={() => nav.push('insight', B.taxe)}>
          <span className="k">◉ Proposition · Économie</span>
          <h4 className="insight__q">Taxer les hauts patrimoines ?</h4>
          <div className="insight__foot"><span className="meta">5 SOURCES</span><span className="insight__bk">♥</span></div>
        </div>
        <div className="entity tap" style={{ marginBottom: 10 }} onClick={() => nav.push('entity', B.candidatA)}><span className="entity__av"></span><div className="entity__meta"><h4 className="entity__nm">Candidat·e A</h4><span className="entity__sub">Fiche sauvegardée</span></div><span className="entity__type">Candidat</span></div>
        <BRow item={B.dette} tint="alt" />
      </div>
    </>
  );
};

/* ---------- ROOT · Profil ---------- */
const BProfileRoot = () => {
  const nav = useNav();
  if (nav.member === 'guest') {
    return (
      <>
        <div className="proto-top"><span className="proto-top__title serif" style={{ paddingLeft: 6 }}>Profil</span><span className="proto-top__act"></span></div>
        <div className="gate-screen">
          <div className="crest">B</div>
          <h3>Suivez vos <i>sujets.</i></h3>
          <p>Créez un compte gratuit pour suivre des thématiques, sauvegarder et reprendre vos dossiers. Aucun profilage politique.</p>
          <span className="btn btn--primary btn--block btn--lg tap" onClick={() => nav.setMember('member')}>Créer un compte</span>
          <span className="btn btn--ghost btn--block tap" onClick={() => nav.go('home')}>Continuer en invité</span>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="p2__top"><span className="ttl serif">Profil</span><span className="ic tap" onClick={() => nav.toast('Réglages — démo')}>⚙</span></div>
      <div className="proto-pad">
        <div className="p2__id">
          <span className="p2__av" style={{ background: 'linear-gradient(135deg,#3a6aa8,#20457A)' }}></span>
          <div style={{ flex: 1 }}>
            <h3 className="nm">Votre profil</h3>
            <span className="p2__status" style={{ color: '#20457A' }}>◉ Lecteur·rice citoyen·ne</span>
            <span className="p2__since">3 dossiers en cours · 14 contenus lus</span>
          </div>
        </div>

        <div className="p2__sec">
          <BK>— Thèmes suivis</BK>
          <div className="chips" style={{ marginTop: 4 }}>
            <span className="chip on">Économie</span><span className="chip on">Écologie</span><span className="chip on">Institutions</span><span className="chip tap" onClick={() => nav.go('explore')}>+ Ajouter</span>
          </div>
        </div>
        <div className="p2__sec">
          <BK>— Mon activité</BK>
          <div className="p2row tap" onClick={() => nav.push('dossier', B.presidentielle)}><span className="ic">◐</span><div className="meta"><span className="t">Progression</span><span className="d">3 dossiers en cours</span></div><span className="chev">›</span></div>
          <div className="p2row tap" onClick={() => nav.go('library')}><span className="ic">⌖</span><div className="meta"><span className="t">Sauvegardés <span className="gate gate--free">Gratuit</span></span><span className="d">Propositions, fiches, médias</span></div><span className="chev">›</span></div>
          <div className="p2row"><span className="ic">◷</span><div className="meta"><span className="t">Historique de lecture</span><span className="d">14 contenus</span></div><span className="chev">›</span></div>
        </div>
        <div className="p2__sec">
          <BK>— Préférences</BK>
          <div className="p2row"><span className="ic">🔔</span><div className="meta"><span className="t">Notifications</span><span className="d">Nouveaux contenus de vos thèmes</span></div><span className="chev">›</span></div>
          <div className="p2row"><span className="ic">⚿</span><div className="meta"><span className="t">Confidentialité</span><span className="d">Aucun profilage politique · données minimales</span></div><span className="chev">›</span></div>
          <div className="p2row tap" onClick={() => nav.setMember('guest')}><span className="ic">⎋</span><div className="meta"><span className="t">Se déconnecter</span><span className="d">Repasser en mode invité</span></div><span className="chev">›</span></div>
        </div>
      </div>
    </>
  );
};

/* ---------- PUSHED views ---------- */
const BDossierView = () => {
  const nav = useNav();
  return (
    <>
      <div className="proto-top"><span className="proto-top__back tap" onClick={nav.pop}>‹</span><span className="proto-top__title">Dossier</span><span className="proto-top__act tap" onClick={() => nav.toast('Sauvegardé')}>♡</span></div>
      <div className="proto-pad">
        <div className="cat__hero">
          <BK accent>◆ DOSSIER CENTRAL</BK>
          <h2 className="t">Présidentielle <i>2027.</i></h2>
          <p className="d">Tout pour comprendre l'élection : enjeux, propositions, candidats et sources, pas à pas.</p>
          <div className="stats"><span>12 CONTENUS</span><span>·</span><span>6 THÉMATIQUES</span><span>·</span><span>SOURCÉ</span></div>
        </div>
        <div className="bprog tap" style={{ margin: '0 0 14px' }} onClick={() => nav.openContent(B.dette)}>
          <span className="k">◐ Votre progression</span>
          <h4 className="t">Reprendre — « Le rôle du Parlement »</h4>
          <div className="bar" style={{ '--p': '30%' }}></div>
          <span className="pct">4 / 12 contenus · 30%</span>
        </div>
        <div className="sh"><span className="sh__t serif">Thématiques liées</span></div>
        <div className="chips" style={{ marginBottom: 14 }}>
          <span className="chip tap" onClick={() => nav.push('thematique', B.eco)}>Économie</span><span className="chip">Institutions</span><span className="chip">Écologie</span><span className="chip">Santé</span>
        </div>
        <div className="sh"><span className="sh__t serif">Propositions <i>clés</i></span></div>
        <div className="insight tap" style={{ marginBottom: 14 }} onClick={() => nav.push('insight', B.taxe)}>
          <span className="k">◉ Proposition</span>
          <h4 className="insight__q">Faut-il taxer les hauts patrimoines ?</h4>
          <div className="insight__foot"><span className="meta">5 SOURCES · 3 POSITIONS</span><span className="insight__bk">♡</span></div>
        </div>
        <div className="sh"><span className="sh__t serif">Pour comprendre</span></div>
        <BRow item={B.dette} tint="alt" />
        <BRow item={B.conseil} tint="dk" />
        <div className="sh"><span className="sh__t serif">Sources</span><span className="sh__more link-src tap" onClick={() => nav.push('sources')}>Voir →</span></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}><SB type="official">Programmes officiels</SB><SB type="report">Rapports</SB><SB type="interview">Interviews</SB></div>
      </div>
    </>
  );
};

const BThematiqueView = () => {
  const nav = useNav();
  return (
    <>
      <div className="proto-top"><span className="proto-top__back tap" onClick={nav.pop}>‹</span><span className="proto-top__title">Thématique</span><span className="proto-top__act tap" onClick={() => nav.toast('Sauvegardé')}>♡</span></div>
      <div className="proto-pad">
        <div className="cat__hero">
          <BK accent>◉ THÉMATIQUE</BK>
          <h2 className="t">Économie.</h2>
          <p className="d">Fiscalité, dette, pouvoir d'achat, emploi. Les grands arbitrages de 2027, expliqués et sourcés.</p>
          <div className="stats"><span>24 CONTENUS</span><span>·</span><span>9 PROPOSITIONS</span></div>
        </div>
        <div className="sh"><span className="sh__t serif">Grandes questions</span></div>
        <div className="list" style={{ marginBottom: 6 }}>
          <div className="list__row tap" onClick={() => nav.push('insight', B.taxe)}><span className="ic">?</span><div className="meta"><h4 className="t">Faut-il taxer davantage les hauts patrimoines ?</h4></div><span className="dot" style={{ background: 'var(--brand-accent)' }}></span></div>
          <div className="list__row tap" onClick={() => nav.push('compare', B.eco)}><span className="ic">?</span><div className="meta"><h4 className="t">Réduire la dette sans casser la croissance ?</h4></div><span className="dot" style={{ background: 'var(--brand-accent)' }}></span></div>
        </div>
        <div className="sh"><span className="sh__t serif">Entités liées</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          <div className="entity tap" onClick={() => nav.push('entity', B.candidatA)}><span className="entity__av"></span><div className="entity__meta"><h4 className="entity__nm">Candidat·e A</h4><span className="entity__sub">Mouvement · centre</span></div><span className="entity__type">Candidat</span></div>
        </div>
        <div className="sh"><span className="sh__t serif">Pour comprendre</span></div>
        <BRow item={B.dette} tint="alt" />
        <BRow item={B.transition} tint="dk" />
      </div>
    </>
  );
};

const BInsightView = () => {
  const nav = useNav();
  return (
    <>
      <div className="proto-top"><span className="proto-top__back tap" onClick={nav.pop}>‹</span><span className="proto-top__title">Proposition</span><span className="proto-top__act tap" onClick={() => nav.toast('Sauvegardé')}>♡</span></div>
      <div className="proto-pad">
        <BK accent>◉ PROPOSITION · ÉCONOMIE</BK>
        <h2 className="article__title" style={{ margin: '8px 0 10px' }}>Faut-il taxer davantage les <i>hauts patrimoines</i> ?</h2>
        <p className="article__lede" style={{ marginBottom: 12 }}>Prélever davantage sur les patrimoines les plus élevés pour financer les services publics ou réduire la dette.</p>
        <div className="callout" style={{ marginBottom: 14 }}><span className="k">◉ Pourquoi c'est important</span><span className="d">Touche à l'équité fiscale, aux recettes de l'État et à l'attractivité économique.</span></div>
        <div className="sh"><span className="sh__t serif">Arguments principaux</span></div>
        <div className="list" style={{ marginBottom: 8 }}>
          <div className="list__row"><span className="ic">+</span><div className="meta"><h4 className="t">Justice fiscale &amp; recettes</h4><span className="d">Financer les services publics, réduire les inégalités.</span></div></div>
          <div className="list__row"><span className="ic">−</span><div className="meta"><h4 className="t">Risque d'évasion fiscale</h4><span className="d">Effet incertain sur les recettes réelles.</span></div></div>
        </div>
        <div className="sh"><span className="sh__t serif">Positions possibles</span></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          <span className="stancebadge"><span className="ini" style={{ background: '#20457A' }}>A</span>Pour, seuils élevés</span>
          <span className="stancebadge"><span className="ini" style={{ background: '#6B6B66' }}>B</span>Contre</span>
          <span className="stancebadge"><span className="ini" style={{ background: '#A8432A' }}>C</span>Réforme alternative</span>
        </div>
        <div className="sh"><span className="sh__t serif">Sources</span><span className="sh__more link-src tap" onClick={() => nav.push('sources')}>5 sources →</span></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}><SB type="official">Programme officiel</SB><SB type="report">Rapport</SB><SB type="article">Analyse</SB></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="btn btn--primary tap" style={{ flex: 1 }} onClick={() => nav.toast('Sauvegardé')}>♡ Sauvegarder</span>
          <span className="btn btn--ghost tap" style={{ flex: 1, background: 'var(--brand-surface)' }} onClick={() => nav.push('compare', B.eco)}>⇄ Comparer</span>
        </div>
      </div>
    </>
  );
};

const BEntityView = () => {
  const nav = useNav();
  return (
    <>
      <div className="proto-top"><span className="proto-top__back tap" onClick={nav.pop}>‹</span><span className="proto-top__title">Fiche</span><span className="proto-top__act tap" onClick={() => nav.toast('Sauvegardé')}>♡</span></div>
      <div className="proto-pad">
        <div className="p2__id" style={{ marginBottom: 14 }}>
          <span className="entity__av" style={{ width: 60, height: 60 }}></span>
          <div style={{ flex: 1 }}><h3 className="entity__nm" style={{ fontSize: 21 }}>Candidat·e A</h3><span className="entity__sub">Mouvement · centre · depuis 2019</span><div style={{ marginTop: 6 }}><span className="entity__type">Candidat</span></div></div>
        </div>
        <p className="bintro" style={{ margin: '0 0 14px' }}>Présentation factuelle : parcours, mouvement, programme et positions, avec sources officielles.</p>
        <div className="callout tap" style={{ marginBottom: 14 }} onClick={() => nav.push('programme', B.candidatA)}><span className="k">◆ Programme associé</span><span className="d">« Programme 2027 » — 38 mesures · 6 thématiques.</span></div>
        <div className="sh"><span className="sh__t serif">Thématiques couvertes</span></div>
        <div className="chips" style={{ marginBottom: 14 }}><span className="chip tap" onClick={() => nav.push('thematique', B.eco)}>Économie</span><span className="chip">Santé</span><span className="chip">Écologie</span></div>
        <div className="sh"><span className="sh__t serif">Propositions principales</span></div>
        <div className="insight tap" style={{ marginBottom: 12 }} onClick={() => nav.push('insight', B.taxe)}><span className="k">◉ Économie</span><h4 className="insight__q">Taxe sur les hauts patrimoines, seuils élevés</h4><div className="insight__foot"><span className="meta">POSITION SOURCÉE</span><span className="insight__bk">♡</span></div></div>
        <div className="sh"><span className="sh__t serif">Sources officielles</span></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}><SB type="official">Programme officiel</SB><SB type="interview">Interview</SB></div>
      </div>
    </>
  );
};

const BProgrammeView = () => {
  const nav = useNav();
  return (
    <>
      <div className="proto-top"><span className="proto-top__back tap" onClick={nav.pop}>‹</span><span className="proto-top__title">Programme</span><span className="proto-top__act"></span></div>
      <div className="proto-pad">
        <div className="cat__hero">
          <BK accent>◆ PROGRAMME · 2027</BK>
          <h2 className="t">Programme A.</h2>
          <p className="d">Document de référence du candidat·e A. Présenté tel quel, avec lien vers la source officielle.</p>
          <div className="stats"><span>38 MESURES</span><span>·</span><span>6 THÉMATIQUES</span></div>
        </div>
        <div className="entity tap" style={{ marginBottom: 14 }} onClick={() => nav.pop()}><span className="entity__av"></span><div className="entity__meta"><h4 className="entity__nm">Candidat·e A</h4><span className="entity__sub">Propriétaire du programme</span></div><span className="entity__chev">›</span></div>
        <div className="sh"><span className="sh__t serif">Mesures principales</span></div>
        <div className="list" style={{ marginBottom: 8 }}>
          <div className="list__row"><span className="ic">1</span><div className="meta"><h4 className="t">Réforme de la fiscalité du patrimoine</h4><span className="d">Économie</span></div></div>
          <div className="list__row"><span className="ic">2</span><div className="meta"><h4 className="t">Plan d'investissement transition</h4><span className="d">Écologie</span></div></div>
          <div className="list__row"><span className="ic">3</span><div className="meta"><h4 className="t">Renforcement de l'hôpital public</h4><span className="d">Santé</span></div></div>
        </div>
        <div className="callout"><span className="k">◉ Source officielle</span><span className="d">Programme publié par le candidat·e — consultez le document original.</span></div>
        <div style={{ marginTop: 8 }}><SB type="official">Programme officiel · PDF</SB></div>
      </div>
    </>
  );
};

const BCompareView = () => {
  const nav = useNav();
  return (
    <>
      <div className="proto-top"><span className="proto-top__back tap" onClick={nav.pop}>‹</span><span className="proto-top__title">Comparer</span><span className="proto-top__act"></span></div>
      <div className="proto-pad">
        <p className="bintro" style={{ margin: '0 0 14px' }}>Mettez en regard plusieurs positions sur une même question. Affichage neutre, ordre aléatoire.</p>
        <div className="compare">
          <div className="compare__q"><span className="k">◉ ÉCONOMIE · PROPOSITION</span><span className="t serif">Fiscalité des hauts patrimoines</span></div>
          <div className="compare__row"><div className="compare__ent"><span className="av" style={{ background: 'linear-gradient(135deg,#3a6aa8,#20457A)' }}></span><span className="nm serif">A</span></div><div><div className="compare__pos">Réduire la dépense publique plutôt qu'augmenter la fiscalité.</div><div className="compare__src">Source : programme officiel</div></div></div>
          <div className="compare__row"><div className="compare__ent"><span className="av" style={{ background: 'linear-gradient(135deg,#8a8478,#6B6B66)' }}></span><span className="nm serif">B</span></div><div><div className="compare__pos">Augmenter l'investissement public, financé par l'emprunt.</div><div className="compare__src">Source : interview</div></div></div>
          <div className="compare__row"><div className="compare__ent"><span className="av" style={{ background: 'linear-gradient(135deg,#bd5e42,#A8432A)' }}></span><span className="nm serif">C</span></div><div><div className="compare__pos">Taxer les hauts patrimoines pour financer la transition.</div><div className="compare__src">Source : programme officiel</div></div></div>
          <div className="compare__note">Les positions sont citées d'après les sources. Aucune n'est mise en avant.</div>
        </div>
        <span className="btn btn--ghost btn--block tap" style={{ marginTop: 14, background: 'var(--brand-surface)' }} onClick={() => nav.push('sources')}>Voir les sources de chaque position</span>
      </div>
    </>
  );
};

const BSourcesView = () => {
  const nav = useNav();
  return (
    <>
      <div className="proto-top"><span className="proto-top__back tap" onClick={nav.pop}>‹</span><span className="proto-top__title">Sources</span><span className="proto-top__act tap" onClick={() => nav.toast('Recherche — démo')}>⌕</span></div>
      <div className="proto-pad">
        <p className="bintro" style={{ margin: '0 0 14px' }}>Chaque contenu cite ses sources. Voici les références, par type.</p>
        <div className="chips" style={{ marginBottom: 12 }}><span className="chip on">Toutes</span><span className="chip">Officielles</span><span className="chip">Rapports</span><span className="chip">Interviews</span></div>
        <div className="list">
          <div className="list__row"><span className="ic" style={{ background: 'rgba(32,69,122,.12)', color: '#20457A' }}>◆</span><div className="meta"><h4 className="t">Programme officiel — Candidat·e A</h4><span className="d">Document de campagne · PDF</span></div><SB type="official">Officiel</SB></div>
          <div className="list__row"><span className="ic">▤</span><div className="meta"><h4 className="t">Rapport sur la dette publique</h4><span className="d">Institution publique · 2026</span></div><SB type="report">Rapport</SB></div>
          <div className="list__row"><span className="ic">▷</span><div className="meta"><h4 className="t">Interview — politique économique</h4><span className="d">Média partenaire · vidéo</span></div><SB type="interview">Interview</SB></div>
          <div className="list__row"><span className="ic">✎</span><div className="meta"><h4 className="t">Analyse — fiscalité comparée</h4><span className="d">Rédaction Boussole</span></div><SB type="article">Analyse</SB></div>
        </div>
        <div className="callout" style={{ marginTop: 12 }}><span className="k">◉ À vérifier</span><span className="d">Les positions évoluent. Vérifiez toujours la date et la source d'origine.</span></div>
      </div>
    </>
  );
};

const BArticleView = ({ item }) => {
  const nav = useNav();
  const it = item || B.dette;
  return (
    <>
      <div className="article" style={{ minHeight: '100%' }}>
        <div className="article__cover" style={{ height: 190, background: 'linear-gradient(135deg,#20457A,#122742)' }}>
          <div className="proto-top"><span className="proto-top__back tap" style={{ color: '#fff' }} onClick={nav.pop}>‹</span><span className="proto-top__act tap" style={{ color: '#fff' }} onClick={() => nav.toast('Partager — démo')}>↗</span></div>
        </div>
        <div className="article__body">
          <BK accent>◉ ANALYSE · ÉCONOMIE</BK>
          <h2 className="article__title">{it.title}<i>.</i></h2>
          <div className="article__meta"><span className="av"></span><div><div className="a">par la rédaction</div><div className="d">12 MIN · SOURCÉ</div></div></div>
          <p className="article__lede">Ce qu'il faut savoir pour comprendre les débats, sans jargon.</p>
          <p className="article__para">La dette publique correspond à l'ensemble des emprunts de l'État. Elle se mesure en proportion du PIB et reflète des choix budgétaires accumulés.</p>
          <div className="callout" style={{ margin: '4px 0 10px' }}><span className="k">◉ Ce contenu est lié à</span><span className="d">Thématique Économie · Proposition « hauts patrimoines » · 3 sources.</span></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}><SB type="report">Rapport public</SB><SB type="official">Données officielles</SB></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="btn btn--primary tap" style={{ flex: 1 }} onClick={() => nav.toast('Sauvegardé')}>♡ Sauvegarder</span>
            <span className="btn btn--ghost tap" style={{ flex: 1, background: 'var(--brand-surface)' }} onClick={() => nav.push('insight', B.taxe)}>Proposition liée</span>
          </div>
        </div>
      </div>
    </>
  );
};

const BVideoView = ({ item }) => {
  const nav = useNav();
  const it = item || B.conseil;
  return (
    <>
      <div className="vid">
        <div className="vid__player">
          <div className="proto-top" style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 5 }}><span className="proto-top__back tap" style={{ color: '#fff' }} onClick={nav.pop}>‹</span><span className="proto-top__act"></span></div>
          <span className="premium" style={{ background: '#20457A', color: '#fff' }}>Explicatif</span>
          <span className="play tap" onClick={() => nav.toast('Lecture — démo')}>▶</span>
          <span className="duration">8:12</span>
        </div>
        <div className="vid__body">
          <BK accent>◉ VIDÉO · INSTITUTIONS</BK>
          <h2 className="vid__title">{it.title}</h2>
          <span className="vid__meta">8 MIN · EXPLICATIF · SOURCÉ</span>
          <p className="vid__desc">Une explication claire du rôle, de la composition et des décisions du Conseil constitutionnel.</p>
          <div className="callout" style={{ margin: '2px 0 8px' }}><span className="k">◉ Ce contenu est lié à</span><span className="d">Thématique Institutions · Dossier Présidentielle 2027.</span></div>
          <div style={{ display: 'flex', gap: 6 }}><SB type="official">Texte officiel</SB><SB type="interview">Interview</SB></div>
        </div>
      </div>
    </>
  );
};

const BPodcastView = ({ item }) => {
  const nav = useNav();
  const it = item || B.transition;
  return (
    <>
      <div className="proto-top"><span className="proto-top__back tap" onClick={nav.pop}>‹</span><span className="proto-top__title">Podcast</span><span className="proto-top__act">⋯</span></div>
      <div className="pod">
        <div className="pod__cover" style={{ background: 'radial-gradient(circle at 70% 30%, rgba(232,180,122,.45), transparent 50%), linear-gradient(135deg,#20457A,#122742)' }}>
          <span className="stamp">S01 · E06 · 34 MIN</span>
          <div className="ep">Transition écologique.</div>
        </div>
        <div><span className="pod__show">Comprendre 2027 · Boussole</span><h3 className="pod__title">{it.title}</h3></div>
        <p className="pod__d">Un point factuel et sourcé sur les engagements climatiques et leur faisabilité.</p>
        <div className="pod__chapters">
          <BK>— Chapitres</BK>
          <div className="ch"><span className="t">00:00</span><span className="l">Introduction</span></div>
          <div className="ch"><span className="t">06:10</span><span className="l">Les objectifs chiffrés</span></div>
          <div className="ch"><span className="t">19:40</span><span className="l">Ce que disent les rapports</span></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          <span className="btn btn--primary tap" style={{ flex: 1 }} onClick={() => nav.playEpisode(it)}>▶ Écouter</span>
          <span className="btn btn--ghost tap" onClick={() => nav.toast('Sauvegardé')}>♡</span>
        </div>
      </div>
    </>
  );
};

window.BOUSSOLE_PROTO = {
  vars: BOUSSOLE_VARS,
  roots: { home: BHomeRoot, explore: BExploreRoot, library: BLibraryRoot, profile: BProfileRoot },
  views: {
    article: BArticleView, podcast: BPodcastView, video: BVideoView,
    dossier: BDossierView, thematique: BThematiqueView, insight: BInsightView,
    entity: BEntityView, programme: BProgrammeView, compare: BCompareView, sources: BSourcesView,
  },
  // player view falls back to media PlayerView (themed)
};
