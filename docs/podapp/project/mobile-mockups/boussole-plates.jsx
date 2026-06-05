/* global React, Phone, StatusBar, Kicker, ContentRow, TabBar, HomeFeed, ArticleDetail, Library, BP, SrcBadge */
// boussole-plates.jsx — explainer plates: switch mapping, primitives, change/stays, other verticals.

/* ---------- Section 2 · Switch plate ---------- */
const SwitchPlate = () => {
  const M = [
    ['Collection', 'dossier média', 'Collection', 'dossier / programme / série'],
    ['Category', 'rubrique', 'Category', 'thématique'],
    ['Insight', 'idée clé', 'Insight', 'proposition / notion'],
    ['Entity', 'auteur / invité', 'Entity', 'candidat / parti / expert'],
    ['Source', 'référence', 'Source', 'programme officiel / rapport'],
    ['ContentItem', 'article / audio / vidéo', 'ContentItem', 'idem — orienté explication'],
  ];
  return (
    <div className="switchplate">
      <div className="head">
        <span className="kicker">◉ Le même socle, un autre vocabulaire</span>
        <h3>Du média générique à la <i>boussole citoyenne.</i></h3>
        <p>On ne change pas le modèle de données ni les composants : on renomme et réorganise les primitives. Le CMS, la navigation et les écrans restent identiques.</p>
      </div>
      <div className="maplist">
        <div className="maprow" style={{ borderTop: 0 }}>
          <div className="from"><span className="lbl" style={{ color: 'var(--brand-ink-soft)' }}>Primitive</span></div>
          <div className="arrow"></div>
          <div className="to"><span className="lbl" style={{ color: 'var(--brand-ink-soft)' }}>Boussole 2027</span></div>
        </div>
        {M.map((r, i) => (
          <div className="maprow" key={i}>
            <div className="from"><span className="lbl">{r[0]}</span><span className="ex">{r[1]}</span></div>
            <div className="arrow">→</div>
            <div className="to"><span className="lbl">{r[3]}</span><span className="ex">ex. {r[2] === 'Insight' ? '« Taxer les hauts patrimoines ? »' : r[2] === 'Entity' ? 'Candidat·e A' : r[2] === 'Collection' ? 'Présidentielle 2027' : r[2] === 'Source' ? 'Programme officiel' : r[2] === 'Category' ? 'Économie' : 'Analyse sourcée'}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- Section 4 · Primitives specimen ---------- */
const PrimitivesPlate = () => (
  <div className="prims">
    <div className="prim">
      <span className="prim__h">— ContentCard</span>
      <div className="prim__demo"><ContentRow kicker="Analyse · Économie" title="La dette publique en 5 points" meta="12 min · sourcé" tint="alt" /></div>
    </div>
    <div className="prim">
      <span className="prim__h">— CollectionCard</span>
      <div className="prim__demo" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="bdossier" style={{ minHeight: 120, borderRadius: 0 }}><span className="bg"></span><div className="meta"><span className="k">◆ Dossier</span><h3 className="t" style={{ fontSize: 20 }}>Présidentielle 2027</h3><div className="prog"><span>12 contenus</span><span className="bar" style={{ '--p': '30%' }}></span></div></div></div>
      </div>
    </div>
    <div className="prim">
      <span className="prim__h">— CategoryCard</span>
      <div className="prim__demo">
        <div className="search__cats" style={{ margin: 0 }}><div className="search__cat" style={{ width: '100%' }}><span className="ic">✎</span><span className="nm">Économie</span><span className="ct">24 CONTENUS</span></div></div>
      </div>
    </div>
    <div className="prim">
      <span className="prim__h">— InsightCard</span>
      <div className="prim__demo">
        <div className="insight"><span className="k">◉ Proposition</span><h4 className="insight__q">Taxer les hauts patrimoines ?</h4><div className="insight__foot"><span className="meta">5 SOURCES · 3 POSITIONS</span><span className="insight__bk">♡</span></div></div>
      </div>
    </div>
    <div className="prim">
      <span className="prim__h">— EntityCard</span>
      <div className="prim__demo"><div className="entity"><span className="entity__av"></span><div className="entity__meta"><h4 className="entity__nm">Candidat·e A</h4><span className="entity__sub">Mouvement · centre</span></div><span className="entity__type">Candidat</span></div></div>
    </div>
    <div className="prim">
      <span className="prim__h">— SourceBadge</span>
      <div className="prim__demo" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <SrcBadge type="official">Officiel</SrcBadge><SrcBadge type="report">Rapport</SrcBadge><SrcBadge type="article">Analyse</SrcBadge><SrcBadge type="video">Vidéo</SrcBadge><SrcBadge type="interview">Interview</SrcBadge>
      </div>
    </div>
    <div className="prim">
      <span className="prim__h">— StanceBadge</span>
      <div className="prim__demo" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <span className="stancebadge"><span className="ini" style={{ background: '#20457A' }}>A</span>Pour, avec seuils</span>
        <span className="stancebadge"><span className="ini" style={{ background: '#6B6B66' }}>B</span>Contre</span>
      </div>
    </div>
    <div className="prim">
      <span className="prim__h">— BookmarkButton · ProgressCard</span>
      <div className="prim__demo" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}><span className="insight__bk">♡</span><span className="insight__bk" style={{ color: '#fff', background: 'var(--brand-accent)', borderColor: 'var(--brand-accent)' }}>♥</span></div>
        <div className="bprog"><span className="k">◐ Progression</span><div className="bar" style={{ '--p': '45%' }}></div><span className="pct">45%</span></div>
      </div>
    </div>
    <div className="prim">
      <span className="prim__h">— RelatedContentSection</span>
      <div className="prim__demo">
        <div className="callout"><span className="k">◉ Ce contenu est lié à</span><span className="d">Thématique Économie · Proposition · 3 sources.</span></div>
      </div>
    </div>
  </div>
);

/* ---------- Section 5 · What changes / stays ---------- */
const ChangeStaysPlate = () => {
  const STAYS = ['Navigation (4 onglets)', 'CMS & modèle de données', 'Content cards', 'Player audio', 'Lecteur vidéo', 'Articles', 'Bookmarks & offline', 'Profil', 'Notifications'];
  const CHANGES = ['Wording & libellés', 'Catégories', 'Collections / dossiers', "Types d'insights", 'Entités (candidats, partis)', 'Sources & badges', 'Ordre de la home', 'Tonalité éditoriale', 'Palette'];
  return (
    <div className="bchange">
      <div className="bchange__col">
        <span className="kicker">◉ Le socle</span>
        <h3>Ce qui reste <i>identique.</i></h3>
        <ul>{STAYS.map((s, i) => <li key={i}><span className="m">·</span>{s}</li>)}</ul>
      </div>
      <div className="bchange__col">
        <span className="kicker" style={{ color: '#20457A' }}>◉ La déclinaison</span>
        <h3>Ce qui <i>change.</i></h3>
        <ul>{CHANGES.map((s, i) => <li key={i}><span className="m">·</span>{s}</li>)}</ul>
      </div>
    </div>
  );
};

/* ---------- Section 6 · Other verticals ---------- */
const VerticalsPlate = () => {
  const V = [
    { nm: 'Média indépendant', kind: 'Éditorial', rows: [['Collection', 'dossier'], ['Insight', 'idée clé'], ['Entity', 'auteur / invité'], ['Source', 'référence']] },
    { nm: 'Éducation', kind: 'Apprentissage', rows: [['Collection', 'module'], ['Insight', 'concept'], ['Entity', 'professeur'], ['Source', 'ressource']] },
    { nm: 'Sport / coaching', kind: 'Performance', rows: [['Collection', 'programme'], ['Insight', 'principe'], ['Entity', 'coach / athlète'], ['Source', 'étude / vidéo']] },
    { nm: 'Business', kind: 'Pro', rows: [['Collection', 'guide'], ['Insight', 'framework'], ['Entity', 'expert / entreprise'], ['Source', 'article / livre']] },
  ];
  return (
    <div className="verticals">
      <div className="head">
        <span className="kicker">◉ Un socle, des verticales</span>
        <h3>Les mêmes primitives, <i>d'autres usages.</i></h3>
        <p>Le modèle Collection / Category / Insight / Entity / Source / ContentItem se redéploie sans refonte — seul le vocabulaire et le contenu changent.</p>
      </div>
      <div className="vgrid">
        {V.map((v, i) => (
          <div className="vcard" key={i}>
            <div><div className="vcard__nm serif">{v.nm}</div><span className="vcard__kind">{v.kind}</span></div>
            <div className="vmap">
              {v.rows.map((r, j) => (
                <div className="vmap__row" key={j}><span className="p">{r[0]}</span><span className="v">{r[1]}</span></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, { SwitchPlate, PrimitivesPlate, ChangeStaysPlate, VerticalsPlate });
