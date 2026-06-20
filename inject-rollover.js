import fs from 'fs';

let content = fs.readFileSync('src/App.jsx', 'utf8');

const getISTDateStr = `const getISTDate = () => {
  const opts = { timeZone: 'Asia/Kolkata' };
  const d = new Date();
  const year = d.toLocaleString('en-US', { ...opts, year: 'numeric' });
  const month = d.toLocaleString('en-US', { ...opts, month: '2-digit' });
  const day = d.toLocaleString('en-US', { ...opts, day: '2-digit' });
  const hour = parseInt(d.toLocaleString('en-US', { ...opts, hour: 'numeric', hourCycle: 'h23' }), 10);
  const weekdayStr = d.toLocaleString('en-US', { ...opts, weekday: 'short' }); 
  
  return { 
    dateString: \`\${year}-\${month}-\${day}\`, 
    hour, 
    weekdayStr 
  };
};

function App() {`;

content = content.replace(`function App() {`, getISTDateStr);

const fetchStateReplacement = `    const fetchState = async () => {
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
        }
        // ---------------------------

        setAllPlayers(currentPlayers);
        setMatchup(data.matchup);
        setTeamsFinalized(data.teams_finalized || false);
      }
    };`;

content = content.replace(
  `    const fetchState = async () => {
      const { data, error } = await supabase.from('game_state').select('*').eq('id', 1).single();
      if (data) {
        setAllPlayers(data.all_players || []);
        setMatchup(data.matchup);
        setTeamsFinalized(data.teams_finalized || false);
      }
    };`,
  fetchStateReplacement
);

const joinButtonLogic = `  const { hour, weekdayStr } = getISTDate();
  const gameDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const isRegistrationBlocked = !isAdmin && gameDays.includes(weekdayStr) && hour >= 0 && hour < 7;

  return (`;

content = content.replace(`  return (`, joinButtonLogic);

const joinButtonUI = `            <div style={{ marginBottom: '0.5rem' }}>
              <button 
                className="action-btn" 
                onClick={handleJoinPrompt} 
                disabled={isRegistrationBlocked}
                style={{ marginTop: 0, opacity: isRegistrationBlocked ? 0.5 : 1 }}
              >
                {isRegistrationBlocked ? 'Registration opens at 7:00 AM IST' : 'Join Game'}
              </button>
            </div>`;

content = content.replace(
  `            <div style={{ marginBottom: '0.5rem' }}>
              <button className="action-btn" onClick={handleJoinPrompt} style={{ marginTop: 0 }}>
                Join Game
              </button>
            </div>`,
  joinButtonUI
);

// We should also protect handleJoinPrompt just in case
const handleJoinPromptProtection = `  const handleJoinPrompt = () => {
    if (isRegistrationBlocked) {
      alert("Registration is closed from Midnight to 7:00 AM IST on weekdays.");
      return;
    }`;

content = content.replace(`  const handleJoinPrompt = () => {`, handleJoinPromptProtection);


fs.writeFileSync('src/App.jsx', content);
