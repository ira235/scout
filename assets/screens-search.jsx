// screens-search.jsx — criteria builder (3 directions), results feed, listing detail
const { QUICK, PROMPT_EXAMPLES, money: fmtMoney, LISTINGS } = window.SCOUT_DATA;

// ── light prompt parser → criteria chips ────────────────────────
function parsePrompt(text) {
  const s = (text || '').toLowerCase();
  const chips = [];
  if (/\brent|rental|lease|\/mo|month/.test(s)) chips.push({ k: 'mode', label: 'Rent', tone: 'green' });
  else if (/\bbuy|own|purchase|for sale\b/.test(s)) chips.push({ k: 'mode', label: 'Buy', tone: 'green' });
  const beds = s.match(/(\d)\s*[- ]?\s*(bed|bd|br)/);
  if (beds) chips.push({ k: 'beds', label: beds[1] + '+ bed', tone: 'neutral' });
  if (/\$|under|below|max|budget/.test(s)) {
    const price = s.match(/\$\s?[\d,.]+\s*[km]?/);
    if (price) chips.push({ k: 'price', label: '≤ ' + price[0].replace(/\s/g, ''), tone: 'neutral' });
  }
  QUICK.features.forEach((f) => { if (s.includes(f.toLowerCase().split(' ')[0])) chips.push({ k: 'feat', label: f, tone: 'clay' }); });
  QUICK.types.forEach((tp) => { if (s.includes(tp.toLowerCase())) chips.push({ k: 'type', label: tp, tone: 'neutral' }); });
  if (/walk|transit|near|close|park|quiet/.test(s)) chips.push({ k: 'loc', label: 'Location-aware', tone: 'neutral' });
  return chips;
}

function FieldLabel({ children, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 9 }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--ink-soft)' }}>{children}</span>
      {hint && <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--green-deep)' }}>{hint}</span>}
    </div>
  );
}

function PriceSlider({ mode, value, onChange }) {
  const rent = mode === 'Rent';
  const min = rent ? 800 : 250000, max = rent ? 6000 : 1200000, step = rent ? 50 : 10000;
  const v = Math.min(Math.max(value, min), max);
  const pct = ((v - min) / (max - min)) * 100;
  return (
    <div>
      <FieldLabel hint={fmtMoney(v) + (rent ? '/mo' : '')}>Max price</FieldLabel>
      <input type="range" min={min} max={max} step={step} value={v}
        onChange={(e) => onChange(+e.target.value)} className="scout-range" style={{
          width: '100%', appearance: 'none', WebkitAppearance: 'none', height: 6, borderRadius: 999, cursor: 'pointer',
          background: `linear-gradient(to right, var(--green) ${pct}%, rgba(28,32,28,0.10) ${pct}%)`,
        }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-faint)' }}>
        <span>{fmtMoney(min)}</span><span>{fmtMoney(max)}{rent ? '/mo' : '+'}</span>
      </div>
    </div>
  );
}

function MinPicker({ label, value, onChange, opts }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <Segmented size="sm" value={value} onChange={onChange}
        options={opts.map((o) => ({ value: o, label: o === 0 ? 'Any' : o + '+' }))} />
    </div>
  );
}

function ChipPicker({ items, selected, onToggle, tone = 'green' }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {items.map((it) => {
        const on = selected.includes(it);
        return (
          <button key={it} onClick={() => onToggle(it)} style={{
            border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 14,
            padding: '9px 14px', borderRadius: 999, WebkitTapHighlightColor: 'transparent',
            background: on ? (tone === 'clay' ? 'var(--clay-tint)' : 'var(--green-tint)') : 'rgba(28,32,28,0.05)',
            color: on ? (tone === 'clay' ? 'var(--clay-deep)' : 'var(--green-deep)') : 'var(--ink-soft)',
            boxShadow: on ? `inset 0 0 0 1.5px ${tone === 'clay' ? 'var(--clay)' : 'var(--green)'}` : 'none',
            display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all .14s',
          }}>
            {on && <Icon name="check" size={14} color={tone === 'clay' ? 'var(--clay-deep)' : 'var(--green-deep)'} strokeWidth={2.4} />}
            {it}
          </button>
        );
      })}
    </div>
  );
}

function CardBlock({ children, style = {} }) {
  return <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 18, boxShadow: '0 1px 2px rgba(28,32,28,0.05)', ...style }}>{children}</div>;
}

// the structured form, used directly or inside the "both" layout
function StructuredForm({ c, set }) {
  const toggle = (key, val) => set({ [key]: c[key].includes(val) ? c[key].filter((x) => x !== val) : [...c[key], val] });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <CardBlock>
        <FieldLabel>I want to</FieldLabel>
        <Segmented value={c.mode} onChange={(v) => set({ mode: v, priceMax: v === 'Rent' ? 2800 : 720000 })}
          options={[{ value: 'Buy', label: 'Buy' }, { value: 'Rent', label: 'Rent' }]} />
        <div style={{ marginTop: 16 }}>
          <FieldLabel>Where</FieldLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(28,32,28,0.04)', borderRadius: 12, padding: '12px 14px' }}>
            <Icon name="pin" size={18} color="var(--ink-faint)" />
            <input defaultValue="Portland, OR" placeholder="City or neighborhood"
              style={{ border: 'none', background: 'transparent', fontFamily: 'var(--sans)', fontSize: 15.5, fontWeight: 600, color: 'var(--ink)', flex: 1, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {['Sellwood', 'Mt Tabor', 'Buckman', 'Division'].map((n) => <Chip key={n} tone="outline" size="sm">{n}</Chip>)}
          </div>
        </div>
      </CardBlock>

      <CardBlock><PriceSlider mode={c.mode} value={c.priceMax} onChange={(v) => set({ priceMax: v })} /></CardBlock>

      <CardBlock style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <MinPicker label="Bedrooms" value={c.beds} onChange={(v) => set({ beds: v })} opts={[0, 1, 2, 3, 4]} />
        <MinPicker label="Bathrooms" value={c.baths} onChange={(v) => set({ baths: v })} opts={[0, 1, 2, 3]} />
      </CardBlock>

      <CardBlock>
        <FieldLabel>Property type</FieldLabel>
        <ChipPicker items={QUICK.types} selected={c.types} onToggle={(v) => toggle('types', v)} />
      </CardBlock>

      <CardBlock>
        <FieldLabel>Must-have features</FieldLabel>
        <ChipPicker items={QUICK.features} selected={c.features} onToggle={(v) => toggle('features', v)} tone="clay" />
      </CardBlock>
    </div>
  );
}

// the prompt form
function PromptForm({ c, set, compact = false }) {
  const chips = parsePrompt(c.prompt);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <CardBlock style={{ background: 'linear-gradient(155deg, var(--green), var(--green-deep))', color: '#fff', padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
          <Icon name="spark" size={18} color="#fff" fill />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Describe your ideal place</span>
        </div>
        <textarea value={c.prompt} onChange={(e) => set({ prompt: e.target.value })} rows={compact ? 3 : 4}
          placeholder="e.g. 3-bed house under $700k with a garden, walkable, quiet street…"
          style={{ width: '100%', resize: 'none', border: 'none', borderRadius: 12, padding: '13px 14px', fontFamily: 'var(--sans)',
            fontSize: 15.5, lineHeight: 1.5, color: 'var(--ink)', background: 'rgba(255,255,255,0.96)', outline: 'none' }} />
        {chips.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 }}>Scout understood</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {chips.map((ch, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.16)', color: '#fff',
                  fontSize: 12.5, fontWeight: 600, padding: '6px 10px', borderRadius: 999 }}>
                  <Icon name="check" size={12} color="#fff" strokeWidth={2.6} />{ch.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardBlock>
      {!compact && (
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--ink-soft)', marginBottom: 9, paddingLeft: 2 }}>Try one of these</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PROMPT_EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => set({ prompt: ex })} style={{
                textAlign: 'left', border: 'none', cursor: 'pointer', background: 'var(--surface)', borderRadius: 14, padding: '13px 15px',
                fontFamily: 'var(--sans)', fontSize: 14.5, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.45, display: 'flex', gap: 10, alignItems: 'center',
                boxShadow: '0 1px 2px rgba(28,32,28,0.05)', WebkitTapHighlightColor: 'transparent',
              }}>
                <Icon name="search" size={16} color="var(--ink-faint)" style={{ flexShrink: 0 }} />“{ex}”
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── BUILDER SCREEN — direction switches via tweak `builderStyle` ─
function BuilderScreen({ c, set, onRun, t }) {
  const style = (t && t.builderStyle) || 'toggle';
  const [mode, setMode] = React.useState('prompt'); // for toggle/tabs

  let body;
  if (style === 'stacked') {
    // Both at once: prompt on top, structured below
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <PromptForm c={c} set={set} compact />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: 1 }}>or refine by hand</span>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        </div>
        <StructuredForm c={c} set={set} />
      </div>
    );
  } else if (style === 'wizard') {
    body = <WizardForm c={c} set={set} />;
  } else {
    // default: segmented toggle between the two modes
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Segmented value={mode} onChange={setMode}
          options={[{ value: 'prompt', label: 'Describe it', icon: <Icon name="spark" size={15} color={mode==='prompt'?'var(--ink)':'var(--ink-soft)'} fill={mode==='prompt'} /> },
                    { value: 'filters', label: 'Use filters', icon: <Icon name="sliders" size={16} color={mode==='filters'?'var(--ink)':'var(--ink-soft)'} /> }]} />
        {mode === 'prompt' ? <PromptForm c={c} set={set} /> : <StructuredForm c={c} set={set} />}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <ScreenBody bottom={132}>
        <AppHeader
          leading={<div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <span style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="pin" size={14} color="#fff" /></span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, letterSpacing: 1, color: 'var(--green-deep)', textTransform: 'uppercase' }}>Scout</span>
          </div>}
          title="What are you looking for?"
          sub="Set it once. We watch every new listing and email you the matches." />
        <div style={{ marginTop: 4 }}>{body}</div>
      </ScreenBody>

      {/* sticky run button */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 18px 26px',
        background: 'linear-gradient(to top, var(--app-bg) 62%, rgba(244,241,233,0))' }}>
        <Btn full variant="primary" onClick={onRun} iconR={<Icon name="arrowR" size={18} color="#fff" />}>
          See matches
        </Btn>
      </div>
    </div>
  );
}

// ── wizard variant (one question per step) ──────────────────────
function WizardForm({ c, set }) {
  const [step, setStep] = React.useState(0);
  const toggle = (key, val) => set({ [key]: c[key].includes(val) ? c[key].filter((x) => x !== val) : [...c[key], val] });
  const steps = [
    { t: 'Buy or rent?', el: <Segmented value={c.mode} onChange={(v) => set({ mode: v, priceMax: v === 'Rent' ? 2800 : 720000 })} options={[{ value: 'Buy', label: 'Buy' }, { value: 'Rent', label: 'Rent' }]} /> },
    { t: "What's your max budget?", el: <PriceSlider mode={c.mode} value={c.priceMax} onChange={(v) => set({ priceMax: v })} /> },
    { t: 'How much space?', el: <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><MinPicker label="Bedrooms" value={c.beds} onChange={(v) => set({ beds: v })} opts={[0, 1, 2, 3, 4]} /><MinPicker label="Bathrooms" value={c.baths} onChange={(v) => set({ baths: v })} opts={[0, 1, 2, 3]} /></div> },
    { t: 'Any must-haves?', el: <ChipPicker items={QUICK.features} selected={c.features} onToggle={(v) => toggle('features', v)} tone="clay" /> },
  ];
  const cur = steps[step];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {steps.map((_, i) => <div key={i} style={{ flex: 1, height: 5, borderRadius: 999, background: i <= step ? 'var(--green)' : 'rgba(28,32,28,0.10)', transition: 'background .2s' }} />)}
      </div>
      <CardBlock style={{ minHeight: 200 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-faint)', marginBottom: 4 }}>Step {step + 1} of {steps.length}</div>
        <h2 style={{ margin: '0 0 18px', fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{cur.t}</h2>
        {cur.el}
      </CardBlock>
      <div style={{ display: 'flex', gap: 10 }}>
        {step > 0 && <Btn variant="ghost" onClick={() => setStep(step - 1)} icon={<Icon name="chevL" size={17} color="var(--ink)" />}>Back</Btn>}
        {step < steps.length - 1 && <Btn full variant="primary" onClick={() => setStep(step + 1)} iconR={<Icon name="chevR" size={17} color="#fff" />}>Next</Btn>}
      </div>
    </div>
  );
}

// ── RESULTS FEED ────────────────────────────────────────────────
function ResultsScreen({ c, onOpen, favs, onFav, onSave, t, justSaved }) {
  const layout = (t && t.resultsLayout) || 'card';
  const D = dens(t);
  const [sort, setSort] = React.useState('match');
  const list = [...LISTINGS].sort((a, b) => sort === 'match' ? b.match - a.match : sort === 'price' ? a.price - b.price : (a.days - b.days));
  const fresh = list.filter((l) => l.fresh);

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <ScreenBody>
        <AppHeader
          title="Your matches"
          sub={`${list.length} homes match · ${fresh.length} new since yesterday`}
          trailing={<button onClick={onSave} style={{ border: 'none', cursor: 'pointer', background: justSaved ? 'var(--green-tint)' : 'var(--clay)', color: justSaved ? 'var(--green-deep)' : '#fff', borderRadius: 13, padding: '11px 14px', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 7, boxShadow: '0 2px 8px rgba(28,32,28,0.14)', WebkitTapHighlightColor: 'transparent', flexShrink: 0 }}>
            <Icon name={justSaved ? 'check' : 'bell'} size={16} color={justSaved ? 'var(--green-deep)' : '#fff'} fill={!justSaved} />{justSaved ? 'Saved' : 'Save'}
          </button>} />

        {/* active criteria summary */}
        <div className="noscroll" style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '2px 0 4px', marginBottom: 14 }}>
          <Chip tone="green" size="sm" icon={<Icon name="search" size={12} color="var(--green-deep)" />}>{c.mode}</Chip>
          <Chip size="sm">≤ {fmtMoney(c.priceMax)}{c.mode === 'Rent' ? '/mo' : ''}</Chip>
          {c.beds > 0 && <Chip size="sm">{c.beds}+ bed</Chip>}
          {c.features.slice(0, 2).map((f) => <Chip key={f} tone="clay" size="sm">{f}</Chip>)}
        </div>

        {/* sort row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-faint)', fontWeight: 600 }}>Sorted by</span>
          <Segmented full={false} size="sm" value={sort} onChange={setSort}
            options={[{ value: 'match', label: 'Best match' }, { value: 'price', label: 'Price' }, { value: 'new', label: 'Newest' }]} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: D.cardGap }}>
          {list.map((l) => layout === 'list'
            ? <ListingRow key={l.id} l={l} onOpen={onOpen} fav={favs.includes(l.id)} onFav={onFav} t={t} />
            : <ListingCard key={l.id} l={l} onOpen={onOpen} fav={favs.includes(l.id)} onFav={onFav} t={t} />)}
        </div>
      </ScreenBody>
    </div>
  );
}

// ── LISTING DETAIL ──────────────────────────────────────────────
function DetailScreen({ l, onBack, fav, onFav }) {
  const rent = l.status === 'rent';
  const [pi, setPi] = React.useState(0);
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <ScreenBody pad={false} bottom={120}>
        <div style={{ position: 'relative' }}>
          <Photo tone={l.photos[pi]} label={l.photos[pi].label} height={320} radius={0} />
          <div style={{ position: 'absolute', top: 52, left: 16, right: 16, display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 999, border: 'none', cursor: 'pointer', background: 'rgba(251,250,245,0.92)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
              <Icon name="chevL" size={22} color="var(--ink)" /></button>
            <div style={{ display: 'flex', gap: 9 }}>
              <button style={{ width: 40, height: 40, borderRadius: 999, border: 'none', cursor: 'pointer', background: 'rgba(251,250,245,0.92)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                <Icon name="share" size={18} color="var(--ink)" /></button>
              <button onClick={() => onFav(l.id)} style={{ width: 40, height: 40, borderRadius: 999, border: 'none', cursor: 'pointer', background: 'rgba(251,250,245,0.92)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                <Icon name="heart" size={19} color={fav ? 'var(--clay)' : 'var(--ink)'} fill={fav} /></button>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
            {l.photos.map((_, i) => <button key={i} onClick={() => setPi(i)} style={{ width: i === pi ? 22 : 7, height: 7, borderRadius: 999, border: 'none', cursor: 'pointer', background: i === pi ? '#fff' : 'rgba(255,255,255,0.55)', transition: 'width .2s' }} />)}
          </div>
          {l.isNew && <span style={{ position: 'absolute', bottom: 14, left: 16, background: 'var(--clay)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '6px 11px', borderRadius: 999 }}>New · listed {l.postedAgo} ago</span>}
        </div>

        <div style={{ padding: '20px 18px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1 }}>{fmtMoney(l.price)}{rent && <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink-faint)' }}>/mo</span>}</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{l.address}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--ink-faint)', fontSize: 14, marginTop: 3 }}><Icon name="pin" size={15} color="var(--ink-faint)" />{l.hood} · {l.city}</div>
            </div>
            <MatchBadge pct={l.match} dark />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 18 }}>
            {[['bed', l.beds, 'Beds'], ['bath', l.baths, 'Baths'], ['ruler', l.sqft.toLocaleString(), 'Sq ft']].map(([ic, v, lab]) => (
              <div key={lab} style={{ background: 'var(--surface)', borderRadius: 14, padding: '14px 10px', textAlign: 'center', boxShadow: '0 1px 2px rgba(28,32,28,0.05)' }}>
                <Icon name={ic} size={20} color="var(--green)" style={{ margin: '0 auto' }} />
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6, fontFamily: 'var(--mono)' }}>{v}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontWeight: 600, marginTop: 1 }}>{lab}</div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 15.5, lineHeight: 1.6, color: 'var(--ink-soft)', marginTop: 18, textWrap: 'pretty' }}>{l.blurb}</p>

          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 4 }}>
            {l.tags.map((tg) => <Chip key={tg} tone="green">{tg}</Chip>)}
          </div>

          {/* why it matched */}
          <div style={{ background: 'var(--green-tint)', borderRadius: 'var(--radius)', padding: 16, marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Icon name="spark" size={17} color="var(--green-deep)" fill /><span style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--green-deep)' }}>Why Scout flagged this</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[`Within your budget — ${fmtMoney(l.monthly)}/mo estimated`, `${l.beds} bedrooms, matches your minimum`, `Has ${l.tags[0].toLowerCase()}, one of your must-haves`].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 14, color: 'var(--green-deep)', fontWeight: 500 }}>
                  <Icon name="check" size={16} color="var(--green)" strokeWidth={2.4} style={{ flexShrink: 0, marginTop: 1 }} />{r}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18, fontSize: 14 }}>
            {[['Type', l.type], ['Year built', l.year], ['Lot', l.lot || '—'], ['Est. monthly', fmtMoney(l.monthly)]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--line-soft)' }}>
                <span style={{ color: 'var(--ink-faint)', fontWeight: 500 }}>{k}</span><span style={{ fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </ScreenBody>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 18px 26px', display: 'flex', gap: 10,
        background: 'linear-gradient(to top, var(--app-bg) 62%, rgba(244,241,233,0))' }}>
        <Btn variant="ghost" icon={<Icon name="mail" size={18} color="var(--ink)" />} onClick={onBack}>Contact</Btn>
        <Btn full variant="primary" iconR={<Icon name="arrowR" size={18} color="#fff" />}>Schedule a tour</Btn>
      </div>
    </div>
  );
}

Object.assign(window, { BuilderScreen, ResultsScreen, DetailScreen, parsePrompt });
