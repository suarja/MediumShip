export function KnowlyNav() {
  return (
    <header className="nav">
      <div className="wrap nav__row">
        <a href="/knowly" className="brand">
          Knowly<span className="brand__dot" />
        </a>
        <nav className="nav__links">
          <a href="#pour-qui">Pour qui</a>
          <a href="#comment">Comment ça marche</a>
          <a href="#sources">Sources</a>
          <a href="#analogie">Knowly vs…</a>
        </nav>
        <div className="nav__cta-group">
          <a href="/" className="btn btn--ghost nav__login" title="Studio Mediumship">
            <span className="nav__login-dot" />
            Studio
          </a>
          <a href="#download" className="btn btn--primary nav__cta">
            Télécharger
            <span className="arr">→</span>
          </a>
        </div>
      </div>
    </header>
  );
}
