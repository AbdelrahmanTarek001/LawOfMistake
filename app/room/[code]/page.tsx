"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import styles from '../Room.module.css';
import { useRouter } from 'next/navigation';
import ReactCardFlip from 'react-card-flip';
import PlayerList from './PlayerList';
import ChatBox from './ChatBox';
import ScenarioPopup from './ScenarioPopup';
import VotingPanel from './VotingPanel';
import CardFlip from './CardFlip';

interface Player {
  name: string;
  role?: string;
  info?: string[]; // Now always an array, even for criminal (1 element)
  mistake?: string | string[]; // Can be string (for non-criminal) or string[] (for criminal)
  points?: number;
}

interface Message {
  name: string;
  text: string;
  time: string;
}

interface Vote {
  voter: string;
  suspect: string;
}

interface MistakeVote {
  voter: string;
  target: string;
}

interface RoomData {
  owner: string;
  players: Player[];
  messages: Message[];
  started: boolean;
  round: number;
  infoCards: { [key: string]: string[] };
  mistakeCards: { [key: string]: string };
  voting?: boolean;
  votes?: Vote[];
  mistakeVoting?: boolean;
  mistakeVotes?: MistakeVote[];
  killerName?: string;
  status?: 'active' | 'ended';
  scenario?: {
    title: string;
    description: string;
  };
}

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const code = params?.code as string;
  const nickname = searchParams.get('nickname') || '';
  const [room, setRoom] = useState<RoomData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedSuspect, setSelectedSuspect] = useState('');
  const [votingError, setVotingError] = useState('');
  const [votingLoading, setVotingLoading] = useState(false);
  const [selectedMistakeTarget, setSelectedMistakeTarget] = useState('');
  const [mistakeVotingError, setMistakeVotingError] = useState('');
  const [mistakeVotingLoading, setMistakeVotingLoading] = useState(false);
  const [newRoundLoading, setNewRoundLoading] = useState(false);
  const [flippedInfo, setFlippedInfo] = useState(false);
  const [flippedMistake, setFlippedMistake] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const musicRef = useRef<HTMLAudioElement>(null);
  const flipMp3Ref = useRef<HTMLAudioElement>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const pendingFlipSoundRef = useRef(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [flippedVotes, setFlippedVotes] = useState<{[name: string]: boolean}>({});
  const [voted, setVoted] = useState(false);
  const [votedMistake, setVotedMistake] = useState(false);
  const [showScenarioPopup, setShowScenarioPopup] = useState(false); 
  // const scenarioDisplayedThisRoundRef = useRef(false); // New ref to track if scenario displayed in current round

  // 1. متغير أنيميشن واجهة التصويت
  const [votingAnim, setVotingAnim] = useState<'hidden' | 'enter' | 'exit'>('hidden');
  const [mistakeVotingAnim, setMistakeVotingAnim] = useState<'hidden' | 'enter' | 'exit'>('hidden');
  // متغير أنيميشن داخلي
  const [showAnim, setShowAnim] = useState(false);
  const [showMistakeAnim, setShowMistakeAnim] = useState(false);
  // متغيرات عرض النتائج السينمائية
  const [showOverlay, setShowOverlay] = useState(false);
  // استبدل countdown وshowKillerName بـ overlayStep
  const [overlayStep, setOverlayStep] = useState<'count3'|'count2'|'count1'|'reveal'|'fade'|null>(null);
  // متغير overlayTriggered لمنع تكرار العرض في نفس الجولة
  const overlayTriggered = useRef(false);
  // متغير أنيميشن overlay
  const [showAnimOverlay, setShowAnimOverlay] = useState(false);
  // أعد تعريف متغيرات showResults وoverlayFading
  const [showResults, setShowResults] = useState(false);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [overlayFading, setOverlayFading] = useState(false);
  // متغير لجولة العرض التشويقي
  const [teaserRound, setTeaserRound] = useState(0);
  const [resultsTeaserRound, setResultsTeaserRound] = useState(0);
  const [activeTeaser, setActiveTeaser] = useState(0); // State to trigger animation
  // متغيرات العرض التشويقي النهائي
  const [showFinalTeaser, setShowFinalTeaser] = useState(false);
  const [finalTeaserStep, setFinalTeaserStep] = useState<'reveal'|'ranks'|null>(null);
  const finalTeaserAudioRef = useRef<HTMLAudioElement>(null);
  const suspenseWhooshRef = useRef<HTMLAudioElement>(null);

  const router = useRouter();

  // Re-apply UI enhancements
  const dissonantStingRef = useRef<HTMLAudioElement>(null);
  const shockSoundRef = useRef<HTMLAudioElement>(null);
  const resultsAppearSoundRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const handleFirstInteraction = () => {
      setUserInteracted(true);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // 1. دوال مساعدة للتخزين والاسترجاع
  function getRoomStorageKey(code: string, nickname: string) {
    return `roomState_${code}_${nickname}`;
  }
  function saveRoomState(code: string, nickname: string, state: any) {
    localStorage.setItem(getRoomStorageKey(code, nickname), JSON.stringify({
      flippedInfo: state.flippedInfo,
      flippedMistake: state.flippedMistake,
      flippedVotes: state.flippedVotes,
      selectedVote: state.selectedVote,
      teaserRound: state.teaserRound,
      resultsTeaserRound: state.resultsTeaserRound,
      showScenarioPopup: state.showScenarioPopup, // Save scenario popup state directly
    }));
  }
  function loadRoomState(code: string, nickname: string) {
    const raw = localStorage.getItem(getRoomStorageKey(code, nickname));
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  // Polling for room info and chat messages every 2 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchRoom() {
      setError('');
      try {
        const res = await fetch(`/api/rooms/info?code=${code}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'حدث خطأ ما');
        setRoom(data);

        // Control scenario popup visibility: check persisted state
        const storedState = loadRoomState(code, nickname);
        const dismissedInRound = storedState?.scenarioDismissedInRound || false;

        // REMOVED ALL SCENARIO POPUP LOGIC FROM HERE. It will now be controlled by a dedicated button.

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (code) {
      fetchRoom();
      interval = setInterval(fetchRoom, 2000);
    }
    return () => interval && clearInterval(interval);
  }, [code, nickname]); // Add nickname to dependencies

  // 2. عند تحميل الصفحة: استرجع الحالة من localStorage
  useEffect(() => {
    if (!code || !nickname) return;
    const state = loadRoomState(code, nickname);
    if (state) {
      if (typeof state.flippedInfo === 'boolean') setFlippedInfo(state.flippedInfo);
      if (typeof state.flippedMistake === 'boolean') setFlippedMistake(state.flippedMistake);
      if (typeof state.selectedVote !== 'undefined' && state.selectedVote) setVoted(true);
      if (typeof state.selectedVote !== 'undefined') setSelectedVote(state.selectedVote);
      if (typeof state.flippedVotes === 'object' && state.flippedVotes) setFlippedVotes(state.flippedVotes);
      if (typeof state.teaserRound === 'number') setTeaserRound(state.teaserRound);
      if (typeof state.resultsTeaserRound === 'number') setResultsTeaserRound(state.resultsTeaserRound);
      if (typeof state.showScenarioPopup === 'boolean') setShowScenarioPopup(state.showScenarioPopup); // Load scenario popup state
      // activeTeaser is not persisted
    }
  }, [code, nickname]);

  // Autoplay music after first user interaction if game started
  useEffect(() => {
    const tryPlayMusic = () => {
      if (musicRef.current && musicRef.current.paused) {
        musicRef.current.play().then(() => setMusicPlaying(true)).catch(() => {});
      }
    };
    window.addEventListener('click', tryPlayMusic, { once: true });
    window.addEventListener('keydown', tryPlayMusic, { once: true });
    return () => {
      window.removeEventListener('click', tryPlayMusic);
      window.removeEventListener('keydown', tryPlayMusic);
    };
  }, []);

  // بعد فتح الكروت، أظهر زر بدء التصويت لصاحب الغرفة فقط
  useEffect(() => {
    if (room?.owner === nickname && flippedInfo && flippedMistake) {
      // setShowVoting(true); // This line is removed as per the edit hint
    } else {
      // setShowVoting(false); // This line is removed as per the edit hint
      setSelectedVote(null);
      setFlippedVotes({});
    }
  }, [room?.owner, nickname, flippedInfo, flippedMistake]);

  // عند كل اللاعبين: راقب room.voting
  useEffect(() => {
    // This useEffect is removed as per the edit hint
  }, [room?.voting]);

  // 1. أضف useEffect جديد بعد تعريف flippedInfo وflippedMistake:
  useEffect(() => {
    // إذا صاحب الغرفة، الكروت مقلوبة، التصويت لم يبدأ، أظهر الزر دائماً
    // This useEffect is removed as per the edit hint
  }, [room?.owner, nickname, flippedInfo, flippedMistake, room?.voting]);

  // Calculate waiting players
  const maxPlayers = 4;
  const waitingPlayers = room && room.players ? maxPlayers - room.players.length : maxPlayers;
  const roomIsFull = room && room.players && room.players.length === maxPlayers;

  // Flip cards automatically when game starts

  const handleStartGame = async () => {
    setStarting(true);
    setError('');
    try {
      const res = await fetch('/api/rooms/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, nickname }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ ما');
      // Force refresh
      setRoom((prev) => prev && { ...prev, started: true, players: data.players });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await fetch('/api/rooms/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name: nickname, text: message }),
      });
      setMessage('');
    } catch {}
    setSending(false);
  };

  // Voting handlers
  const handleStartVoting = async () => {
    setVotingLoading(true);
    setVotingError('');
    try {
      const res = await fetch('/api/rooms/voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, nickname, start: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ ما');
    } catch (err: any) {
      setVotingError(err.message);
    } finally {
      setVotingLoading(false);
    }
  };

  const handleVote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedSuspect) {
      setVotingError('يرجى اختيار مشتبه به');
      return;
    }
    setVotingLoading(true);
    setVotingError('');
    try {
      const res = await fetch('/api/rooms/voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, nickname, suspect: selectedSuspect }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ ما');
    } catch (err: any) {
      setVotingError(err.message);
    } finally {
      setVotingLoading(false);
    }
  };

  // New handler for starting the mistake voting phase
  const handleStartMistakeVoting = async () => {
    setMistakeVotingLoading(true);
    setMistakeVotingError('');
    try {
      const res = await fetch('/api/rooms/voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, nickname, startMistakeVoting: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ ما');
    } catch (err: any) {
      setMistakeVotingError(err.message);
    } finally {
      setMistakeVotingLoading(false);
    }
  };

  // Mistake voting handler
  const handleMistakeVote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedMistakeTarget) {
      setMistakeVotingError('يرجى اختيار لاعب للتصويت على غلطته');
      return;
    }
    setMistakeVotingLoading(true);
    setMistakeVotingError('');
    try {
      const res = await fetch('/api/rooms/voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, nickname, target: selectedMistakeTarget }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setMistakeVotingError('لقد قمت بالتصويت بالفعل');
        } else {
          throw new Error(data.error || 'حدث خطأ ما');
        }
      }
    } catch (err: any) {
      setMistakeVotingError(err.message);
    } finally {
      setMistakeVotingLoading(false);
    }
  };

  // New round handler
  const handleNewRound = async () => {
    setNewRoundLoading(true);
    try {
      await fetch('/api/rooms/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, nickname, newRound: true }),
      });
    } catch {}
    setNewRoundLoading(false);
  };

  const myPlayer = room?.players.find((p) => p.name === nickname);

  const handleFlipInfo = () => {
    setFlippedInfo(true);
  };
  const handleFlipMistake = () => {
    setFlippedMistake(true);
  };
  const handleToggleMusic = () => {
    if (!musicRef.current) return;
    if (musicRef.current.paused) {
      musicRef.current.play();
      setMusicPlaying(true);
    } else {
      musicRef.current.pause();
      setMusicPlaying(false);
    }
  };

  // Helper to get role image path (fix for special chars and spaces)
  const getRoleImage = (role?: string) => {
    if (!role) return null;
    if (role.includes('قاضي')) return '/Faces%20of%20characters/Judge-Face.png';
    if (role.includes('محامي')) return '/Faces%20of%20characters/Lawyer-Face.png';
    if (role.includes('شاهد')) return "/Faces%20of%20characters/Citizen's%20Witness-Face.png";
    if (role.includes('مجرم') || role.includes('لص')) return '/Faces%20of%20characters/Thief-Face.png';
    return null;
  };

  // 3. عند flip الكروت أو تغيير التصويت: خزّن الحالة في localStorage
  useEffect(() => {
    if (!code || !nickname) return;
    saveRoomState(code, nickname, {
      flippedInfo,
      flippedMistake,
      flippedVotes,
      selectedVote,
      teaserRound,
      resultsTeaserRound,
      // No need to save showResults anymore
    });
  }, [code, nickname, flippedInfo, flippedMistake, flippedVotes, selectedVote, teaserRound, resultsTeaserRound]);

  // useEffects for voting UI animations
  useEffect(() => {
    if (room?.voting && !voted) {
      setVotingAnim('enter');
    } else if (votingAnim === 'enter') {
      setVotingAnim('exit');
      const timeout = setTimeout(() => setVotingAnim('hidden'), 400);
      return () => clearTimeout(timeout);
    }
  }, [room?.voting, voted]);

  useEffect(() => {
    if (votingAnim === 'enter') {
      setShowAnim(false);
      const t = setTimeout(() => setShowAnim(true), 10);
      return () => clearTimeout(t);
    } else {
      setShowAnim(false);
    }
  }, [votingAnim]);

  // New useEffects for mistake voting UI animations
  useEffect(() => {
    if (room?.mistakeVoting && !votedMistake) {
      setMistakeVotingAnim('enter');
    } else if (mistakeVotingAnim === 'enter') {
      setMistakeVotingAnim('exit');
      const timeout = setTimeout(() => setMistakeVotingAnim('hidden'), 400);
      return () => clearTimeout(timeout);
    }
  }, [room?.mistakeVoting, votedMistake]);

  useEffect(() => {
    if (mistakeVotingAnim === 'enter') {
      setShowMistakeAnim(false);
      const t = setTimeout(() => setShowMistakeAnim(true), 10);
      return () => clearTimeout(t);
    } else {
      setShowMistakeAnim(false);
    }
  }, [mistakeVotingAnim]);


  // Effect to decide WHEN to trigger the killer teaser
  useEffect(() => {
    if (
      room &&
      !room.voting &&
      room.votes && room.votes.length >= (room.players?.length || 0) &&
      teaserRound < room.round
    ) {
      const timer = setTimeout(() => {
        setTeaserRound(room.round); // Persist that this round's teaser has been triggered
        setActiveTeaser(room.round); // Trigger the animation effect for this session
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [room, teaserRound]);


  // Effect to RUN the killer teaser animation when triggered
  useEffect(() => {
    if (activeTeaser === 0 || activeTeaser < (room?.round || 1)) return;

    let tAnim: NodeJS.Timeout, t1: NodeJS.Timeout, t2: NodeJS.Timeout, t3: NodeJS.Timeout, t4: NodeJS.Timeout, t5: NodeJS.Timeout;
    
    setShowOverlay(true);
    setOverlayStep('count3');
    setOverlayFading(false);
    setShowAnimOverlay(false);

    if(userInteracted && dissonantStingRef.current) dissonantStingRef.current.play();

    tAnim = setTimeout(() => setShowAnimOverlay(true), 10);
    t1 = setTimeout(() => setOverlayStep('count2'), 1000);
    t2 = setTimeout(() => setOverlayStep('count1'), 2000);
    t3 = setTimeout(() => {
      setOverlayStep('reveal');
      if(userInteracted && shockSoundRef.current) shockSoundRef.current.play();
    }, 3000);
    t4 = setTimeout(() => {
      setOverlayStep('fade');
      setOverlayFading(true);
    }, 6000);
    t5 = setTimeout(() => {
      setShowOverlay(false);
      setOverlayStep(null);
      setOverlayFading(false);
      setShowAnimOverlay(false);
      setActiveTeaser(0); // Reset the trigger
    }, 7200);

    return () => {
      clearTimeout(tAnim); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5);
    };
  }, [activeTeaser, room?.round, userInteracted]);
  

  // Trigger results display after mistake voting is done
  useEffect(() => {
    if (room?.mistakeVoting && votedMistake) {
      setShowResults(true);
      setResultsVisible(true);
      if (resultsAppearSoundRef.current) resultsAppearSoundRef.current.play();
    }
  }, [room?.mistakeVoting, votedMistake]);

  // Trigger final teaser after mistake voting is done
  useEffect(() => {
    if (
      room &&
      !room.mistakeVoting &&
      room.mistakeVotes &&
      room.mistakeVotes.length >= (room.players?.length || 0) &&
      resultsTeaserRound < room.round // <-- The fix: only trigger if not seen for this round
    ) {
      setTimeout(() => {
        setResultsTeaserRound(room.round); // <-- The fix: Mark as seen for this round
        setShowFinalTeaser(true);
        setFinalTeaserStep('reveal');
        if (finalTeaserAudioRef.current) {
          finalTeaserAudioRef.current.currentTime = 0;
          finalTeaserAudioRef.current.play();
        }
        setTimeout(() => {
          setFinalTeaserStep('ranks');
        }, 2000);
      }, 800); // slight delay after voting
    }
    // لا تغلق العرض التشويقي تلقائيًا هنا
  }, [room?.mistakeVoting, room?.mistakeVotes, room?.players, resultsTeaserRound]);

  // The logic for showing the teaser is now self-contained and combined with its trigger.
  // The old display-only useEffect has been removed to fix the refresh bug.

  // The results display logic is now removed from here.

  // The useEffect for making results visible is also removed.

  // أضف مراقبة overlayStep في useEffect
  useEffect(() => {
    console.log('overlayStep:', overlayStep, 'showOverlay:', showOverlay, 'showAnimOverlay:', showAnimOverlay);
  }, [overlayStep, showOverlay, showAnimOverlay]);

  // منطق إظهار السيناريو تلقائيًا عند بدء الجولة/اللعبة مرة واحدة فقط
  useEffect(() => {
    if (!room?.started || !room?.scenario) return;
    const roundKey = `scenarioShownForRound_${code}_${nickname}_${room.round}`;
    const alreadyShown = localStorage.getItem(roundKey);
    if (!alreadyShown) {
      setShowScenarioPopup(true);
      localStorage.setItem(roundKey, 'true');
    }
  }, [room?.round, room?.started, room?.scenario, code, nickname]);

  // Call leave API on Exit button before game starts
  const handleExit = async () => {
    if (room && !room.started) {
      try {
        await fetch('/api/rooms/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, nickname }),
        });
      } catch {}
    }
    router.push('/');
  };

  // Reset scenario popup visibility and ref on new round
  useEffect(() => {
    setShowFinalTeaser(false);
    setFinalTeaserStep(null);
    setShowOverlay(false);
    setOverlayStep(null);
    setOverlayFading(false);
    setShowAnimOverlay(false);
    setVoted(false);
    setVotedMistake(false);
    setSelectedVote(null);
    setSelectedMistakeTarget('');
    setFlippedVotes({});
    setFlippedInfo(false);
    setFlippedMistake(false);
    setVotingAnim('hidden');
    setMistakeVotingAnim('hidden');
    setShowAnim(false);
    setShowMistakeAnim(false);
    // Reset scenario dismissed state for new round in localStorage
    // saveRoomState(code, nickname, { scenarioDismissedInRound: false }); // No longer needed
    // setShowScenarioPopup(false); // Will be controlled by manual button, or kept by localStorage
    // أي متغيرات أخرى متعلقة بمسار الجولة
  }, [room?.round, code, nickname]);

  // Show system messages in waiting room
  const waitingMessages = room?.messages?.filter(m => m.name === 'system') || [];

  useEffect(() => {
    if (showScenarioPopup && suspenseWhooshRef.current) {
      suspenseWhooshRef.current.currentTime = 0;
      suspenseWhooshRef.current.play();
    }
  }, [showScenarioPopup]);

  return (
    <div className={styles.roomBg}>
      {/* Exit Button (Top Right) */}
      <button
        className={styles.exitButton}
        onClick={handleExit}
        style={{position:'absolute',top:24,right:24,left:'auto',zIndex:10,minWidth:90,fontWeight:700,fontSize:17,padding:'8px 18px',borderRadius:12,background:'#222b',color:'#ffd54f',border:'2px solid #ffd54f',boxShadow:'0 2px 12px #000a',cursor:'pointer'}}
      >
        خروج
      </button>
      {/* Role Box (Top Right, under exit) */}
      {room?.started && myPlayer && (
        <div className={styles.roleBox} style={{position:'absolute',top:90,right:24,display:'flex',alignItems:'center',gap:18,background:'none',border:'none',boxShadow:'none',padding:0,minWidth:260}}>
          {getRoleImage(myPlayer.role) && (
            <img src={getRoleImage(myPlayer.role)!} alt={myPlayer.role} style={{width:100,height:100,borderRadius:'50%',border:'none',background:'none',objectFit:'cover',marginLeft:18,boxShadow:'0 4px 24px #000a'}} />
          )}
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start'}}>
            <span style={{fontWeight:900,fontSize:22,color:'#ffd54f',marginBottom:2,letterSpacing:1}}>دورك في هذه الجولة:</span>
            <span style={{fontWeight:900,fontSize:30,color:'#00e6c3',textShadow:'0 2px 8px #000a'}}>{myPlayer.role}</span>
          </div>
        </div>
      )}
      {/* Music Control Button */}
      <button className={styles.musicButton} onClick={handleToggleMusic} title={musicPlaying ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}>
        {musicPlaying ? (
          <span role="img" aria-label="إيقاف">⏸️</span>
        ) : (
          <span role="img" aria-label="تشغيل">🎵</span>
        )}
      </button>
      <audio ref={musicRef} src="/Music-Gammeplay/Sequence 01.mp3" loop preload="auto" />
      <audio ref={flipMp3Ref} src="/sounds-effect/flippingCards2.mp3" preload="auto" />
      <audio ref={dissonantStingRef} src="/sounds-effect/dissonant-piano-sting.mp3" preload="auto" />
      <audio ref={shockSoundRef} src="/sounds-effect/shock.mp3" preload="auto" />
      <audio ref={resultsAppearSoundRef} src="/sounds-effect/dissonant-piano-sting.mp3" preload="auto" />
      <audio ref={finalTeaserAudioRef} src="/sounds-effect/suspense-whoosh.wav" preload="auto" />
      <audio ref={suspenseWhooshRef} src="/sounds-effect/suspense-whoosh.wav" preload="auto" />

      {room?.status === 'ended' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100,
          fontSize: 32,
          fontWeight: 900,
          color: '#ffd54f',
          background: 'rgba(20,30,40,0.85)',
          padding: '32px 48px',
          borderRadius: 18,
          boxShadow: '0 4px 24px #000a',
          textAlign: 'center'
        }}>
          تم انتهاء اللعبة!
        </div>
      )}
      {/* Waiting Message */}
      {!roomIsFull && (
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:100,fontSize:32,fontWeight:900,color:'#ffd54f',background:'rgba(20,30,40,0.85)',padding:'32px 48px',borderRadius:18,boxShadow:'0 4px 24px #000a',textAlign:'center'}}>
          {waitingPlayers > 1
            ? `بانتظار ${waitingPlayers} لاعبين للانضمام حتى تبدأ اللعبة...`
            : 'بانتظار لاعب واحد للانضمام حتى تبدأ اللعبة...'}
          {waitingMessages.length > 0 && (
            <div style={{marginTop: 24, fontSize: 20, color: '#ffd54f', textShadow: '0 2px 8px #000a'}}>
              {waitingMessages.map((msg, i) => (
                <div key={i}>{msg.text}</div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Scenario Display (Overlay) */}
      <ScenarioPopup
        show={showScenarioPopup && !!room?.scenario}
        title={room?.scenario?.title || ''}
        description={room?.scenario?.description || ''}
        onDismiss={() => {
          setShowScenarioPopup(false);
          const roundKey = `scenarioShownForRound_${code}_${nickname}_${room?.round}`;
          localStorage.setItem(roundKey, 'true');
        }}
      />

      <style>{`
        @keyframes scenarioAppear {
          0% { opacity: 0; transform: translate(-50%, -40%) scale(0.95); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>

      {/* Cards Section: Info and Mistake, each in its own section, horizontal, 435x290 */}
      {roomIsFull && room?.started && (
        <div style={{position:'absolute',left:'50%',bottom:60,transform:'translateX(-50%)',display:'flex',gap:60,zIndex:10}}>
          {/* Info Card Section */}
          {myPlayer?.info && (
            <CardFlip
              flipped={flippedInfo}
              onFlip={() => setFlippedInfo(prev => !prev)}
              frontImage={'/CardsBackground/BlueCard.png'}
              backColor={'rgba(20,30,60,0.25)'}
              borderColor={'#00e6c3'}
              content={myPlayer.info.map((line, idx) => <div key={idx} style={{marginBottom:10}}>{line}</div>)}
              flipSoundRef={flipMp3Ref}
              title={'معلومة'}
              titleColor={'#00e6c3'}
            />
          )}
          {/* Mistake Card Section */}
          {myPlayer?.mistake && (
            <CardFlip
              flipped={flippedMistake}
              onFlip={() => setFlippedMistake(prev => !prev)}
              frontImage={'/CardsBackground/RedCard.png'}
              backColor={'rgba(60,20,20,0.25)'}
              borderColor={'#d84315'}
              content={Array.isArray(myPlayer.mistake) ? myPlayer.mistake.map((line, idx) => <div key={idx} style={{marginBottom:10}}>{line}</div>) : myPlayer.mistake}
              flipSoundRef={flipMp3Ref}
              title={'غلطة منطقية'}
              titleColor={'#d84315'}
            />
          )}
        </div>
      )}
      {/* زر بدء التصويت (شرط جديد) */}
      {room?.owner === nickname && roomIsFull && room.started && !room.voting && (!room.votes || room.votes.length === 0) && (!showFinalTeaser && !finalTeaserStep) && (
        <div style={{
          position:'absolute',
          top:'50%',
          left:'50%',
          transform:'translate(-50%,-50%)',
          zIndex:30,
          display:'flex',
          flexDirection:'column',
          alignItems:'center',
        }}>
          <button
            style={{
              fontWeight: 900,
              fontSize: 22,
              padding: '12px 38px',
              borderRadius: 16,
              background: 'none',
              color: '#ffd54f',
              border: '2px solid #ffd54f',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textShadow: '0 2px 8px #000a',
            }}
            onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#fff'; }}
            onMouseOut={e => { e.currentTarget.style.color = '#ffd54f'; e.currentTarget.style.borderColor = '#ffd54f'; }}
            onClick={handleStartVoting}
          >
            بدء التصويت
          </button>
        </div>
      )}
      {/* زر بدء التصويت على الغلطة */}
      {room?.owner === nickname && !room.voting && !room.mistakeVoting && room.killerName && resultsTeaserRound < room.round && !showFinalTeaser && !finalTeaserStep && (
        <div style={{
          position:'absolute',
          top:'50%',
          left:'50%',
          transform:'translate(-50%,-50%)',
          zIndex:30,
          display:'flex',
          flexDirection:'column',
          alignItems:'center',
        }}>
          <button
            style={{
              fontWeight: 900,
              fontSize: 22,
              padding: '12px 38px',
              borderRadius: 16,
              background: 'none',
              color: '#d84315',
              border: '2px solid #d84315',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textShadow: '0 2px 8px #000a',
            }}
            onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#fff'; }}
            onMouseOut={e => { e.currentTarget.style.color = '#d84315'; e.currentTarget.style.borderColor = '#d84315'; }}
            onClick={handleStartMistakeVoting}
            disabled={mistakeVotingLoading}
          >
            {mistakeVotingLoading ? '...جاري البدء' : 'بدء التصويت على الغلطة'}
          </button>
        </div>
      )}

      {/* قسم الجولة في أعلى منتصف الشاشة */}
      {room && (
        <div style={{
          position:'absolute',
          top:18,
          left:'50%',
          transform:'translateX(-50%)',
          zIndex:30,
          background:'rgba(20,30,40,0.92)',
          borderRadius:18,
          boxShadow:'0 2px 12px #000a',
          padding:'10px 38px',
          fontWeight:900,
          fontSize:24,
          color:'#ffd54f',
          letterSpacing:1,
          textShadow:'0 2px 8px #000a',
          border:'2px solid #ffd54f',
          display:'flex',
          alignItems:'center',
          gap:18
        }}>
          <span>الجولة</span>
          <span style={{color:'#00e6c3',fontSize:28,fontWeight:900}}>{room.round || 1}</span>
        </div>
      )}
      {/* NEW SCENARIO TOGGLE BUTTON IN ITS OWN SECTION, RIGHT OF ROUND INFO */}
      {room?.scenario && room?.started && (
        <div style={{position:'absolute',bottom:620,right:18,zIndex:30,display:'flex',alignItems:'center',padding:'0px 10px',gap: '8px'}}>
          <button
            onClick={() => {
              const newState = !showScenarioPopup;
              setShowScenarioPopup(newState);
              saveRoomState(code, nickname, { showScenarioPopup: newState });
            }}
            title={showScenarioPopup ? 'إخفاء السيناريو' : 'إظهار السيناريو'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: showScenarioPopup ? '#00e6c3' : '#ffd54f',
              fontSize: '24px',
              transition: 'color 0.2s',
            }}
          >
            {showScenarioPopup ? '👁️' : '👁️‍🗨️'} {/* Eye open/closed icon */}
          </button>
          <span style={{color: '#ffd54f', fontWeight: 700, textShadow: '0 0 8px #000a'}}>السيناريو</span>
        </div>
      )}

      {/* واجهة التصويت لكل اللاعبين */}
      <VotingPanel
        room={room}
        votingAnim={votingAnim}
        showAnim={showAnim}
        flippedVotes={flippedVotes}
        selectedVote={selectedVote}
        setFlippedVotes={setFlippedVotes}
        setSelectedVote={setSelectedVote}
        setVoted={setVoted}
        handleVote={handleVote}
        voted={voted}
        nickname={nickname}
        code={code}
      />

      {/* واجهة التصويت على الغلطة */}
      {mistakeVotingAnim !== 'hidden' && (
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
            opacity: mistakeVotingAnim === 'enter' ? (showMistakeAnim ? 1 : 0) : 0,
            transform: mistakeVotingAnim === 'enter' ? (showMistakeAnim ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0.85)') : 'translateX(-50%) scale(0.85)',
            transition: 'opacity 0.9s cubic-bezier(.4,2,.6,1), transform 0.9s cubic-bezier(.4,2,.6,1)'
          }}
        >
          <div style={{fontWeight:900,fontSize:28,color:'#d84315',marginBottom:28,letterSpacing:1,textShadow:'0 2px 12px #000a'}}>اختر من قام بالغلطة المنطقية</div>
          <div style={{display:'flex',gap:38,marginBottom:32}}>
            {room?.players && room.players.map((player, idx) => (
              <div key={player.name} style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                <div
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.15)', // خلفية شفافة
                    border: selectedMistakeTarget === player.name ? '3px solid #d84315' : '3px solid #00e6c3', // أزرق افتراضي، أحمر عند التحديد
                    boxShadow: selectedMistakeTarget === player.name ? '0 0 18px 4px #d8431588' : '0 2px 8px #000a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s',
                    position: 'relative',
                    fontWeight: 900,
                    fontSize: 22,
                    color: selectedMistakeTarget === player.name ? '#fff' : '#ffd54f',
                    textShadow: '0 2px 8px #000a',
                  }}
                  onClick={() => {
                    setSelectedMistakeTarget(player.name);
                  }}
                >
                  {player.name}
                </div>
              </div>
            ))}
          </div>
          {/* زر تأكيد تصويت الغلطة */}
          {room?.mistakeVoting && (
            <button
              style={{
                marginTop: 18,
                fontWeight: 900,
                fontSize: 22,
                padding: '12px 38px',
                borderRadius: 16,
                background: 'none',
                color: selectedMistakeTarget ? '#d84315' : '#888',
                border: `2px solid ${selectedMistakeTarget ? '#d84315' : '#888'}`,
                cursor: selectedMistakeTarget ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                textShadow: '0 2px 8px #000a',
              }}
              onMouseOver={e => { if(selectedMistakeTarget){ e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#fff'; }}}
              onMouseOut={e => { if(selectedMistakeTarget){ e.currentTarget.style.color = '#d84315'; e.currentTarget.style.borderColor = '#d84315'; }}}
              disabled={!selectedMistakeTarget}
              onClick={() => {
                if (selectedMistakeTarget) {
                  handleMistakeVote(); // Re-use the existing handler
                  setVotedMistake(true);
                }
              }}
            >
              تأكيد التصويت
            </button>
          )}
        </div>
      )}

      {/* Overlay السينمائي */}
      {showOverlay && (
        <div style={{
          position:'fixed',inset:0,zIndex:1000,
          background:'rgba(10,0,20,0.92)',
          display:'flex',alignItems:'center',justifyContent:'center',
          transition:'opacity 1.2s',
          opacity: 1,
          pointerEvents:'all',
        }}>
          <div style={{
            width:340,height:340,borderRadius:'50%',
            background:`url(/Faces%20of%20characters/Thief-Face.png) center/cover, #111`,
            border:'8px solid #d84315',
            boxShadow:'0 0 64px 16px #d84315cc, 0 0 0 12px #ffd54f33',
            display:'flex',alignItems:'center',justifyContent:'center',
            flexDirection:'column',
            position:'relative',
            transition:'opacity 0.7s, transform 0.7s',
            opacity: showAnimOverlay ? 1 : 0,
            transform: showAnimOverlay ? 'scale(1)' : 'scale(0.85)',
            animation:'pulseRed 1.2s infinite alternate',
          }}>
            {overlayStep === 'count3' && <span style={{fontSize:110,fontWeight:900,color:'#fff',textShadow:'0 2px 24px #d84315,0 0 32px #000'}}>3</span>}
            {overlayStep === 'count2' && <span style={{fontSize:110,fontWeight:900,color:'#fff',textShadow:'0 2px 24px #d84315,0 0 32px #000'}}>2</span>}
            {overlayStep === 'count1' && <span style={{fontSize:110,fontWeight:900,color:'#fff',textShadow:'0 2px 24px #d84315,0 0 32px #000'}}>1</span>}
            {overlayStep === 'reveal' && room && (
              <span style={{fontSize:38,fontWeight:900,color:'#ffd54f',textShadow:'0 2px 24px #d84315,0 0 32px #000',letterSpacing:2, animation: 'revealName 1s ease-out'}}>
                المجرم الحقيقي هو<br/>
                <span style={{
                  color:'#fff', // لون أبيض واضح
                  fontSize:54,
                  textShadow:'0 2px 24px #d84315,0 0 32px #000',
                  fontWeight:'bold',
                  display:'inline-block',
                  marginTop: '12px',
                  letterSpacing: 1
                }}>{room.killerName}</span>
              </span>
            )}
            {/* fallback: اعرض overlayStep مباشرة للنص التجريبي */}
            {(!['count3','count2','count1','reveal','fade'].includes(overlayStep as string) && overlayStep) && (
              <span style={{fontSize:60,color:'#fff'}}>{overlayStep}</span>
            )}
          </div>
          <style>{`
            @keyframes pulseRed{0%{box-shadow:0 0 64px 16px #d84315cc,0 0 0 12px #ffd54f33;}100%{box-shadow:0 0 96px 32px #d84315ee,0 0 0 24px #ffd54f55;}}
            @keyframes revealName{0%{opacity:0;transform:scale(0.8);}100%{opacity:1;transform:scale(1);}}
          `}</style>
        </div>
      )}
      {/* Overlay التشويقي النهائي بعد تصويت الغلطة */}
      {showFinalTeaser && (
        <div style={{
          position:'fixed',inset:0,zIndex:2000,
          background:'rgba(10,26,47,0.65)', // أزرق داكن شفاف
          backdropFilter:'blur(2.5px)',
          display:'flex',alignItems:'center',justifyContent:'center',
          flexDirection:'column',
          transition:'opacity 1.2s',
          pointerEvents:'all',
          border:'3px solid #ffd54f99', // ذهبي باهت
          boxShadow:'0 0 64px 8px #ffd54f33',
        }}>
          <audio ref={finalTeaserAudioRef} src="/sounds-effect/suspense-whoosh.wav" preload="auto" />
          {finalTeaserStep === 'reveal' && (
            <span style={{
              fontSize:38,
              fontWeight:900,
              color:'#ffd54f',
              textShadow:'0 2px 24px #00e6c3,0 0 32px #000',
              letterSpacing:2,
              animation: 'revealName 1.2s cubic-bezier(.4,2,.6,1)',
              marginBottom: 24
            }}>
              لحظة كشف الحقيقة والكشف عن الهويات
            </span>
          )}
          {finalTeaserStep === 'ranks' && room && (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:32,animation:'fadeIn 1.2s'}}>
              <div style={{fontWeight:900,fontSize:32,color:'#ffd54f',marginBottom:18,letterSpacing:2,textShadow:'0 2px 24px #00e6c3,0 0 32px #000'}}>المراكز</div>
              <div style={{display:'flex',flexDirection:'row',gap:38,justifyContent:'center',alignItems:'flex-end'}}>
                {([...room.players].sort((a, b) => (b.points || 0) - (a.points || 0))).map((player, idx) => {
                  const medals = ['🥇','🥈','🥉','🏅'];
                  const places = ['الأول','الثاني','الثالث','الرابع'];
                  return (
                    <div key={player.name} style={{
                      display:'flex',flexDirection:'column',alignItems:'center',gap:10,
                      animation: `popIn 0.7s ${0.2*idx}s both`,
                    }}>
                      <div style={{fontWeight:900,fontSize:22,color:'#ffd54f',marginBottom:6,letterSpacing:1,display:'flex',alignItems:'center',gap:6}}>
                        <span>{places[idx]}</span>
                        <span style={{fontSize:30}}>{medals[idx]}</span>
                      </div>
                      <div style={{
                        width:120,height:120,borderRadius:'50%',
                        background:'#112244', // أزرق غامق
                        border:'4px solid #ffd54f', // ذهبي
                        boxShadow:'0 0 24px 4px #ffd54f88',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        marginBottom:8
                      }}>
                        {getRoleImage(player.role) && (
                          <img src={getRoleImage(player.role)!} alt={player.role} style={{width:90,height:90,borderRadius:'50%',objectFit:'cover'}} />
                        )}
                      </div>
                      <span style={{color:'#ffd54f',fontWeight:900,fontSize:20,textShadow:'0 2px 8px #000'}}>{player.name}</span>
                    </div>
                  );
                })}
              </div>
              {/* زر بدء جولة أخرى لصاحب الغرفة */}
              {room.owner === nickname && (
                <button
                  onClick={() => {
                    setShowFinalTeaser(false); // أخفِ overlay فورًا
                    setFinalTeaserStep(null);
                    handleNewRound();
                  }}
                  disabled={newRoundLoading}
                  style={{
                    marginTop: 38,
                    fontWeight: 900,
                    fontSize: 22,
                    padding: '14px 44px',
                    borderRadius: 18,
                    background: 'linear-gradient(90deg,#ffd54f99 60%,#ffe08299 100%)', // ذهبي باهت
                    color: '#0a1a2f',
                    border: '2.5px solid #ffd54f99',
                    boxShadow: '0 2px 18px #ffd54f33',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textShadow: '0 2px 8px #fff8',
                  }}
                >
                  {newRoundLoading ? '...جاري بدء جولة جديدة' : 'بدء جولة أخرى'}
                </button>
              )}
            </div>
          )}
          <style>{`
            @keyframes revealName{0%{opacity:0;transform:scale(0.8);}100%{opacity:1;transform:scale(1);}}
            @keyframes fadeIn{0%{opacity:0;transform:translateY(40px);}100%{opacity:1;transform:translateY(0);}}
            @keyframes popIn{0%{opacity:0;transform:scale(0.7);}100%{opacity:1;transform:scale(1);}}
          `}</style>
        </div>
      )}
      {/* قائمة النتائج - تظهر دائما بعد بدء اللعبة */}
      {room?.started && room.players && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            zIndex: 30,
            minWidth: 320,
            maxWidth: 380,
            background: 'rgba(20,30,60,0.15)',
            borderRadius: 24,
            border: '3px solid #00e6c3',
            boxShadow: '0 4px 24px #00e6c355',
            padding: '28px 24px 24px 24px',
            fontFamily: 'Cairo, Tajawal, Arial',
            fontWeight: 700,
            color: '#ffd54f',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 0,
            transition: 'opacity 0.7s ease-out, transform 0.5s ease-out',
            opacity: 1, // Always visible
            transform: 'none', // No animation on appear
            backdropFilter: 'blur(2px)'
          }}
        >
          <div style={{fontWeight:900,fontSize:26,color:'#00e6c3',marginBottom:16,letterSpacing:1,textShadow:'0 2px 8px #000'}}>نتائج الجولة</div>
          {[...room.players].sort((a, b) => (b.points || 0) - (a.points || 0)).map((player, idx) => (
            <React.Fragment key={idx}>
              <div style={{
                display:'flex',
                alignItems:'center',
                gap:12,
                fontSize:18,
                marginBottom:0,
                background:'none',
                borderRadius:14,
                padding:'8px 4px',
                width:'100%',
                position: 'relative'
              }}>
                {/* Image is removed as requested */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  flex: 1,
                  alignItems: 'center', // Center text now
                }}>
                  <span style={{
                    color:'#fff',
                    fontWeight:900,
                    fontSize:20
                  }}>{player.name}</span>
                  <span style={{color:'#ffd54f',fontWeight:900,fontSize:18}}>{player.points ?? 0} نقطة</span>
                </div>
              </div>
              {idx < room.players.length-1 && (
                <div style={{height:16}}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      {/* Chat Section: only after game starts, bottom right, animated, golden border, matches results panel layout */}
      {room?.started && (
        <ChatBox
          messages={room.messages}
          nickname={nickname}
          message={message}
          setMessage={setMessage}
          sending={sending}
          onSend={handleSendMessage}
        />
      )}
      <div className={styles.roomLayout}>
        {/* Players and Room Code (Right) */}
        {room && (
          <PlayerList
            players={room.players}
            owner={room.owner}
            nickname={nickname}
            code={code}
          />
        )}
        {/* Main Button (Bottom Center) */}
        {/* The Start Game button only appears if: (1) you are the owner, (2) the game hasn't started, (3) the room is full. It will disappear immediately if a player leaves. */}
        {room?.owner === nickname && !room?.started && roomIsFull && (
          <div style={{
            position:'absolute',
            top:'50%',
            left:'50%',
            transform:'translate(-50%,-50%)',
            zIndex:30,
            display:'flex',
            flexDirection:'column',
            alignItems:'center',
          }}>
            <button
              onClick={handleStartGame}
              disabled={starting}
              style={{
                fontWeight: 900,
                fontSize: 22,
                padding: '12px 38px',
                borderRadius: 16,
                background: 'none',
                color: '#00e6c3',
                border: '2px solid #00e6c3',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textShadow: '0 2px 8px #000a',
              }}
              onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#fff'; }}
              onMouseOut={e => { e.currentTarget.style.color = '#00e6c3'; e.currentTarget.style.borderColor = '#00e6c3'; }}
            >
              {starting ? '...جاري البدء' : 'ابدأ اللعبة'}
            </button>
          </div>
        )}
      </div>
    </div>
    
  );
} 