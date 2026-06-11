import { env } from "../../lib/env";

export function Nav() {
  return (
    <header className="nav">
      <div className="wrap nav__row">
        <a href="#" className="brand">
          Mediumship<span className="brand__dot" />
        </a>
        <nav className="nav__links">
          <a href="#preuve">L'app</a>
          <a href="#solution">Pourquoi</a>
          <a href="#features">Fonctionnalités</a>
          <a href="#wl">White-label</a>
          <a href="#variants">Variantes</a>
          <a href="#process">Process</a>
        </nav>
        <div className="nav__cta-group">
          <a
            href={env.cmsUrl}
            className="btn btn--ghost nav__login"
            title="Accéder au CMS"
          >
            <span className="nav__login-dot" />
            CMS
          </a>
          <a href="#cta" className="btn btn--primary nav__cta">
            Booker un appel
            <span className="arr">→</span>
          </a>
        </div>
      </div>
    </header>
  );
}
