/* global React, Phone, StatusBar, TopBar, Kicker, ContentRow, TabBar */
// boussole-screens.jsx — Boussole citoyenne 2027 : documentary vertical frames (A–O)

const BOUSSOLE_THEME = {
  '--brand-bg': '#F4F1E8', '--brand-surface': '#FFFFFF', '--brand-surface-2': '#FAF7EE',
  '--brand-ink': '#16130E', '--brand-ink-2': '#3C372F', '--brand-ink-soft': '#756E62', '--brand-muted': '#B3AC9D',
  '--brand-rule': 'rgba(22,19,14,.08)', '--brand-rule-2': 'rgba(22,19,14,.14)',
  '--brand-accent': '#20457A', '--brand-accent-soft': 'rgba(32,69,122,.12)', '--brand-premium': '#C8964A',
  '--font-display': '"Newsreader", Georgia, serif', '--font-body': '"Hanken Grotesk", system-ui, sans-serif', '--font-mono': '"JetBrains Mono", monospace',
};
const BP = (props) => <Phone themeVars={BOUSSOLE_THEME} {...props} />;

const SrcBadge = ({ type, children }) => <span className={`srcbadge srcbadge--${type}`}>{children}</span>;

/* ---------- A · Home — Comprendre 2027 ---------- */
const BHome = () => (
  <BP>
    <StatusBar />
    <div className="scr">
      <div className="bhdr">
        <div className="bhdr__logo"><i>Boussole</i><span className="dot"></span></div>
        <div className="bhdr__act"><span className="bhdr__ic">🔔</span><span className="bhdr__av"></span></div>
      </div>
      <div className="scr__body">
        <div className="chips" style={{ marginBottom: 14 }}>
          <span className="chip on">À la une</span>
          <span className="chip">Dossiers</span>
          <span className="chip">Thématiques</span>
          <span className="chip">Sources</span>
        </div>

        <div className="bdossier" style={{ marginBottom: 14 }}>
          <span className="bg"></span>
          <div className="meta">
            <span className="k">◆ Dossier · à la une</span>
            <h3 className="t">Présidentielle <i>2027.</i></h3>
            <div className="prog"><span>12 contenus</span><span className="bar" style={{ '--p': '30%' }}></span><span>30%</span></div>
          </div>
        </div>

        <div className="sh"><span className="sh__t serif">Proposition <i>du jour</i></span></div>
        <div className="insight" style={{ marginBottom: 14 }}>
          <span className="k">◉ Proposition · Économie</span>
          <h4 className="insight__q">Faut-il taxer davantage les hauts patrimoines ?</h4>
          <p className="insight__d">Une mesure clivante au cœur du débat fiscal. Trois familles de positions, plusieurs sources officielles.</p>
          <div className="insight__foot"><span className="meta">5 SOURCES · 3 POSITIONS</span><span className="insight__bk">♡</span></div>
        </div>

        <div className="sh"><span className="sh__t serif">Dernières <i>analyses</i></span><span className="sh__more">Tout voir →</span></div>
        <ContentRow kicker="Analyse · Économie" title="Comprendre la dette publique en 5 points" meta="12 min · sourcé" tint="alt" />
        <ContentRow kicker="Vidéo · Institutions" title="À quoi sert le Conseil constitutionnel ?" meta="8 min · explicatif" tint="dk" />
        <ContentRow kicker="Podcast · Écologie" title="Transition : les chiffres derrière les promesses" meta="34 min" tint="br" />

        <div className="callout" style={{ marginTop: 14 }}>
          <span className="k">◉ Comprendre avant de choisir</span>
          <span className="d">Explorez les thématiques pour voir propositions, positions et sources, sans bruit médiatique.</span>
        </div>
        <span className="btn btn--primary btn--block" style={{ marginTop: 12 }}>Explorer les thématiques</span>
      </div>
      <TabBar active={0} />
    </div>
  </BP>
);

/* ---------- B · Dossiers / Collections ---------- */
const BDossiers = () => {
  const D = [
    { k: '12 contenus · 30%', t: 'Présidentielle 2027', bg: 'a', sub: 'Dossier central' },
    { k: '8 contenus', t: "Comprendre l'économie", bg: 'b', sub: 'Série explicative' },
    { k: '6 contenus', t: 'Institutions & démocratie', bg: 'c', sub: 'Fondamentaux' },
    { k: '7 contenus', t: "Pouvoir d'achat", bg: 'a', sub: 'Dossier' },
    { k: '9 contenus', t: 'Écologie & transition', bg: 'b', sub: 'Dossier' },
    { k: '5 contenus', t: 'Géopolitique', bg: 'c', sub: 'Dossier' },
  ];
  return (
    <BP>
      <StatusBar />
      <div className="scr">
        <TopBar back="" title="Dossiers" action="⌕" />
        <div className="scr__body">
          <p className="bintro" style={{ margin: '0 0 14px' }}>Des parcours documentaires pour comprendre un sujet de bout en bout.</p>
          <div className="ecoll">
            {D.map((d, i) => (
              <div className="ecoll__card" key={i} style={{ minHeight: 96 }}>
                <span className={`bg ${d.bg}`}></span>
                <div className="meta">
                  <span className="by">◆ {d.sub}</span>
                  <h3 className="nm">{d.t}</h3>
                  <span className="ct">{d.k}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <TabBar active={1} />
      </div>
    </BP>
  );
};

/* ---------- C · Détail collection (Présidentielle 2027) ---------- */
const BDossierDetail = () => (
  <BP>
    <StatusBar />
    <div className="scr">
      <TopBar back="‹" title="Dossier" action="♡" />
      <div className="scr__body">
        <div className="cat__hero">
          <Kicker accent>◆ DOSSIER CENTRAL</Kicker>
          <h2 className="t">Présidentielle <i>2027.</i></h2>
          <p className="d">Tout pour comprendre l'élection : enjeux, propositions, candidats et sources, expliqués pas à pas.</p>
          <div className="stats"><span>12 CONTENUS</span><span>·</span><span>6 THÉMATIQUES</span><span>·</span><span>SOURCÉ</span></div>
        </div>

        <div className="bprog" style={{ margin: '0 0 14px' }}>
          <span className="k">◐ Votre progression</span>
          <h4 className="t">Reprendre — « Le rôle du Parlement »</h4>
          <div className="bar" style={{ '--p': '30%' }}></div>
          <span className="pct">4 / 12 contenus · 30%</span>
        </div>

        <div className="sh"><span className="sh__t serif">Thématiques liées</span></div>
        <div className="chips" style={{ marginBottom: 14 }}>
          <span className="chip">Économie</span><span className="chip">Institutions</span><span className="chip">Écologie</span><span className="chip">Santé</span>
        </div>

        <div className="sh"><span className="sh__t serif">Propositions <i>clés</i></span></div>
        <div className="insight" style={{ marginBottom: 10 }}>
          <span className="k">◉ Proposition</span>
          <h4 className="insight__q">Faut-il taxer les hauts patrimoines ?</h4>
          <div className="insight__foot"><span className="meta">5 SOURCES · 3 POSITIONS</span><span className="insight__bk">♡</span></div>
        </div>

        <div className="sh"><span className="sh__t serif">Pour comprendre</span><span className="sh__more">Tout voir →</span></div>
        <ContentRow kicker="Analyse" title="Comment fonctionne une élection présidentielle" meta="9 min · sourcé" tint="alt" />
        <ContentRow kicker="Vidéo" title="Le calendrier 2027 expliqué" meta="6 min" tint="dk" />

        <div className="sh"><span className="sh__t serif">Sources principales</span><span className="sh__more link-src">Voir les sources →</span></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <SrcBadge type="official">Programmes officiels</SrcBadge>
          <SrcBadge type="report">Rapports publics</SrcBadge>
          <SrcBadge type="interview">Interviews</SrcBadge>
        </div>
      </div>
      <TabBar active={1} />
    </div>
  </BP>
);

/* ---------- D · Thématiques ---------- */
const BThematiques = () => {
  const T = [['✎', 'Économie', '24 contenus'], ['♁', 'Santé', '12'], ['✦', 'Éducation', '9'], ['⚖', 'Sécurité', '11'], ['◉', 'Institutions', '15'], ['☘', 'Écologie', '18'], ['✈', 'International', '8'], ['⚒', 'Travail', '10']];
  return (
    <BP>
      <StatusBar />
      <div className="scr">
        <div className="topbar"><span className="topbar__back"></span><span className="topbar__title serif">Thématiques</span><span className="topbar__act">⌕</span></div>
        <div className="scr__body">
          <p className="bintro" style={{ margin: '0 0 14px' }}>Choisissez un sujet pour voir les grandes questions, les propositions et les sources.</p>
          <div className="search__cats">
            {T.map((c, i) => (
              <div className="search__cat" key={i}><span className="ic">{c[0]}</span><span className="nm">{c[1]}</span><span className="ct">{c[2]}{i === 0 ? ' CONTENUS' : ''}</span></div>
            ))}
          </div>
        </div>
        <TabBar active={1} />
      </div>
    </BP>
  );
};

/* ---------- E · Détail thématique (Économie) ---------- */
const BThematiqueDetail = () => (
  <BP>
    <StatusBar />
    <div className="scr">
      <TopBar back="‹" title="Thématique" action="♡" />
      <div className="scr__body">
        <div className="cat__hero">
          <Kicker accent>◉ THÉMATIQUE</Kicker>
          <h2 className="t">Économie.</h2>
          <p className="d">Fiscalité, dette, pouvoir d'achat, emploi. Les grands arbitrages économiques de 2027, expliqués et sourcés.</p>
          <div className="stats"><span>24 CONTENUS</span><span>·</span><span>9 PROPOSITIONS</span></div>
        </div>

        <div className="sh"><span className="sh__t serif">Grandes questions</span></div>
        <div className="list" style={{ marginBottom: 6 }}>
          <div className="list__row"><span className="ic">?</span><div className="meta"><h4 className="t">Comment réduire la dette sans casser la croissance ?</h4></div><span className="dot" style={{ background: 'var(--brand-accent)' }}></span></div>
          <div className="list__row"><span className="ic">?</span><div className="meta"><h4 className="t">Faut-il taxer davantage les hauts patrimoines ?</h4></div><span className="dot" style={{ background: 'var(--brand-accent)' }}></span></div>
        </div>

        <div className="sh"><span className="sh__t serif">Propositions associées</span></div>
        <div className="insight" style={{ marginBottom: 14 }}>
          <span className="k">◉ Proposition</span>
          <h4 className="insight__q">Instaurer une taxe sur les hauts patrimoines</h4>
          <div className="insight__foot"><span className="meta">5 SOURCES · 3 POSITIONS</span><span className="insight__bk">♡</span></div>
        </div>

        <div className="sh"><span className="sh__t serif">Entités liées</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          <div className="entity"><span className="entity__av"></span><div className="entity__meta"><h4 className="entity__nm">Candidat·e A</h4><span className="entity__sub">Mouvement · centre</span></div><span className="entity__type">Candidat</span></div>
          <div className="entity"><span className="entity__av"></span><div className="entity__meta"><h4 className="entity__nm">Parti B</h4><span className="entity__sub">Formation politique</span></div><span className="entity__type">Parti</span></div>
        </div>

        <div className="sh"><span className="sh__t serif">Pour comprendre</span></div>
        <ContentRow kicker="Analyse" title="La dette publique en 5 points" meta="12 min · sourcé" tint="alt" />
        <ContentRow kicker="Podcast" title="Fiscalité : ce qui change vraiment" meta="28 min" tint="dk" />
      </div>
      <TabBar active={1} />
    </div>
  </BP>
);

/* ---------- F · Insight / Proposition detail ---------- */
const BInsight = () => (
  <BP>
    <StatusBar />
    <div className="scr">
      <TopBar back="‹" title="Proposition" action="♡" />
      <div className="scr__body">
        <Kicker accent>◉ PROPOSITION · ÉCONOMIE</Kicker>
        <h2 className="article__title" style={{ margin: '8px 0 10px' }}>Faut-il taxer davantage les <i>hauts patrimoines</i> ?</h2>
        <p className="article__lede" style={{ marginBottom: 12 }}>Une mesure récurrente du débat fiscal : prélever davantage sur les patrimoines les plus élevés pour financer services publics ou réduire la dette.</p>

        <div className="callout" style={{ marginBottom: 14 }}>
          <span className="k">◉ Pourquoi c'est important</span>
          <span className="d">Touche à l'équité fiscale, aux recettes de l'État et à l'attractivité économique. Un arbitrage central de 2027.</span>
        </div>

        <div className="sh"><span className="sh__t serif">Arguments principaux</span></div>
        <div className="list" style={{ marginBottom: 8 }}>
          <div className="list__row"><span className="ic">+</span><div className="meta"><h4 className="t">Justice fiscale &amp; recettes</h4><span className="d">Financer les services publics et réduire les inégalités.</span></div></div>
          <div className="list__row"><span className="ic">−</span><div className="meta"><h4 className="t">Risque d'évasion &amp; d'exil fiscal</h4><span className="d">Effet incertain sur les recettes réelles.</span></div></div>
        </div>

        <div className="sh"><span className="sh__t serif">Positions possibles</span></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          <span className="stancebadge"><span className="ini" style={{ background: '#20457A' }}>A</span>Pour, avec seuils élevés</span>
          <span className="stancebadge"><span className="ini" style={{ background: '#6B6B66' }}>B</span>Contre</span>
          <span className="stancebadge"><span className="ini" style={{ background: '#A8432A' }}>C</span>Réforme alternative</span>
        </div>

        <div className="sh"><span className="sh__t serif">Sources</span><span className="sh__more link-src">5 sources →</span></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          <SrcBadge type="official">Programme officiel</SrcBadge>
          <SrcBadge type="report">Rapport public</SrcBadge>
          <SrcBadge type="article">Analyse</SrcBadge>
        </div>

        <div className="sh"><span className="sh__t serif">Approfondir</span></div>
        <ContentRow kicker="Vidéo · explicatif" title="L'impôt sur la fortune, comment ça marche ?" meta="7 min" tint="dk" />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <span className="btn btn--primary" style={{ flex: 1 }}>♡ Sauvegarder</span>
          <span className="btn btn--ghost" style={{ flex: 1, background: 'var(--brand-surface)' }}>⇄ Comparer les positions</span>
        </div>
      </div>
    </div>
  </BP>
);

/* ---------- G · Fiche candidat / Entity detail ---------- */
const BEntity = () => (
  <BP>
    <StatusBar />
    <div className="scr">
      <TopBar back="‹" title="Fiche" action="♡" />
      <div className="scr__body">
        <div className="p2__id" style={{ marginBottom: 14 }}>
          <span className="entity__av" style={{ width: 60, height: 60 }}></span>
          <div style={{ flex: 1 }}>
            <h3 className="entity__nm" style={{ fontSize: 21 }}>Candidat·e A</h3>
            <span className="entity__sub">Mouvement · centre · depuis 2019</span>
            <div style={{ marginTop: 6 }}><span className="entity__type">Candidat</span></div>
          </div>
        </div>

        <p className="bintro" style={{ margin: '0 0 14px' }}>Présentation neutre et factuelle : parcours, mouvement, programme et positions, avec sources officielles.</p>

        <div className="callout" style={{ marginBottom: 14 }}>
          <span className="k">◆ Programme associé</span>
          <span className="d">« Programme 2027 » — 38 mesures · 6 thématiques couvertes.</span>
        </div>

        <div className="sh"><span className="sh__t serif">Thématiques couvertes</span></div>
        <div className="chips" style={{ marginBottom: 14 }}>
          <span className="chip">Économie</span><span className="chip">Santé</span><span className="chip">Écologie</span><span className="chip">Institutions</span>
        </div>

        <div className="sh"><span className="sh__t serif">Propositions principales</span></div>
        <div className="insight" style={{ marginBottom: 10 }}>
          <span className="k">◉ Économie</span>
          <h4 className="insight__q">Taxe sur les hauts patrimoines, avec seuils élevés</h4>
          <div className="insight__foot"><span className="meta">POSITION SOURCÉE</span><span className="insight__bk">♡</span></div>
        </div>

        <div className="sh"><span className="sh__t serif">Sources officielles</span></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          <SrcBadge type="official">Programme officiel</SrcBadge>
          <SrcBadge type="interview">Interview</SrcBadge>
        </div>

        <div className="sh"><span className="sh__t serif">Contenus liés</span></div>
        <ContentRow kicker="Analyse" title="Le programme A, décrypté point par point" meta="14 min · sourcé" tint="alt" />
      </div>
    </div>
  </BP>
);

/* ---------- H · Programme (Collection type program) ---------- */
const BProgramme = () => (
  <BP>
    <StatusBar />
    <div className="scr">
      <TopBar back="‹" title="Programme" action="♡" />
      <div className="scr__body">
        <div className="cat__hero">
          <Kicker accent>◆ PROGRAMME · 2027</Kicker>
          <h2 className="t">Programme A.</h2>
          <p className="d">Document de référence du candidat·e A. Présenté tel quel, avec lien vers la source officielle.</p>
          <div className="stats"><span>38 MESURES</span><span>·</span><span>6 THÉMATIQUES</span></div>
        </div>

        <div className="entity" style={{ marginBottom: 14 }}>
          <span className="entity__av"></span>
          <div className="entity__meta"><h4 className="entity__nm">Candidat·e A</h4><span className="entity__sub">Propriétaire du programme</span></div>
          <span className="entity__chev">›</span>
        </div>

        <div className="sh"><span className="sh__t serif">Mesures principales</span></div>
        <div className="list" style={{ marginBottom: 8 }}>
          <div className="list__row"><span className="ic">1</span><div className="meta"><h4 className="t">Réforme de la fiscalité du patrimoine</h4><span className="d">Économie</span></div><span className="dot" style={{ background: 'var(--brand-accent)' }}></span></div>
          <div className="list__row"><span className="ic">2</span><div className="meta"><h4 className="t">Plan d'investissement transition</h4><span className="d">Écologie</span></div><span className="dot" style={{ background: 'var(--brand-accent)' }}></span></div>
          <div className="list__row"><span className="ic">3</span><div className="meta"><h4 className="t">Renforcement de l'hôpital public</h4><span className="d">Santé</span></div><span className="dot" style={{ background: 'var(--brand-accent)' }}></span></div>
        </div>

        <div className="sh"><span className="sh__t serif">Catégories couvertes</span></div>
        <div className="chips" style={{ marginBottom: 14 }}>
          <span className="chip">Économie</span><span className="chip">Écologie</span><span className="chip">Santé</span><span className="chip">Institutions</span>
        </div>

        <div className="callout">
          <span className="k">◉ Source officielle</span>
          <span className="d">Programme publié par le candidat·e — consultez le document original.</span>
        </div>
        <div style={{ marginTop: 8 }}><SrcBadge type="official">Programme officiel · PDF</SrcBadge></div>
      </div>
    </div>
  </BP>
);

/* ---------- I · Comparaison ---------- */
const BCompare = () => (
  <BP>
    <StatusBar />
    <div className="scr">
      <TopBar back="‹" title="Comparer" action="⌕" />
      <div className="scr__body">
        <p className="bintro" style={{ margin: '0 0 14px' }}>Mettez en regard plusieurs positions sur une même question. Affichage neutre, ordre aléatoire.</p>
        <div className="compare">
          <div className="compare__q">
            <span className="k">◉ ÉCONOMIE · PROPOSITION</span>
            <span className="t serif">Fiscalité des hauts patrimoines</span>
          </div>
          <div className="compare__row">
            <div className="compare__ent"><span className="av" style={{ background: 'linear-gradient(135deg,#3a6aa8,#20457A)' }}></span><span className="nm serif">A</span></div>
            <div><div className="compare__pos">Réduire la dépense publique plutôt qu'augmenter la fiscalité.</div><div className="compare__src">Source : programme officiel</div></div>
          </div>
          <div className="compare__row">
            <div className="compare__ent"><span className="av" style={{ background: 'linear-gradient(135deg,#8a8478,#6B6B66)' }}></span><span className="nm serif">B</span></div>
            <div><div className="compare__pos">Augmenter l'investissement public, financé par l'emprunt.</div><div className="compare__src">Source : interview</div></div>
          </div>
          <div className="compare__row">
            <div className="compare__ent"><span className="av" style={{ background: 'linear-gradient(135deg,#bd5e42,#A8432A)' }}></span><span className="nm serif">C</span></div>
            <div><div className="compare__pos">Taxer les hauts patrimoines pour financer la transition.</div><div className="compare__src">Source : programme officiel</div></div>
          </div>
          <div className="compare__note">Les positions sont citées d'après les sources. Aucune n'est mise en avant.</div>
        </div>
        <span className="btn btn--ghost btn--block" style={{ marginTop: 14, background: 'var(--brand-surface)' }}>Voir les sources de chaque position</span>
      </div>
    </div>
  </BP>
);

/* ---------- J · Article detail (documentary) ---------- */
const BArticle = () => (
  <BP>
    <StatusBar dark />
    <div className="scr">
      <div className="article">
        <div className="article__cover" style={{ background: 'linear-gradient(135deg,#20457A,#122742)' }}>
          <TopBar />
        </div>
        <div className="article__body">
          <Kicker accent>◉ ANALYSE · ÉCONOMIE</Kicker>
          <h2 className="article__title">La dette publique <i>en 5 points.</i></h2>
          <div className="article__meta">
            <span className="av"></span>
            <div><div className="a">par la rédaction</div><div className="d">12 MIN · SOURCÉ</div></div>
          </div>
          <p className="article__lede">Ce qu'il faut savoir pour comprendre les débats sur la dette, sans jargon.</p>
          <p className="article__para">La dette publique correspond à l'ensemble des emprunts de l'État. Elle se mesure en proportion du PIB…</p>
          <div className="callout" style={{ margin: '4px 0 10px' }}>
            <span className="k">◉ Ce contenu est lié à</span>
            <span className="d">Thématique Économie · Proposition « hauts patrimoines » · 3 sources.</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <SrcBadge type="report">Rapport public</SrcBadge>
            <SrcBadge type="official">Données officielles</SrcBadge>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 26, left: 16, right: 16, display: 'flex', gap: 8, zIndex: 10 }}>
        <span className="btn btn--primary" style={{ flex: 1 }}>♡ Sauvegarder</span>
        <span className="btn btn--ghost" style={{ flex: 1, background: 'var(--brand-surface)' }}>↗ Partager</span>
      </div>
    </div>
  </BP>
);

/* ---------- K · Video detail ---------- */
const BVideo = () => (
  <BP>
    <StatusBar dark />
    <div className="scr">
      <div className="vid">
        <div className="vid__player">
          <span className="premium" style={{ background: '#20457A', color: '#fff' }}>Explicatif</span>
          <span className="play">▶</span>
          <span className="duration">8:12</span>
        </div>
        <div className="vid__body">
          <Kicker accent>◉ VIDÉO · INSTITUTIONS</Kicker>
          <h2 className="vid__title">À quoi sert le Conseil constitutionnel ?</h2>
          <span className="vid__meta">8 MIN · EXPLICATIF · SOURCÉ</span>
          <p className="vid__desc">Une explication claire du rôle, de la composition et des décisions du Conseil constitutionnel.</p>
          <div className="callout" style={{ margin: '2px 0 8px' }}>
            <span className="k">◉ Ce contenu est lié à</span>
            <span className="d">Thématique Institutions · Dossier Présidentielle 2027.</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}><SrcBadge type="official">Texte officiel</SrcBadge><SrcBadge type="interview">Interview</SrcBadge></div>
        </div>
      </div>
    </div>
  </BP>
);

/* ---------- L · Podcast episode detail ---------- */
const BPodcast = () => (
  <BP>
    <StatusBar />
    <div className="scr">
      <TopBar back="‹" title="Podcast" action="⋯" />
      <div className="pod">
        <div className="pod__cover" style={{ background: 'radial-gradient(circle at 70% 30%, rgba(232,180,122,.45), transparent 50%), linear-gradient(135deg,#20457A,#122742)' }}>
          <span className="stamp">S01 · E06 · 34 MIN</span>
          <div className="ep">Transition écologique.</div>
        </div>
        <div><span className="pod__show">Comprendre 2027 · Boussole</span><h3 className="pod__title">Les chiffres derrière les promesses</h3></div>
        <p className="pod__d">Un point factuel et sourcé sur les engagements climatiques et leur faisabilité.</p>
        <div className="pod__chapters">
          <Kicker>— Chapitres</Kicker>
          <div className="ch"><span className="t">00:00</span><span className="l">Introduction</span></div>
          <div className="ch"><span className="t">06:10</span><span className="l">Les objectifs chiffrés</span></div>
          <div className="ch"><span className="t">19:40</span><span className="l">Ce que disent les rapports</span></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          <span className="btn btn--primary" style={{ flex: 1 }}>▶ Écouter</span>
          <span className="btn btn--ghost">♡</span>
          <span className="btn btn--ghost">↓</span>
        </div>
      </div>
    </div>
  </BP>
);

/* ---------- M · Bibliothèque ---------- */
const BLibrary = () => (
  <BP>
    <StatusBar />
    <div className="scr">
      <div className="topbar"><span className="topbar__back"></span><span className="topbar__title serif">Bibliothèque</span><span className="topbar__act">⌕</span></div>
      <div className="scr__body">
        <div className="chips" style={{ marginBottom: 12 }}>
          <span className="chip on">Tout</span><span className="chip">Propositions</span><span className="chip">Candidats</span><span className="chip">Dossiers</span><span className="chip">Médias</span>
        </div>
        <div className="sh"><span className="sh__t serif">Sauvegardés</span><span className="sh__more">14 éléments</span></div>

        <div className="insight" style={{ marginBottom: 10 }}>
          <span className="k">◉ Proposition · Économie</span>
          <h4 className="insight__q">Taxer les hauts patrimoines ?</h4>
          <div className="insight__foot"><span className="meta">5 SOURCES</span><span className="insight__bk">♥</span></div>
        </div>
        <div className="entity" style={{ marginBottom: 10 }}><span className="entity__av"></span><div className="entity__meta"><h4 className="entity__nm">Candidat·e A</h4><span className="entity__sub">Fiche sauvegardée</span></div><span className="entity__type">Candidat</span></div>
        <ContentRow kicker="Analyse · Économie" title="La dette publique en 5 points" meta="12 min · ↓ hors-ligne" tint="alt" />
        <ContentRow kicker="Vidéo · Institutions" title="À quoi sert le Conseil constitutionnel ?" meta="8 min" tint="dk" />
      </div>
      <TabBar active={2} />
    </div>
  </BP>
);

/* ---------- N · Sources ---------- */
const BSources = () => (
  <BP>
    <StatusBar />
    <div className="scr">
      <TopBar back="‹" title="Sources" action="⌕" />
      <div className="scr__body">
        <p className="bintro" style={{ margin: '0 0 14px' }}>Chaque contenu cite ses sources. Voici les références mobilisées, par type.</p>
        <div className="chips" style={{ marginBottom: 12 }}>
          <span className="chip on">Toutes</span><span className="chip">Officielles</span><span className="chip">Rapports</span><span className="chip">Interviews</span>
        </div>
        <div className="list">
          <div className="list__row"><span className="ic" style={{ background: 'rgba(32,69,122,.12)', color: '#20457A' }}>◆</span><div className="meta"><h4 className="t">Programme officiel — Candidat·e A</h4><span className="d">Document de campagne · PDF</span></div><SrcBadge type="official">Officiel</SrcBadge></div>
          <div className="list__row"><span className="ic">▤</span><div className="meta"><h4 className="t">Rapport sur la dette publique</h4><span className="d">Institution publique · 2026</span></div><SrcBadge type="report">Rapport</SrcBadge></div>
          <div className="list__row"><span className="ic">▷</span><div className="meta"><h4 className="t">Interview — politique économique</h4><span className="d">Média partenaire · vidéo</span></div><SrcBadge type="interview">Interview</SrcBadge></div>
          <div className="list__row"><span className="ic">✎</span><div className="meta"><h4 className="t">Analyse — fiscalité comparée</h4><span className="d">Rédaction Boussole</span></div><SrcBadge type="article">Analyse</SrcBadge></div>
        </div>
        <div className="callout" style={{ marginTop: 12 }}>
          <span className="k">◉ À vérifier</span>
          <span className="d">Les positions évoluent. Vérifiez toujours la date et la source d'origine.</span>
        </div>
      </div>
      <TabBar active={1} />
    </div>
  </BP>
);

/* ---------- O · Profil / préférences ---------- */
const BProfile = () => (
  <BP>
    <StatusBar />
    <div className="scr">
      <div className="p2">
        <div className="p2__top"><span className="ttl serif">Profil</span><span className="ic">⚙</span></div>
        <div className="p2__body">
          <div className="p2__id">
            <span className="p2__av" style={{ background: 'linear-gradient(135deg,#3a6aa8,#20457A)' }}></span>
            <div style={{ flex: 1 }}>
              <h3 className="nm">Votre profil</h3>
              <span className="p2__status" style={{ color: '#20457A' }}>◉ Lecteur·rice citoyen·ne</span>
              <span className="p2__since">Progression sur 3 dossiers · 14 contenus lus</span>
            </div>
          </div>

          <div className="p2__sec">
            <Kicker>— Thèmes suivis</Kicker>
            <div className="chips" style={{ marginTop: 4 }}>
              <span className="chip on">Économie</span><span className="chip on">Écologie</span><span className="chip on">Institutions</span><span className="chip">+ Ajouter</span>
            </div>
          </div>

          <div className="p2__sec">
            <Kicker>— Mon activité</Kicker>
            <div className="p2row"><span className="ic">◐</span><div className="meta"><span className="t">Progression</span><span className="d">3 dossiers en cours</span></div><span className="chev">›</span></div>
            <div className="p2row"><span className="ic">◷</span><div className="meta"><span className="t">Historique de lecture</span><span className="d">14 contenus</span></div><span className="chev">›</span></div>
            <div className="p2row"><span className="ic">⌖</span><div className="meta"><span className="t">Sauvegardés <span className="gate gate--free">Gratuit</span></span><span className="d">Propositions, fiches, médias</span></div><span className="chev">›</span></div>
          </div>

          <div className="p2__sec">
            <Kicker>— Préférences</Kicker>
            <div className="p2row"><span className="ic">🔔</span><div className="meta"><span className="t">Notifications</span><span className="d">Nouveaux contenus de vos thèmes</span></div><span className="chev">›</span></div>
            <div className="p2row"><span className="ic">⚿</span><div className="meta"><span className="t">Confidentialité</span><span className="d">Aucun profilage politique · données minimales</span></div><span className="chev">›</span></div>
          </div>
        </div>
      </div>
      <TabBar active={3} />
    </div>
  </BP>
);

Object.assign(window, {
  BOUSSOLE_THEME, BP, SrcBadge,
  BHome, BDossiers, BDossierDetail, BThematiques, BThematiqueDetail, BInsight,
  BEntity, BProgramme, BCompare, BArticle, BVideo, BPodcast, BLibrary, BSources, BProfile,
});
