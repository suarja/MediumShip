export function FinalCTA() {
  return (
    <section className="section" id="cta">
      <div className="wrap">
        <div className="cta">
          <div
            className="eyebrow"
            style={{
              color: "color-mix(in oklab, var(--bg) 60%, transparent)",
              marginBottom: 24,
            }}
          >
            <span className="dot">◉</span>Prêt à lancer votre app ?
          </div>
          <h2 className="h-section serif">
            Discutons de votre <em>média propriétaire.</em>
          </h2>
          <p className="lede cta__lede">
            30 minutes pour comprendre votre audience, votre contenu et vos
            ambitions. Vous repartez avec un plan, qu'on travaille ensemble ou
            non.
          </p>
          <div className="cta__row">
            <a href="#" className="btn btn--accent btn--big">
              Booker un appel découverte<span className="arr">→</span>
            </a>
            <a href="#" className="btn btn--ghost btn--big">
              Recevoir le dossier PDF
            </a>
          </div>
          <div className="cta__sig">
            — MEDIUMSHIP · STUDIO D'APPS POUR MÉDIAS &amp; CRÉATEURS
          </div>
        </div>
      </div>
    </section>
  );
}
