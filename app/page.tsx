"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Home() {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState('');
  const [copied, setCopied] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false); // start unmuted
  const [showMusicHint, setShowMusicHint] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const router = useRouter();

  React.useEffect(() => {
    // Try to autoplay on mount
    if (audioRef.current) {
      audioRef.current.muted = false;
      audioRef.current.play().catch(() => {
        setShowMusicHint(true);
      });
    }
    const tryPlay = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.muted = false;
        audioRef.current.play();
        setMusicMuted(false);
        setShowMusicHint(false);
      }
    };
    window.addEventListener('click', tryPlay, { once: true });
    window.addEventListener('keydown', tryPlay, { once: true });
    window.addEventListener('touchstart', tryPlay, { once: true });
    return () => {
      window.removeEventListener('click', tryPlay);
      window.removeEventListener('keydown', tryPlay);
      window.removeEventListener('touchstart', tryPlay);
    };
  }, []);

  const handleCreateRoom = async () => {
    if (!nickname.trim()) {
      setError('يرجى إدخال اسمك أولاً');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ ما');
      setCreatedRoom(data.code);
      setCopied(false);
      router.push(`/room/${data.code}?nickname=${encodeURIComponent(nickname)}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!nickname.trim() || !roomCode.trim()) {
      setError('يرجى إدخال اسمك وكود الغرفة');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, code: roomCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error && data.error.includes('full')) {
          setError('هذه الغرفة ممتلئة. الرجاء تجربة غرفة أخرى أو إنشاء غرفة جديدة.');
        } else {
          throw new Error(data.error || 'حدث خطأ ما');
        }
        return;
      }
      router.push(`/room/${roomCode.trim().toUpperCase()}?nickname=${encodeURIComponent(nickname)}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (createdRoom) {
      navigator.clipboard.writeText(createdRoom);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleToggleMusic = () => {
    setMusicMuted((prev) => {
      const newMuted = !prev;
      if (audioRef.current) {
        audioRef.current.muted = newMuted;
        if (!newMuted) audioRef.current.play();
      }
      return newMuted;
    });
  };

  return (
    <div className={styles.lobbyBg}>
      <svg className={styles.bgBlob} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path fill="#b2dfdb" d="M44.8,-67.2C56.7,-60.2,63.7,-44.2,68.2,-28.7C72.7,-13.2,74.7,1.8,70.2,15.2C65.7,28.6,54.7,40.3,41.7,48.7C28.6,57.1,14.3,62.2,-1.2,63.7C-16.7,65.2,-33.4,63.1,-45.2,54.1C-57,45.2,-63.9,29.4,-67.2,13.2C-70.5,-3,-70.2,-19.6,-62.7,-29.7C-55.2,-39.8,-40.5,-43.4,-26.7,-50.2C-12.9,-57,0,-67,14.2,-72.2C28.4,-77.4,56.7,-74.2,44.8,-67.2Z" transform="translate(100 100)" />
      </svg>
      <audio
        ref={audioRef}
        src="/sounds/lobby.mp3"
        autoPlay
        loop
        muted={musicMuted}
        style={{ display: 'none' }}
      />
      {showMusicHint && (
        <div style={{position:'absolute',top:60,left:18,zIndex:10,background:'#fffde7',color:'#00897b',padding:'8px 18px',borderRadius:8,boxShadow:'0 2px 8px #0001',fontFamily:'Tajawal,Cairo,Arial',fontWeight:'bold'}}>
          اضغط في أي مكان لتشغيل الموسيقى
        </div>
      )}
      <button
        onClick={handleToggleMusic}
        style={{ position: 'absolute', top: 18, left: 18, zIndex: 10, background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: 8, padding: '6px 14px', fontFamily: 'Tajawal, Cairo, Arial', cursor: 'pointer', fontWeight: 'bold', color: '#00897b', boxShadow: '0 2px 8px #0001' }}
      >
        {musicMuted ? 'تشغيل الموسيقى 🎵' : 'إيقاف الموسيقى 🔇'}
      </button>
      <main className={styles.main} style={{ direction: 'rtl', textAlign: 'right', width: '100%' }}>
        <div className={styles.lobbyContainer}>
          <div className={styles.lobbyTitle}>
            <span className={styles.lobbyTitleIcon}>⚖️</span>
            لعبة قانون الغلطة
          </div>
          <div className={styles.lobbyDesc}>ادخل اسمك وابدأ اللعب مع أصدقائك أونلاين!</div>
          <label>
            اسمك:
            <input
              type="text"
              value={nickname}
              onChange={e => { setNickname(e.target.value); setError(''); }}
              className={styles.lobbyInput}
              placeholder="مثال: أبو سعود"
              disabled={loading}
            />
          </label>
          <div className={styles.lobbyDivider}>
            <button
              onClick={handleCreateRoom}
              className={`${styles.lobbyButton} ${styles.lobbyCreate}`}
              disabled={loading}
            >
              {loading ? '...جاري الإنشاء' : 'إنشاء غرفة جديدة'}
            </button>
            {createdRoom && (
              <button className={styles.copyCodeBtn} onClick={handleCopyCode} type="button">
                {copied ? 'تم النسخ!' : `نسخ كود الغرفة: ${createdRoom}`}
              </button>
            )}
          </div>
          <hr />
          <label>
            كود الغرفة:
            <input
              type="text"
              value={roomCode}
              onChange={e => { setRoomCode(e.target.value); setError(''); }}
              className={styles.lobbyInput}
              placeholder="مثال: 123ABC"
              disabled={loading}
            />
          </label>
          <button
            onClick={handleJoinRoom}
            className={`${styles.lobbyButton} ${styles.lobbyJoin}`}
            disabled={loading}
          >
            {loading ? '...جاري الانضمام' : 'انضمام لغرفة موجودة'}
          </button>
          {error && <div className={styles.lobbyError}>{error}</div>}
        </div>
        <footer className={styles.lobbyFooter}>
          <p>جميع الحقوق محفوظة &copy; 2024</p>
          <p>تم التطوير بكل ❤️ بواسطة Cody {'</>'}</p>
        </footer>
      </main>
    </div>
  );
}
