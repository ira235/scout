// app.jsx — Scout app shell, navigation, tweaks
const { SAVED_SEARCHES } = window.SCOUT_DATA;

const THEMES = {
  sage: {
    label: 'Sage & Clay', swatch: ['#2F5D4F', '#C9794A', '#EFEBE2'],
    vars: {
      '--bg': '#EFEBE2', '--app-bg': '#F4F1E9', '--surface': '#FBFAF5',
      '--green': '#2F5D4F', '--green-deep': '#244A3E', '--green-tint': '#E3ECE5', '--green-tint-2': '#D2E0D6',
      '--clay': '#C9794A', '--clay-deep': '#B0632F', '--clay-tint': '#F3E2D4',
      '--ink': '#1C201C', '--ink-soft': '#5C635B', '--ink-faint': '#8E948B',
      '--line': 'rgba(28,32,28,0.10)', '--line-soft': 'rgba(28,32,28,0.06)',
    },
  },
  cobalt: {
    label: 'Cobalt & White', swatch: ['#1F4FD9', '#E07A3C', '#FFFFFF'],
    vars: {
      '--bg': '#EDF0F7', '--app-bg': '#F5F7FC', '--surface': '#FFFFFF',
      '--green': '#1F4FD9', '--green-deep': '#163AAA', '--green-tint': '#E2E9FB', '--green-tint-2': '#CDD9F7',
      '--clay': '#E07A3C', '--clay-deep': '#B85822', '--clay-tint': '#FBE5D2',
      '--ink': '#0F1A2E', '--ink-soft': '#4E5870', '--ink-faint': '#8189A0',
      '--line': 'rgba(15,26,46,0.10)', '--line-soft': 'rgba(15,26,46,0.06)',
    },
  },
  navy: {
    label: 'Navy & Sky', swatch: ['#0B3A6F', '#4A90E2', '#FFFFFF'],
    vars: {
      '--bg': '#EFF3F9', '--app-bg': '#F4F7FC', '--surface': '#FFFFFF',
      '--green': '#0B3A6F', '--green-deep': '#08284D', '--green-tint': '#DDE7F3', '--green-tint-2': '#C2D2E8',
      '--clay': '#4A90E2', '--clay-deep': '#2E73C2', '--clay-tint': '#DCE9F8',
      '--ink': '#0A1A2E', '--ink-soft': '#4A586E', '--ink-faint': '#7E8A9E',
      '--line': 'rgba(10,26,46,0.10)', '--line-soft': 'rgba(10,26,46,0.06)',
    },
  },
  ocean: {
    label: 'Ocean & Sand', swatch: ['#0E6E8A', '#E3A857', '#EAF1F3'],
    vars: {
      '--bg': '#E8EEF1', '--app-bg': '#F0F4F6', '--surface': '#FFFFFF',
      '--green': '#0E6E8A', '--green-deep': '#075368', '--green-tint': '#DCEAEF', '--green-tint-2': '#BFD7DF',
      '--clay': '#E3A857', '--clay-deep': '#B58235', '--clay-tint': '#F8E9D0',
      '--ink': '#0F1F26', '--ink-soft': '#4E5D65', '--ink-faint': '#83909A',
      '--line': 'rgba(15,31,38,0.10)', '--line-soft': 'rgba(15,31,38,0.06)',
    },
  },
  ink: {
    label: 'Ink Blue & Bone', swatch: ['#15315B', '#D77A4A', '#F4F0E6'],
    vars: {
      '--bg': '#F0EBDF', '--app-bg': '#F4F0E6', '--surface': '#FFFFFF',
      '--green': '#15315B', '--green-deep': '#0D2342', '--green-tint': '#E0E7F0', '--green-tint-2': '#C5D3E2',
      '--clay': '#D77A4A', '--clay-deep': '#B25F2F', '--clay-tint': '#F5E3D2',
      '--ink': '#11233D', '--ink-soft': '#4A5A70', '--ink-faint': '#7C8898',
      '--line': 'rgba(17,35,61,0.10)', '--line-soft': 'rgba(17,35,61,0.06)',
    },
  },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "resultsLayout": "card",
  "density": "regular",
  "builderStyle": "toggle",
  "theme": ["#2F5D4F", "#C9794A", "#EFEBE2"]
}/*EDITMODE-END*/;

function rangeStyleOnce() {
  if (document.getElementById('scout-range-css')) return;
  const s = document.createElement('style');
  s.id = 'scout-range-css';
  s.textContent = `
    .scout-range::-webkit-slider-thumb{ -webkit-appearance:none; width:24px; height:24px; border-radius:999px; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,.25), inset 0 0 0 5px var(--green); cursor:pointer; }
    .scout-range::-moz-range-thumb{ width:24px; height:24px; border:none; border-radius:999px; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,.25), inset 0 0 0 5px var(--green); cursor:pointer; }
  `;
  document.head.appendChild(s);
}

function ScoutApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  rangeStyleOnce();

  // resolve theme: tweak stores the swatch array; find the matching named theme
  const themeKey = React.useMemo(() => {
    const key = JSON.stringify(t.theme);
    return Object.keys(THEMES).find((k) => JSON.stringify(THEMES[k].swatch) === key) || 'sage';
  }, [t.theme]);

  // apply theme vars to :root whenever theme changes
  React.useEffect(() => {
    const theme = THEMES[themeKey] || THEMES.sage;
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [themeKey]);

  const [tab, setTab] = React.useState('builder');
  const [detail, setDetail] = React.useState(null);   // listing being viewed
  const [showEmail, setShowEmail] = React.useState(false);
  const [favs, setFavs] = React.useState(['l3']);
  const [justSaved, setJustSaved] = React.useState(false);
  const [searches, setSearches] = React.useState(SAVED_SEARCHES);

  const [criteria, setCriteria] = React.useState({
    mode: 'Buy', priceMax: 720000, beds: 3, baths: 2,
    types: ['House'], features: ['Garden'], prompt: '',
  });
  const setC = (patch) => setCriteria((c) => ({ ...c, ...patch }));

  const toggleFav = (id) => setFavs((f) => f.includes(id) ? f.filter((x) => x !== id) : [...f, id]);
  const toggleSearch = (id) => setSearches((ss) => ss.map((s) => s.id === id ? { ...s, active: !s.active } : s));
  const cycleFreq = (id) => setSearches((ss) => ss.map((s) => s.id === id ? { ...s, freq: s.freq === 'daily' ? 'weekly' : 'daily' } : s));

  const [settings, setSettings] = React.useState({
    freq: 'daily', time: '8am', push: true, email: 'you@email.com',
    perEmail: 10, hidePending: true, highOnly: false,
  });
  const setS = (patch) => setSettings((s) => ({ ...s, ...patch }));

  const runSearch = () => { setTab('results'); setJustSaved(false); };
  const saveSearch = () => { setJustSaved(true); setTimeout(() => setTab('alerts'), 650); };

  // body scroll resets between tabs handled by remount key
  let screen;
  if (detail) {
    screen = <DetailScreen l={detail} onBack={() => setDetail(null)} fav={favs.includes(detail.id)} onFav={toggleFav} />;
  } else if (showEmail) {
    screen = <EmailScreen onBack={() => setShowEmail(false)} settings={settings} />;
  } else if (tab === 'builder') {
    screen = <BuilderScreen c={criteria} set={setC} onRun={runSearch} t={t} />;
  } else if (tab === 'results') {
    screen = <ResultsScreen c={criteria} onOpen={setDetail} favs={favs} onFav={toggleFav} onSave={saveSearch} justSaved={justSaved} t={t} />;
  } else if (tab === 'alerts') {
    screen = <AlertsScreen searches={searches} onToggle={toggleSearch} onFreq={cycleFreq} onOpenSearch={() => setTab('results')} onViewEmail={() => setShowEmail(true)} />;
  } else {
    screen = <SettingsScreen settings={settings} set={setS} onViewEmail={() => setShowEmail(true)} />;
  }

  const hideNav = detail || showEmail;
  const alertCount = searches.filter((s) => s.active).reduce((n, s) => n + s.newCount, 0);

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--app-bg)', overflow: 'hidden' }}>
      <div key={tab + (detail ? 'd' : '') + (showEmail ? 'e' : '')} style={{ height: '100%' }}>
        {screen}
      </div>
      {!hideNav && <BottomNav active={tab} onNav={(id) => { setTab(id); setDetail(null); setShowEmail(false); }} alertCount={alertCount} />}

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakColor label="Palette" value={t.theme}
          options={Object.values(THEMES).map((th) => th.swatch)}
          onChange={(v) => setTweak('theme', v)} />
        <TweakSection label="Results" />
        <TweakRadio label="Layout" value={t.resultsLayout} options={[{ value: 'card', label: 'Cards' }, { value: 'list', label: 'List' }]} onChange={(v) => setTweak('resultsLayout', v)} />
        <TweakRadio label="Density" value={t.density} options={['compact', 'regular', 'comfy']} onChange={(v) => setTweak('density', v)} />
        <TweakSection label="Criteria builder" />
        <TweakSelect label="Input style" value={t.builderStyle} options={[{ value: 'toggle', label: 'Toggle (prompt ⇄ filters)' }, { value: 'stacked', label: 'Stacked (both at once)' }, { value: 'wizard', label: 'Guided wizard' }]} onChange={(v) => setTweak('builderStyle', v)} />
      </TweaksPanel>
    </div>
  );
}

function Root() {
  return (
    <IOSDevice>
      <ScoutApp />
    </IOSDevice>
  );
}

ReactDOM.createRoot(document.getElementById('stage')).render(<Root />);
