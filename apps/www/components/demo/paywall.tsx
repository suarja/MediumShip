import { Phone, StatusBar } from "./phone";

export function Paywall({ large = false }: { large?: boolean }) {
  return (
    <Phone large={large} label="Paywall premium">
      <StatusBar />
      <div className="app-content">
        <div className="pw">
          <div className="pw__close">✕ Fermer</div>
          <div className="pw__crest">M</div>
          <div className="pw__eyebrow">◉ Accès Mediumship Premium</div>
          <h3 className="pw__title">
            Soutenez le travail. <i>Recevez plus.</i>
          </h3>
          <p className="pw__sub">
            Les coulisses, les éditions longues, et la communauté.
          </p>

          <div className="pw__plans">
            <div className="pw__plan">
              <div className="nm">Mensuel</div>
              <div className="pr">
                7€<small> /mois</small>
              </div>
            </div>
            <div className="pw__plan on">
              <div className="bd">Le choix</div>
              <div className="nm">Annuel</div>
              <div className="pr">
                59€<small> /an · −30%</small>
              </div>
            </div>
          </div>

          <div className="pw__benefits">
            <div className="b">
              <span className="c">✓</span>
              <span>Tous les épisodes en avant-première</span>
            </div>
            <div className="b">
              <span className="c">✓</span>
              <span>Éditions longues + archives complètes</span>
            </div>
            <div className="b">
              <span className="c">✓</span>
              <span>Salon membres privé</span>
            </div>
          </div>

          <div className="pw__cta">Continuer · 59€ / an</div>
          <div className="pw__fine">
            Renouvellement automatique · Annulez à tout moment.
          </div>
        </div>
      </div>
    </Phone>
  );
}
