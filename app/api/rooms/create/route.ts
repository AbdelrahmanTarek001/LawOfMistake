import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
const ROOMS_FILE = './rooms.json';
const ROOMS_FILE_BAK = './rooms.json.bak';

// Atomic save with backup
function saveRooms() {
  try {
    if (fs.existsSync(ROOMS_FILE)) {
      fs.copyFileSync(ROOMS_FILE, ROOMS_FILE_BAK); // backup
    }
    const tmpFile = ROOMS_FILE + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(rooms, null, 2));
    fs.renameSync(tmpFile, ROOMS_FILE);
  } catch (err) {
    console.error('Error saving rooms:', err);
  }
}
// Robust load with backup recovery
function loadRooms() {
  try {
    if (fs.existsSync(ROOMS_FILE)) {
      const data = JSON.parse(fs.readFileSync(ROOMS_FILE).toString());
      Object.assign(rooms, data);
    }
  } catch (err) {
    console.error('Error loading rooms.json:', err);
    // Try backup
    try {
      if (fs.existsSync(ROOMS_FILE_BAK)) {
        const data = JSON.parse(fs.readFileSync(ROOMS_FILE_BAK).toString());
        Object.assign(rooms, data);
        console.warn('Loaded rooms from backup.');
      }
    } catch (bakErr) {
      console.error('Error loading rooms.json.bak:', bakErr);
    }
  }
}
// Singleton/global pattern for rooms
let rooms = globalThis.rooms;
if (!rooms) {
  rooms = {};
  loadRooms();
  globalThis.rooms = rooms;
}
function generateRoomCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
export async function POST(req: NextRequest) {
  const { nickname } = await req.json();
  if (!nickname || typeof nickname !== 'string') {
    return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
  }
  let code = generateRoomCode();
  while (rooms[code]) {
    code = generateRoomCode();
  }
  rooms[code] = {
    players: [{ name: nickname }],
    owner: nickname,
    started: false,
    messages: [],
    round: 1,
    voting: false,
    votes: [],
    mistakeVoting: false,
    mistakeVotes: [],
    killerName: undefined,
  };
  saveRooms(); // احفظ الغرف بعد كل تغيير
  return NextResponse.json({ code });
}
export { rooms, saveRooms, loadRooms }; 