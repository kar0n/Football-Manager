import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const matchupStr = searchParams.get('matchup');
    
    if (!matchupStr) {
      return new Response('Missing matchup data', { status: 400 });
    }

    const matchup = JSON.parse(decodeURIComponent(matchupStr));
    const { teamA, teamB, gameDay } = matchup;

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#0f172a',
            padding: '40px',
            fontFamily: 'sans-serif',
            color: 'white',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
            <h1 style={{ fontSize: '60px', margin: '0 0 10px 0', fontWeight: 'bold' }}>Weekday Football</h1>
            <div style={{ fontSize: '32px', color: '#94a3b8' }}>{gameDay}</div>
          </div>

          {/* Teams Container */}
          <div style={{ display: 'flex', width: '100%', gap: '40px' }}>
            
            {/* Team A */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
                <h2 style={{ fontSize: '40px', margin: 0 }}>{teamA.name}</h2>
                <div style={{ width: '30px', height: '30px', borderRadius: '15px', backgroundColor: teamA.colorCode }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {teamA.players.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '16px 24px', borderRadius: '16px' }}>
                    <span style={{ width: '40px', height: '40px', borderRadius: '20px', backgroundColor: teamA.colorCode, color: teamA.name === 'Team White' ? '#0f172a' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', marginRight: '20px' }}>
                      {i + 1}
                    </span>
                    <span style={{ color: '#0f172a', fontSize: '28px', fontWeight: '500' }}>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team B */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
                <h2 style={{ fontSize: '40px', margin: 0 }}>{teamB.name}</h2>
                <div style={{ width: '30px', height: '30px', borderRadius: '15px', backgroundColor: teamB.colorCode }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {teamB.players.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '16px 24px', borderRadius: '16px' }}>
                    <span style={{ width: '40px', height: '40px', borderRadius: '20px', backgroundColor: teamB.colorCode, color: teamB.name === 'Team White' ? '#0f172a' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', marginRight: '20px' }}>
                      {i + 1}
                    </span>
                    <span style={{ color: '#0f172a', fontSize: '28px', fontWeight: '500' }}>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      ),
      {
        width: 1200,
        height: 1000,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response('Failed to generate image', { status: 500 });
  }
}
