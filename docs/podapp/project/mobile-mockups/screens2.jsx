/* global React, Phone, StatusBar, TabBar, Kicker, ContentRow */
// screens2.jsx — V2 additions: editorial vs personal collections,
// contextual paywall sheet, refined community, and the IA recommendation plate.

/* ---------- A · Collections éditoriales (curated by the app) ---------- */
const EditorialCollections = () => (
  <Phone>
    <StatusBar />
    <div className="scr">
      <div className="topbar">
        <span className="topbar__back">‹</span>
        <span className="topbar__title serif">Collections</span>
        <span className="topbar__act">⌕</span>
      </div>
      <div className="scr__body">
        <p className="coll__intro">
          Des parcours thématiques construits par la rédaction — séries, dossiers et formats au long cours.
        </p>
        <div className="ecoll">
          <div className="ecoll__card">
            <span className="bg a"></span>
            <div className="meta">
              <span className="by">◆ Par la rédaction</span>
              <h3 className="nm">Le grand entretien</h3>
              <span className="ct">Série · 14 épisodes · audio</span>
            </div>
          </div>
          <div className="ecoll__card">
            <span className="bg b"></span>
            <div className="meta">
              <span className="by">◆ Dossier</span>
              <h3 className="nm">Programme 2027</h3>
              <span className="ct">32 contenus · mis à jour chaque semaine</span>
            </div>
          </div>
          <div className="ecoll__card">
            <span className="bg c"></span>
            <div className="meta">
              <span className="by">◆ Format</span>
              <h3 className="nm">L'économie autrement</h3>
              <span className="ct">Série · 8 vidéos · ★ premium</span>
            </div>
          </div>
        </div>
      </div>
      <TabBar active={1} />
    </div>
  </Phone>
);

/* ---------- B · Collections / listes personnelles (user-created) ---------- */
const PersonalCollections = () => (
  <Phone>
    <StatusBar />
    <div className="scr">
      <div className="topbar">
        <span className="topbar__back">‹</span>
        <span className="topbar__title serif">Mes listes</span>
        <span className="topbar__act">⌕</span>
      </div>
      <div className="scr__body">
        <p className="coll__intro">
          Vos propres listes — distinctes des collections de la rédaction. Organisez ce que vous gardez.
        </p>

        <div className="pcoll">
          <div className="pcoll__create">
            <span className="pl">+</span>
            <div>
              <div className="t">Créer une liste</div>
              <div className="d">Regroupez articles, épisodes et vidéos</div>
            </div>
          </div>

          <div className="pcoll__item">
            <span className="pcoll__stack"><i></i><i></i><i></i></span>
            <div style={{ minWidth: 0 }}>
              <div className="nm">À écouter en voiture</div>
              <div className="d">9 épisodes · privée</div>
            </div>
            <span className="chev">›</span>
          </div>
          <div className="pcoll__item">
            <span className="pcoll__stack"><i></i><i></i><i></i></span>
            <div style={{ minWidth: 0 }}>
              <div className="nm">Économie — à relire</div>
              <div className="d">6 contenus · privée</div>
            </div>
            <span className="chev">›</span>
          </div>

          <div className="pcoll__lockmsg">
            <div className="t">Listes illimitées avec Premium</div>
            <div className="d">Les membres gratuits créent 1 liste. Passez Premium pour des listes illimitées et la synchro multi-appareils.</div>
            <span className="btn btn--premium btn--sm" style={{ alignSelf: 'flex-start' }}>Voir Premium</span>
          </div>
        </div>
      </div>
      <TabBar active={3} />
    </div>
  </Phone>
);

/* ---------- C · Contextual paywall sheet (just-in-time) ---------- */
const PaywallSheet = () => (
  <Phone>
    <StatusBar />
    <div className="scr">
      <div className="sheet-scr">
        {/* Background context: an episode the user tried to download */}
        <div className="sheet-bg">
          <div className="sheet-bg__cover">
            <div className="topbar" style={{ paddingTop: 4 }}>
              <span className="topbar__back" style={{ color: '#fff' }}>‹</span>
              <span className="topbar__act" style={{ color: '#fff' }}>⋯</span>
            </div>
          </div>
          <div className="sheet-bg__body">
            <span className="k">◉ Épisode · S03 · E14</span>
            <h3 className="t">L'économie du soin.</h3>
          </div>
        </div>

        {/* Dim + sheet */}
        <div className="sheet-scr__dim"></div>
        <div className="sheet">
          <div className="sheet__grab"></div>
          <div className="sheet__crest">C</div>
          <span className="sheet__k">◉ Téléchargement hors-ligne · Premium</span>
          <h3 className="sheet__t">Écoutez <i>partout,</i> même sans réseau.</h3>
          <p className="sheet__d">Le téléchargement hors-ligne est réservé aux membres Premium. La lecture en ligne reste gratuite.</p>
          <div className="sheet__benefits">
            <div className="b"><span className="c">✓</span><span>Téléchargements illimités hors-ligne</span></div>
            <div className="b"><span className="c">✓</span><span>Reprise synchronisée sur vos appareils</span></div>
            <div className="b"><span className="c">✓</span><span>Listes personnelles illimitées</span></div>
          </div>
          <div className="sheet__cta">Devenir membre · 59 € / an</div>
          <div className="sheet__alt">CONTINUER L'ÉCOUTE EN LIGNE — GRATUIT</div>
        </div>
      </div>
    </div>
  </Phone>
);

/* ---------- D · Community CTA (refined, gating-aware) ---------- */
const CommunityV2 = () => (
  <Phone>
    <StatusBar />
    <div className="scr">
      <div className="topbar">
        <span className="topbar__back">‹</span>
        <span className="topbar__title serif">Communauté</span>
        <span className="topbar__act">⋯</span>
      </div>
      <div className="scr__body">
        <div className="comm__hero">
          <Kicker premium>◉ REJOINDRE</Kicker>
          <h3 className="t">Prolongez la conversation <i>hors de l'app.</i></h3>
          <p className="s">12 400 membres · 84 cercles locaux · accès libre ou réservé selon le module.</p>
          <span className="btn btn--accent btn--block">Rejoindre la communauté</span>
        </div>
        <div className="comm__card">
          <div className="head">
            <span className="nm">Discord communautaire</span>
            <span className="ic">#</span>
          </div>
          <p className="d">Échangez avec les rédactions et les membres. Lien ouvert à tous.</p>
          <div className="stat">
            <span><b>42</b> salons</span>
            <span className="gate gate--free" style={{ marginLeft: 'auto' }}>Gratuit</span>
          </div>
        </div>
        <div className="comm__card">
          <div className="head">
            <span className="nm">Salon membres</span>
            <span className="ic">✦</span>
          </div>
          <p className="d">Espace réservé : AMA, coulisses, votes éditoriaux.</p>
          <div className="stat">
            <span><b>8</b> fils actifs</span>
            <span className="gate gate--premium" style={{ marginLeft: 'auto' }}>Premium</span>
          </div>
        </div>
      </div>
      <TabBar active={1} />
    </div>
  </Phone>
);

Object.assign(window, {
  EditorialCollections, PersonalCollections, PaywallSheet, CommunityV2,
});

/* ============================================================
   IA / Navigation recommendation plate
   ============================================================ */
const RecoPlate = () => (
  <div className="reco">
    <div className="reco__full reco__head">
      <span className="kicker">◉ Recommandation produit</span>
      <h3>Guest-first, 4 onglets, <i>premium contextuel.</i></h3>
      <p>
        Lecture publique sans compte. La connexion n'arrive qu'au moment d'utiliser une fonction membre.
        La navigation passe de 5 entrées (dont un onglet Premium fixe) à 4 destinations stables ;
        Agenda, Communauté et Collections deviennent des modules sous Explorer, activables depuis le CMS.
      </p>
    </div>

    {/* Nav reco */}
    <div className="reco__full reco__block">
      <div className="h">— Navigation recommandée (bottom bar)</div>
      <div className="reco-nav">
        <div className="reco-nav__tab">
          <div className="ic">◉</div>
          <h4 className="nm">Accueil</h4>
          <p className="d">Feed modulaire piloté par le CMS : hero + rails configurables.</p>
          <span className="sub">Fixe</span>
        </div>
        <div className="reco-nav__tab">
          <div className="ic">⌕</div>
          <h4 className="nm">Explorer</h4>
          <p className="d">Recherche, catégories, collections éditoriales, agenda, communauté.</p>
          <span className="sub">Fixe · modules CMS</span>
        </div>
        <div className="reco-nav__tab">
          <div className="ic">▤</div>
          <h4 className="nm">Bibliothèque</h4>
          <p className="d">Enregistrés, hors-ligne, listes perso, progression. Invite au login si invité.</p>
          <span className="sub">Fixe · login juste-à-temps</span>
        </div>
        <div className="reco-nav__tab">
          <div className="ic">○</div>
          <h4 className="nm">Profil</h4>
          <p className="d">Statut membre, abonnement, préférences, accès aux fonctions membres.</p>
          <span className="sub">Fixe</span>
        </div>
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--brand-ink-soft)', margin: '12px 0 0', fontFamily: 'var(--font-mono)', letterSpacing: '.02em' }}>
        ✕ Plus d'onglet « Premium » fixe — le paywall apparaît en sheet contextuel quand on touche une fonction premium.
      </p>
    </div>

    {/* Free vs premium defaults */}
    <div className="reco__block">
      <div className="h">— Défauts gratuit / premium (modifiables par tenant)</div>
      <table className="reco-table">
        <thead>
          <tr><th>Feature</th><th>Défaut</th><th className="why">Raison</th></tr>
        </thead>
        <tbody>
          <tr><td>Lecture publique</td><td><span className="gate gate--free">Gratuit</span></td><td className="why">Acquisition, SEO, partage</td></tr>
          <tr><td>Enregistrer (bookmark)</td><td><span className="gate gate--free">Gratuit</span></td><td className="why">Engagement, faible coût</td></tr>
          <tr><td>Téléchargement offline</td><td><span className="gate gate--premium">Premium</span></td><td className="why">Valeur perçue forte</td></tr>
          <tr><td>Progression / reprise sync</td><td><span className="gate gate--member">Membre</span></td><td className="why">Nécessite un compte</td></tr>
          <tr><td>Listes personnelles</td><td><span className="gate gate--premium">Premium</span></td><td className="why">Power-users</td></tr>
          <tr><td>Agenda / événements</td><td><span className="gate gate--free">Gratuit</span></td><td className="why">Selon tenant</td></tr>
          <tr><td>CTA communauté</td><td><span className="gate gate--free">Gratuit</span></td><td className="why">Salon membres = premium</td></tr>
        </tbody>
      </table>
    </div>

    {/* Fixed vs CMS + distinctions */}
    <div className="reco__block">
      <div className="reco-two">
        <div className="col">
          <div className="h">— Fixe dans l'app</div>
          <ul>
            <li><span className="m">·</span>Bottom navigation (4 onglets)</li>
            <li><span className="m">·</span>Structure des écrans &amp; cartes</li>
            <li><span className="m">·</span>Player audio / vidéo</li>
            <li><span className="m">·</span>Mécanique de paywall (sheet)</li>
            <li><span className="m">·</span>Bibliothèque &amp; profil</li>
          </ul>
        </div>
        <div className="col">
          <div className="h">— Configurable au CMS</div>
          <ul>
            <li><span className="m">·</span>Sections &amp; ordre du home feed</li>
            <li><span className="m">·</span>Modules ON/OFF (agenda, communauté…)</li>
            <li><span className="m">·</span>Gratuit / premium par feature</li>
            <li><span className="m">·</span>Catégories &amp; collections éditoriales</li>
            <li><span className="m">·</span>Offre &amp; paliers premium</li>
          </ul>
        </div>
      </div>
      <div style={{ marginTop: 18 }}>
        <div className="h">— Distinctions à ne jamais confondre</div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <li style={{ fontSize: 12, color: 'var(--brand-ink-2)' }}><b style={{ fontFamily: 'var(--font-display)' }}>Collection éditoriale</b> — créée par la rédaction (série, dossier).</li>
          <li style={{ fontSize: 12, color: 'var(--brand-ink-2)' }}><b style={{ fontFamily: 'var(--font-display)' }}>Liste personnelle</b> — créée par l'utilisateur final.</li>
          <li style={{ fontSize: 12, color: 'var(--brand-ink-2)' }}><b style={{ fontFamily: 'var(--font-display)' }}>Contenu premium</b> — un contenu donné, verrouillé.</li>
          <li style={{ fontSize: 12, color: 'var(--brand-ink-2)' }}><b style={{ fontFamily: 'var(--font-display)' }}>Feature premium</b> — une capacité (offline, listes), verrouillée.</li>
          <li style={{ fontSize: 12, color: 'var(--brand-ink-2)' }}><b style={{ fontFamily: 'var(--font-display)' }}>Module tenant</b> — activé/désactivé pour tout le client.</li>
        </ul>
      </div>
    </div>
  </div>
);

Object.assign(window, { RecoPlate });
