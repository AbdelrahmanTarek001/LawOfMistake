import React from 'react';
import styles from '../Room.module.css';

interface Message {
  name: string;
  text: string;
  time: string;
}

interface ChatBoxProps {
  messages: Message[];
  nickname: string;
  message: string;
  setMessage: (msg: string) => void;
  sending: boolean;
  onSend: (e?: React.FormEvent) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, nickname, message, setMessage, sending, onSend }) => {
  return (
    <div className={styles.roomChat}>
      <div className={styles.chatBox}>
        <div style={{fontWeight:900,fontSize:20,color:'#ffd54f',marginBottom:8,letterSpacing:1,textShadow:'0 2px 8px #000a'}}>الدردشة</div>
        <div style={{flex:1,overflowY:'auto',marginBottom:8}}>
          {messages?.filter(m => m.name !== 'system').map((msg, i) => (
            <div key={i} className={msg.name === nickname ? styles.myChatMessage : styles.chatMessage} style={{marginBottom:6}}>
              <span style={{color:'#ffd54f',fontWeight:800,marginLeft:6}}>{msg.name}:</span>
              <span style={{color:'#fff',fontWeight:700}}>{msg.text}</span>
            </div>
          ))}
        </div>
        <form onSubmit={onSend} className={styles.chatInputRow} style={{margin:0}} autoComplete="off">
          <input
            type="text"
            className={styles.chatInput}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="اكتب رسالتك..."
            maxLength={200}
            autoComplete="off"
            disabled={sending}
            style={{background:'rgba(30,30,40,0.92)',color:'#ffd54f',border:'2px solid #ffd54f',fontWeight:700}}
          />
          <button type="submit" className={styles.chatSendBtn} disabled={sending} style={{boxShadow:'0 2px 8px #ffd54f55'}}>
            إرسال
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox; 