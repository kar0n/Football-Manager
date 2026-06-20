import fs from 'fs';

let content = fs.readFileSync('src/App.jsx', 'utf8');

const targetLogic = `  const { hour, weekdayStr } = getISTDate();
  const gameDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const isRegistrationBlocked = !isAdmin && gameDays.includes(weekdayStr) && hour >= 0 && hour < 7;

  const getTargetGameDay = () => {
    switch(weekdayStr) {
      case 'Mon': return { full: 'Tuesday', short: 'Tue' };
      case 'Tue': return { full: 'Wednesday', short: 'Wed' };
      case 'Wed': return { full: 'Thursday', short: 'Thu' };
      case 'Thu': return { full: 'Friday', short: 'Fri' };
      case 'Fri': 
      case 'Sat': 
      case 'Sun': 
        return { full: 'Monday', short: 'Mon' };
      default: return { full: 'Next Game', short: 'Next' };
    }
  };
  const targetDay = getTargetGameDay();`;

content = content.replace(
`  const { hour, weekdayStr } = getISTDate();
  const gameDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const isRegistrationBlocked = !isAdmin && gameDays.includes(weekdayStr) && hour >= 0 && hour < 7;`,
  targetLogic
);

// Update Join Game button
const joinButtonOld = `{isRegistrationBlocked ? 'Registration opens at 7:00 AM IST' : 'Join Game'}`;
const joinButtonNew = `{isRegistrationBlocked ? 'Registration opens at 7:00 AM IST' : \`Join Game for \${targetDay.full}\`}`;

content = content.replace(joinButtonOld, joinButtonNew);

// Update Waitlist Title
const waitlistTitleOld = `<h2 className="card-title">
                    <ShieldAlert size={24} style={{ color: 'var(--warning)' }} />
                    Waitlist
                  </h2>`;
const waitlistTitleNew = `<h2 className="card-title">
                    <ShieldAlert size={24} style={{ color: 'var(--warning)' }} />
                    Waitlist - {targetDay.short}
                  </h2>`;

content = content.replace(waitlistTitleOld, waitlistTitleNew);

// Update Confirmed List Title
const confirmedTitleOld = `<h2 className="card-title">
                  <Users size={24} />
                  Confirmed List
                </h2>`;
const confirmedTitleNew = `<h2 className="card-title">
                  <Users size={24} />
                  Confirmed List - {targetDay.short}
                </h2>`;

content = content.replace(confirmedTitleOld, confirmedTitleNew);

fs.writeFileSync('src/App.jsx', content);
