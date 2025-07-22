import { NextRequest, NextResponse } from 'next/server';
import { rooms, saveRooms } from '../create/route';

export async function POST(req: NextRequest) {
  const { code, nickname } = await req.json();
  if (!code || !nickname) {
    return NextResponse.json({ error: 'كود الغرفة واسم اللاعب مطلوبان' }, { status: 400 });
  }
  const room = rooms[code];
  if (!room) {
    return NextResponse.json({ error: 'الغرفة غير موجودة' }, { status: 404 });
  }
  if (room.started) {
    return NextResponse.json({ error: 'لا يمكن مغادرة الغرفة بعد بدء اللعبة' }, { status: 403 });
  }
  const idx = room.players.findIndex((p: any) => p.name === nickname);
  if (idx !== -1) {
    room.players.splice(idx, 1);
    room.messages.push({ name: 'system', text: `لقد غادر اللاعب ${nickname} الغرفة.`, time: Date.now() });
    if (room.players.length === 0) {
      delete rooms[code]; // Clean up empty room
    }
    saveRooms();
  }
  return NextResponse.json({ success: true });
} 