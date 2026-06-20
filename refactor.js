import fs from 'fs';

let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add imports
content = content.replace(
  "import { useState } from 'react';",
  "import { useState, useEffect } from 'react';\nimport { supabase } from './supabaseClient';"
);

// 2. Change initial allPlayers and add updateGameState + useEffect
const stateTarget = `  const [allPlayers, setAllPlayers] = useState([`;
const stateIndex = content.indexOf(stateTarget);
const endOfMockData = content.indexOf(`  ]);\n  const [newName, setNewName] = useState('');`);

if (stateIndex !== -1 && endOfMockData !== -1) {
  const replacement = `  const [allPlayers, setAllPlayers] = useState([]);
  const [newName, setNewName] = useState('');

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
        setAllPlayers(data.all_players || []);
        setMatchup(data.matchup);
        setTeamsFinalized(data.teams_finalized || false);
      }
    };
    fetchState();

    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_state' }, (payload) => {
        setAllPlayers(payload.new.all_players || []);
        setMatchup(payload.new.matchup);
        setTeamsFinalized(payload.new.teams_finalized || false);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Auto-redirect non-admins when teams finalize
  useEffect(() => {
    if (matchup && teamsFinalized && !isAdmin) {
      setViewMode('matchup');
    } else if (!teamsFinalized && !isAdmin) {
      setViewMode('roster');
    }
  }, [teamsFinalized, isAdmin, matchup]);
`;
  content = content.slice(0, stateIndex) + replacement + content.slice(endOfMockData + `  ]);\n  const [newName, setNewName] = useState('');`.length);
}

// 3. handleJoinPrompt
content = content.replace(
  `setAllPlayers(prev => [...prev, { id: Date.now().toString(), name: name.trim(), joinedAt: Date.now() }]);\n      setMatchup(null);\n      setTeamsFinalized(false);`,
  `const newPlayers = [...allPlayers, { id: Date.now().toString(), name: name.trim(), joinedAt: Date.now() }];
      setAllPlayers(newPlayers);
      setMatchup(null);
      setTeamsFinalized(false);
      updateGameState({ all_players: newPlayers, matchup: null, teams_finalized: false });`
);

// 4. handleRemove
content = content.replace(
  `setAllPlayers(allPlayers.filter(p => p.id !== idToRemove));\n      setMatchup(null);\n      setTeamsFinalized(false);`,
  `const newPlayers = allPlayers.filter(p => p.id !== idToRemove);
      setAllPlayers(newPlayers);
      setMatchup(null);
      setTeamsFinalized(false);
      updateGameState({ all_players: newPlayers, matchup: null, teams_finalized: false });`
);

// 5. generateTeams
content = content.replace(
  `setMatchup({\n      theme: initialTheme,\n      teamA: { id: 'teamA', name: \`Team \${colors[0]}\`, colorCode: colorHex[0], players: teamA },\n      teamB: { id: 'teamB', name: \`Team \${colors[1]}\`, colorCode: colorHex[1], players: teamB }\n    });\n    \n    setTeamsFinalized(false);\n    setViewMode('matchup');`,
  `const newMatchup = {
      theme: initialTheme,
      teamA: { id: 'teamA', name: \`Team \${colors[0]}\`, colorCode: colorHex[0], players: teamA },
      teamB: { id: 'teamB', name: \`Team \${colors[1]}\`, colorCode: colorHex[1], players: teamB }
    };
    setMatchup(newMatchup);
    setTeamsFinalized(false);
    setViewMode('matchup');
    updateGameState({ matchup: newMatchup, teams_finalized: false });`
);

// 6. toggleColors
content = content.replace(
  `setMatchup({\n      ...matchup,\n      theme: newTheme,\n      teamA: { ...matchup.teamA, name: \`Team \${colors[0]}\`, colorCode: colorHex[0] },\n      teamB: { ...matchup.teamB, name: \`Team \${colors[1]}\`, colorCode: colorHex[1] }\n    });`,
  `const newMatchup = {
      ...matchup,
      theme: newTheme,
      teamA: { ...matchup.teamA, name: \`Team \${colors[0]}\`, colorCode: colorHex[0] },
      teamB: { ...matchup.teamB, name: \`Team \${colors[1]}\`, colorCode: colorHex[1] }
    };
    setMatchup(newMatchup);
    updateGameState({ matchup: newMatchup });`
);

// 7. handleShare
content = content.replace(
  `setTeamsFinalized(true);\n    \n    try {`,
  `setTeamsFinalized(true);\n    updateGameState({ teams_finalized: true });\n    \n    try {`
);

// 8. handleDragEnd
content = content.replace(
  `const items = [...prev[activeContainer].players];\n        const item = items[activeIndex];\n        items.splice(activeIndex, 1);\n        items.splice(overIndex, 0, item);\n        return {\n          ...prev,\n          [activeContainer]: { ...prev[activeContainer], players: items }\n        };`,
  `const items = [...prev[activeContainer].players];
        const item = items[activeIndex];
        items.splice(activeIndex, 1);
        items.splice(overIndex, 0, item);
        const finalMatchup = {
          ...prev,
          [activeContainer]: { ...prev[activeContainer], players: items }
        };
        updateGameState({ matchup: finalMatchup });
        return finalMatchup;`
);

// 9. Protect non-admins from seeing unfinalized matchups
content = content.replace(
  `{viewMode === 'matchup' && matchup ? (`,
  `{(viewMode === 'matchup' && matchup && (isAdmin || teamsFinalized)) ? (`
);

fs.writeFileSync('src/App.jsx', content);
console.log("App.jsx updated successfully.");
