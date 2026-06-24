import { useState, useEffect, useRef, useMemo } from 'react';
import { getISTDate, getTargetGameDay } from '../utils/time';
import { getDeviceId } from '../utils/device';
import {
  fetchGameState,
  fetchMatchupState,
  fetchPlayerState,
  fetchMatchupOnly,
  updateGameState,
  addPlayer as addPlayerRpc,
  removePlayer as removePlayerRpc,
  logActivity,
  subscribeToChanges,
} from '../services/gameService';
import { generateTeams as generateTeamsLogic, toggleTheme, getToggleProps } from '../logic/teamGenerator';
import { createDragHandlers } from '../logic/dragHandlers';
import { GAME_DAYS, REGISTRATION_BLOCKED_START, REGISTRATION_BLOCKED_END, ADMIN_PASSWORD, CAPACITY_THRESHOLDS } from '../config/constants';
import html2canvas from 'html2canvas';

/**
 * The main orchestrator hook.
 * Owns all application state, realtime subscriptions, and mutation functions.
 * Returns everything the UI components need as a flat object.
 */
export const useGameState = () => {
  // --- Core State ---
  const [allPlayers, setAllPlayers] = useState([]);
  const [matchup, setMatchup] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [viewMode, setViewMode] = useState('roster'); // 'roster' | 'matchup' | 'image'
  const [isSharing, setIsSharing] = useState(false);
  const [savedImageUrl, setSavedImageUrl] = useState(null);
  const [showToast, setShowToast] = useState(false);

  // --- Admin State ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [teamsFinalized, setTeamsFinalized] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasUnsavedChangesRef = useRef(false);

  // Keep the ref in sync with state (needed by event handlers that close over stale values)
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Warn on browser close if there are unsaved changes
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



  // --- Initial Fetch + Realtime + Visibility Listener ---
  useEffect(() => {
    const fetchState = async () => {
      const data = await fetchGameState();
      if (data) {
        let currentPlayers = data.all_players || [];

        // --- LAZY ROLLOVER LOGIC ---
        // Runs once on the first page load of a new day.
        const { dateString, weekdayStr } = getISTDate();
        if (data.last_rollover_date && dateString > data.last_rollover_date) {
          if (GAME_DAYS.includes(weekdayStr)) {
            if (data.teams_finalized && data.matchup) {
              // Teams were finalized yesterday — carry forward ONLY the players
              // from the actual finalized matchup (teamA + teamB).
              const matchupPlayers = [
                ...data.matchup.teamA.players,
                ...data.matchup.teamB.players,
              ];
              currentPlayers = matchupPlayers;
            } else {
              // No finalized matchup — just truncate waitlist
              const cap = (currentPlayers.length >= CAPACITY_THRESHOLDS.LARGE) ? CAPACITY_THRESHOLDS.LARGE
                : (currentPlayers.length >= CAPACITY_THRESHOLDS.MEDIUM ? CAPACITY_THRESHOLDS.MEDIUM : CAPACITY_THRESHOLDS.DEFAULT);
              currentPlayers = currentPlayers.slice(0, cap);
            }
          }
          // Clear matchup for the new day and update rollover date
          updateGameState({
            all_players: currentPlayers,
            matchup: null,
            teams_finalized: false,
            last_rollover_date: dateString,
          });
        } else if (!data.last_rollover_date) {
          // Initialize tracking if it doesn't exist
          updateGameState({ last_rollover_date: dateString });
        }

        setAllPlayers(currentPlayers);
        setMatchup(data.matchup);
        setTeamsFinalized(data.teams_finalized || false);
      }
    };
    fetchState();

    // Realtime subscription
    const unsubscribe = subscribeToChanges((payload) => {
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
    });

    // Re-fetch state when the browser tab becomes active, window gains focus, or network returns.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchState();
      }
    };
    const handleFocus = () => fetchState();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
    };
  }, []);

  // --- Derived Values ---
  const { hour, weekdayStr } = getISTDate();
  const isRegistrationBlocked = !isAdmin && GAME_DAYS.includes(weekdayStr) && hour >= REGISTRATION_BLOCKED_START && hour < REGISTRATION_BLOCKED_END;
  const targetDay = getTargetGameDay(weekdayStr);

  const totalPlayers = allPlayers.length;
  let capacity = CAPACITY_THRESHOLDS.DEFAULT;
  if (totalPlayers >= CAPACITY_THRESHOLDS.LARGE) capacity = CAPACITY_THRESHOLDS.LARGE;
  else if (totalPlayers >= CAPACITY_THRESHOLDS.MEDIUM) capacity = CAPACITY_THRESHOLDS.MEDIUM;

  const confirmedPlayers = allPlayers.slice(0, capacity);
  const waitlistPlayers = allPlayers.slice(capacity);
  const toggleProps = getToggleProps(matchup);

  // --- Drag Handlers ---
  const dragHandlers = useMemo(
    () => createDragHandlers(setMatchup, setHasUnsavedChanges, setActiveId),
    []
  );

  // --- Mutation Functions ---

  const handleMatchupAccess = async () => {
    const pwd = window.prompt("Enter admin password:");
    if (pwd === ADMIN_PASSWORD) {
      setIsAdmin(true);
      await logActivity('admin_login', getDeviceId());
      const data = await fetchMatchupState();
      if (data && data.matchup) {
        setMatchup(data.matchup);
        setTeamsFinalized(data.teams_finalized || false);
        setViewMode('matchup');
      } else {
        handleGenerateTeams();
      }
    } else if (pwd !== null) {
      alert("Incorrect password");
    }
  };

  const handleJoinPrompt = async () => {
    if (isRegistrationBlocked) {
      alert("Registration is closed from Midnight to 7:00 AM IST on weekdays.");
      return;
    }
    const name = window.prompt("Enter your name:");
    if (name && name.trim()) {
      // Re-evaluate the time block AFTER the prompt.
      const current = getISTDate();
      const stillBlocked = !isAdmin && GAME_DAYS.includes(current.weekdayStr) && current.hour >= REGISTRATION_BLOCKED_START && current.hour < REGISTRATION_BLOCKED_END;

      if (stillBlocked) {
        alert("Registration is closed from Midnight to 7:00 AM IST on weekdays.");
        return;
      }

      const playerData = { id: Date.now().toString(), name: name.trim(), joinedAt: Date.now() };
      const { error } = await addPlayerRpc(playerData, getDeviceId());
      if (error) {
        console.error('Error adding player:', error);
        alert('Failed to join. Please try again.');
        return;
      }

      const data = await fetchPlayerState();
      if (data) {
        setAllPlayers(data.all_players || []);
        setMatchup(data.matchup);
        setTeamsFinalized(data.teams_finalized || false);
      }

      setTimeout(() => {
        const listElement = document.querySelector('.player-list');
        if (listElement) {
          listElement.scrollTop = listElement.scrollHeight;
        }
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 50);
    }
  };

  const handleRemove = async (idToRemove, name) => {
    if (window.confirm(`Are you sure you want to remove ${name} from the roster?`)) {
      const { error } = await removePlayerRpc(idToRemove, getDeviceId());
      if (error) {
        console.error('Error removing player:', error);
        alert('Failed to remove player. Please try again.');
        return;
      }

      const data = await fetchPlayerState();
      if (data) {
        setAllPlayers(data.all_players || []);
        setMatchup(data.matchup);
        setTeamsFinalized(data.teams_finalized || false);
      }
    }
  };

  const handleGenerateTeams = () => {
    const newMatchup = generateTeamsLogic(confirmedPlayers, targetDay.full);
    setMatchup(newMatchup);
    setTeamsFinalized(false);
    setViewMode('matchup');
    setHasUnsavedChanges(true);
    logActivity('generate_teams', getDeviceId());
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 10);
  };

  const handleToggleColors = () => {
    if (!matchup) return;
    setMatchup(toggleTheme(matchup));
    setHasUnsavedChanges(true);
    logActivity('toggle_colors', getDeviceId());
  };

  const handleShare = async () => {
    setIsSharing(true);
    setTeamsFinalized(true);
    setHasUnsavedChanges(false);
    await updateGameState({ matchup: matchup, teams_finalized: true });

    await logActivity('finalize', getDeviceId());

    // Show success toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

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

        // --- Belt-and-suspenders Web Share API strategy ---
        //
        // Chrome (CriOS) and Firefox (FxiOS) on iOS are WebKit wrappers that
        // falsely report navigator.canShare === true for files, but Apple's sandbox
        // blocks the actual share() call. Worse, they throw an unpredictable
        // AbortError or NotAllowedError — indistinguishable from a user cancel.
        // So we skip the API entirely for these browsers and go straight to the
        // manual save fallback, rather than playing error-guessing games.
        const ua = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
        const isBrokenIOSBrowser = isIOS && (/CriOS/i.test(ua) || /FxiOS/i.test(ua));

        if (!isBrokenIOSBrowser && navigator.canShare && navigator.canShare({ files: [file] })) {
          // Browser genuinely supports file sharing — try the native share sheet
          try {
            await navigator.share({
              files: [file],
              title: 'Weekday Football Matchup',
              text: 'Here are the finalized teams!',
            });
            // Share sheet was shown and user either shared or dismissed it
            setIsAdmin(false);
            setHasUnsavedChanges(false);
            setViewMode('roster');
          } catch (err) {
            if (err.name === 'AbortError') {
              // User explicitly cancelled the share sheet — go home normally
              setIsAdmin(false);
              setHasUnsavedChanges(false);
              setViewMode('roster');
            } else {
              // Unexpected API failure on a browser that claimed it could share
              // Route to the manual fallback rather than stranding the user
              console.warn('Unexpected share failure, falling back to image view:', err);
              const imageUrl = URL.createObjectURL(blob);
              setSavedImageUrl(imageUrl);
              setIsAdmin(false);
              setHasUnsavedChanges(false);
              setViewMode('image');
            }
          }
        } else {
          // Browser explicitly can't share files, OR it's a known broken iOS wrapper —
          // skip the gamble entirely and go straight to the manual save view
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

  const handleBackClick = async () => {
    if (hasUnsavedChanges) {
      if (window.confirm("You haven't clicked 'Finalize & Share' yet.\n\nAre you sure you want to go back? Your current team layout will be lost.")) {
        setHasUnsavedChanges(false);
        const data = await fetchMatchupOnly();
        if (data) setMatchup(data.matchup);
        setIsAdmin(false);
        setViewMode('roster');
      }
    } else {
      setIsAdmin(false);
      setViewMode('roster');
    }
  };

  const handleImageDone = () => {
    setSavedImageUrl(null);
    setViewMode('roster');
  };

  // --- Public API ---
  return {
    // State
    allPlayers,
    matchup,
    activeId,
    viewMode,
    isSharing,
    savedImageUrl,
    showToast,
    isAdmin,
    teamsFinalized,
    hasUnsavedChanges,
    isRegistrationBlocked,

    // Derived
    targetDay,
    capacity,
    confirmedPlayers,
    waitlistPlayers,
    toggleProps,

    // Drag handlers
    ...dragHandlers,

    // Mutations
    handleMatchupAccess,
    handleJoinPrompt,
    handleRemove,
    handleGenerateTeams,
    handleToggleColors,
    handleShare,
    handleBackClick,
    handleImageDone,
  };
};
