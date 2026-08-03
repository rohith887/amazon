function Svg({ children, viewBox = "0 0 24 24", ...rest }) {
  return (
    <svg width="18" height="18" viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="1.8" {...rest}>
      {children}
    </svg>
  );
}

export const icons = {
  dashboard: () => (
    <Svg>
      <rect x="3" y="3" width="8" height="10" rx="1.5" />
      <rect x="13" y="3" width="8" height="6" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
      <rect x="3" y="17" width="8" height="4" rx="1.5" />
    </Svg>
  ),
  report: () => (
    <Svg>
      <path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6M9 9h2" strokeLinecap="round" />
    </Svg>
  ),
  activity: () => (
    <Svg>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  quality: () => (
    <Svg>
      <path d="M12 2l3 6.5 7 1-5.2 5 1.3 7L12 18l-6.1 3.5 1.3-7L2 9.5l7-1L12 2z" strokeLinejoin="round" />
    </Svg>
  ),
  chevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chevron">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  menu: () => (
    <Svg>
      <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
    </Svg>
  ),
  logout: () => (
    <Svg>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" />
      <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  empty: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 7h18M3 12h18M3 17h12" strokeLinecap="round" />
    </svg>
  ),
};
