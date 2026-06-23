import React from 'react';
import { Share2, Lock, Unlock, Palette, RefreshCw } from 'lucide-react';

export const MatchupControls = ({ 
  isAdmin, 
  teamsFinalized, 
  isSharing, 
  handleShare, 
  handleFinalizeToggle, 
  toggleColors, 
  hasUnsavedChanges, 
  generateTeams 
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
      {/* Primary Action Button */}
      {isAdmin ? (
        <button 
          onClick={handleFinalizeToggle} 
          className="action-btn"
          style={teamsFinalized ? { background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' } : {}}
        >
          {teamsFinalized ? (
            <><Unlock size={20} /> Unlock Teams</>
          ) : (
            <><Lock size={20} /> Finalize Teams</>
          )}
        </button>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? 'repeat(2, 1fr)' : '1fr', gap: '0.75rem' }}>
        {/* Share Button */}
        <button 
          onClick={handleShare}
          disabled={isSharing}
          className={`action-btn ${teamsFinalized ? '' : 'secondary'}`}
        >
          {isSharing ? (
            <div style={{ width: '20px', height: '20px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
            <Share2 size={18} />
          )}
          Share Image
        </button>

        {/* Admin Secondary Controls */}
        {isAdmin && !teamsFinalized && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            <button 
              onClick={toggleColors}
              className="action-btn secondary"
            >
              <Palette size={18} /> Swap
            </button>
            <button 
              onClick={() => {
                if(window.confirm("Are you sure you want to shuffle? All unsaved manual changes will be lost.")) {
                  generateTeams();
                }
              }}
              className="action-btn secondary"
            >
              <RefreshCw size={18} /> Shuffle
            </button>
          </div>
        )}
      </div>

      {hasUnsavedChanges && (
        <div style={{ textAlign: 'center', marginTop: '0.5rem', color: '#d97706', fontSize: '0.875rem', fontWeight: 500, padding: '0.5rem', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
          Unsaved manual changes
        </div>
      )}
    </div>
  );
};
