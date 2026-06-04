/* global React, PALETTES, TYPOS */
// tenant.jsx — Tenant configuration & live mobile preview

const { useMemo } = React;

function MobilePhonePreview({ tenant, items, large }) {
  const palette = PALETTES.find(p => p.id === tenant.palette) || PALETTES[0];
  const typo = TYPOS.find(t => t.id === tenant.typo) || TYPOS[0];
  const phoneVars = { ...palette.vars, ...typo.vars };

  // Build a feed from real content + visibility/feed sections
  const visibleTypes = Object.entries(tenant.visibility).filter(([k, v]) => v && k !== 'premium').map(([k]) => k);
  const filtered = items.filter(i => i.status === 'published' && visibleTypes.includes(i.type) && (tenant.visibility.premium || !i.premium));

  // pick top published for hero, rest for list
  const hero = filtered[0];
  const rest = filtered.slice(1, 4);
  const heroFallback = items.find(i => i.status === 'published') || items[0];
  const heroDisplay = hero || heroFallback;
  const restDisplay = rest.length > 0 ? rest : items.filter(i => i.id !== (heroDisplay && heroDisplay.id)).slice(0, 3);

  const tints = ['', 'alt', 'dk'];
  const typeLabel = { article: 'ARTICLE', episode: 'PODCAST', video: 'VIDÉO' };

  const sections = tenant.feed.slice(0, 4).map(fs => fs.label).join(' · ');

  return (
    <div className={`phone ${large ? 'phone--lg' : ''}`} style={phoneVars}>
      <div className="phone__notch"></div>
      <div className="phone__home"></div>
      <div className="phone__screen">
        <div className="phone__sb">
          <span>9:41</span>
          <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
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
        <div className="mfeed">
          <div className="mfeed__hdr">
            <div className="mfeed__logo">
              <i>{tenant.brandName}</i><span className="d"></span>
            </div>
            <div className="mfeed__av"></div>
          </div>
          <div className="mfeed__tabs">
            {(tenant.feed.slice(0, 4)).map((fs, i) => (
              <span key={fs.id} className={i === 0 ? 'on' : ''}>{fs.label}</span>
            ))}
          </div>
          {heroDisplay && (
            <div className="mfeed__hero">
              <span className="k">◉ {(heroDisplay.category || typeLabel[heroDisplay.type]).toUpperCase()}</span>
              <span className="t">{heroDisplay.title}</span>
              <span className="m">
                <span className="pl">▶</span>
                <span>{heroDisplay.durationOverride || '22 MIN'} · {(typeLabel[heroDisplay.type] || '')}</span>
              </span>
            </div>
          )}
          <div className="mfeed__list">
            {restDisplay.slice(0, 3).map((it, i) => (
              <div className="mfeed__item" key={it.id}>
                <div className={`ph ${tints[i]}`}></div>
                <div className="meta">
                  <span className="k">{typeLabel[it.type]}{it.premium ? ' · ★ PREMIUM' : ''}</span>
                  <span className="t">{it.title}</span>
                  <span className="d">{it.durationOverride || it.updated}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Section: Identity ---------- */
function IdentitySection({ tenant, setTenant }) {
  return (
    <section className="tenant-section">
      <div className="tenant-section__h">— Identité</div>
      <h3 className="tenant-section__t">Marque <i>de l'app.</i></h3>
      <div className="identity">
        <div className="identity__logo">{(tenant.brandName[0] || 'M').toUpperCase()}</div>
        <div className="identity__fields">
          <Field label="Nom de la marque">
            <input className="input" value={tenant.brandName} onChange={(e) => setTenant({ ...tenant, brandName: e.target.value })} />
          </Field>
          <Field label="Slug du tenant">
            <input className="input input--mono" value={tenant.brandSlug} onChange={(e) => setTenant({ ...tenant, brandSlug: e.target.value })} />
          </Field>
        </div>
      </div>
      <div className="upload" style={{ marginTop: 14 }}>
        <div className="upload__thumb" style={{ background: 'var(--accent)', display: 'grid', placeItems: 'center', color: '#fff', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 26 }}>
          {(tenant.brandName[0] || 'M').toUpperCase()}
        </div>
        <div className="upload__meta">
          <h5 className="upload__t">App icon · 1024 × 1024</h5>
          <div className="upload__d">PNG · iOS & Android · fond plein recommandé</div>
        </div>
        <button className="btn btn--ghost btn--sm">Téléverser</button>
      </div>
    </section>
  );
}

/* ---------- Section: Palette ---------- */
function PaletteSection({ tenant, setTenant }) {
  return (
    <section className="tenant-section">
      <div className="tenant-section__h">— Palette</div>
      <h3 className="tenant-section__t">Couleurs de <i>l'app.</i></h3>
      <div className="palette-grid">
        {PALETTES.map(p => (
          <button key={p.id} className={`swatch ${tenant.palette === p.id ? 'on' : ''}`} onClick={() => setTenant({ ...tenant, palette: p.id })}>
            <div className="swatch__chips">
              {p.chips.map((c, i) => <span key={i} style={{ background: c }}></span>)}
            </div>
            <h5 className="swatch__nm">{p.nm}</h5>
            <span className="swatch__d">{p.d}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------- Section: Typography ---------- */
function TypographySection({ tenant, setTenant }) {
  return (
    <section className="tenant-section">
      <div className="tenant-section__h">— Typographie</div>
      <h3 className="tenant-section__t">Couple <i>typographique.</i></h3>
      <div className="typo-set">
        {TYPOS.map(t => (
          <button key={t.id} className={`typo ${tenant.typo === t.id ? 'on' : ''}`} onClick={() => setTenant({ ...tenant, typo: t.id })}>
            <span className="typo__radio"></span>
            <div className="typo__samples">
              <span className="typo__display" style={{ fontFamily: t.vars['--m-display'], fontStyle: t.vars['--m-display-style'], fontWeight: t.vars['--m-display-weight'] }}>
                {t.display}
              </span>
              <span className="typo__body" style={{ fontFamily: t.vars['--m-body'] }}>
                + {t.body} — corps de texte
              </span>
            </div>
            <span className="typo__nm">{t.nm}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------- Section: Visibility ---------- */
function VisibilitySection({ tenant, setTenant }) {
  const v = tenant.visibility;
  const update = (key, val) => setTenant({ ...tenant, visibility: { ...v, [key]: val } });
  return (
    <section className="tenant-section">
      <div className="tenant-section__h">— Visibilité</div>
      <h3 className="tenant-section__t">Types <i>de contenus.</i></h3>
      <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: '0 0 4px' }}>
        Cochez les types affichés dans l'app et activez le contenu premium si vous proposez un abonnement.
      </p>
      <div className="visibility-grid">
        <label className="check"><input type="checkbox" checked={v.articles} onChange={(e) => update('articles', e.target.checked)} /><span className="check__box"></span>Articles</label>
        <label className="check"><input type="checkbox" checked={v.episodes} onChange={(e) => update('episodes', e.target.checked)} /><span className="check__box"></span>Épisodes</label>
        <label className="check"><input type="checkbox" checked={v.videos} onChange={(e) => update('videos', e.target.checked)} /><span className="check__box"></span>Vidéos</label>
        <label className="check"><input type="checkbox" checked={v.premium} onChange={(e) => update('premium', e.target.checked)} /><span className="check__box"></span>Contenu premium</label>
      </div>
    </section>
  );
}

/* ---------- Section: Feed sections ---------- */
function FeedSectionsSection({ tenant, setTenant }) {
  const feed = tenant.feed;
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= feed.length) return;
    const copy = feed.slice();
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setTenant({ ...tenant, feed: copy });
  };
  const remove = (i) => setTenant({ ...tenant, feed: feed.filter((_, idx) => idx !== i) });
  const add = () => setTenant({ ...tenant, feed: [...feed, { id: 'fs' + Date.now(), type: 'article', label: 'Nouvelle section' }] });
  const update = (i, key, val) => setTenant({ ...tenant, feed: feed.map((fs, idx) => idx === i ? { ...fs, [key]: val } : fs) });
  return (
    <section className="tenant-section">
      <div className="tenant-section__h">— Sections du feed</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 10 }}>
        <h3 className="tenant-section__t" style={{ marginBottom: 0 }}>Architecture <i>du home.</i></h3>
        <button className="btn btn--surface btn--sm" onClick={add}>Ajouter</button>
      </div>
      <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: '0 0 4px' }}>
        L'ordre détermine l'apparence sur l'app mobile : la première section devient le hero, les suivantes les rails.
      </p>
      <div className="feed-list">
        {feed.map((fs, i) => (
          <div className="feed-row" key={fs.id}>
            <span className="grip">⋮⋮</span>
            <select className="select" value={fs.type} onChange={(e) => update(i, 'type', e.target.value)}>
              <option value="article">article</option>
              <option value="episode">episode</option>
              <option value="video">video</option>
            </select>
            <input className="input" value={fs.label} onChange={(e) => update(i, 'label', e.target.value)} />
            <div className="ord">
              <button onClick={() => move(i, -1)}>↑</button>
              <button onClick={() => move(i, +1)}>↓</button>
            </div>
            <button className="btn btn--sm btn--danger" onClick={() => remove(i)}>Retirer</button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Helper ---------- */
function Field({ label, children }) {
  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <span className="field__lbl">{label}</span>
      {children}
    </div>
  );
}

/* ---------- Page ---------- */
function TenantPage({ tenant, setTenant, items }) {
  return (
    <div className="page">
      <div className="tenant-grid">
        <div className="tenant-col">
          <IdentitySection tenant={tenant} setTenant={setTenant} />
          <PaletteSection tenant={tenant} setTenant={setTenant} />
          <TypographySection tenant={tenant} setTenant={setTenant} />
          <VisibilitySection tenant={tenant} setTenant={setTenant} />
          <FeedSectionsSection tenant={tenant} setTenant={setTenant} />
        </div>

        <div className="tenant-col tenant-col--right">
          <div className="mobile-preview">
            <div className="mobile-preview__h">
              <span className="lbl">— Live mobile preview</span>
              <span className="tg">{tenant.palette} · {tenant.typo}</span>
            </div>
            <MobilePhonePreview tenant={tenant} items={items} />
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <button className="btn btn--ghost btn--block">Réinitialiser</button>
              <button className="btn btn--primary btn--block">Enregistrer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TenantPage, MobilePhonePreview });
