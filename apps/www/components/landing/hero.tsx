import { HomeFeed } from "../demo/home-feed";

export function Hero() {
  return (
    <section className="section hero">
      <div className="wrap hero__grid">
        <div>
          <div className="eyebrow hero__eyebrow">
            <span className="dot">◉</span>Studio d'apps mobiles white-label · pour
            médias et créateurs
          </div>
          <h1 className="h-display serif">
            Transformez votre audience en <i>média propriétaire.</i>
          </h1>
          <p className="lede hero__lede">
            Mediumship conçoit votre application iOS et Android premium — contenu,
            podcasts, vidéos, abonnements. Vous gardez l'audience. Nous nous
            occupons du reste.
          </p>
          <div className="hero__cta">
            <a href="#cta" className="btn btn--primary btn--big">
              Booker un appel découverte<span className="arr">→</span>
            </a>
            <a href="#preuve" className="btn btn--ghost btn--big">
              Voir l'app démo
            </a>
          </div>
          <div className="hero__meta">
            <div>
              <div className="k serif">14 j.</div>
              <div className="v">De la maquette au store</div>
            </div>
            <div>
              <div className="k serif">100%</div>
              <div className="v">Sous votre marque</div>
            </div>
            <div>
              <div className="k serif">
                iOS<span style={{ opacity: 0.4 }}> · </span>And.
              </div>
              <div className="v">Apps natives livrées</div>
            </div>
          </div>
        </div>
        <div className="hero__phone">
          <HomeFeed large />
        </div>
      </div>
    </section>
  );
}
