/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard, DesignSystemSpec,
   Onboarding1, Onboarding2, HomeFeed, ArticleDetail, PodcastDetail, AudioPlayer,
   VideoDetail, Library, Agenda, Community, Premium, Notifications, Profile, Search,
   Category, UserFlow, WhiteLabelMatrix, VariationHead, VariantHome, VariantLabel, VARIANTS,
   EditorialCollections, PersonalCollections, PaywallSheet, CommunityV2, RecoPlate,
   useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor */

// app.jsx — Civica mobile mockups planche
// NOTE: DCSection filters children to only direct DCArtboard descendants, so every
// artboard must be inlined here (no helper components wrapping DCArtboard).

/* ============================================================
   Tweakable palettes + typographies
   ============================================================ */

const PALETTES = {
  brick: {
    label: 'Brick',
    swatch: ['#B14424', '#F4F1E8', '#C8964A'],
    vars: {
      '--brand-bg':         '#F4F1E8',
      '--brand-surface':    '#FFFFFF',
      '--brand-surface-2':  '#FAF7EE',
      '--brand-ink':        '#14110E',
      '--brand-ink-2':      '#46413A',
      '--brand-ink-soft':   '#7A746A',
      '--brand-muted':      '#B7B1A4',
      '--brand-rule':       'rgba(20,17,14,.08)',
      '--brand-rule-2':     'rgba(20,17,14,.14)',
      '--brand-accent':     '#B14424',
      '--brand-accent-soft':'rgba(177,68,36,.12)',
      '--brand-premium':    '#C8964A',
    },
  },
  indigo: {
    label: 'Indigo',
    swatch: ['#2C4A7D', '#F1EFEA', '#B89548'],
    vars: {
      '--brand-bg':         '#F1EFEA',
      '--brand-surface':    '#FFFFFF',
      '--brand-surface-2':  '#F7F5F0',
      '--brand-ink':        '#0F1320',
      '--brand-ink-2':      '#303746',
      '--brand-ink-soft':   '#6E7480',
      '--brand-muted':      '#B5B7BD',
      '--brand-rule':       'rgba(15,19,32,.08)',
      '--brand-rule-2':     'rgba(15,19,32,.14)',
      '--brand-accent':     '#2C4A7D',
      '--brand-accent-soft':'rgba(44,74,125,.12)',
      '--brand-premium':    '#B89548',
    },
  },
  olive: {
    label: 'Olive',
    swatch: ['#5E6E3D', '#EFEDE0', '#C2913A'],
    vars: {
      '--brand-bg':         '#EFEDE0',
      '--brand-surface':    '#FFFFFF',
      '--brand-surface-2':  '#F7F5E8',
      '--brand-ink':        '#171511',
      '--brand-ink-2':      '#3A3628',
      '--brand-ink-soft':   '#73705B',
      '--brand-muted':      '#B5B19D',
      '--brand-rule':       'rgba(23,21,17,.08)',
      '--brand-rule-2':     'rgba(23,21,17,.14)',
      '--brand-accent':     '#5E6E3D',
      '--brand-accent-soft':'rgba(94,110,61,.13)',
      '--brand-premium':    '#C2913A',
    },
  },
  ink: {
    label: 'Ink',
    swatch: ['#2D2D29', '#F0EFEB', '#B8945C'],
    vars: {
      '--brand-bg':         '#F0EFEB',
      '--brand-surface':    '#FFFFFF',
      '--brand-surface-2':  '#F8F7F3',
      '--brand-ink':        '#14140F',
      '--brand-ink-2':      '#353530',
      '--brand-ink-soft':   '#7A7975',
      '--brand-muted':      '#B6B4AE',
      '--brand-rule':       'rgba(20,20,15,.08)',
      '--brand-rule-2':     'rgba(20,20,15,.14)',
      '--brand-accent':     '#2D2D29',
      '--brand-accent-soft':'rgba(45,45,41,.13)',
      '--brand-premium':    '#B8945C',
    },
  },
};

const TYPOS = {
  editorial: {
    label: 'Editorial',
    pair: 'Newsreader · Hanken Grotesk',
    vars: {
      '--font-display': '"Newsreader", Georgia, serif',
      '--font-body':    '"Hanken Grotesk", system-ui, sans-serif',
    },
  },
  modern: {
    label: 'Modern',
    pair: 'Instrument Serif · Manrope',
    vars: {
      '--font-display': '"Instrument Serif", Georgia, serif',
      '--font-body':    '"Manrope", system-ui, sans-serif',
    },
  },
  grotesque: {
    label: 'Grotesque',
    pair: 'Geist · Geist',
    vars: {
      '--font-display': '"Geist", system-ui, sans-serif',
      '--font-body':    '"Geist", system-ui, sans-serif',
    },
  },
  classic: {
    label: 'Classic',
    pair: 'Newsreader · Geist',
    vars: {
      '--font-display': '"Newsreader", Georgia, serif',
      '--font-body':    '"Geist", system-ui, sans-serif',
    },
  },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "brick",
  "typo": "editorial"
}/*EDITMODE-END*/;

function applyVars(map) {
  Object.entries(map).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
}

/* ============================================================
   App
   ============================================================ */

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const PH_W = 320, PH_H = 680;

  React.useEffect(() => {
    applyVars((PALETTES[t.palette] || PALETTES.brick).vars);
    applyVars((TYPOS[t.typo] || TYPOS.editorial).vars);
    // Mark the body so any per-typo CSS adjustments can hook into it
    document.body.dataset.typo = t.typo || 'editorial';
    document.body.dataset.palette = t.palette || 'brick';
  }, [t.palette, t.typo]);

  return (
    <>
      <DesignCanvas>
        {/* 01 · Design system */}
        <DCSection id="ds"
          title="01 · Design system"
          subtitle="Tokens, typographies, composants. Le socle réutilisable derrière chaque déclinaison.">
          <DCArtboard id="tokens" label="Tokens · Typo · Composants" width={1200} height={760}>
            <DesignSystemSpec />
          </DCArtboard>
        </DCSection>

        {/* 02 · Recommandation UX v2 */}
        <DCSection id="reco"
          title="02 · Recommandation UX (v2)"
          subtitle="Guest-first, navigation à 4 onglets, premium contextuel, gating piloté par le CMS.">
          <DCArtboard id="reco-plate" label="Architecture & gating" width={1280} height={920}>
            <RecoPlate />
          </DCArtboard>
        </DCSection>

        {/* 03 · User flow */}
        <DCSection id="flow"
          title="03 · User flow"
          subtitle="Le parcours utilisateur, d'abord onboarding puis engagement membre.">
          <DCArtboard id="userflow" label="Parcours utilisateur — 7 étapes" width={1820} height={720}>
            <UserFlow />
          </DCArtboard>
        </DCSection>

        {/* 04 · Onboarding */}
        <DCSection id="onb"
          title="04 · Onboarding"
          subtitle="Première impression et présentation des piliers du produit.">
          <DCArtboard id="onb-1" label="01 · Promesse" width={PH_W} height={PH_H}><Onboarding1 /></DCArtboard>
          <DCArtboard id="onb-2" label="02 · Piliers" width={PH_W} height={PH_H}><Onboarding2 /></DCArtboard>
        </DCSection>

        {/* 05 · Core consumption */}
        <DCSection id="core"
          title="05 · Découvrir & consommer"
          subtitle="Le cœur de l'application : feed, contenus, player, recherche.">
          <DCArtboard id="home" label="03 · Home / Feed" width={PH_W} height={PH_H}><HomeFeed /></DCArtboard>
          <DCArtboard id="article" label="04 · Article" width={PH_W} height={PH_H}><ArticleDetail /></DCArtboard>
          <DCArtboard id="podcast" label="05 · Podcast" width={PH_W} height={PH_H}><PodcastDetail /></DCArtboard>
          <DCArtboard id="player" label="06 · Audio player" width={PH_W} height={PH_H}><AudioPlayer /></DCArtboard>
          <DCArtboard id="video" label="07 · Video" width={PH_W} height={PH_H}><VideoDetail /></DCArtboard>
          <DCArtboard id="search" label="14 · Recherche" width={PH_W} height={PH_H}><Search /></DCArtboard>
          <DCArtboard id="category" label="15 · Catégorie" width={PH_W} height={PH_H}><Category /></DCArtboard>
        </DCSection>

        {/* 06 · Membres, collections & premium */}
        <DCSection id="util"
          title="06 · Membres, collections & premium"
          subtitle="Profil unifié, bibliothèque, collections éditoriales vs personnelles, premium contextuel.">
          <DCArtboard id="profile" label="Profil unifié" width={PH_W} height={PH_H}><Profile /></DCArtboard>
          <DCArtboard id="library" label="Bibliothèque" width={PH_W} height={PH_H}><Library /></DCArtboard>
          <DCArtboard id="ecoll" label="Collections éditoriales (rédaction)" width={PH_W} height={PH_H}><EditorialCollections /></DCArtboard>
          <DCArtboard id="pcoll" label="Listes personnelles (utilisateur)" width={PH_W} height={PH_H}><PersonalCollections /></DCArtboard>
          <DCArtboard id="paywall" label="Paywall contextuel (sheet)" width={PH_W} height={PH_H}><PaywallSheet /></DCArtboard>
          <DCArtboard id="agenda" label="Agenda / événements" width={PH_W} height={PH_H}><Agenda /></DCArtboard>
          <DCArtboard id="community" label="Communauté (CTA + gating)" width={PH_W} height={PH_H}><CommunityV2 /></DCArtboard>
          <DCArtboard id="notif" label="Notifications" width={PH_W} height={PH_H}><Notifications /></DCArtboard>
        </DCSection>

        {/* 07 · White-label customization */}
        <DCSection id="wl"
          title="07 · White-label customization"
          subtitle="Ce qui se personnalise, ce qui reste le socle stable.">
          <DCArtboard id="wl-matrix" label="Matrice de personnalisation" width={1200} height={680}>
            <WhiteLabelMatrix />
          </DCArtboard>
        </DCSection>

        {/* 08 · Client variations (themes inline — pas affectés par les tweaks) */}
        <DCSection id="var"
          title="08 · Client variation example"
          subtitle="Le même socle, décliné pour trois verticales différentes. Marques figées (non affectées par les Tweaks).">
          <DCArtboard id="var-head" label="Démonstration" width={1200} height={260}>
            <VariationHead />
          </DCArtboard>
          <DCArtboard id="var-1" label="Variation 01 · Média citoyen" width={340} height={900}
            style={{ background: '#ECE8DC', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 10px 16px', gap: 14 }}>
              <VariantHome v={VARIANTS[0]} />
              <VariantLabel v={VARIANTS[0]} />
            </div>
          </DCArtboard>
          <DCArtboard id="var-2" label="Variation 02 · YouTube éducation" width={340} height={900}
            style={{ background: '#ECE8DC', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 10px 16px', gap: 14 }}>
              <VariantHome v={VARIANTS[1]} />
              <VariantLabel v={VARIANTS[1]} />
            </div>
          </DCArtboard>
          <DCArtboard id="var-3" label="Variation 03 · Podcast culture" width={340} height={900}
            style={{ background: '#ECE8DC', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 10px 16px', gap: 14 }}>
              <VariantHome v={VARIANTS[2]} />
              <VariantLabel v={VARIANTS[2]} />
            </div>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks · Thème Civica">
        <TweakSection label="Palette" />
        <TweakColor
          label="Couleurs"
          value={(PALETTES[t.palette] || PALETTES.brick).swatch}
          options={Object.values(PALETTES).map(p => p.swatch)}
          onChange={(swatch) => {
            const k = Object.keys(PALETTES).find(k => PALETTES[k].swatch === swatch);
            if (k) setTweak('palette', k);
          }}
        />
        <div style={{ padding: '0 14px 8px', fontFamily: 'ui-monospace, monospace', fontSize: 10, color: '#888', letterSpacing: '.04em', textAlign: 'right' }}>
          {(PALETTES[t.palette] || PALETTES.brick).label}
        </div>

        <TweakSection label="Typographie" />
        <TweakRadio
          label="Pairing"
          value={t.typo}
          options={Object.entries(TYPOS).map(([v, p]) => ({ value: v, label: p.label }))}
          onChange={(v) => setTweak('typo', v)}
        />
        <div style={{ padding: '4px 14px 10px', fontFamily: 'ui-monospace, monospace', fontSize: 10, color: '#888', letterSpacing: '.04em', textAlign: 'right' }}>
          {(TYPOS[t.typo] || TYPOS.editorial).pair}
        </div>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
