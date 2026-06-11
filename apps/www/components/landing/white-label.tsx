export function WhiteLabel() {
  return (
    <section className="section wl" id="wl">
      <div className="wrap">
        <div className="wl__grid">
          <div className="wl__copy">
            <div className="eyebrow" style={{ marginBottom: 16 }}>
              <span className="dot">◉</span>Comment la personnalisation fonctionne
            </div>
            <h2 className="h-section serif">
              Un socle premium.
              <br />
              <i>Votre marque, partout.</i>
            </h2>
            <p className="lede">
              Mediumship n'est pas un constructeur drag-and-drop. C'est un produit
              éprouvé, redécliné chaque fois autour de votre identité — logo,
              palette, typographie, ton éditorial, hiérarchie du home feed, offre
              premium.
            </p>
            <div className="wl__steps">
              <span className="wl__step">
                <span className="n">01</span> Brief
              </span>
              <span className="wl__step">
                <span className="n">02</span> Design
              </span>
              <span className="wl__step">
                <span className="n">03</span> Build
              </span>
              <span className="wl__step">
                <span className="n">04</span> Launch
              </span>
            </div>
          </div>
          <div
            className="wl__matrix"
            role="table"
            aria-label="Éléments personnalisables"
          >
            <div className="wl__row">
              <div className="k">Logo & icône</div>
              <div className="v">
                <b>Votre logo</b>, app icon iOS/Android, splash screen
              </div>
            </div>
            <div className="wl__row">
              <div className="k">Couleurs</div>
              <div className="v swatches">
                <span className="wl__sw" style={{ background: "var(--ink)" }} />
                <span className="wl__sw" style={{ background: "var(--accent)" }} />
                <span className="wl__sw" style={{ background: "var(--bg-alt)" }} />
                <span className="wl__sw" style={{ background: "#fff" }} />
                <span
                  style={{
                    marginLeft: 10,
                    fontSize: 12.5,
                    color: "var(--ink-soft)",
                  }}
                >
                  Palette complète personnalisée
                </span>
              </div>
            </div>
            <div className="wl__row">
              <div className="k">Typographie</div>
              <div
                className="v"
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 22,
                    lineHeight: 1,
                  }}
                >
                  Display
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    color: "var(--ink-soft)",
                  }}
                >
                  + corps de texte
                </span>
              </div>
            </div>
            <div className="wl__row">
              <div className="k">Ton éditorial</div>
              <div className="v">
                Voix de marque, micro-copy, vocabulaire des catégories
              </div>
            </div>
            <div className="wl__row">
              <div className="k">Home feed</div>
              <div className="v">
                <span className="wl__pill">À la une</span>{" "}
                <span className="wl__pill">Écouter</span>{" "}
                <span className="wl__pill">Lire</span>{" "}
                <span className="wl__pill">Premium</span>
              </div>
            </div>
            <div className="wl__row">
              <div className="k">Catégories</div>
              <div className="v">
                Vos rubriques, vos sections, votre architecture éditoriale
              </div>
            </div>
            <div className="wl__row">
              <div className="k">Offre premium</div>
              <div className="v">
                Paliers, prix, durées d'essai, bénéfices, paywall sur-mesure
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
