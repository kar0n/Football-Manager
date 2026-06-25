/**
 * IST timezone utilities.
 * These are pure functions — no React, no side effects.
 */

/**
 * Returns the current date string, hour, and weekday abbreviation in IST.
 * Used for rollover checks, registration blocking, and game day calculation.
 */
export const getISTDate = () => {
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
    weekdayStr,
  };
};

/**
 * Given the current IST weekday abbreviation, returns the next game day
 * label (e.g. "Tuesday (24 Jun)") and short name (e.g. "Tue").
 */
export const getTargetGameDay = (weekdayStr) => {
  const opts = { timeZone: 'Asia/Kolkata' };
  const now = new Date();
  const year = parseInt(now.toLocaleString('en-US', { ...opts, year: 'numeric' }));
  const month = parseInt(now.toLocaleString('en-US', { ...opts, month: 'numeric' })) - 1;
  const day = parseInt(now.toLocaleString('en-US', { ...opts, day: 'numeric' }));
  const istDate = new Date(year, month, day);

  let daysToAdd = 1;
  let fullDayName = '';
  let shortDayName = '';

  switch (weekdayStr) {
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
    short: shortDayName,
  };
};

/**
 * Checks if a given timestamp falls on the current day in IST.
 */
export const isTodayIST = (timestamp) => {
  const opts = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
  const todayStr = new Date().toLocaleString('en-US', opts);
  const tsStr = new Date(timestamp).toLocaleString('en-US', opts);
  return todayStr === tsStr;
};

/**
 * Formats a Unix timestamp into a human-readable time string (e.g. "07:32:15 AM").
 */
export const formatTime = (timestamp) => {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};
