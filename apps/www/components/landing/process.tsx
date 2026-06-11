const STEPS = [
  {
    n: "01",
    t: "Brief & cadrage",
    d: "Audience, contenus, ambitions, offre premium. On définit ensemble la promesse de l'app.",
    dur: "Semaine 1",
  },
  {
    n: "02",
    t: "Design sur-mesure",
    d: "Maquettes hi-fi de votre app, sous votre marque, prêtes à valider avant développement.",
    dur: "Semaine 1—2",
  },
  {
    n: "03",
    t: "Build & intégration",
    d: "Configuration de votre socle, import de vos contenus, branchement abonnements et notifications.",
    dur: "Semaine 2",
  },
  {
    n: "04",
    t: "Mise en ligne",
    d: "Soumission App Store et Play Store, déploiement, formation de votre équipe.",
    dur: "Semaine 2—3",
  },
];

export function Process() {
  return (
    <section className="section" id="process">
      <div className="wrap">
        <div className="process__head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>
              <span className="dot">◉</span>Process
            </div>
            <h2 className="h-section serif">
              Du brief au store en <i>14 jours.</i>
            </h2>
          </div>
          <p className="lede" style={{ maxWidth: 360 }}>
            Une équipe dédiée, un calendrier serré, aucune surprise. Vous validez
            chaque étape.
          </p>
        </div>
        <div className="process__grid">
          {STEPS.map((s) => (
            <div className="step" key={s.n}>
              <div className="step__n">— {s.n}</div>
              <h3 className="step__t serif">{s.t}</h3>
              <p className="step__d">{s.d}</p>
              <div className="step__dur">{s.dur}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
