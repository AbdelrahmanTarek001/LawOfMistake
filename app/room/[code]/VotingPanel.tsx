import React from 'react';
import ReactCardFlip from 'react-card-flip';
// تعريف Player محلياً
interface Player {
  name: string;
  role?: string;
  info?: string[];
  mistake?: string | string[];
  points?: number;
}

interface VotingPanelProps {
  room: any;
  votingAnim: 'hidden' | 'enter' | 'exit';
  showAnim: boolean;
  flippedVotes: {[name: string]: boolean};
  selectedVote: string | null;
  setFlippedVotes: (v: {[name: string]: boolean}) => void;
  setSelectedVote: (v: string | null) => void;
  setVoted: (v: boolean) => void;
  handleVote: () => void;
  voted: boolean;
  nickname: string;
  code: string;
}

const VotingPanel: React.FC<VotingPanelProps> = ({
  room,
  votingAnim,
  showAnim,
  flippedVotes,
  selectedVote,
  setFlippedVotes,
  setSelectedVote,
  setVoted,
  handleVote,
  voted,
  nickname,
  code,
}) => {
  if (votingAnim === 'hidden') return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: '18%',
        left: '50%',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: 600,
        minHeight: 320,
        background: 'none',
        border: 'none',
        boxShadow: 'none',
        padding: 0,
        opacity: votingAnim === 'enter' ? (showAnim ? 1 : 0) : 0,
        transform: votingAnim === 'enter' ? (showAnim ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0.85)') : 'translateX(-50%) scale(0.85)',
        transition: 'opacity 0.9s cubic-bezier(.4,2,.6,1), transform 0.9s cubic-bezier(.4,2,.6,1)'
      }}
    >
      <div style={{fontWeight:900,fontSize:28,color:'#ffd54f',marginBottom:28,letterSpacing:1,textShadow:'0 2px 12px #000a'}}>اختر من تظن أنه المجرم</div>
      <div style={{display:'flex',gap:38,marginBottom:32}}>
        {room?.players && room.players.map((player: Player, idx: number) => (
          <div key={player.name} style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
            <ReactCardFlip isFlipped={!!flippedVotes[player.name]} flipDirection="horizontal">
              {/* Front: صورة اللص شفافة واسم اللاعب */}
              <div
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: '50%',
                  backgroundImage: 'url(/Faces%20of%20characters/Thief-Face.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.18,
                  border: selectedVote === player.name ? '3px solid #ffd54f' : '2px solid #888',
                  boxShadow: selectedVote === player.name ? '0 0 18px 4px #ffd54f88' : '0 2px 8px #000a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s'
                }}
                onClick={() => {
                  setFlippedVotes({ [player.name]: true });
                  setSelectedVote(player.name);
                }}
              >
                <span style={{position:'relative',zIndex:2,fontWeight:900,fontSize:18,color:'#ffd54f',textShadow:'0 2px 8px #000a'}}>{player.name}</span>
              </div>
              {/* Back: صورة اللص بوضوح */}
              <div
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: '50%',
                  backgroundImage: 'url(/Faces%20of%20characters/Thief-Face.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 1,
                  border: selectedVote === player.name ? '3px solid #ffd54f' : '2px solid #888',
                  boxShadow: selectedVote === player.name ? '0 0 18px 4px #ffd54f88' : '0 2px 8px #000a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s',
                  position: 'relative'
                }}
                onClick={() => {
                  if (selectedVote === player.name) {
                    setFlippedVotes({ ...flippedVotes, [player.name]: false });
                    setSelectedVote(null);
                  } else {
                    // ألغِ تمييز كل الدوائر الأخرى
                    const resetVotes: {[name: string]: boolean} = {};
                    Object.keys(flippedVotes).forEach(k => { resetVotes[k] = false; });
                    setFlippedVotes({ ...resetVotes, [player.name]: true });
                    setSelectedVote(player.name);
                  }
                }}
              >
                <span style={{position:'absolute',bottom:-32,left:'50%',transform:'translateX(-50%)',fontWeight:900,fontSize:18,color:'#ffd54f',textShadow:'0 2px 8px #000a'}}>{player.name}</span>
              </div>
            </ReactCardFlip>
          </div>
        ))}
      </div>
      {/* زر تأكيد التصويت */}
      {room?.voting && (
        <button
          style={{
            marginTop: 18,
            fontWeight: 900,
            fontSize: 22,
            padding: '12px 38px',
            borderRadius: 16,
            background: 'none',
            color: selectedVote ? '#00e6c3' : '#888',
            border: `2px solid ${selectedVote ? '#00e6c3' : '#888'}`,
            cursor: selectedVote ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            textShadow: '0 2px 8px #000a',
          }}
          onMouseOver={e => { if(selectedVote){ e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#fff'; }}}
          onMouseOut={e => { if(selectedVote){ e.currentTarget.style.color = '#00e6c3'; e.currentTarget.style.borderColor = '#00e6c3'; }}}
          disabled={!selectedVote}
          onClick={() => {
            if (selectedVote) {
              handleVote();
              setVoted(true);
            }
          }}
        >
          تأكيد التصويت
        </button>
      )}
    </div>
  );
};

export default VotingPanel; 