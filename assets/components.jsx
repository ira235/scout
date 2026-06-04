// components.jsx — shared UI for Scout
const { money } = window.SCOUT_DATA;

// density → spacing scale
function dens(t) {
  const d = (t && t.density) || 'regular';
  if (d === 'compact') return { pad: 12, gap: 8, cardGap: 10, rowPad: 12 };
  if (d === 'comfy')   return { pad: 20, gap: 16, cardGap: 20, rowPad: 18 };
  return { pad: 16, gap: 12, cardGap: 14, rowPad: 15 };
}

// ── diagonal-striped photo placeholder ──────────────────────────
function Photo({ tone, label, height = 200, radius = 16, badge = null, fav = null }) {
  const id = 'st' + Math.abs((label || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  return (
    <div style={{
      position: 'relative', width: '100%', height, borderRadius: radius, overflow: 'hidden',
      background: tone ? tone.a : '#E2DBCC',
    }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="14" height="14" fill={tone ? tone.a : '#E2DBCC'} />
            <rect width="7" height="14" fill={tone ? tone.b : '#D5CCB8'} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} opacity="0.55" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 0.4, color: 'rgba(28,32,28,0.42)',
          textTransform: 'uppercase', background: 'rgba(251,250,245,0.62)', padding: '4px 9px', borderRadius: 7,
        }}>{label}</span>
      </div>
      {badge}
      {fav}
    </div>
  );
}

// ── small chip / tag ────────────────────────────────────────────
function Chip({ children, tone = 'neutral', size = 'md', icon = null, style = {} }) {
  const tones = {
    neutral: { bg: 'rgba(28,32,28,0.05)', fg: 'var(--ink-soft)' },
    green:   { bg: 'var(--green-tint)', fg: 'var(--green-deep)' },
    clay:    { bg: 'var(--clay-tint)', fg: 'var(--clay-deep)' },
    outline: { bg: 'transparent', fg: 'var(--ink-soft)', bd: '1px solid var(--line)' },
  };
  const c = tones[tone] || tones.neutral;
  const sm = size === 'sm';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: c.bg, color: c.fg, border: c.bd || 'none',
      fontSize: sm ? 11.5 : 13, fontWeight: 600, lineHeight: 1,
      padding: sm ? '5px 9px' : '7px 11px', borderRadius: 999, whiteSpace: 'nowrap', ...style,
    }}>{icon}{children}</span>
  );
}

// ── match badge ─────────────────────────────────────────────────
function MatchBadge({ pct, dark = false }) {
  const strong = pct >= 92;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', flexShrink: 0,
      fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600,
      color: dark ? '#fff' : (strong ? 'var(--green-deep)' : 'var(--ink-soft)'),
      background: dark ? 'rgba(47,93,79,0.92)' : (strong ? 'var(--green-tint)' : 'transparent'),
      padding: dark ? '5px 9px' : (strong ? '3px 8px' : '0'), borderRadius: 999,
    }}>
      <Icon name="spark" size={13} color={dark ? '#fff' : 'var(--green)'} fill />
      {pct}% match
    </span>
  );
}

// ── frequency badge (daily / weekly) ────────────────────────────
function FreqBadge({ freq }) {
  const daily = freq === 'daily';
  return (
    <Chip tone={daily ? 'clay' : 'green'} size="sm"
      icon={<Icon name={daily ? 'clock' : 'calendar'} size={12} color={daily ? 'var(--clay-deep)' : 'var(--green-deep)'} />}>
      {daily ? 'Daily' : 'Weekly'}
    </Chip>
  );
}

// ── primary / ghost buttons ─────────────────────────────────────
function Btn({ children, onClick, variant = 'primary', size = 'md', full = false, icon = null, iconR = null, style = {} }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    border: 'none', cursor: 'pointer', fontWeight: 700, borderRadius: 14,
    fontSize: size === 'sm' ? 14 : 16, padding: size === 'sm' ? '9px 14px' : '14px 20px',
    width: full ? '100%' : 'auto', fontFamily: 'var(--sans)', transition: 'transform .12s, filter .12s',
    WebkitTapHighlightColor: 'transparent', ...style,
  };
  const variants = {
    primary: { background: 'var(--green)', color: '#fff' },
    clay:    { background: 'var(--clay)', color: '#fff' },
    ghost:   { background: 'var(--surface)', color: 'var(--ink)', boxShadow: 'inset 0 0 0 1px var(--line)' },
    soft:    { background: 'var(--green-tint)', color: 'var(--green-deep)' },
    quiet:   { background: 'transparent', color: 'var(--ink-soft)' },
  };
  return (
    <button onClick={onClick} style={{ ...base, ...variants[variant] }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.975)'}
      onMouseUp={(e) => e.currentTarget.style.transform = ''}
      onMouseLeave={(e) => e.currentTarget.style.transform = ''}>
      {icon}{children}{iconR}
    </button>
  );
}

// ── segmented control ───────────────────────────────────────────
function Segmented({ options, value, onChange, full = true, size = 'md' }) {
  return (
    <div style={{
      display: full ? 'grid' : 'inline-grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`,
      background: 'rgba(28,32,28,0.05)', borderRadius: 13, padding: 3, gap: 2,
    }}>
      {options.map((o) => {
        const val = typeof o === 'string' ? o : o.value;
        const lab = typeof o === 'string' ? o : o.label;
        const active = val === value;
        return (
          <button key={val} onClick={() => onChange(val)} style={{
            border: 'none', cursor: 'pointer', borderRadius: 10, fontFamily: 'var(--sans)',
            fontSize: size === 'sm' ? 13 : 14.5, fontWeight: 600, padding: size === 'sm' ? '7px 8px' : '9px 10px',
            background: active ? 'var(--surface-2)' : 'transparent',
            color: active ? 'var(--ink)' : 'var(--ink-soft)',
            boxShadow: active ? '0 1px 3px rgba(28,32,28,0.10)' : 'none',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'background .15s, color .15s', WebkitTapHighlightColor: 'transparent',
          }}>{typeof o === 'object' && o.icon}{lab}</button>
        );
      })}
    </div>
  );
}

// ── toggle switch ───────────────────────────────────────────────
function Switch({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 46, height: 28, borderRadius: 999, border: 'none', cursor: 'pointer', padding: 3,
      background: on ? 'var(--green)' : 'rgba(28,32,28,0.18)', transition: 'background .18s',
      display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start', WebkitTapHighlightColor: 'transparent',
    }}>
      <span style={{ width: 22, height: 22, borderRadius: 999, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.25)', transition: 'all .18s' }} />
    </button>
  );
}

// ── specs row (beds / baths / sqft) ─────────────────────────────
function Specs({ beds, baths, sqft, color = 'var(--ink-soft)', size = 13 }) {
  const item = (icon, val) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: size, color, fontWeight: 500 }}>
      <Icon name={icon} size={size + 3} color={color} strokeWidth={1.7} />{val}
    </span>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      {item('bed', beds)}
      {item('bath', baths)}
      {item('ruler', sqft.toLocaleString() + ' ft²')}
    </div>
  );
}

// ── listing card (card layout) ──────────────────────────────────
function ListingCard({ l, onOpen, fav, onFav, t }) {
  const D = dens(t);
  const rent = l.status === 'rent';
  return (
    <button onClick={() => onOpen(l)} style={{
      display: 'block', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
      background: 'var(--surface)', borderRadius: 'var(--radius)', padding: D.pad,
      boxShadow: '0 1px 2px rgba(28,32,28,0.05), 0 6px 16px rgba(28,32,28,0.04)',
      fontFamily: 'var(--sans)', WebkitTapHighlightColor: 'transparent',
    }}>
      <Photo tone={l.photos[0]} label={l.photos[0].label} height={D.pad === 12 ? 150 : 184}
        badge={l.isNew && (
          <span style={{ position: 'absolute', top: 10, left: 10, background: 'var(--clay)', color: '#fff',
            fontSize: 11.5, fontWeight: 700, padding: '5px 9px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: '#fff' }} />New · {l.postedAgo}
          </span>
        )}
        fav={(
          <span onClick={(e) => { e.stopPropagation(); onFav(l.id); }} style={{
            position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 999,
            background: 'rgba(251,250,245,0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}>
            <Icon name="heart" size={18} color={fav ? 'var(--clay)' : 'var(--ink-soft)'} fill={fav} />
          </span>
        )} />

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 13 }}>
        <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.4 }}>
          {money(l.price)}{rent && <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-faint)' }}>/mo</span>}
        </div>
        <MatchBadge pct={l.match} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{l.address}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--ink-faint)', fontSize: 13.5, marginTop: 2 }}>
        <Icon name="pin" size={14} color="var(--ink-faint)" />{l.hood} · {l.city}
      </div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line-soft)' }}>
        <Specs beds={l.beds} baths={l.baths} sqft={l.sqft} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {l.tags.slice(0, 3).map((tg) => <Chip key={tg} size="sm">{tg}</Chip>)}
      </div>
    </button>
  );
}

// ── listing row (list layout) ───────────────────────────────────
function ListingRow({ l, onOpen, fav, onFav, t }) {
  const D = dens(t);
  const rent = l.status === 'rent';
  return (
    <button onClick={() => onOpen(l)} style={{
      display: 'flex', gap: 12, width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
      background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: D.pad === 12 ? 8 : 10,
      boxShadow: '0 1px 2px rgba(28,32,28,0.05)', fontFamily: 'var(--sans)', alignItems: 'stretch',
      WebkitTapHighlightColor: 'transparent',
    }}>
      <div style={{ width: 104, flexShrink: 0, position: 'relative' }}>
        <Photo tone={l.photos[0]} label="" height={D.pad === 12 ? 88 : 104} radius={10} />
        {l.isNew && <span style={{ position: 'absolute', top: 6, left: 6, width: 9, height: 9, borderRadius: 999, background: 'var(--clay)', boxShadow: '0 0 0 2px #fff' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>
            {money(l.price)}{rent && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-faint)' }}>/mo</span>}
          </span>
          <Icon name="heart" size={17} color={fav ? 'var(--clay)' : 'var(--ink-faint)'} fill={fav}
            style={{ flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); onFav(l.id); }} />
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.address}</div>
        <div style={{ color: 'var(--ink-faint)', fontSize: 12.5, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.hood} · {l.city}</div>
        <div style={{ marginTop: 'auto', paddingTop: 7, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Specs beds={l.beds} baths={l.baths} sqft={l.sqft} size={11.5} />
          <MatchBadge pct={l.match} />
        </div>
      </div>
    </button>
  );
}

// ── app header (in-app, sits below status bar) ──────────────────
function AppHeader({ title, sub, leading, trailing }) {
  return (
    <div style={{ padding: '54px 18px 12px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        {leading}
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.05 }}>{title}</h1>
        {sub && <div style={{ color: 'var(--ink-faint)', fontSize: 14, marginTop: 4, fontWeight: 500 }}>{sub}</div>}
      </div>
      {trailing}
    </div>
  );
}

// ── bottom tab bar ──────────────────────────────────────────────
function BottomNav({ active, onNav, alertCount }) {
  const tabs = [
    { id: 'builder', label: 'Search', icon: 'search' },
    { id: 'results', label: 'Matches', icon: 'home' },
    { id: 'alerts', label: 'Alerts', icon: 'bell', badge: alertCount },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
      paddingBottom: 26, paddingTop: 8, background: 'linear-gradient(to top, var(--app-bg) 64%, rgba(244,241,233,0))',
    }}>
      <div style={{
        margin: '0 14px', background: 'rgba(251,250,245,0.92)', backdropFilter: 'blur(14px) saturate(180%)',
        borderRadius: 22, boxShadow: '0 2px 8px rgba(28,32,28,0.08), 0 8px 24px rgba(28,32,28,0.08), inset 0 0 0 1px var(--line-soft)',
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: '8px 6px',
      }}>
        {tabs.map((tb) => {
          const on = active === tb.id;
          return (
            <button key={tb.id} onClick={() => onNav(tb.id)} style={{
              border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4, padding: '4px 0', position: 'relative', WebkitTapHighlightColor: 'transparent',
            }}>
              <div style={{ position: 'relative' }}>
                <Icon name={tb.icon} size={23} color={on ? 'var(--green)' : 'var(--ink-faint)'} fill={on && (tb.icon === 'home' || tb.icon === 'bell')} strokeWidth={on ? 2 : 1.8} />
                {tb.badge > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -7, minWidth: 16, height: 16, padding: '0 4px',
                    borderRadius: 999, background: 'var(--clay)', color: '#fff', fontSize: 10.5, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px var(--surface)' }}>{tb.badge}</span>
                )}
              </div>
              <span style={{ fontSize: 11, fontWeight: on ? 700 : 600, color: on ? 'var(--green)' : 'var(--ink-faint)' }}>{tb.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── scrollable screen body with consistent paddings ─────────────
function ScreenBody({ children, pad = true, bottom = 112 }) {
  return (
    <div className="noscroll" style={{ height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ padding: pad ? '0 18px' : 0, paddingBottom: bottom }}>{children}</div>
    </div>
  );
}

Object.assign(window, {
  dens, Photo, Chip, MatchBadge, FreqBadge, Btn, Segmented, Switch, Specs,
  ListingCard, ListingRow, AppHeader, BottomNav, ScreenBody,
});
