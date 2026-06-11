export function ProblemSolution() {
  return (
    <section className="section section--tight" id="solution">
      <div className="wrap">
        <div className="split">
          <div className="split__col split__col--problem">
            <div className="eyebrow">
              <span className="dot">◉</span>Le problème
            </div>
            <h3 className="h-section serif">
              Vous construisez sur du <i>terrain loué.</i>
            </h3>
            <p className="lede">
              YouTube, Spotify, Patreon, Substack. Chaque plateforme prend une
              commission, change ses règles, et garde la relation avec votre
              public.
            </p>
            <ul className="bullets">
              <li>
                <span className="x">01</span>
                <span>Algorithme qui décide qui vous voit (ou pas)</span>
              </li>
              <li>
                <span className="x">02</span>
                <span>Vous ne possédez pas vos abonnés</span>
              </li>
              <li>
                <span className="x">03</span>
                <span>30 à 45% de commission sur vos revenus</span>
              </li>
              <li>
                <span className="x">04</span>
                <span>Aucun contrôle sur l'expérience</span>
              </li>
            </ul>
          </div>
          <div className="split__col split__col--solution">
            <div className="eyebrow">
              <span className="dot" style={{ color: "var(--accent)" }}>
                ◉
              </span>
              La solution
            </div>
            <h3 className="h-section serif">
              Votre app. Votre audience. <i>Vos règles.</i>
            </h3>
            <p className="lede">
              Mediumship vous livre une application native sous votre marque,
              prête à publier. Un socle produit éprouvé, personnalisé en 14
              jours.
            </p>
            <ul className="bullets">
              <li>
                <span className="x">✓</span>
                <span>Votre marque, votre direction artistique</span>
              </li>
              <li>
                <span className="x">✓</span>
                <span>Vos abonnés, vos données, vos revenus</span>
              </li>
              <li>
                <span className="x">✓</span>
                <span>Notifications push natives, conversion 5×</span>
              </li>
              <li>
                <span className="x">✓</span>
                <span>Maintenance et évolutions incluses</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
