import './App.css';
import { useGameState } from './hooks/useGameState';
import { useBoundaryTimer } from './hooks/useBoundaryTimer';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { JoinButton } from './components/roster/JoinButton';
import { ConfirmedList } from './components/roster/ConfirmedList';
import { WaitlistCard } from './components/roster/WaitlistCard';
import { MatchupBoard } from './components/matchup/MatchupBoard';
import { MatchupToolbar, FinalizeButton } from './components/matchup/MatchupActions';
import { ImagePreview } from './components/ImagePreview';

function App() {
  const {
    // State
    matchup,
    activeId,
    viewMode,
    isSharing,
    savedImageUrl,
    showToast,
    isAdmin,
    teamsFinalized,
    isRegistrationBlocked,

    // Derived
    targetDay,
    capacity,
    confirmedPlayers,
    waitlistPlayers,
    toggleProps,

    // Drag handlers
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,

    // Mutations
    handleMatchupAccess,
    handleJoinPrompt,
    handleRemove,
    handleToggleColors,
    handleShare,
    handleBackClick,
    handleImageDone,
  } = useGameState();

  // Force an instant page refresh at exact IST boundaries (Midnight and 7:00 AM)
  useBoundaryTimer();

  const displayMode = viewMode;

  return (
    <div className="app-container">
      {/* Success Toast */}
      <Toast message="Teams finalized successfully!" visible={showToast} />

      <Header />

      <main className="main-content">
        {viewMode === 'image' && savedImageUrl ? (
          <ImagePreview savedImageUrl={savedImageUrl} onDone={handleImageDone} />
        ) : (displayMode === 'matchup' && matchup) ? (
          <div className="matchup-container">
            <MatchupToolbar
              isAdmin={isAdmin}
              toggleProps={toggleProps}
              onBack={handleBackClick}
              onToggleColors={handleToggleColors}
            />

            <MatchupBoard
              matchup={matchup}
              targetDay={targetDay}
              isAdmin={isAdmin}
              activeId={activeId}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              onDragCancel={onDragCancel}
            />

            {isAdmin && (
              <FinalizeButton isSharing={isSharing} onShare={handleShare} />
            )}
          </div>
        ) : (
          <>
            <JoinButton
              isRegistrationBlocked={isRegistrationBlocked}
              targetDay={targetDay}
              onJoin={handleJoinPrompt}
            />

            <WaitlistCard
              waitlistPlayers={waitlistPlayers}
              onRemove={handleRemove}
            />

            <ConfirmedList
              confirmedPlayers={confirmedPlayers}
              capacity={capacity}
              targetDay={targetDay}
              matchup={matchup}
              onRemove={handleRemove}
              onMatchupAccess={handleMatchupAccess}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
