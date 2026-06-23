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
    <div className="flex flex-col gap-3 mt-8">
      {/* Primary Action Button */}
      {isAdmin ? (
        <button 
          onClick={handleFinalizeToggle} 
          className={`py-4 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg transition-all duration-300 ${
            teamsFinalized
              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
              : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20 hover:-translate-y-0.5'
          }`}
        >
          {teamsFinalized ? (
            <><Unlock size={20} /> Unlock Teams</>
          ) : (
            <><Lock size={20} /> Finalize Teams</>
          )}
        </button>
      ) : null}

      <div className={`grid ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
        {/* Share Button (Shows for everyone, but visual varies) */}
        <button 
          onClick={handleShare}
          disabled={isSharing}
          className={`py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all shadow-sm border ${
            teamsFinalized 
              ? 'bg-blue-500 text-white hover:bg-blue-600 border-transparent shadow-blue-500/20' 
              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
          }`}
        >
          {isSharing ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Share2 size={18} />
          )}
          Share Image
        </button>

        {/* Admin Secondary Controls */}
        {isAdmin && !teamsFinalized && (
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={toggleColors}
              className="py-3 bg-white border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 font-medium transition-colors shadow-sm"
            >
              <Palette size={18} /> Swap
            </button>
            <button 
              onClick={() => {
                if(window.confirm("Are you sure you want to shuffle? All unsaved manual changes will be lost.")) {
                  generateTeams();
                }
              }}
              className="py-3 bg-white border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 font-medium transition-colors shadow-sm"
            >
              <RefreshCw size={18} /> Shuffle
            </button>
          </div>
        )}
      </div>

      {hasUnsavedChanges && (
        <div className="text-center mt-2 text-sm font-medium text-amber-600 bg-amber-50 py-2 rounded-lg border border-amber-200">
          Unsaved manual changes
        </div>
      )}
    </div>
  );
};
