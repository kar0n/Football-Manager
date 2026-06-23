import React, { useState, useRef } from 'react';
import './App.css';
import { useGameState } from './hooks/useGameState';
import { useMatchupMutations } from './hooks/useMatchupMutations';
import { useTimers } from './hooks/useTimers';
import { Header } from './components/shared/Header';
import { Toast } from './components/shared/Toast';
import { RosterView } from './components/Roster/RosterView';
import { MatchupBoard } from './components/Matchup/MatchupBoard';
import { MatchupControls } from './components/Matchup/MatchupControls';
import { ArrowLeft } from 'lucide-react';
import { supabase } from './supabaseClient';
import { getTargetGameDay } from './utils/timeUtils';

function App() {
  const hasUnsavedChangesRef = useRef(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Custom Hooks
  const { gameState, isLoading } = useGameState(hasUnsavedChangesRef);
  const { addPlayer, removePlayer, finalizeTeams } = useMatchupMutations();
  useTimers();

  // Local View States
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState('roster');
  const [activeId, setActiveId] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [savedImageUrl, setSavedImageUrl] = useState(null);
  
  // To deal with unsaved manual modifications, we maintain local matchup state
  // and sync it when needed.
  const [localMatchup, setLocalMatchup] = useState(null);

  const syncHasUnsavedChanges = (val) => {
    setHasUnsavedChanges(val);
    hasUnsavedChangesRef.current = val;
  };

  if (isLoading || !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { allPlayers, matchup, teamsFinalized } = gameState;
  
  const totalPlayers = allPlayers.length;
  let capacity = 10;
  if (totalPlayers >= 18) capacity = 18;
  else if (totalPlayers >= 14) capacity = 14;

  const currentMatchup = localMatchup || matchup;

  const handleMatchupAccess = async () => {
    const pwd = window.prompt("Enter admin password:");
    if (pwd === "admin") {
      setIsAdmin(true);
      if (matchup) {
        setLocalMatchup(matchup);
        setViewMode('matchup');
      } else {
        generateTeams(allPlayers.slice(0, capacity));
      }
    } else if (pwd !== null) {
      alert("Incorrect password");
    }
  };

  const generateTeams = (playersList) => {
    const shuffled = [...playersList];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const mid = Math.ceil(shuffled.length / 2);
    const teamA = shuffled.slice(0, mid);
    const teamB = shuffled.slice(mid);

    const targetDay = getTargetGameDay();
    const newMatchup = {
      theme: 'rb',
      gameDay: targetDay.full,
      teamA: { id: 'teamA', name: `Team Red`, colorCode: '#ef4444', players: teamA },
      teamB: { id: 'teamB', name: `Team Blue`, colorCode: '#3b82f6', players: teamB }
    };
    
    setLocalMatchup(newMatchup);
    setViewMode('matchup');
    syncHasUnsavedChanges(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 10);
  };

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    setActiveId(null);
    syncHasUnsavedChanges(true);
  };

  const toggleColors = () => {
    if (!localMatchup) return;
    const newTheme = localMatchup.theme === 'bw' ? 'rb' : 'bw';
    const colors = newTheme === 'bw' ? ['Black', 'White'] : ['Red', 'Blue'];
    const colorHex = newTheme === 'bw' ? ['#0f172a', '#ffffff'] : ['#ef4444', '#3b82f6'];
    
    setLocalMatchup({
      ...localMatchup,
      theme: newTheme,
      teamA: { ...localMatchup.teamA, name: `Team ${colors[0]}`, colorCode: colorHex[0] },
      teamB: { ...localMatchup.teamB, name: `Team ${colors[1]}`, colorCode: colorHex[1] }
    });
    syncHasUnsavedChanges(true);
  };

  const handleFinalizeToggle = async () => {
    if (teamsFinalized) {
      await supabase.from('game_state').update({ teams_finalized: false }).eq('id', 1);
    } else {
      await finalizeTeams.mutateAsync(localMatchup);
      syncHasUnsavedChanges(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (!teamsFinalized) {
        await finalizeTeams.mutateAsync(localMatchup);
        syncHasUnsavedChanges(false);
      }
      
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      // Fetch from Vercel Edge OG Route instead of client-side html2canvas
      const response = await fetch(`/api/generate-image?matchup=${encodeURIComponent(JSON.stringify(currentMatchup))}`);
      if (!response.ok) throw new Error('Image generation failed');
      const blob = await response.blob();
      const file = new File([blob], 'football-matchup.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Weekday Football Matchup',
          text: 'Here are the finalized teams!'
        });
        setIsAdmin(false);
        setViewMode('roster');
      } else {
        setSavedImageUrl(URL.createObjectURL(blob));
        setIsAdmin(false);
        setViewMode('image');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate image. Ensure you are online.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="app-container">
      <Toast message="Teams Finalized! Generating image..." />
      {showToast && <Toast message="Teams Finalized! Generating image..." />}

      <div className="main-content">
        <Header />

        {viewMode === 'roster' && (
          <RosterView 
            allPlayers={allPlayers}
            capacity={capacity}
            isAdmin={isAdmin}
            addPlayer={addPlayer.mutateAsync}
            removePlayer={removePlayer.mutateAsync}
            handleMatchupAccess={handleMatchupAccess}
            teamsFinalized={teamsFinalized}
          />
        )}

        {viewMode === 'matchup' && currentMatchup && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <button 
              onClick={() => {
                if (hasUnsavedChangesRef.current && !window.confirm("You have unsaved changes. Return to roster?")) return;
                setViewMode('roster');
                setLocalMatchup(null);
                syncHasUnsavedChanges(false);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: 500, transition: 'color 0.2s' }}
            >
              <ArrowLeft size={18} /> Back to Roster
            </button>
            
            <MatchupBoard 
              matchup={currentMatchup}
              activeId={activeId}
              isAdmin={isAdmin}
              teamsFinalized={teamsFinalized}
              handleDragStart={handleDragStart}
              handleDragEnd={handleDragEnd}
            />

            <MatchupControls 
              isAdmin={isAdmin}
              teamsFinalized={teamsFinalized}
              isSharing={isSharing}
              handleShare={handleShare}
              handleFinalizeToggle={handleFinalizeToggle}
              toggleColors={toggleColors}
              hasUnsavedChanges={hasUnsavedChanges}
              generateTeams={() => generateTeams(allPlayers.slice(0, capacity))}
            />
          </div>
        )}

        {viewMode === 'image' && savedImageUrl && (
          <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <button 
              onClick={() => { setViewMode('roster'); setSavedImageUrl(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: 500, transition: 'color 0.2s' }}
            >
              <ArrowLeft size={18} /> Back to Roster
            </button>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Your Matchup Image</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Long press or right-click the image to save it to your device.</p>
            <img src={savedImageUrl} alt="Matchup" style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }} />
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
