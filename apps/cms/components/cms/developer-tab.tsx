"use client";

export function DeveloperTab() {
  return (
    <main className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Développeur</h1>
          <p className="page__subtitle">
            Catalogue global IPTC · Import · Recherche · Ajout à la taxonomie tenant
          </p>
        </div>
      </div>

      <div className="dev-grid">
        {/* Import section — Task 3 */}
        <section className="panel dev-panel" id="import-section">
          <div className="panel__header">
            <span className="ic">⬡</span>
            <h2 className="panel__title">Catalogue IPTC</h2>
          </div>
          <p className="empty-copy">Chargement…</p>
        </section>

        {/* Search section — Task 4 */}
        <section className="panel dev-panel" id="search-section">
          <div className="panel__header">
            <span className="ic">◎</span>
            <h2 className="panel__title">Recherche catalogue</h2>
          </div>
          <p className="empty-copy">Chargement…</p>
        </section>
      </div>
    </main>
  );
}
