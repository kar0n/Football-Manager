/**
 * App header — title, football pitch icon, and subtitle.
 * Renders the exact same JSX and inline SVG as the original App.jsx lines 707–719.
 */

export const Header = () => {
  return (
    <header className="app-header">
      <h1 className="title text-gradient">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '10px', marginTop: '-4px' }}>
          <rect x="2" y="3" width="20" height="18" rx="2" ry="2" />
          <line x1="12" y1="3" x2="12" y2="21" />
          <circle cx="12" cy="12" r="3" />
          <path d="M2 9h3v6H2" />
          <path d="M22 9h-3v6h3" />
        </svg>
        Weekday Football
      </h1>
      <p className="subtitle">Assemble the squad. Create a team</p>
    </header>
  );
};
