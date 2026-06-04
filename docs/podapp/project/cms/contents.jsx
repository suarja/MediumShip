/* global React, CATEGORIES, slugify, templateFor */
// contents.jsx — Editorial desk: sidebar list + editor + preview rail

const { useState, useMemo } = React;

const TYPE_PILL = { article: 'pill--article', episode: 'pill--episode', video: 'pill--video' };
const STATUS_PILL = { draft: 'pill--draft', published: 'pill--published', archived: 'pill--archived' };
const TYPE_LABEL = { article: 'ARTICLE', episode: 'ÉPISODE', video: 'VIDÉO' };
const STATUS_LABEL = { draft: 'BROUILLON', published: 'PUBLIÉ', archived: 'ARCHIVÉ' };

/* ---------- Sidebar ---------- */
function Sidebar({ items, filterType, setFilterType, filterStatus, setFilterStatus, query, setQuery, selected, setSelected, onNew }) {
  const counts = useMemo(() => {
    const c = { all: items.length, article: 0, episode: 0, video: 0 };
    items.forEach(i => c[i.type]++);
    return c;
  }, [items]);

  return (
    <aside className="sidebar">
      <div className="sidebar__card">
        <div className="sidebar__h">— Editorial desk</div>
        <h2 className="sidebar__t">Contenus</h2>

        <div className="newrow">
          <button className="btn btn--ghost btn--sm" onClick={() => onNew('article')}>Article</button>
          <button className="btn btn--ghost btn--sm" onClick={() => onNew('episode')}>Épisode</button>
          <button className="btn btn--ghost btn--sm" onClick={() => onNew('video')}>Vidéo</button>
        </div>

        <div className="search">
          <span className="ic">⌕</span>
          <input
            type="text"
            placeholder="Chercher par titre, slug, tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="filterset">
          <span className="filterset__lbl">— Type</span>
          <div className="filterset__row">
            <button className={`chip ${filterType === 'all' ? 'on' : ''}`} onClick={() => setFilterType('all')}>
              Tout <span className="count">{counts.all}</span>
            </button>
            <button className={`chip ${filterType === 'article' ? 'on' : ''}`} onClick={() => setFilterType('article')}>
              Articles <span className="count">{counts.article}</span>
            </button>
            <button className={`chip ${filterType === 'episode' ? 'on' : ''}`} onClick={() => setFilterType('episode')}>
              Épisodes <span className="count">{counts.episode}</span>
            </button>
            <button className={`chip ${filterType === 'video' ? 'on' : ''}`} onClick={() => setFilterType('video')}>
              Vidéos <span className="count">{counts.video}</span>
            </button>
          </div>
          <span className="filterset__lbl" style={{ marginTop: 8 }}>— Statut</span>
          <div className="filterset__row">
            {['all', 'draft', 'published', 'archived'].map(s => (
              <button key={s} className={`chip ${filterStatus === s ? 'on' : ''}`} onClick={() => setFilterStatus(s)}>
                {s === 'all' ? 'Tout' : STATUS_LABEL[s].toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="itemlist">
          {items.map(it => (
            <button key={it.id} className={`item ${selected === it.id ? 'on' : ''}`} onClick={() => setSelected(it.id)}>
              <div className="item__row1">
                <span className="item__pills">
                  <span className={`pill ${STATUS_PILL[it.status]}`}>{STATUS_LABEL[it.status]}</span>
                  <span className={`pill ${TYPE_PILL[it.type]}`}>{TYPE_LABEL[it.type]}</span>
                </span>
                {it.premium && <span className="pill pill--premium">★ PREMIUM</span>}
              </div>
              <h4 className="item__t">{it.title || 'Sans titre'}</h4>
              <span className="item__slug">{it.slug || 'sans-slug'}</span>
              <p className="item__sum">{it.summary || '—'}</p>
              <div className="item__meta">MAJ · {it.updated}</div>
            </button>
          ))}
          {items.length === 0 && (
            <div style={{ padding: 18, textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13 }}>
              Aucun contenu ne correspond aux filtres.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

/* ---------- Common field components ---------- */
function Field({ label, optional, children, wide }) {
  return (
    <div className={`field ${wide ? 'field--wide' : ''}`}>
      <span className="field__lbl">{label}{optional && <span className="opt">facultatif</span>}</span>
      {children}
    </div>
  );
}

function ImageUpload({ value, onChange }) {
  return (
    <div className="upload">
      <div className="upload__thumb"></div>
      <div className="upload__meta">
        <h5 className="upload__t">{value || 'Glisser une image ou cliquer pour téléverser'}</h5>
        <div className="upload__d">PNG, JPG, WEBP · 16:9 recommandé · max 5 Mo</div>
      </div>
      <button className="btn btn--ghost btn--sm" onClick={() => onChange(prompt('Nom du fichier image', value) || value)}>
        Choisir
      </button>
    </div>
  );
}

function PremiumBlock({ item, patch }) {
  return (
    <div className="premium-block">
      <div className="premium-block__h">
        <span className="premium-block__t">Contenu premium</span>
        <label className="toggle">
          <input type="checkbox" checked={!!item.premium} onChange={(e) => patch({ premium: e.target.checked })} />
          <span className="toggle__sw"></span>
        </label>
      </div>
      {item.premium && (
        <Field label="Time override · accès anticipé" optional>
          <input
            className="input input--mono"
            placeholder="ex. 72 h, 7 j, 0 h (pas d'override)"
            value={item.premiumTimeOverride || ''}
            onChange={(e) => patch({ premiumTimeOverride: e.target.value })}
          />
        </Field>
      )}
    </div>
  );
}

function AdvancedMeta({ item, patch }) {
  const [open, setOpen] = useState(false);
  const adv = item.advanced || {};
  const update = (k, v) => patch({ advanced: { ...adv, [k]: v } });
  return (
    <div className={`disclose ${open ? 'open' : ''}`}>
      <div className="disclose__h" onClick={() => setOpen(!open)}>
        <span>Advanced metadata</span>
        <span className="pl">⌄</span>
      </div>
      <div className="disclose__body">
        <div className="fields-grid">
          <Field label="Canonical URL" optional>
            <input className="input input--mono" placeholder="https://…" value={adv.canonicalUrl || ''} onChange={(e) => update('canonicalUrl', e.target.value)} />
          </Field>
          <Field label="Author" optional>
            <input className="input" value={adv.author || ''} onChange={(e) => update('author', e.target.value)} placeholder="par défaut : éditeur connecté" />
          </Field>
          <Field label="Published at" optional>
            <input className="input input--mono" type="datetime-local" value={adv.publishedAt || ''} onChange={(e) => update('publishedAt', e.target.value)} />
          </Field>
          <Field label="SEO description" optional>
            <input className="input" value={adv.seoDesc || ''} onChange={(e) => update('seoDesc', e.target.value)} placeholder="par défaut : summary" />
          </Field>
        </div>
      </div>
    </div>
  );
}

/* ---------- Editor : per-type fields ---------- */
function ArticleEditor({ item, patch }) {
  return (
    <>
      <div className="fields-grid">
        <Field label="Slug">
          <input className="input input--mono" value={item.slug} onChange={(e) => patch({ slug: e.target.value })} placeholder="slug-de-l-article" />
        </Field>
        <Field label="Catégorie">
          <select className="select" value={item.category} onChange={(e) => patch({ category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Résumé" wide>
          <textarea className="textarea" rows={3} value={item.summary} onChange={(e) => patch({ summary: e.target.value })} placeholder="Une phrase ou deux, affichée dans le feed." />
        </Field>
        <Field label="Tags" wide>
          <input className="input" value={item.tags} onChange={(e) => patch({ tags: e.target.value })} placeholder="virgule, séparés" />
        </Field>
        <Field label="Hero image" wide>
          <ImageUpload value={item.heroImage} onChange={(v) => patch({ heroImage: v })} />
        </Field>
        <Field label="URL canonique" optional wide>
          <input className="input input--mono" value={item.url || ''} onChange={(e) => patch({ url: e.target.value })} placeholder="https://votre-site.com/…" />
        </Field>
        <Field label="Corps de l'article" wide>
          <textarea className="textarea textarea--body" value={item.body} onChange={(e) => patch({ body: e.target.value })} placeholder="Écrivez ici…" />
        </Field>
        <div className="field--wide">
          <PremiumBlock item={item} patch={patch} />
        </div>
      </div>
      <AdvancedMeta item={item} patch={patch} />
    </>
  );
}

function EpisodeEditor({ item, patch }) {
  return (
    <>
      <div className="fields-grid">
        <Field label="Slug">
          <input className="input input--mono" value={item.slug} onChange={(e) => patch({ slug: e.target.value })} placeholder="slug-de-l-episode" />
        </Field>
        <Field label="Catégorie">
          <select className="select" value={item.category} onChange={(e) => patch({ category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Résumé" wide>
          <textarea className="textarea" rows={3} value={item.summary} onChange={(e) => patch({ summary: e.target.value })} />
        </Field>
        <Field label="Tags" wide>
          <input className="input" value={item.tags} onChange={(e) => patch({ tags: e.target.value })} placeholder="podcast, économie…" />
        </Field>
        <Field label="Hero image" wide>
          <ImageUpload value={item.heroImage} onChange={(v) => patch({ heroImage: v })} />
        </Field>
        <Field label="Audio URL" wide>
          <input className="input input--mono" value={item.audioUrl || ''} onChange={(e) => patch({ audioUrl: e.target.value })} placeholder="https://…/episode.mp3" />
        </Field>
        <Field label="Durée override" optional>
          <input className="input input--mono" value={item.durationOverride || ''} onChange={(e) => patch({ durationOverride: e.target.value })} placeholder="ex. 54 min" />
        </Field>
        <Field label="Saison · Épisode" optional>
          <input className="input input--mono" value={item.seasonEp || ''} onChange={(e) => patch({ seasonEp: e.target.value })} placeholder="S03 · E14" />
        </Field>
        <div className="field--wide">
          <PremiumBlock item={item} patch={patch} />
        </div>
      </div>
      <AdvancedMeta item={item} patch={patch} />
    </>
  );
}

function VideoEditor({ item, patch }) {
  return (
    <>
      <div className="fields-grid">
        <Field label="Slug">
          <input className="input input--mono" value={item.slug} onChange={(e) => patch({ slug: e.target.value })} />
        </Field>
        <Field label="Catégorie">
          <select className="select" value={item.category} onChange={(e) => patch({ category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Résumé" wide>
          <textarea className="textarea" rows={3} value={item.summary} onChange={(e) => patch({ summary: e.target.value })} />
        </Field>
        <Field label="Tags" wide>
          <input className="input" value={item.tags} onChange={(e) => patch({ tags: e.target.value })} />
        </Field>
        <Field label="Hero image" wide>
          <ImageUpload value={item.heroImage} onChange={(v) => patch({ heroImage: v })} />
        </Field>
        <Field label="Source vidéo">
          <select className="select" value={item.videoSource || 'youtube'} onChange={(e) => patch({ videoSource: e.target.value })}>
            <option value="youtube">YouTube</option>
            <option value="hosted">Fichier hébergé</option>
            <option value="vimeo">Vimeo</option>
          </select>
        </Field>
        <Field label="Durée override" optional>
          <input className="input input--mono" value={item.durationOverride || ''} onChange={(e) => patch({ durationOverride: e.target.value })} placeholder="ex. 1 h 04" />
        </Field>
        {item.videoSource === 'youtube' && (
          <Field label="URL YouTube" wide>
            <input className="input input--mono" value={item.youtubeUrl || ''} onChange={(e) => patch({ youtubeUrl: e.target.value })} placeholder="https://youtube.com/watch?v=…" />
          </Field>
        )}
        {item.videoSource === 'vimeo' && (
          <Field label="URL Vimeo" wide>
            <input className="input input--mono" value={item.vimeoUrl || ''} onChange={(e) => patch({ vimeoUrl: e.target.value })} placeholder="https://vimeo.com/…" />
          </Field>
        )}
        {item.videoSource === 'hosted' && (
          <Field label="Fichier vidéo" wide>
            <div className="upload">
              <div className="upload__thumb" style={{ background: 'linear-gradient(135deg, #2A2A2A, #4A4541)' }}></div>
              <div className="upload__meta">
                <h5 className="upload__t">{item.hostedFile || 'Téléverser un fichier vidéo'}</h5>
                <div className="upload__d">MP4, MOV, WEBM · max 2 Go · transcodage auto</div>
              </div>
              <button className="btn btn--ghost btn--sm" onClick={() => patch({ hostedFile: prompt('Nom du fichier vidéo', item.hostedFile) || item.hostedFile })}>Téléverser</button>
            </div>
          </Field>
        )}
        <div className="field--wide">
          <PremiumBlock item={item} patch={patch} />
        </div>
      </div>
      <AdvancedMeta item={item} patch={patch} />
    </>
  );
}

/* ---------- Editor shell ---------- */
function Editor({ item, patch, onStatus, onDelete }) {
  if (!item) {
    return (
      <div className="empty">
        <h3 className="empty__t">Sélectionnez un contenu</h3>
        <p className="empty__sub">Ou créez-en un nouveau dans la barre latérale.</p>
      </div>
    );
  }
  return (
    <div className="editor">
      <div className="editor__card">
        <div className="editor__head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="editor__crumb">
              <span>EDITOR</span>
              <span className="sep">·</span>
              <span className={`pill ${TYPE_PILL[item.type]}`}>{TYPE_LABEL[item.type]}</span>
              <span className={`pill ${STATUS_PILL[item.status]}`}>{STATUS_LABEL[item.status]}</span>
              {item.premium && <span className="pill pill--premium">★ PREMIUM</span>}
            </div>
            <input
              className="editor__title-input"
              value={item.title}
              placeholder="Titre du contenu…"
              onChange={(e) => patch({ title: e.target.value, slug: item.slug || slugify(e.target.value) })}
            />
          </div>
          <div className="editor__status-row">
            <button className={`btn ${item.status === 'draft' ? 'btn--surface' : 'btn--ghost'} btn--sm`} onClick={() => onStatus('draft')}>Brouillon</button>
            <button className={`btn ${item.status === 'published' ? 'btn--surface' : 'btn--ghost'} btn--sm`} onClick={() => onStatus('published')}>Publier</button>
            <button className={`btn ${item.status === 'archived' ? 'btn--surface' : 'btn--ghost'} btn--sm`} onClick={() => onStatus('archived')}>Archiver</button>
          </div>
        </div>

        {item.type === 'article' && <ArticleEditor item={item} patch={patch} />}
        {item.type === 'episode' && <EpisodeEditor item={item} patch={patch} />}
        {item.type === 'video' && <VideoEditor item={item} patch={patch} />}

        <div className="editor__foot">
          <div className="editor__foot-l">
            <span>ID · {item.id}</span>
            <span>·</span>
            <span>MAJ · {item.updated}</span>
          </div>
          <div className="editor__foot-r">
            <button className="btn btn--ghost btn--sm btn--danger" onClick={onDelete}>Supprimer</button>
            <button className="btn btn--primary">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Right rail preview (public model snapshot) ---------- */
function PublicPreview({ item }) {
  if (!item) return null;
  return (
    <aside className="col-preview">
      <div className="preview-card">
        <span className="label">PREVIEW · APP MOBILE</span>
        <div className="meta-row">
          <span className="pill">{TYPE_LABEL[item.type]}</span>
          {item.category && <span className="pill pill--accent">{item.category.toUpperCase()}</span>}
          {item.premium && <span className="pill pill--premium">★ PREMIUM</span>}
        </div>
        <h3>{item.title || 'Sans titre'}</h3>
        <p>{item.summary || 'Pas encore de résumé.'}</p>
        {item.type === 'episode' && item.durationOverride && <span className="dur">{item.durationOverride} audio</span>}
        {item.type === 'video' && item.durationOverride && <span className="dur">{item.durationOverride} vidéo</span>}
        {item.type === 'episode' && item.audioUrl && <div className="url" style={{ marginTop: 10 }}>{item.audioUrl}</div>}
        {item.type === 'video' && item.youtubeUrl && <div className="url" style={{ marginTop: 10 }}>{item.youtubeUrl}</div>}
        {item.type === 'article' && item.url && <div className="url" style={{ marginTop: 10 }}>{item.url}</div>}
      </div>
      <div className="preview-card">
        <span className="label" style={{ background: '#B14424' }}>JSON · API SHAPE</span>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.6, color: 'var(--ink-2)', background: 'var(--surface-2)', padding: 12, borderRadius: 8, border: '1px solid var(--rule)', overflowX: 'auto' }}>
{`{
  "id": "${item.id}",
  "type": "${item.type}",
  "slug": "${item.slug || ''}",
  "status": "${item.status}",
  "premium": ${item.premium ? 'true' : 'false'}
}`}
        </div>
      </div>
    </aside>
  );
}

/* ---------- Contents page ---------- */
function ContentsPage({ items, setItems, selected, setSelected }) {
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (filterType !== 'all' && i.type !== filterType) return false;
      if (filterStatus !== 'all' && i.status !== filterStatus) return false;
      if (query) {
        const q = query.toLowerCase();
        if (![i.title, i.slug, i.tags, i.summary].some(s => (s || '').toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [items, filterType, filterStatus, query]);

  const item = items.find(i => i.id === selected);

  const handleNew = (type) => {
    const newItem = templateFor(type);
    setItems([newItem, ...items]);
    setSelected(newItem.id);
  };

  const patch = (delta) => {
    setItems(items.map(i => i.id === selected ? { ...i, ...delta, updated: 'à l\u2019instant' } : i));
  };
  const setStatus = (status) => patch({ status });
  const handleDelete = () => {
    if (!confirm('Supprimer ce contenu ?')) return;
    setItems(items.filter(i => i.id !== selected));
    setSelected(null);
  };

  return (
    <div className="page">
      <div className="contents-grid">
        <Sidebar
          items={filtered}
          filterType={filterType} setFilterType={setFilterType}
          filterStatus={filterStatus} setFilterStatus={setFilterStatus}
          query={query} setQuery={setQuery}
          selected={selected} setSelected={setSelected}
          onNew={handleNew}
        />
        <Editor item={item} patch={patch} onStatus={setStatus} onDelete={handleDelete} />
        <PublicPreview item={item} />
      </div>
    </div>
  );
}

Object.assign(window, { ContentsPage });
