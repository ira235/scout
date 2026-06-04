// icons.jsx — minimal line-icon set for Scout
function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8, style = {}, fill = false }) {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
    style,
  };
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.2-3.2" /></>,
    sliders: <><path d="M4 7h11M19 7h1M4 17h6M14 17h6" /><circle cx="17" cy="7" r="2" fill={fill?color:'none'} /><circle cx="12" cy="17" r="2" fill={fill?color:'none'} /></>,
    spark: <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z" fill={fill?color:'none'} />,
    home: <><path d="M4 11l8-6.5L20 11" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5h4v5" /></>,
    pin: <><path d="M12 21s-6.5-5.4-6.5-10.2A6.5 6.5 0 0112 4a6.5 6.5 0 016.5 6.8C18.5 15.6 12 21 12 21z" /><circle cx="12" cy="10.5" r="2.2" /></>,
    bed: <><path d="M3 18v-9M3 13h18a0 0 0 010 0v5M21 18v-3" /><path d="M3 13v-2a2 2 0 012-2h5a2 2 0 012 2v2" /></>,
    bath: <><path d="M4 11V6.5A2.5 2.5 0 016.5 4 2 2 0 018 5.5" /><path d="M3 11h18v2a5 5 0 01-5 5H8a5 5 0 01-5-5v-2z" /><path d="M7 21l-1 1M18 21l1 1" /></>,
    ruler: <><rect x="3" y="8" width="18" height="8" rx="1.5" /><path d="M7 8v3M11 8v4M15 8v3M19 8v4" /></>,
    heart: <path d="M12 20s-7-4.5-7-9.5A4 4 0 0112 7a4 4 0 017 3.5C19 15.5 12 20 12 20z" fill={fill?color:'none'} />,
    bell: <><path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z" fill={fill?color:'none'} /><path d="M10 19a2 2 0 004 0" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M4 7l8 6 8-6" /></>,
    chevR: <path d="M9 5l7 7-7 7" />,
    chevL: <path d="M15 5l-7 7 7 7" />,
    chevD: <path d="M5 9l7 7 7-7" />,
    arrowR: <><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>,
    check: <path d="M5 12.5l4.5 4.5L19 7" />,
    x: <path d="M6 6l12 12M18 6L6 18" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    dot: <circle cx="12" cy="12" r="4" fill={color} stroke="none" />,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4.5l3 1.8" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2.5l1.4 2.3 2.6-.5.6 2.6 2.4 1.1-1 2.5 1 2.5-2.4 1.1-.6 2.6-2.6-.5L12 21.5l-1.4-2.3-2.6.5-.6-2.6L5 16l1-2.5-1-2.5 2.4-1.1.6-2.6 2.6.5L12 2.5z" /></>,
    map: <><path d="M9 4L3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4z" /><path d="M9 4v14M15 6v14" /></>,
    grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
    list: <><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1.2" fill={color} stroke="none" /><circle cx="4" cy="12" r="1.2" fill={color} stroke="none" /><circle cx="4" cy="18" r="1.2" fill={color} stroke="none" /></>,
    share: <><circle cx="6" cy="12" r="2.5" /><circle cx="17" cy="6" r="2.5" /><circle cx="17" cy="18" r="2.5" /><path d="M8.2 10.8l6.6-3.6M8.2 13.2l6.6 3.6" /></>,
    star: <path d="M12 4l2.3 4.7 5.2.8-3.8 3.7.9 5.1L12 16l-4.6 2.4.9-5.1L4.5 9.5l5.2-.8L12 4z" fill={fill?color:'none'} />,
    tag: <><path d="M3 12.5V5a2 2 0 012-2h7.5L21 11.5a2 2 0 010 2.8l-6.7 6.7a2 2 0 01-2.8 0L3 12.5z" /><circle cx="8" cy="8" r="1.4" fill={color} stroke="none" /></>,
    send: <path d="M21 4L3 11l7 3 3 7 8-17z" fill={fill?color:'none'} />,
    pause: <><path d="M9 5v14M15 5v14" /></>,
    edit: <><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M14 6l4 4" /></>,
    trash: <><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" /></>,
    walk: <><circle cx="13" cy="4.5" r="1.8" /><path d="M11 9l-2 4 2 1.5M11 9l3 1 1 3M9 13l-1.5 6M14 13l1 7" /></>,
    car: <><path d="M5 11l1.5-4.5A2 2 0 018.4 5h7.2a2 2 0 011.9 1.5L19 11M4 11h16v5H4z" /><circle cx="7.5" cy="16.5" r="1.4" /><circle cx="16.5" cy="16.5" r="1.4" /></>,
    tree: <><path d="M12 21v-5" /><path d="M12 16a5 5 0 003-9 4 4 0 00-6 0 5 5 0 003 9z" /></>,
  };
  return <svg {...common}>{paths[name] || null}</svg>;
}

window.Icon = Icon;
