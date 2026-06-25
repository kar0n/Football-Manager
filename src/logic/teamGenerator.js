/**
 * Team generation and theme toggling logic.
 * Pure functions — no React, no side effects.
 */
import { TEAM_THEMES, DEFAULT_THEME } from '../config/constants';

/**
 * Fisher-Yates shuffles the confirmed players and splits them into two teams.
 * Returns a complete matchup object ready to be stored in state.
 *
 * @param {Array} confirmedPlayers - the players to split
 * @param {string} gameDayLabel - e.g. "Tuesday (24 Jun)"
 * @returns {Object} matchup object with teamA, teamB, theme, gameDay
 */
export const generateTeams = (confirmedPlayers, gameDayLabel) => {
  const shuffled = [...confirmedPlayers];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const mid = Math.ceil(shuffled.length / 2);
  const teamA = shuffled.slice(0, mid);
  const teamB = shuffled.slice(mid);

  const theme = TEAM_THEMES[DEFAULT_THEME];

  return {
    theme: DEFAULT_THEME,
    gameDay: gameDayLabel,
    teamA: { id: 'teamA', name: `Team ${theme.names[0]}`, colorCode: theme.colors[0], players: teamA },
    teamB: { id: 'teamB', name: `Team ${theme.names[1]}`, colorCode: theme.colors[1], players: teamB },
  };
};

/**
 * Returns a new matchup object with the color theme toggled (bw ↔ rb).
 *
 * @param {Object} currentMatchup - the current matchup state
 * @returns {Object} new matchup with swapped theme
 */
export const toggleTheme = (currentMatchup) => {
  const newThemeKey = currentMatchup.theme === 'bw' ? 'rb' : 'bw';
  const theme = TEAM_THEMES[newThemeKey];

  return {
    ...currentMatchup,
    theme: newThemeKey,
    teamA: { ...currentMatchup.teamA, name: `Team ${theme.names[0]}`, colorCode: theme.colors[0] },
    teamB: { ...currentMatchup.teamB, name: `Team ${theme.names[1]}`, colorCode: theme.colors[1] },
  };
};

/**
 * Returns the toggle button label and style for the current theme.
 * Used by the color swap button in MatchupActions.
 */
export const getToggleProps = (matchup) => {
  if (!matchup) return {};
  if (matchup.theme === 'bw') {
    return {
      text: 'Red vs Blue',
      style: { color: '#ffffff', borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.85)' },
    };
  }
  return {
    text: 'Black vs White',
    style: { color: '#ffffff', borderColor: '#334155', background: 'rgba(30, 41, 59, 0.9)' },
  };
};
