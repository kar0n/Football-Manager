import { ArrowLeft, Share2, Palette } from 'lucide-react';

/**
 * Matchup toolbar — Back button and Color toggle.
 * Renders above the matchup board, outside the screenshot capture area.
 * Exact same JSX as App.jsx lines 744–753.
 */
export const MatchupToolbar = ({
  isAdmin,
  toggleProps,
  onBack,
  onToggleColors,
}) => {
  return (
    <div className="matchup-header-actions" style={{ marginTop: '-0.25rem', marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <button className="action-btn secondary" onClick={onBack} style={{ width: 'fit-content', padding: '0.6rem 1rem', fontSize: '1rem', marginTop: 0 }}>
        <ArrowLeft size={18} /> Back
      </button>
      {isAdmin && (
        <button className="action-btn secondary" onClick={onToggleColors} style={{ width: 'fit-content', padding: '0.6rem 1rem', fontSize: '1rem', marginTop: 0, gap: '0.25rem', ...toggleProps.style }}>
          <Palette size={18} /> {toggleProps.text}
        </button>
      )}
    </div>
  );
};

/**
 * Finalize & Share button.
 * Renders below the matchup board, outside the screenshot capture area.
 * Exact same JSX as App.jsx lines 822–828.
 */
export const FinalizeButton = ({ isSharing, onShare }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 0 }}>
      <button className="action-btn" onClick={onShare} style={{ background: 'var(--success)', opacity: isSharing ? 0.5 : 1, boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)' }} disabled={isSharing}>
        <Share2 size={20} /> {isSharing ? 'Generating Image...' : 'Finalize & Share Image'}
      </button>
    </div>
  );
};
