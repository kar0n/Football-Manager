import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { ShieldAlert, Users, Zap, X, Share2, ArrowLeft, ArrowRight, RefreshCw, Palette, Lock, Unlock, CheckCircle, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, TouchSensor, MouseSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import html2canvas from 'html2canvas';
import './App.css';

// A pure visual representation of the player item
function PlayerItemVisual({ player, index, teamColor, teamName, isOverlay, isAdmin, dragListeners, dragAttributes, isCompact }) {
  const overlayStyle = isOverlay ? {
    boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
    transform: 'scale(1.02)',
    cursor: 'grabbing',
    opacity: 1,
    zIndex: 9999
  } : {};

  return (
    <div className={`player-item ${isCompact ? 'player-item-compact' : ''}`} style={overlayStyle}>
      <div className="player-info">
        {isAdmin && !isCompact && (
          <div 
            className="drag-handle" 
            style={{ cursor: isOverlay ? 'grabbing' : 'grab', touchAction: 'none', padding: '0.5rem', margin: '-0.5rem 0.5rem -0.5rem -0.25rem' }}
            {...dragAttributes}
            {...dragListeners}
          >
            <GripVertical size={18} />
          </div>
        )}
        <span className="player-number" style={{ background: teamColor, color: teamName === 'Team White' ? '#0f172a' : 'white' }}>{index + 1}</span>
        <span className="player-name">{player.name}</span>
      </div>
    </div>
  );
}

// The sortable wrapper that handles the dnd-kit hooks
function SortablePlayerItem({ player, index, teamColor, teamName, isAdmin, isCompact }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: player.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1, // Dim the original item while dragging
    cursor: isCompact && isAdmin ? 'grab' : 'default'
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...(isCompact && isAdmin ? attributes : {})} 
      {...(isCompact && isAdmin ? listeners : {})}
    >
      <PlayerItemVisual 
        player={player} 
        index={index} 
        teamColor={teamColor} 
        teamName={teamName} 
        isAdmin={isAdmin}
        isCompact={isCompact}
        dragListeners={!isCompact && isAdmin ? listeners : undefined}
        dragAttributes={!isCompact && isAdmin ? attributes : undefined}
      />
    </div>
  );
}

const getISTDate = () => {
  const opts = { timeZone: 'Asia/Kolkata' };
  const d = new Date();
  const year = d.toLocaleString('en-US', { ...opts, year: 'numeric' });
  const month = d.toLocaleString('en-US', { ...opts, month: '2-digit' });
  const day = d.toLocaleString('en-US', { ...opts, day: '2-digit' });
  const hour = parseInt(d.toLocaleString('en-US', { ...opts, hour: 'numeric', hourCycle: 'h23' }), 10);
  const weekdayStr = d.toLocaleString('en-US', { ...opts, weekday: 'short' }); 
  
  return { 
    dateString: `${year}-${month}-${day}`, 
    hour, 
    weekdayStr 
  };
};

function App() {
  const [allPlayers, setAllPlayers] = useState([]);
  const [newName, setNewName] = useState('');

  
  // App States
  const [matchup, setMatchup] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [viewMode, setViewMode] = useState('roster'); // 'roster' | 'matchup' | 'image'
  const [isSharing, setIsSharing] = useState(false);
  const [savedImageUrl, setSavedImageUrl] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  
  // Admin States
  const [isAdmin, setIsAdmin] = useState(false);
  const [teamsFinalized, setTeamsFinalized] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasUnsavedChangesRef = useRef(false);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const updateGameState = async (updates) => {
    try {
      await supabase.from('game_state').update(updates).eq('id', 1);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchState = async () => {
      const { data, error } = await supabase.from('game_state').select('*').eq('id', 1).single();
      if (data) {
        let currentPlayers = data.all_players || [];
        
        // --- LAZY ROLLOVER LOGIC ---
        const { dateString, weekdayStr } = getISTDate();
        if (data.last_rollover_date && dateString > data.last_rollover_date) {
          const gameDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
          if (gameDays.includes(weekdayStr)) {
            // Weekday midnight rollover: Truncate waitlist
            const capacity = (currentPlayers.length >= 18) ? 18 : (currentPlayers.length >= 14 ? 14 : 10);
            currentPlayers = currentPlayers.slice(0, capacity);
          }
          // Update database with new rollover date (and truncated players if applicable)
          supabase.from('game_state').update({
            all_players: currentPlayers,
            last_rollover_date: dateString
          }).eq('id', 1).then();
        } else if (!data.last_rollover_date) {
          // Initialize tracking if it doesn't exist
          supabase.from('game_state').update({
            last_rollover_date: dateString
          }).eq('id', 1).then();
        }
        // ---------------------------

        setAllPlayers(currentPlayers);
        setMatchup(data.matchup);
        setTeamsFinalized(data.teams_finalized || false);
      }
    };
    fetchState();

    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_state' }, (payload) => {
        setAllPlayers(payload.new.all_players || []);
        
        if (payload.new.teams_finalized && payload.new.matchup) {
           if (hasUnsavedChangesRef.current) {
               alert("Another admin has finalized a team matchup. Your view will now refresh.");
               setHasUnsavedChanges(false);
           }
           setTeamsFinalized(true);
           setMatchup(payload.new.matchup);
        } else {
           if (payload.new.matchup === null) {
              if (hasUnsavedChangesRef.current) {
                  alert("The roster has changed! Your team draft has been reset.");
                  setHasUnsavedChanges(false);
              }
              setMatchup(null);
              setTeamsFinalized(false);
           } else if (!hasUnsavedChangesRef.current) {
              setMatchup(payload.new.matchup);
              setTeamsFinalized(payload.new.teams_finalized || false);
           }
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Everyone always starts on roster. Only admins can switch to matchup.
  const displayMode = viewMode;

  const totalPlayers = allPlayers.length;
  let capacity = 10;
  if (totalPlayers >= 18) capacity = 18;
  else if (totalPlayers >= 14) capacity = 14;

  const confirmedPlayers = allPlayers.slice(0, capacity);
  const waitlistPlayers = allPlayers.slice(capacity);

  const formatTime = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Handles the "Generate Teams" / "View Matchup" button click.
  // Always prompts for password. On success, fetches latest state from DB before showing.
  const handleMatchupAccess = async () => {
    const pwd = window.prompt("Enter admin password:");
    if (pwd === "admin") {
      setIsAdmin(true);
      // Always fetch the absolute latest matchup from the database
      // to prevent stale views when realtime updates are missed
      const { data } = await supabase.from('game_state').select('matchup, teams_finalized').eq('id', 1).single();
      if (data && data.matchup) {
        setMatchup(data.matchup);
        setTeamsFinalized(data.teams_finalized || false);
        setViewMode('matchup');
      } else {
        // No matchup exists yet, generate a fresh one
        generateTeams();
      }
    } else if (pwd !== null) {
      alert("Incorrect password");
    }
  };

  const { hour, weekdayStr } = getISTDate();
  const gameDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const isRegistrationBlocked = !isAdmin && gameDays.includes(weekdayStr) && hour >= 0 && hour < 7;

  const getTargetGameDay = () => {
    const opts = { timeZone: 'Asia/Kolkata' };
    const now = new Date();
    const year = parseInt(now.toLocaleString('en-US', { ...opts, year: 'numeric' }));
    const month = parseInt(now.toLocaleString('en-US', { ...opts, month: 'numeric' })) - 1;
    const day = parseInt(now.toLocaleString('en-US', { ...opts, day: 'numeric' }));
    const istDate = new Date(year, month, day);

    let daysToAdd = 1;
    let fullDayName = '';
    let shortDayName = '';

    switch(weekdayStr) {
      case 'Mon': fullDayName = 'Tuesday'; shortDayName = 'Tue'; daysToAdd = 1; break;
      case 'Tue': fullDayName = 'Wednesday'; shortDayName = 'Wed'; daysToAdd = 1; break;
      case 'Wed': fullDayName = 'Thursday'; shortDayName = 'Thu'; daysToAdd = 1; break;
      case 'Thu': fullDayName = 'Friday'; shortDayName = 'Fri'; daysToAdd = 1; break;
      case 'Fri': fullDayName = 'Monday'; shortDayName = 'Mon'; daysToAdd = 3; break;
      case 'Sat': fullDayName = 'Monday'; shortDayName = 'Mon'; daysToAdd = 2; break;
      case 'Sun': fullDayName = 'Monday'; shortDayName = 'Mon'; daysToAdd = 1; break;
      default: return { full: 'Next Game', short: 'Next' };
    }

    istDate.setDate(istDate.getDate() + daysToAdd);
    const targetDateNum = istDate.getDate();
    const targetMonthStr = istDate.toLocaleString('en-US', { month: 'short' });

    return { 
      full: `${fullDayName} (${targetDateNum} ${targetMonthStr})`, 
      short: shortDayName 
    };
  };
  const targetDay = getTargetGameDay();

  const handleJoinPrompt = () => {
    if (isRegistrationBlocked) {
      alert("Registration is closed from Midnight to 7:00 AM IST on weekdays.");
      return;
    }
    const name = window.prompt("Enter your name:");
    if (name && name.trim()) {
      const newPlayers = [...allPlayers, { id: Date.now().toString(), name: name.trim(), joinedAt: Date.now() }];
      setAllPlayers(newPlayers);
      setMatchup(null);
      setTeamsFinalized(false);
      updateGameState({ all_players: newPlayers, matchup: null, teams_finalized: false });
      
      setTimeout(() => {
        const listElement = document.querySelector('.player-list');
        if (listElement) {
          listElement.scrollTop = listElement.scrollHeight;
        }
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 50);
    }
  };

  const handleRemove = (idToRemove, name) => {
    if (window.confirm(`Are you sure you want to remove ${name} from the roster?`)) {
      const newPlayers = allPlayers.filter(p => p.id !== idToRemove);
      setAllPlayers(newPlayers);
      setMatchup(null);
      setTeamsFinalized(false);
      updateGameState({ all_players: newPlayers, matchup: null, teams_finalized: false });
    }
  };

  const generateTeams = () => {
    const shuffled = [...confirmedPlayers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      // eslint-disable-next-line react-hooks/purity
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const mid = Math.ceil(shuffled.length / 2);
    const teamA = shuffled.slice(0, mid);
    const teamB = shuffled.slice(mid);

    const initialTheme = 'rb';
    const colors = initialTheme === 'bw' ? ['Black', 'White'] : ['Red', 'Blue'];
    const colorHex = initialTheme === 'bw' ? ['#0f172a', '#ffffff'] : ['#ef4444', '#3b82f6'];

    const newMatchup = {
      theme: initialTheme,
      gameDay: targetDay.full,
      teamA: { id: 'teamA', name: `Team ${colors[0]}`, colorCode: colorHex[0], players: teamA },
      teamB: { id: 'teamB', name: `Team ${colors[1]}`, colorCode: colorHex[1], players: teamB }
    };
    setMatchup(newMatchup);
    setTeamsFinalized(false);
    setViewMode('matchup');
    setHasUnsavedChanges(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 10);
  };

  const toggleColors = () => {
    if (!matchup) return;
    const newTheme = matchup.theme === 'bw' ? 'rb' : 'bw';
    const colors = newTheme === 'bw' ? ['Black', 'White'] : ['Red', 'Blue'];
    const colorHex = newTheme === 'bw' ? ['#0f172a', '#ffffff'] : ['#ef4444', '#3b82f6'];
    
    const newMatchup = {
      ...matchup,
      theme: newTheme,
      teamA: { ...matchup.teamA, name: `Team ${colors[0]}`, colorCode: colorHex[0] },
      teamB: { ...matchup.teamB, name: `Team ${colors[1]}`, colorCode: colorHex[1] }
    };
    setMatchup(newMatchup);
    setHasUnsavedChanges(true);
  };

  const handleShare = async () => {
    setIsSharing(true);
    setTeamsFinalized(true);
    setHasUnsavedChanges(false);
    updateGameState({ matchup: matchup, teams_finalized: true });
    
    try {
      const captureArea = document.getElementById('matchup-capture-area');
      if (!captureArea) throw new Error('Capture area not found');

      const canvas = await html2canvas(captureArea, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Canvas to Blob failed');
        
        const file = new File([blob], 'football-matchup.png', { type: 'image/png' });
        
        // Try native file sharing (Safari iOS, Chrome Android, Brave)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Weekday Football Matchup',
              text: 'Here are the finalized teams!'
            });
          } catch (err) {
            console.log('Share dismissed:', err);
          }
          setIsAdmin(false);
          setHasUnsavedChanges(false);
          setViewMode('roster');
        } else {
          // Fallback: Show image directly on the page so user can save it
          const imageUrl = URL.createObjectURL(blob);
          setSavedImageUrl(imageUrl);
          setIsAdmin(false);
          setHasUnsavedChanges(false);
          setViewMode('image');
        }
        
        setIsSharing(false);
      }, 'image/png');

    } catch (err) {
      console.error('Error generating image:', err);
      alert('Failed to generate image. Please try again.');
      setIsSharing(false);
    }
  };

  // Drag and Drop Logic
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const findContainer = (id) => {
      if (matchup.teamA.players.find(p => p.id === id)) return 'teamA';
      if (matchup.teamB.players.find(p => p.id === id)) return 'teamB';
      if (id === 'teamA' || id === 'teamB') return id;
      return null;
    };

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setMatchup((prev) => {
      const activeItems = [...prev[activeContainer].players];
      const overItems = [...prev[overContainer].players];
      const activeIndex = activeItems.findIndex(p => p.id === activeId);
      const overIndex = overId === overContainer ? overItems.length : overItems.findIndex(p => p.id === overId);

      const item = activeItems[activeIndex];
      activeItems.splice(activeIndex, 1);
      overItems.splice(overIndex, 0, item);

      return {
        ...prev,
        [activeContainer]: { ...prev[activeContainer], players: activeItems },
        [overContainer]: { ...prev[overContainer], players: overItems }
      };
    });
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    setMatchup((prev) => {
      const activeId = active.id;
      const overId = over.id;

      const findContainer = (id, state) => {
        if (state.teamA.players.find(p => p.id === id)) return 'teamA';
        if (state.teamB.players.find(p => p.id === id)) return 'teamB';
        return null;
      };

      const activeContainer = findContainer(activeId, prev);
      const overContainer = findContainer(overId, prev);

      if (!activeContainer || !overContainer || activeContainer !== overContainer) {
        setHasUnsavedChanges(true);
        return prev;
      }

      const activeIndex = prev[activeContainer].players.findIndex(p => p.id === activeId);
      const overIndex = prev[overContainer].players.findIndex(p => p.id === overId);

      if (activeIndex !== overIndex) {
        const items = [...prev[activeContainer].players];
        const item = items[activeIndex];
        items.splice(activeIndex, 1);
        items.splice(overIndex, 0, item);
        const finalMatchup = {
          ...prev,
          [activeContainer]: { ...prev[activeContainer], players: items }
        };
        setHasUnsavedChanges(true);
        return finalMatchup;
      }

      setHasUnsavedChanges(true);
      return prev;
    });
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleBackClick = async () => {
    if (hasUnsavedChanges) {
      if (window.confirm("You haven't clicked 'Finalize & Share' yet.\n\nAre you sure you want to go back? Your current team layout will be lost.")) {
        setHasUnsavedChanges(false);
        // Revert to master state from DB
        const { data } = await supabase.from('game_state').select('matchup').eq('id', 1).single();
        if (data) setMatchup(data.matchup);
        setIsAdmin(false);
        setViewMode('roster');
      }
    } else {
      setIsAdmin(false);
      setViewMode('roster');
    }
  };

  const getToggleProps = () => {
    if (!matchup) return {};
    if (matchup.theme === 'bw') {
      return {
        text: 'Red vs Blue',
        style: { color: '#ef4444', borderColor: '#ef4444' }
      };
    } else {
      return {
        text: 'Black vs White',
        style: { color: '#0f172a', borderColor: '#0f172a' }
      };
    }
  };

  const toggleProps = getToggleProps();

  const getActivePlayerInfo = (id) => {
    if (!matchup) return null;
    let idx = matchup.teamA.players.findIndex(p => p.id === id);
    if (idx !== -1) return { player: matchup.teamA.players[idx], index: idx, teamColor: matchup.teamA.colorCode, teamName: matchup.teamA.name };
    idx = matchup.teamB.players.findIndex(p => p.id === id);
    if (idx !== -1) return { player: matchup.teamB.players[idx], index: idx, teamColor: matchup.teamB.colorCode, teamName: matchup.teamB.name };
    return null;
  };

  const activeInfo = activeId ? getActivePlayerInfo(activeId) : null;

  return (
    <div className="app-container">
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

      <main className="main-content">
        {viewMode === 'image' && savedImageUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6 }}>
              <p style={{ fontWeight: 600, color: '#f8fafc', fontSize: '1.1rem', marginBottom: '0.5rem' }}>📸 Team image generated!</p>
              <p><strong>Long-press</strong> the image below → <strong>Save to Photos</strong></p>
              <p>Then share it on WhatsApp from your gallery.</p>
            </div>
            <img 
              src={savedImageUrl} 
              alt="Finalized Teams" 
              style={{ width: '100%', maxWidth: '500px', borderRadius: '12px', border: '2px solid rgba(148, 163, 184, 0.2)' }} 
            />
            <button 
              className="action-btn secondary" 
              onClick={() => { setSavedImageUrl(null); setViewMode('roster'); }} 
              style={{ width: 'fit-content', padding: '0.75rem 2rem', marginTop: '0.5rem' }}
            >
              ✓ Done
            </button>
          </div>
        ) : (displayMode === 'matchup' && matchup) ? (
          <div className="matchup-container">
            <div className="matchup-header-actions" style={{ marginTop: '-0.25rem', marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="action-btn secondary" onClick={handleBackClick} style={{ width: 'fit-content', padding: '0.6rem 1rem', fontSize: '1rem', marginTop: 0 }}>
                <ArrowLeft size={18} /> Back
              </button>
              {isAdmin && (
                <button className="action-btn secondary" onClick={toggleColors} style={{ width: 'fit-content', padding: '0.6rem 1rem', fontSize: '1rem', marginTop: 0, gap: '0.25rem', ...toggleProps.style }}>
                  <Palette size={18} /> {toggleProps.text}
                </button>
              )}
            </div>
            
            <DndContext sensors={isAdmin ? sensors : []} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
              <div id="matchup-capture-area" style={{ background: 'linear-gradient(to bottom, #1e293b, #0f172a)', padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '0 -0.5rem' }}>
                <div style={{ textAlign: 'center', color: '#f8fafc', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '-0.25rem', marginBottom: '-0.75rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  Game On: {matchup.gameDay || targetDay.full}
                </div>
                <div className="team-card" style={{ '--team-color': matchup.teamA.colorCode }}>
                  <div className="team-header">
                    <h2 className="team-name" style={{ 
                      color: matchup.teamA.colorCode,
                      textShadow: matchup.teamA.name === 'Team White' ? '-1px -1px 0 #0f172a, 1px -1px 0 #0f172a, -1px 1px 0 #0f172a, 1px 1px 0 #0f172a, 0 2px 4px rgba(0,0,0,0.5)' : 'none'
                    }}>
                    {matchup.teamA.name}
                  </h2>
                </div>
                <SortableContext items={matchup.teamA.players.map(p => p.id)} strategy={rectSortingStrategy}>
                  <div className="player-grid" id="teamA">
                    {matchup.teamA.players.map((player, idx) => (
                      <SortablePlayerItem key={player.id} player={player} index={idx} teamColor={matchup.teamA.colorCode} teamName={matchup.teamA.name} isAdmin={isAdmin} isCompact={true} />
                    ))}
                  </div>
                </SortableContext>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', margin: '-1rem 0', zIndex: 10 }}>
                  <div style={{ height: '3px', width: '130px', background: 'linear-gradient(to left, rgba(255,255,255,0.7), transparent)', transform: 'rotate(-8deg)', borderRadius: '4px' }}></div>
                  <div className="vs-badge">
                    <span>VS</span>
                  </div>
                  <div style={{ height: '3px', width: '130px', background: 'linear-gradient(to right, rgba(255,255,255,0.7), transparent)', transform: 'rotate(-8deg)', borderRadius: '4px' }}></div>
                </div>

                <div className="team-card" style={{ '--team-color': matchup.teamB.colorCode }}>
                <div className="team-header">
                  <h2 className="team-name" style={{ 
                    color: matchup.teamB.colorCode,
                    textShadow: matchup.teamB.name === 'Team White' ? '-1px -1px 0 #0f172a, 1px -1px 0 #0f172a, -1px 1px 0 #0f172a, 1px 1px 0 #0f172a, 0 2px 4px rgba(0,0,0,0.5)' : 'none'
                  }}>
                    {matchup.teamB.name}
                  </h2>
                </div>
                <SortableContext items={matchup.teamB.players.map(p => p.id)} strategy={rectSortingStrategy}>
                  <div className="player-grid" id="teamB">
                    {matchup.teamB.players.map((player, idx) => (
                      <SortablePlayerItem key={player.id} player={player} index={idx} teamColor={matchup.teamB.colorCode} teamName={matchup.teamB.name} isAdmin={isAdmin} isCompact={true} />
                    ))}
                  </div>
                </SortableContext>
              </div>

              {isAdmin && (
                <DragOverlay>
                  {activeInfo ? (
                    <PlayerItemVisual 
                      player={activeInfo.player} 
                      index={activeInfo.index} 
                      teamColor={activeInfo.teamColor} 
                      teamName={activeInfo.teamName} 
                      isOverlay={true} 
                      isAdmin={isAdmin}
                      isCompact={true}
                    />
                  ) : null}
                </DragOverlay>
              )}
              </div>
            </DndContext>

            {isAdmin && (
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: 0 }}>
                <button className="action-btn" onClick={handleShare} style={{ background: 'var(--success)', opacity: isSharing ? 0.5 : 1, boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)' }} disabled={isSharing}>
                  <Share2 size={20} /> {isSharing ? 'Generating Image...' : 'Finalize & Share Image'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '0.5rem' }}>
              <button 
                className="action-btn" 
                onClick={handleJoinPrompt} 
                disabled={isRegistrationBlocked}
                style={{ marginTop: 0, opacity: isRegistrationBlocked ? 0.5 : 1 }}
              >
                {isRegistrationBlocked ? 'Registration opens at 7:00 AM IST' : `Join Game for ${targetDay.full.split(' ')[0]}`}
              </button>
            </div>

            {waitlistPlayers.length > 0 && (
              <section className="card">
                <div className="card-header">
                  <h2 className="card-title">
                    <ShieldAlert size={24} style={{ color: 'var(--warning)' }} />
                    Waitlist
                  </h2>
                  <span className="badge" style={{ background: 'rgba(217, 119, 6, 0.15)', color: 'var(--warning)' }}>
                    {waitlistPlayers.length}
                  </span>
                </div>
                
                <div className="player-list">
                  {waitlistPlayers.map((player, index) => (
                    <div key={player.id} className="player-item" style={{ opacity: 0.85 }}>
                      <div className="player-info">
                        <span className="player-number" style={{ fontSize: '0.75rem' }}>WL{index + 1}</span>
                        <div className="player-details">
                          <span className="player-name">{player.name}</span>
                        </div>
                      </div>
                      <button onClick={() => handleRemove(player.id, player.name)} className="remove-btn" title="Remove Player">
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="card">
              <div className="card-header">
                <h2 className="card-title">
                  <Users size={24} />
                  Confirmed - {targetDay.short}
                </h2>
                <span 
                  className="badge"
                  style={confirmedPlayers.length === capacity ? { background: 'var(--accent-primary)', color: 'white', boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)' } : {}}
                >
                  {confirmedPlayers.length} / {capacity}
                  {capacity === 10 && ' (5v5)'}
                  {capacity === 14 && ' (7v7)'}
                  {capacity === 18 && ' (9v9)'}
                </span>
              </div>
              
              <div className="player-list">
                {confirmedPlayers.length === 0 ? (
                  <p className="empty-state">No players confirmed yet.</p>
                ) : (
                  confirmedPlayers.map((player, index) => (
                    <div key={player.id} className="player-item">
                      <div className="player-info">
                        <span className="player-number">{index + 1}</span>
                        <div className="player-details">
                          <span className="player-name">{player.name}</span>
                          <span className="player-meta">
                            Joined at {formatTime(player.joinedAt)}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => handleRemove(player.id, player.name)} className="remove-btn" title="Remove Player">
                        <X size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {confirmedPlayers.length === capacity && (
                <button className="action-btn" onClick={handleMatchupAccess}>
                  {matchup ? (
                    <><ArrowRight size={20} /> View Matchup</>
                  ) : (
                    <><Zap size={20} /> Generate Teams</>
                  )}
                </button>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
