import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { getISTDate } from '../../utils/timeUtils';

export const JoinButton = ({ isAdmin, addPlayer, disabled }) => {
  const [isJoining, setIsJoining] = useState(false);

  const { hour, weekdayStr } = getISTDate();
  const gameDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const isRegistrationBlocked = !isAdmin && gameDays.includes(weekdayStr) && hour >= 0 && hour < 7;

  const handleJoinClick = async () => {
    if (isRegistrationBlocked) {
      alert("Registration is closed from Midnight to 7:00 AM IST on weekdays.");
      return;
    }
    const name = window.prompt("Enter your name:");
    if (name && name.trim()) {
      const current = getISTDate();
      const stillBlocked = !isAdmin && ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(current.weekdayStr) && current.hour >= 0 && current.hour < 7;
      
      if (stillBlocked) {
        alert("Registration is closed from Midnight to 7:00 AM IST on weekdays.");
        return;
      }

      setIsJoining(true);
      const playerData = { id: Date.now().toString(), name: name.trim(), joinedAt: Date.now() };
      
      try {
        await addPlayer(playerData);
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 50);
      } catch (err) {
        console.error(err);
        alert('Failed to join. Please try again.');
      } finally {
        setIsJoining(false);
      }
    }
  };

  return (
    <div className="join-container" style={{ position: 'relative', background: 'transparent', padding: 0, boxShadow: 'none', border: 'none' }}>
      <button 
        onClick={handleJoinClick} 
        disabled={disabled || isJoining}
        className="join-btn action-btn"
        style={{ width: '100%', padding: '1rem', borderRadius: '12px' }}
      >
        <Zap size={20} className={isJoining ? 'animate-pulse' : ''} />
        {isJoining ? 'Joining...' : isRegistrationBlocked ? 'Registration Opens at 7 AM' : 'Join Game'}
      </button>
    </div>
  );
};
