import React from 'react';

interface Player {
  name: string;
}

interface PlayerListProps {
  players: Player[];
  owner: string;
  nickname: string;
  code: string;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, owner, nickname, code }) => {
  return (
    <div style={{
      position:'absolute',
      top:24,
      left:24,
      right:'auto',
      width:'auto',
      minWidth:'auto',
      maxWidth:'auto',
      padding:0,
      background:'none',
      border:'none',
      boxShadow:'none',
      backdropFilter:'none',
      zIndex:10,
      display:'flex',
      flexDirection:'column',
      alignItems:'flex-start',
    }}>
      <div style={{fontWeight: 900, fontSize: '1.5rem', color:'#ffd54f', letterSpacing:1, marginBottom:10, textShadow:'0 2px 12px #000a'}}>اللاعبون في الغرفة:</div>
      <ul style={{ paddingRight: 0, margin: 0, listStyle: 'none', width: 'auto' }}>
        {players.map((player, i) => (
          <li key={i} style={{background: 'none', fontWeight: 700, color: '#e0f7fa', textShadow: '0 2px 8px #000a', marginBottom: 0, padding: 0, display: 'block', boxShadow: 'none', border: 'none'}}>
            <span style={{color: player.name === nickname ? '#80cbc4' : '#e0f7fa', fontWeight:'bold', textShadow:'0 2px 8px #000a'}}>{player.name}</span>
            <div style={{display:'inline', marginLeft:'8px'}}>
              {owner === player.name && <span style={{fontSize:'0.9rem',fontWeight:700,color:'#ffd54f'}}>(صاحب الغرفة)</span>}
              {player.name === nickname && <span style={{fontSize:'0.9rem',fontWeight:700,color:'#00e6c3'}}>(أنت)</span>}
            </div>
          </li>
        ))}
      </ul>
      <div style={{marginTop: '10px', fontSize: '1.1rem', fontWeight: 700, color:'#ffd54f', textShadow:'0 2px 8px #000a'}}><span style={{color:'#ffd54f',fontWeight:700}}>كود الغرفة:</span> {code}</div>
    </div>
  );
};

export default PlayerList; 