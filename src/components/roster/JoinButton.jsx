/**
 * The "Join Game" call-to-action button.
 * Renders the exact same JSX as App.jsx lines 832–841.
 */
export const JoinButton = ({ isRegistrationBlocked, targetDay, onJoin }) => {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <button
        className="action-btn"
        onClick={onJoin}
        disabled={isRegistrationBlocked}
        style={{ marginTop: 0, opacity: isRegistrationBlocked ? 0.5 : 1 }}
      >
        {isRegistrationBlocked
          ? 'Registration opens at 7:00 AM IST'
          : `Join Game for ${targetDay.full}`}
      </button>
    </div>
  );
};
