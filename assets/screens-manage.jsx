// screens-manage.jsx — saved searches/alerts, settings, email digest
const { SAVED_SEARCHES, LISTINGS: ALL, money: m2 } = window.SCOUT_DATA;
const byId = (id) => ALL.find((x) => x.id === id);

// ── ALERTS / SAVED SEARCHES DASHBOARD ───────────────────────────
function AlertsScreen({ searches, onToggle, onFreq, onOpenSearch, onViewEmail }) {
  const totalNew = searches.reduce((n, s) => n + (s.active ? s.newCount : 0), 0);
  return (
    <ScreenBody>
      <AppHeader title="Saved alerts" sub={`${searches.filter((s) => s.active).length} active · watching every new listing`} />

      {/* digest summary banner */}
      <button onClick={onViewEmail} style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: 'linear-gradient(150deg, var(--clay), var(--clay-deep))', color: '#fff', borderRadius: 'var(--radius)', padding: 18, marginBottom: 18, boxShadow: '0 6px 18px rgba(28,32,28,0.16)', WebkitTapHighlightColor: 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="mail" size={22} color="#fff" /></span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{totalNew} new in tomorrow's digest</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 1 }}>Preview your morning email →</div>
            </div>
          </div>
          <Icon name="chevR" size={20} color="#fff" />
        </div>
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {searches.map((s) => {
          const matches = s.matchIds.map(byId).filter(Boolean);
          return (
            <div key={s.id} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 16, boxShadow: '0 1px 2px rgba(28,32,28,0.05), 0 6px 16px rgba(28,32,28,0.03)', opacity: s.active ? 1 : 0.72 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <button onClick={() => onOpenSearch(s)} style={{ border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', padding: 0, flex: 1, minWidth: 0, WebkitTapHighlightColor: 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>{s.name}</span>
                    {s.active && s.newCount > 0 && <span style={{ background: 'var(--clay)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 999 }}>{s.newCount} new</span>}
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--ink-faint)', marginTop: 4, lineHeight: 1.45 }}>{s.summary}</div>
                </button>
                <Switch on={s.active} onChange={() => onToggle(s.id)} />
              </div>

              {/* match thumbnails */}
              {s.active && (
                <button onClick={() => onOpenSearch(s)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', gap: 8, marginTop: 13, width: '100%', WebkitTapHighlightColor: 'transparent' }}>
                  {matches.slice(0, 3).map((l) => (
                    <div key={l.id} style={{ flex: 1, position: 'relative' }}>
                      <Photo tone={l.photos[0]} label="" height={62} radius={10} />
                      {l.fresh && <span style={{ position: 'absolute', top: 5, left: 5, width: 8, height: 8, borderRadius: 999, background: 'var(--clay)', boxShadow: '0 0 0 2px #fff' }} />}
                    </div>
                  ))}
                  {matches.length < 3 && Array.from({ length: 3 - matches.length }).map((_, i) => <div key={i} style={{ flex: 1, height: 62, borderRadius: 10, background: 'rgba(28,32,28,0.04)' }} />)}
                </button>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 13, paddingTop: 13, borderTop: '1px solid var(--line-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FreqBadge freq={s.freq} />
                  <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>Last sent {s.lastSent}</span>
                </div>
                <button onClick={() => onFreq(s.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--green-deep)', fontWeight: 700, fontSize: 13.5, display: 'inline-flex', alignItems: 'center', gap: 4, WebkitTapHighlightColor: 'transparent' }}>
                  <Icon name="edit" size={14} color="var(--green-deep)" />Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button style={{ width: '100%', marginTop: 14, border: '1.5px dashed var(--line)', background: 'transparent', cursor: 'pointer', borderRadius: 'var(--radius)', padding: 16, color: 'var(--ink-soft)', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, WebkitTapHighlightColor: 'transparent' }}>
        <Icon name="plus" size={18} color="var(--ink-soft)" />New saved search
      </button>
    </ScreenBody>
  );
}

// ── SETTINGS (notification frequency etc.) ──────────────────────
function SettingsScreen({ settings, set, onViewEmail }) {
  const Row = ({ icon, title, sub, right, last }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 0', borderBottom: last ? 'none' : '1px solid var(--line-soft)' }}>
      <span style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--green-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={19} color="var(--green-deep)" /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15.5, fontWeight: 700 }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 1 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
  const Card = ({ label, children }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--ink-soft)', margin: '0 0 8px 4px' }}>{label}</div>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '2px 16px', boxShadow: '0 1px 2px rgba(28,32,28,0.05)' }}>{children}</div>
    </div>
  );

  return (
    <ScreenBody>
      <AppHeader title="Settings" sub="How and when Scout reaches you" />

      <Card label="Delivery schedule">
        <div style={{ padding: '15px 0', borderBottom: '1px solid var(--line-soft)' }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 11 }}>How often should we email you?</div>
          <Segmented value={settings.freq} onChange={(v) => set({ freq: v })}
            options={[{ value: 'instant', label: 'Instant' }, { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }]} />
          <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 10, lineHeight: 1.5 }}>
            {settings.freq === 'instant' && 'We email the moment a new match is listed — best for hot markets.'}
            {settings.freq === 'daily' && 'One tidy digest each morning with everything new since yesterday.'}
            {settings.freq === 'weekly' && 'A single roundup every Monday — calm and low-volume.'}
          </div>
        </div>
        {settings.freq !== 'instant' && (
          <Row icon="clock" title="Send time" sub={settings.freq === 'weekly' ? 'Mondays' : 'Every morning'}
            right={<Segmented full={false} size="sm" value={settings.time} onChange={(v) => set({ time: v })}
              options={[{ value: '8am', label: '8 AM' }, { value: '12pm', label: 'Noon' }, { value: '6pm', label: '6 PM' }]} />} />
        )}
        <Row icon="bell" title="Push notifications" sub="Buzz my phone for new matches too" last
          right={<Switch on={settings.push} onChange={(v) => set({ push: v })} />} />
      </Card>

      <Card label="Email digest">
        <Row icon="mail" title="Send to" sub={settings.email} right={<Icon name="chevR" size={18} color="var(--ink-faint)" />} />
        <Row icon="home" title="Listings per email" sub={`Up to ${settings.perEmail} top matches`} last
          right={<Segmented full={false} size="sm" value={settings.perEmail} onChange={(v) => set({ perEmail: v })}
            options={[{ value: 5, label: '5' }, { value: 10, label: '10' }, { value: 20, label: '20' }]} />} />
      </Card>

      <button onClick={onViewEmail} style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'var(--green-tint)', borderRadius: 'var(--radius)', padding: 16, color: 'var(--green-deep)', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14, WebkitTapHighlightColor: 'transparent' }}>
        <Icon name="mail" size={18} color="var(--green-deep)" />Preview my email digest
      </button>

      <Card label="Filters">
        <Row icon="tag" title="Exclude pending & sold" sub="Only show available listings" right={<Switch on={settings.hidePending} onChange={(v) => set({ hidePending: v })} />} />
        <Row icon="spark" title="Only high-confidence matches" sub="85%+ match score" last right={<Switch on={settings.highOnly} onChange={(v) => set({ highOnly: v })} />} />
      </Card>
    </ScreenBody>
  );
}

// ── EMAIL DIGEST PREVIEW ────────────────────────────────────────
function EmailScreen({ onBack, settings }) {
  const picks = ALL.filter((l) => l.fresh).slice(0, 3);
  const more = ALL.length - picks.length;
  return (
    <div style={{ position: 'relative', height: '100%', background: 'var(--bg)' }}>
      {/* mail app top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingTop: 46, background: 'color-mix(in srgb, var(--bg) 92%, transparent)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px 12px' }}>
          <button onClick={onBack} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', color: 'var(--green-deep)', fontWeight: 700, fontSize: 15, gap: 2 }}>
            <Icon name="chevL" size={20} color="var(--green-deep)" />Inbox
          </button>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: 0.6, whiteSpace: 'nowrap' }}>Email preview</span>
        </div>
      </div>

      <ScreenBody pad={false} bottom={40}>
        <div style={{ height: 92 }} />
        {/* the email itself, as a white "paper" sheet */}
        <div style={{ margin: '0 12px', background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 20px rgba(28,32,28,0.10)' }}>
          {/* email header */}
          <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid var(--line-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="pin" size={18} color="#fff" /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14.5 }}>Scout</div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>alerts@scout.homes · to {settings.email}</div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>8:00 AM</span>
            </div>
          </div>

          {/* hero */}
          <div style={{ background: 'linear-gradient(150deg, var(--green), var(--green-deep))', color: '#fff', padding: '22px 20px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, letterSpacing: 1, opacity: 0.8, textTransform: 'uppercase' }}>Your daily digest · Tue, Jun 4</div>
            <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: -0.5, marginTop: 6, lineHeight: 1.15 }}>3 new homes match<br />“Family house · East side”</div>
            <div style={{ display: 'flex', gap: 18, marginTop: 16 }}>
              {[['3', 'new today'], ['96%', 'top match'], ['$685k', 'from']].map(([n, l]) => (
                <div key={l}><div style={{ fontSize: 19, fontWeight: 800, fontFamily: 'var(--mono)' }}>{n}</div><div style={{ fontSize: 11.5, opacity: 0.85 }}>{l}</div></div>
              ))}
            </div>
          </div>

          {/* listing blocks */}
          <div style={{ padding: '8px 16px 4px' }}>
            {picks.map((l, idx) => (
              <div key={l.id} style={{ padding: '16px 4px', borderBottom: idx < picks.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                <div style={{ position: 'relative' }}>
                  <Photo tone={l.photos[0]} label={l.photos[0].label} height={148} radius={12}
                    badge={<span style={{ position: 'absolute', top: 9, left: 9, background: 'var(--clay)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 999 }}>New · {l.postedAgo} ago</span>} />
                  <span style={{ position: 'absolute', top: 9, right: 9, background: 'rgba(47,93,79,0.94)', color: '#fff', fontFamily: 'var(--mono)', fontSize: 11.5, fontWeight: 600, padding: '4px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>{l.match}% match</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 11 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>{m2(l.price)}{l.status === 'rent' && <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>/mo</span>}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--ink-soft)' }}>{l.beds} bd · {l.baths} ba · {l.sqft.toLocaleString()} ft²</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 3 }}>{l.address}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 1 }}>{l.hood} · {l.city}</div>
                <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-soft)', margin: '8px 0 12px', textWrap: 'pretty' }}>{l.blurb}</p>
                <div style={{ background: 'var(--green)', color: '#fff', borderRadius: 11, padding: '11px', textAlign: 'center', fontSize: 14, fontWeight: 700 }}>View listing & photos →</div>
              </div>
            ))}
          </div>

          {/* footer */}
          <div style={{ padding: '4px 20px 22px' }}>
            <div style={{ background: 'var(--app-bg)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', fontWeight: 600 }}>{more} more matches in the app</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 8, lineHeight: 1.5 }}>You're getting a <b>daily</b> digest for this search.<br />Change frequency · Pause · Unsubscribe</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 14 }}>Scout · Sent because you saved an alert</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-faint)', padding: '16px' }}>This is a preview of the email you'll receive.</div>
      </ScreenBody>
    </div>
  );
}

Object.assign(window, { AlertsScreen, SettingsScreen, EmailScreen });
