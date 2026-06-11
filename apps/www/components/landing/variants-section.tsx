import { BrandedFeed, VARIANTS } from "../demo/branded-feed";

const CHANGES = [
  { i: "Logo & icône", d: "Marque, splash screen, app icon iOS/Android." },
  { i: "Couleur", d: "Palette complète, accent, fond, surfaces." },
  { i: "Typographie", d: "Display éditoriale + corps de texte." },
  { i: "Catégories", d: "Architecture du home feed, vocabulaire." },
  { i: "Ton éditorial", d: "Voix de marque, microcopy, CTA." },
  { i: "Offre premium", d: "Paliers, prix, durées d'essai, bénéfices." },
];

const FIXED = [
  { i: "Navigation", d: "Tabs, hiérarchie, transitions natives iOS/Android." },
  { i: "Player audio", d: "Lecture continue, vitesse, hors-ligne, chapitres." },
  { i: "Paywall", d: "Plans, conversion, abonnements natifs." },
  { i: "Home feed", d: "Structure, cards, hero éditorial, infinite scroll." },
  { i: "Espace membres", d: "Profil, préférences, gestion d'abonnement." },
  { i: "Notifications", d: "Push segmenté, deeplinks, planification." },
];

export function Variants() {
  return (
    <section className="section variants" id="variants">
      <div className="wrap">
        <header className="variants__head">
          <div className="eyebrow">
            <span className="dot">◉</span>Démonstration · white-label
          </div>
          <h2 className="h-section serif">
            Un socle. <i>Plusieurs identités.</i>
          </h2>
          <p className="lede">
            Le même produit, la même architecture — trois directions de marque,
            trois tonalités, trois audiences. Toutes livrables en 14 jours.
          </p>
        </header>

        <div className="variants__strip">
          {VARIANTS.map((v) => (
            <article className="variant" key={v.id}>
              <div className="variant__badge mono">{v.badge}</div>
              <div className="variant__phone">
                <BrandedFeed variant={v} />
              </div>
              <div className="variant__meta">
                <h3 className="variant__brand serif">{v.brand}</h3>
                <p className="variant__tagline">{v.tagline}</p>
                <p className="variant__desc">{v.desc}</p>
                <div className="variant__dna">
                  {v.dna.map((d) => (
                    <div className="variant__dna-row" key={d.k}>
                      <span className="k">{d.k}</span>
                      <span className="v">
                        {d.sw && (
                          <span className="dna-sw-row">
                            {d.sw.map((c, i) => (
                              <span
                                key={i}
                                className="dna-sw"
                                style={{ background: c }}
                              />
                            ))}
                          </span>
                        )}
                        <span>{d.v}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="variants__matrix">
          <div className="vm-col vm-col--change">
            <div className="eyebrow">
              <span className="dot">◉</span>Ce qui change
            </div>
            <h3 className="h-3 serif">Ce que vous personnalisez.</h3>
            <ul>
              {CHANGES.map((r) => (
                <li key={r.i}>
                  <span className="i">{r.i}</span>
                  <span className="d">{r.d}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="vm-col vm-col--fixed">
            <div className="eyebrow">
              <span className="dot">◉</span>Ce qui reste fixe
            </div>
            <h3 className="h-3 serif">
              Le socle que vous n'avez pas à construire.
            </h3>
            <ul>
              {FIXED.map((r) => (
                <li key={r.i}>
                  <span className="i">{r.i}</span>
                  <span className="d">{r.d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
