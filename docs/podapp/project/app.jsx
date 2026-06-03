/* global React, ReactDOM */
// app.jsx — Mediumship landing entry

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "warm",
  "typo": "editorial"
}/*EDITMODE-END*/;

const PALETTES = {
  warm:    { '--bg':'#EFECE5','--bg-alt':'#E6E2D7','--bg-deep':'#DCD7C8','--ink':'#1A1A1A','--ink-2':'#3A3A36','--ink-soft':'#6B6B66','--ink-mute':'#9C9A92','--rule':'#1A1A1A','--rule-soft':'rgba(26,26,26,.14)','--accent':'#C8462C' },
  bone:    { '--bg':'#F4F1EA','--bg-alt':'#EBE7DD','--bg-deep':'#DDD8CB','--ink':'#0F0F0F','--ink-2':'#2A2A28','--ink-soft':'#5E5E5A','--ink-mute':'#9A988F','--rule':'#0F0F0F','--rule-soft':'rgba(15,15,15,.12)','--accent':'#1E3A5F' },
  olive:   { '--bg':'#ECE8DC','--bg-alt':'#E1DCCC','--bg-deep':'#CFC9B5','--ink':'#1A1A1A','--ink-2':'#33332D','--ink-soft':'#67675E','--ink-mute':'#9C9C90','--rule':'#1A1A1A','--rule-soft':'rgba(26,26,26,.14)','--accent':'#6B7440' },
  dark:    { '--bg':'#121110','--bg-alt':'#1A1916','--bg-deep':'#22201B','--ink':'#F3EFE6','--ink-2':'#D7D2C4','--ink-soft':'#8A8472','--ink-mute':'#5C5749','--rule':'#F3EFE6','--rule-soft':'rgba(243,239,230,.14)','--accent':'#E8B47A','--accent-ink':'#121110' },
};

const TYPOS = {
  editorial: { '--font-display': '"Instrument Serif", Georgia, serif',     '--font-body': '"Hanken Grotesk", system-ui, sans-serif' },
  grotesque: { '--font-display': '"Geist", system-ui, sans-serif',          '--font-body': '"Geist", system-ui, sans-serif' },
  modern:    { '--font-display': '"Newsreader", Georgia, serif',           '--font-body': '"Manrope", system-ui, sans-serif' },
};

function applyTokens(map) {
  const root = document.documentElement;
  Object.entries(map).forEach(([k, v]) => root.style.setProperty(k, v));
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    // Reset accent-ink (some palettes set it, others don't)
    document.documentElement.style.removeProperty('--accent-ink');
    applyTokens(PALETTES[t.palette] || PALETTES.warm);
    if (!(PALETTES[t.palette] || {})['--accent-ink']) {
      document.documentElement.style.setProperty('--accent-ink', '#FFFFFF');
    }
    applyTokens(TYPOS[t.typo] || TYPOS.editorial);
    document.body.dataset.typo = t.typo || 'editorial';
  }, [t.palette, t.typo]);

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Gallery />
        <ProblemSolution />
        <Features />
        <WhiteLabel />
        <Variants />
        <Process />
        <FinalCTA />
      </main>
      <Footer />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Palette" />
        <TweakRadio
          label="Thème"
          value={t.palette}
          options={[
            { value: 'warm',  label: 'Warm' },
            { value: 'bone',  label: 'Bone' },
            { value: 'olive', label: 'Olive' },
            { value: 'dark',  label: 'Dark' },
          ]}
          onChange={(v) => setTweak('palette', v)}
        />
        <TweakSection label="Typographie" />
        <TweakRadio
          label="Pairing"
          value={t.typo}
          options={[
            { value: 'editorial', label: 'Editorial' },
            { value: 'grotesque', label: 'Grotesque' },
            { value: 'modern',    label: 'Modern' },
          ]}
          onChange={(v) => setTweak('typo', v)}
        />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
