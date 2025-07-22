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
  if (!room.scenarioReady) room.scenarioReady = [];
  if (!room.scenarioReady.includes(nickname)) {
    room.scenarioReady.push(nickname);
    saveRooms();
  }
  return NextResponse.json({ scenarioReady: room.scenarioReady });
} 