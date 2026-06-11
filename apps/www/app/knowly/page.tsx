import { Fragment } from "react";
import type { Metadata } from "next";

import { KnowlyNav } from "../../components/knowly/knowly-nav";
import { HomeFeed } from "../../components/demo/home-feed";

export const metadata: Metadata = {
  title: "Knowly — la plupart des fils te font réagir, celui-ci te fait réfléchir",
  description:
    "Les réseaux optimisent l'indignation. Knowly ralentit : un fil d'idées qui t'apprend, sans le vide du doom scroll. Wikipedia, YouTube et plus, dans un seul fil trié pour toi.",
};

/* ---------- Hero (manifesto) ---------- */
function KnowlyHero() {
  return (
    <section className="section hero">
      <div className="wrap hero__grid">
        <div>
          <div className="eyebrow hero__eyebrow">
            <span className="dot">◉</span>App de découverte d'idées · iOS &amp;
            Android
          </div>
          <h1 className="h-display serif">
            La plupart des fils te font réagir.{" "}
            <i>Celui-ci te fait réfléchir.</i>
          </h1>
          <p className="lede hero__lede">
            Les réseaux optimisent l'indignation : leurs algorithmes poussent ce
            qui rend viral — la colère, le clash — et t'enferment dans ta bulle.
            C'est le réflexe : rapide, émotionnel. Ici, on ralentit.
          </p>
          <div className="hero__cta">
            <a href="#download" className="btn btn--primary btn--big">
              Commencer<span className="arr">→</span>
            </a>
            <a href="#comment" className="btn btn--ghost btn--big">
              Comment ça marche
            </a>
          </div>
          <div className="hero__meta">
            <div>
              <div className="k serif">Wiki</div>
              <div className="v">+ YouTube, et bientôt plus</div>
            </div>
            <div>
              <div className="k serif">0 €</div>
              <div className="v">Sans compte, dès l'ouverture</div>
            </div>
            <div>
              <div className="k serif">Un fil</div>
              <div className="v">Trié pour toi, pas pour l'algo</div>
            </div>
          </div>
        </div>
        <div className="hero__phone">
          <HomeFeed large brand="Knowly" />
        </div>
      </div>
    </section>
  );
}

/* ---------- Pour qui ---------- */
const AUDIENCE = [
  {
    n: "01",
    t: "Curieux & apprenants",
    d: "Découvrir sans culpabiliser de scroller — mais en retenant quelque chose.",
  },
  {
    n: "02",
    t: "Utilisateurs de Gleeph",
    d: "Tu suis tes livres et tes goûts ; Knowly fait pareil pour les idées.",
  },
  {
    n: "03",
    t: "Marathoniens Wikipédia / YouTube",
    d: "Tu tombes dans des trous sans fin, sans mémoire de ce qui t'a accroché.",
  },
  {
    n: "04",
    t: "Fatigués des réseaux",
    d: "Un fil utile, pas un mur de polémiques ni des clips vides.",
  },
];

function Audience() {
  return (
    <section className="section features" id="pour-qui">
      <div className="wrap">
        <div className="features__head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>
              <span className="dot">◉</span>Pour qui
            </div>
            <h2 className="h-section serif">
              Pour ceux qui veulent <i>scroller utilement.</i>
            </h2>
          </div>
          <p className="lede">
            Knowly n'est pas un réseau social. Exploration et bibliothèque
            personnelle d'abord — le social pourra venir plus tard.
          </p>
        </div>
        <div className="features__grid">
          {AUDIENCE.map((a) => (
            <article className="feat" key={a.n}>
              <div className="feat__num">— {a.n}</div>
              <h3 className="feat__t">{a.t}</h3>
              <p className="feat__d">{a.d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Problème / Promesse ---------- */
function ProblemPromise() {
  return (
    <section className="section section--tight" id="pourquoi">
      <div className="wrap">
        <div className="split">
          <div className="split__col split__col--problem">
            <div className="eyebrow">
              <span className="dot">◉</span>Le problème
            </div>
            <h3 className="h-section serif">
              Tu scrolles beaucoup. <i>Tu retiens peu.</i>
            </h3>
            <p className="lede">
              Du temps passé, peu de progression. Tu consommes passivement.
            </p>
            <ul className="bullets">
              <li>
                <span className="x">01</span>
                <span>TikTok, Reels, X : rapide, addictif, peu de profondeur</span>
              </li>
              <li>
                <span className="x">02</span>
                <span>
                  Wikipédia, YouTube : riches, mais sans mémoire de tes goûts
                </span>
              </li>
              <li>
                <span className="x">03</span>
                <span>Newsletters, podcasts : excellents, mais noyés</span>
              </li>
              <li>
                <span className="x">04</span>
                <span>Chaque session repart de zéro</span>
              </li>
            </ul>
          </div>
          <div className="split__col split__col--solution">
            <div className="eyebrow">
              <span className="dot" style={{ color: "var(--accent)" }}>
                ◉
              </span>
              La promesse
            </div>
            <h3 className="h-section serif">
              On ralentit. <i>Et le fil t'apprend.</i>
            </h3>
            <p className="lede">
              Tu gardes la découverte infinie et le plaisir du fil ; tu gagnes de
              la profondeur et un fil qui apprend.
            </p>
            <ul className="bullets">
              <li>
                <span className="x">✓</span>
                <span>Idées structurées, sources, profondeur</span>
              </li>
              <li>
                <span className="x">✓</span>
                <span>Un fil qui apprend tes centres d'intérêt</span>
              </li>
              <li>
                <span className="x">✓</span>
                <span>Engagement réel : lire, regarder, finir</span>
              </li>
              <li>
                <span className="x">✓</span>
                <span>Hasard contrôlé — sortir de sa bulle sans chaos</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Analogie Gleeph ---------- */
const ANALOGY: { k: string; v: string }[] = [
  { k: "Livre", v: "Idée — article, vidéo, épisode, extrait encyclopédique" },
  { k: "Ma bibliothèque", v: "Mes idées sauvegardées" },
  { k: "Profil de goût littéraire", v: "Profil de curiosité" },
  { k: "Recos livres", v: "Fil qui s'adapte à ce que tu ouvres et termines" },
];

function Analogy() {
  return (
    <section className="section wl" id="analogie">
      <div className="wrap">
        <div className="wl__grid">
          <div className="wl__copy">
            <div className="eyebrow" style={{ marginBottom: 16 }}>
              <span className="dot">◉</span>L'analogie
            </div>
            <h2 className="h-section serif">
              Gleeph pour tes livres.
              <br />
              <i>Knowly pour tes idées.</i>
            </h2>
            <p className="lede">
              Gleeph suit tes livres, construit ton profil de lecteur et te
              recommande quoi lire ensuite. Knowly applique la même logique aux
              idées, tous formats confondus.
            </p>
          </div>
          <div className="wl__matrix" role="table" aria-label="Gleeph vers Knowly">
            {ANALOGY.map((row) => (
              <div className="wl__row" key={row.k}>
                <div className="k">{row.k}</div>
                <div className="v">{row.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Comment ça marche ---------- */
const STEPS = [
  {
    n: "01",
    t: "Sans compte",
    d: "Scrolle tout de suite dans un fil d'idées. Ouvre ce qui t'intrigue, passe le reste.",
    dur: "Dès l'ouverture",
  },
  {
    n: "02",
    t: "Avec un compte",
    d: "Sauvegarde les idées qui comptent. Le fil s'adapte à ce que tu explores en profondeur.",
    dur: "Bibliothèque + sync",
  },
  {
    n: "03",
    t: "Le moment où ça clique",
    d: "« Je garde ce qui compte, et demain le fil connaît mieux ce qui m'intéresse. »",
    dur: "Au fil du temps",
  },
];

function HowItWorks() {
  return (
    <section className="section" id="comment">
      <div className="wrap">
        <div className="process__head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>
              <span className="dot">◉</span>Comment ça marche
            </div>
            <h2 className="h-section serif">
              Scrolle. Apprends. <i>Garde ce qui compte.</i>
            </h2>
          </div>
          <p className="lede" style={{ maxWidth: 360 }}>
            Pas de « tu es à jour » quand il reste des choses à découvrir. Le fil
            continue, et il s'améliore avec toi.
          </p>
        </div>
        <div className="process__grid">
          {STEPS.map((s) => (
            <div className="step" key={s.n}>
              <div className="step__n">— {s.n}</div>
              <h3 className="step__t serif">{s.t}</h3>
              <p className="step__d">{s.d}</p>
              <div className="step__dur">{s.dur}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Sources ---------- */
const SOURCES: { k: string; v: string }[] = [
  { k: "Encyclopédie (Wikipedia)", v: "Disponible aujourd'hui" },
  { k: "Vidéo (YouTube)", v: "Disponible aujourd'hui" },
  { k: "Podcasts", v: "Prévu" },
  { k: "Blogs, newsletters (ex. Substack)", v: "En étude" },
];

function Sources() {
  return (
    <section className="section wl" id="sources">
      <div className="wrap">
        <div className="wl__grid">
          <div className="wl__copy">
            <div className="eyebrow" style={{ marginBottom: 16 }}>
              <span className="dot">◉</span>D'où viennent les idées
            </div>
            <h2 className="h-section serif">
              Un seul fil.
              <br />
              <i>Texte, vidéo, bientôt audio.</i>
            </h2>
            <p className="lede">
              Tout arrive dans un seul fil — trié pour toi, pas seulement « les
              dernières publications ».
            </p>
          </div>
          <div className="wl__matrix" role="table" aria-label="Sources de contenu">
            {SOURCES.map((row) => (
              <div className="wl__row" key={row.k}>
                <div className="k">{row.k}</div>
                <div className="v">{row.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Ce que Knowly n'est pas ---------- */
const NOT: { t: string; d: string }[] = [
  { t: "Pas TikTok", d: "Pas de clips vides pour tuer le temps." },
  { t: "Pas X / Threads", d: "Pas de réseau social ni de course aux likes (v1)." },
  { t: "Pas Wikipédia seule", d: "Une encyclopédie qui te connaît un peu." },
  { t: "Pas une encyclopédie figée", d: "Ton fil évolue avec toi." },
];

function NotThat() {
  return (
    <section className="section features">
      <div className="wrap">
        <div className="features__head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>
              <span className="dot">◉</span>Ce que Knowly n'est pas
            </div>
            <h2 className="h-section serif">
              Un feed <i>d'idées,</i>
              <br />
              pas un mur de posts.
            </h2>
          </div>
          <p className="lede">
            Une encyclopédie vivante doublée d'un algorithme simple et
            progressif — pas une boîte noire « For You ».
          </p>
        </div>
        <div className="features__grid">
          {NOT.map((f) => (
            <article className="feat" key={f.t}>
              <div className="feat__num">— ✕</div>
              <h3 className="feat__t">{f.t}</h3>
              <p className="feat__d">{f.d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Premium (wording repris de l'onboarding) ---------- */
const PREMIUM_BENEFITS = [
  "Ta lecture du jour, chaque matin",
  "Lecture hors-ligne",
  "Listes personnelles illimitées",
  "Salon membres",
];

function Premium() {
  return (
    <section className="section wl" id="premium">
      <div className="wrap">
        <div className="wl__grid">
          <div className="wl__copy">
            <div
              className="eyebrow"
              style={{ marginBottom: 16, color: "var(--accent)" }}
            >
              <span className="dot">◉</span>Premium — gratuit pour l'instant
            </div>
            <h2 className="h-section serif">
              Approfondis <i>chaque lecture.</i>
            </h2>
            <p className="lede">
              Une lecture du jour qui interprète ce que tu lis et t'indique quoi
              explorer ensuite — plus le hors-ligne, les listes et le salon
              membres.
            </p>
            <p
              className="mono"
              style={{ marginTop: 18, color: "var(--ink-soft)" }}
            >
              Aucune carte requise. Premium est offert pendant le lancement.
            </p>
          </div>
          <div
            className="wl__matrix"
            role="list"
            aria-label="Bénéfices Premium"
          >
            {PREMIUM_BENEFITS.map((benefit) => (
              <div className="wl__row" key={benefit} role="listitem">
                <div className="k" aria-hidden="true">
                  ✓
                </div>
                <div className="v">{benefit}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- CTA ---------- */
function Download() {
  return (
    <section className="section" id="download">
      <div className="wrap">
        <div className="cta">
          <div
            className="eyebrow"
            style={{
              color: "color-mix(in oklab, var(--bg) 60%, transparent)",
              marginBottom: 24,
            }}
          >
            <span className="dot">◉</span>Disponible sur iOS &amp; Android
          </div>
          <h2 className="h-section serif">
            Arrête de réagir. <em>Commence à réfléchir.</em>
          </h2>
          <p className="lede cta__lede">
            Scrolle. Apprends. Garde ce qui compte. Le fil s'améliore avec toi.
          </p>
          <div className="cta__row">
            <a href="#" className="btn btn--accent btn--big">
              App Store<span className="arr">→</span>
            </a>
            <a href="#" className="btn btn--ghost btn--big">
              Google Play
            </a>
          </div>
          <div className="cta__sig">
            — KNOWLY · WIKIPEDIA, YOUTUBE &amp; PLUS, DANS UN SEUL FIL
          </div>
        </div>
      </div>
    </section>
  );
}

function KnowlyFooter() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__row">
          <div className="footer__col footer__brand">
            <div className="brand" style={{ fontSize: 24 }}>
              Knowly<span className="brand__dot" />
            </div>
            <p>
              Une application mobile de découverte et de suivi d'idées — texte,
              vidéo, bientôt audio — avec un fil personnalisé par algorithme.
            </p>
          </div>
          <div className="footer__col">
            <h4>Knowly</h4>
            <a href="#pour-qui">Pour qui</a>
            <a href="#comment">Comment ça marche</a>
            <a href="#sources">Sources</a>
          </div>
          <div className="footer__col">
            <h4>Découvrir</h4>
            <a href="#analogie">Knowly vs…</a>
            <a href="#premium">Premium</a>
            <a href="/">Studio Mediumship</a>
          </div>
          <div className="footer__col">
            <h4>Contact</h4>
            <a href="mailto:hello@knowly.app">hello@knowly.app</a>
            <a href="#download">Télécharger l'app</a>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© 2026 Knowly · une démo Mediumship</span>
          <span className="mono">v1 — la plupart des fils te font réagir</span>
        </div>
      </div>
    </footer>
  );
}

export default function KnowlyPage() {
  return (
    <Fragment>
      <KnowlyNav />
      <main>
        <KnowlyHero />
        <Audience />
        <ProblemPromise />
        <Analogy />
        <HowItWorks />
        <Sources />
        <NotThat />
        <Premium />
        <Download />
      </main>
      <KnowlyFooter />
    </Fragment>
  );
}
