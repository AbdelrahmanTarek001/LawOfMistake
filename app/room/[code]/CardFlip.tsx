import React from 'react';

interface CardFlipProps {
  flipped: boolean;
  onFlip: () => void;
  frontImage: string;
  backColor: string;
  borderColor: string;
  content: React.ReactNode;
  flipSoundRef: React.RefObject<HTMLAudioElement | null>;
  title: string;
  titleColor: string;
}

const CardFlip: React.FC<CardFlipProps> = ({
  flipped,
  onFlip,
  frontImage,
  backColor,
  borderColor,
  content,
  flipSoundRef,
  title,
  titleColor
}) => {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
      <div style={{fontWeight:900,fontSize:26,color:titleColor,marginBottom:12}}>{title}</div>
      <div style={{perspective: '1200px'}}>
        <div
          style={{
            width: 435,
            height: 290,
            borderRadius: 22,
            boxShadow: `0 4px 24px #000a`,
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 3.5s cubic-bezier(.22,1,.36,1)', // much slower, more mysterious
            transform: flipped ? 'rotateY(180deg)' : 'none',
            cursor: 'pointer',
            background: 'none',
          }}
          onClick={() => {
            if (flipSoundRef.current) {
              flipSoundRef.current.currentTime = 0;
              flipSoundRef.current.play();
            }
            onFlip();
          }}
        >
          {/* Front Side */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              backgroundImage: `url(${frontImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 22,
              zIndex: 2,
            }}
          />
          {/* Back Side */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              background: backColor,
              border: `2px solid ${borderColor}`,
              borderRadius: 22,
              boxShadow: `0 0 12px 2px ${borderColor}88, 0 2px 8px #000a`,
              color: '#ffd54f',
              fontWeight: 800,
              fontSize: 26,
              padding: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              textShadow: '0 2px 8px #000a',
              transform: 'rotateY(180deg)',
              zIndex: 3,
              cursor: 'pointer',
            }}
          >
            <div style={{position:'absolute',inset:0,backgroundImage:`url(${frontImage})`,backgroundSize:'cover',backgroundPosition:'center',opacity:0.25,zIndex:1}} />
            <div style={{position:'absolute',inset:0,background:backColor,opacity:0.25,zIndex:2}} />
            <div style={{position:'relative',zIndex:3,width:'100%'}}>
              {content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardFlip; 