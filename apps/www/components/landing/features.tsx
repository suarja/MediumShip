import { Fragment } from "react";

type TitlePart = string | { italic: string };

const FEATURES: { n: string; t: TitlePart[]; d: string }[] = [
  {
    n: "01",
    t: ["Contenu ", { italic: "éditorial" }, " multi-format"],
    d: "Articles longs, vidéos, podcasts, newsletter — un seul flux orchestré.",
  },
  {
    n: "02",
    t: ["Espace ", { italic: "membres" }, " & abonnements"],
    d: "Paywalls natifs, gestion des abonnés, accès gradué premium.",
  },
  {
    n: "03",
    t: ["Player audio ", { italic: "pro" }],
    d: "Lecture continue, vitesse, notes d'épisode, hors-ligne, chapitres.",
  },
  {
    n: "04",
    t: ["Notifications ", { italic: "push" }],
    d: "Segmentation par catégorie, programmation, deeplinks intelligents.",
  },
  {
    n: "05",
    t: ["Personnalisation ", { italic: "totale" }],
    d: "Couleurs, typographie, icône, ton éditorial — votre marque, partout.",
  },
  {
    n: "06",
    t: ["Stats & ", { italic: "rétention" }],
    d: "Dashboards clairs, cohortes, conversion, churn premium.",
  },
];

export function Features() {
  return (
    <section className="section features" id="features">
      <div className="wrap">
        <div className="features__head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>
              <span className="dot">◉</span>Fonctionnalités
            </div>
            <h2 className="h-section serif">
              Un socle produit <i>complet,</i>
              <br />
              prêt à publier.
            </h2>
          </div>
          <p className="lede">
            Tout ce qu'un média propriétaire moderne doit offrir, sans devoir
            développer ou maintenir quoi que ce soit en interne.
          </p>
        </div>
        <div className="features__grid">
          {FEATURES.map((f) => (
            <article className="feat" key={f.n}>
              <div className="feat__num">— {f.n}</div>
              <h3 className="feat__t">
                {f.t.map((part, i) =>
                  typeof part === "string" ? (
                    <Fragment key={i}>{part}</Fragment>
                  ) : (
                    <em key={i}>{part.italic}</em>
                  ),
                )}
              </h3>
              <p className="feat__d">{f.d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
