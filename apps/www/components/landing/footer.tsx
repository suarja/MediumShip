export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__row">
          <div className="footer__col footer__brand">
            <div className="brand" style={{ fontSize: 24 }}>
              Mediumship<span className="brand__dot" />
            </div>
            <p>
              Studio d'applications mobiles white-label pour médias indépendants,
              créateurs et podcasteurs.
            </p>
          </div>
          <div className="footer__col">
            <h4>Produit</h4>
            <a href="#preuve">Aperçu</a>
            <a href="#features">Fonctionnalités</a>
            <a href="#wl">White-label</a>
          </div>
          <div className="footer__col">
            <h4>Studio</h4>
            <a href="/knowly">Démo Knowly</a>
            <a href="#">Réalisations</a>
            <a href="#">Journal</a>
          </div>
          <div className="footer__col">
            <h4>Contact</h4>
            <a href="mailto:studio@mediumship.app">studio@mediumship.app</a>
            <a href="#cta">Booker un appel</a>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© 2026 Mediumship Studio · Paris</span>
          <span className="mono">v1.0 — démo white-label</span>
        </div>
      </div>
    </footer>
  );
}
