import { NextRequest, NextResponse } from 'next/server';
import { rooms, saveRooms } from '../create/route';

export async function POST(req: NextRequest) {
  const { nickname, code } = await req.json();
  if (!nickname || typeof nickname !== 'string' || !code || typeof code !== 'string') {
    return NextResponse.json({ error: 'الاسم وكود الغرفة مطلوبان' }, { status: 400 });
  }
  const room = rooms[code];
  if (!room) {
    return NextResponse.json({ error: 'الغرفة غير موجودة' }, { status: 404 });
  }
  if (room.started) {
    return NextResponse.json({ error: 'اللعبة بدأت بالفعل' }, { status: 403 });
  }
  if (room.players.length >= 4) {
    return NextResponse.json({ error: 'This room is full. Please try another room or create a new one.' }, { status: 403 });
  }
  if (room.players.some(p => p.name === nickname)) {
    return NextResponse.json({ error: 'الاسم مستخدم بالفعل في هذه الغرفة' }, { status: 409 });
  }
  room.players.push({ name: nickname });
  saveRooms();
  return NextResponse.json({ success: true });
} 