import fs from 'fs';

let content = fs.readFileSync('src/App.jsx', 'utf8');

// The problematic block that was injected:
const injectedBlock = `  const [allPlayers, setAllPlayers] = useState([]);
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

// Extract it out
content = content.replace(injectedBlock, `  const [allPlayers, setAllPlayers] = useState([]);\n  const [newName, setNewName] = useState('');\n`);

// Locate the end of the state declarations
const endOfStates = content.indexOf(`  const totalPlayers = allPlayers.length;`);

// Re-insert the block after the state declarations
const before = content.slice(0, endOfStates);
const after = content.slice(endOfStates);

const fixedBlock = `  const updateGameState = async (updates) => {
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

content = before + fixedBlock + after;

fs.writeFileSync('src/App.jsx', content);
