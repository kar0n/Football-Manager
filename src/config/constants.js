/**
 * Application-wide constants.
 * Every hardcoded value from the monolithic App.jsx lives here.
 */

// The admin password used to gate access to the matchup screen.
export const ADMIN_PASSWORD = 'admin';

// Weekdays when games are played (Mon–Fri).
export const GAME_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Registration is blocked between these IST hours on game days.
export const REGISTRATION_BLOCKED_START = 0;  // midnight
export const REGISTRATION_BLOCKED_END = 7;    // 7:00 AM

// Capacity thresholds — the confirmed list caps at these sizes.
// When total players >= threshold, the format upgrades.
export const CAPACITY_THRESHOLDS = {
  DEFAULT: 10,   // 5v5
  MEDIUM: 14,    // 7v7
  LARGE: 18,     // 9v9
};

// Team color themes used in matchup generation and toggling.
export const TEAM_THEMES = {
  bw: {
    names: ['Black', 'White'],
    colors: ['#0f172a', '#ffffff'],
  },
  rb: {
    names: ['Red', 'Blue'],
    colors: ['#ef4444', '#3b82f6'],
  },
};

// The default theme applied when generating a fresh matchup.
export const DEFAULT_THEME = 'rb';

// Supabase game_state row ID (single-row table pattern).
export const GAME_STATE_ROW_ID = 1;
