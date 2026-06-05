/* global React, ACCESS_LABEL */
// modules.jsx — CMS "Modules & accès" : enable/disable + free/member/premium per feature

const { useMemo: useModMemo } = React;

function AccessSegment({ value, locked, disabled, onChange }) {
  if (locked) {
    return <span className="seg--fixed">{ACCESS_LABEL[value]} · fixe</span>;
  }
  const opts = [
    { v: 'free', l: 'Gratuit' },
    { v: 'member', l: 'Membre' },
    { v: 'premium', l: 'Premium' },
  ];
  return (
    <div className="seg" aria-disabled={disabled ? 'true' : 'false'}>
      {opts.map(o => (
        <button
          key={o.v}
          className={`${value === o.v ? 'on ' + o.v : ''}`}
          onClick={() => !disabled && onChange(o.v)}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function ModuleToggle({ checked, locked, onChange }) {
  return (
    <div className="mod-toggle-cell">
      <span className="lbl">{checked ? 'Activé' : 'Désactivé'}</span>
      <label className="toggle">
        <input
          type="checkbox"
          checked={checked}
          disabled={locked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle__sw"></span>
      </label>
    </div>
  );
}

function ModulesPage({ modules, setModules }) {
  const update = (gi, fi, delta) => {
    setModules(modules.map((g, i) =>
      i !== gi ? g : { ...g, features: g.features.map((f, j) => j !== fi ? f : { ...f, ...delta }) }
    ));
  };

  const stats = useModMemo(() => {
    let on = 0, free = 0, member = 0, premium = 0, total = 0;
    modules.forEach(g => g.features.forEach(f => {
      total++;
      if (f.enabled) {
        on++;
        if (f.access === 'free') free++;
        else if (f.access === 'member') member++;
        else premium++;
      }
    }));
    return { on, free, member, premium, total };
  }, [modules]);

  return (
    <div className="page">
      <div className="mod-page">
        <div className="mod-col">
          {modules.map((g, gi) => (
            <section className="mod-group" key={g.group}>
              <div className="mod-group__h">
                <span className="t serif">{g.group}</span>
                <span className="c">{g.features.filter(f => f.enabled).length}/{g.features.length} actifs</span>
              </div>
              {g.features.map((f, fi) => (
                <div className={`mod-row ${f.enabled ? '' : 'off'}`} key={f.key}>
                  <div className="mod-row__info">
                    <h4 className="mod-row__t">
                      {f.label}
                      {f.lockModule && <span className="mod-row__lock">Core</span>}
                    </h4>
                    <p className="mod-row__d">{f.desc}</p>
                  </div>
                  <AccessSegment
                    value={f.access}
                    locked={f.lockAccess}
                    disabled={!f.enabled}
                    onChange={(v) => update(gi, fi, { access: v })}
                  />
                  <ModuleToggle
                    checked={f.enabled}
                    locked={f.lockModule}
                    onChange={(v) => update(gi, fi, { enabled: v })}
                  />
                </div>
              ))}
            </section>
          ))}
        </div>

        <aside className="mod-summary">
          <div className="mod-summary__card">
            <div className="h">— Résumé tenant</div>
            <div className="mod-stat"><span className="k">Modules activés</span><span className="v">{stats.on}/{stats.total}</span></div>
            <div className="mod-stat"><span className="k">Gratuit</span><span className="v">{stats.free}</span></div>
            <div className="mod-stat"><span className="k">Membre</span><span className="v">{stats.member}</span></div>
            <div className="mod-stat"><span className="k">Premium</span><span className="v">{stats.premium}</span></div>
          </div>

          <div className="mod-summary__card">
            <div className="h">— Niveaux d'accès</div>
            <div className="mod-legend">
              <div className="row"><span className="dot free"></span><span><b>Gratuit</b> — invité, sans compte</span></div>
              <div className="row"><span className="dot member"></span><span><b>Membre</b> — compte requis, gratuit</span></div>
              <div className="row"><span className="dot premium"></span><span><b>Premium</b> — abonnement payant</span></div>
            </div>
          </div>

          <div className="mod-summary__card">
            <div className="h">— Comment ça marche</div>
            <p className="mod-note">
              Le <b>toggle</b> active ou retire la feature de l'app pour ce client.
              Le <b>sélecteur</b> définit qui peut l'utiliser. Une feature désactivée
              disparaît de la navigation ; une feature premium déclenche le paywall
              contextuel au moment de l'usage.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--ghost btn--block">Réinitialiser</button>
            <button className="btn btn--primary btn--block">Enregistrer</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

Object.assign(window, { ModulesPage });
