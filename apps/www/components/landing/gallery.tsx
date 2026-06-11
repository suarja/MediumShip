import { HomeFeed } from "../demo/home-feed";
import { PodcastPlayer } from "../demo/podcast-player";
import { Paywall } from "../demo/paywall";

export function Gallery() {
  return (
    <section className="section section--tight" id="preuve">
      <div className="wrap">
        <div className="gallery">
          <div className="gallery__head">
            <div>
              <div
                className="eyebrow"
                style={{
                  color: "color-mix(in oklab, var(--bg) 60%, transparent)",
                  marginBottom: 16,
                }}
              >
                <span className="dot">◉</span>Aperçu produit
              </div>
              <h2 className="h-section serif">
                Une app pensée comme <i>un magazine vivant.</i>
              </h2>
            </div>
            <p className="lede" style={{ minWidth: 280 }}>
              Trois écrans extraits de la démo Mediumship — votre version sera
              identique en architecture, personnalisée en marque.
            </p>
          </div>
          <div className="gallery__strip">
            <div className="gallery__col">
              <HomeFeed />
              <div className="gallery__caption">
                <div className="l serif">Home feed</div>
                <div className="s">
                  Catégories, contenu éditorial, fil quotidien
                </div>
              </div>
            </div>
            <div className="gallery__col">
              <PodcastPlayer />
              <div className="gallery__caption">
                <div className="l serif">Player audio</div>
                <div className="s">
                  Lecture continue, vitesse, notes d'épisode
                </div>
              </div>
            </div>
            <div className="gallery__col">
              <Paywall />
              <div className="gallery__caption">
                <div className="l serif">Abonnement</div>
                <div className="s">
                  Paywall natif iOS/Android, conversion soignée
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
