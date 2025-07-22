import React from 'react';

interface ScenarioPopupProps {
  show: boolean;
  title: string;
  description: string;
  onDismiss: () => void;
}

const ScenarioPopup: React.FC<ScenarioPopupProps> = ({ show, title, description, onDismiss }) => {
  if (!show) return null;
  return (
    <div style={{
      position:'fixed',inset:0,zIndex:1000,
      background:'rgba(10,0,20,0.92)',
      display:'flex',alignItems:'center',justifyContent:'center',
      transition:'opacity 1.2s',
      opacity: 1,
      pointerEvents:'all',
    }}>
      <div style={{
        position:'absolute',
        top:'50%',
        left:'50%',
        transform:'translate(-50%,-50%)',
        background:'rgba(20,30,40,0.95)',
        borderRadius:22,
        boxShadow:'0 4px 32px #000a',
        padding:'40px 48px',
        textAlign:'center',
        maxWidth:'700px',
        border:'2px solid #ffd54f',
        animation: 'scenarioAppear 1s ease-out forwards',
      }}>
        <h2 style={{fontWeight:900,fontSize:36,color:'#00e6c3',marginBottom:20,letterSpacing:1.5,textShadow:'0 2px 16px #000a'}}>{title}</h2>
        <p style={{fontWeight:700,fontSize:24,color:'#ffd54f',lineHeight:1.6,textShadow:'0 2px 8px #000a'}}>{description}</p>
        <button
          onClick={onDismiss}
          style={{
            marginTop: 30,
            padding: '14px 36px',
            borderRadius: '16px',
            background: 'linear-gradient(90deg, #00e6c3 0%, #00b09b 100%)',
            color: '#fff',
            border: '2px solid #00e6c3',
            fontWeight: '900',
            fontSize: '20px',
            cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(0,230,195,0.5)',
            transition: 'all 0.2s ease-in-out',
            textShadow: '0 2px 8px #000a',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'linear-gradient(90deg, #00b09b 0%, #00e6c3 100%)'; e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(90deg, #00e6c3 0%, #00b09b 100%)'; e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
        >
          مفهوم، أخفِ السيناريو
        </button>
      </div>
      <style>{`
        @keyframes scenarioAppear {
          0% { opacity: 0; transform: translate(-50%, -40%) scale(0.95); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ScenarioPopup; 