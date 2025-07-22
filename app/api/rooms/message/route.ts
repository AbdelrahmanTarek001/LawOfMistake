import { NextRequest, NextResponse } from 'next/server';
import { rooms } from '../create/route';

export async function POST(req: NextRequest) {
  const { code, name, text } = await req.json();
  if (!code || !name || !text) {
    return NextResponse.json({ error: 'كود الغرفة، الاسم، والرسالة مطلوبة' }, { status: 400 });
  }
  const room = rooms[code];
  if (!room) {
    return NextResponse.json({ error: 'الغرفة غير موجودة' }, { status: 404 });
  }
  const message = { name, text, time: Date.now() };
  room.messages.push(message);
  // Keep only last 100 messages
  if (room.messages.length > 100) room.messages = room.messages.slice(-100);
  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'كود الغرفة مطلوب' }, { status: 400 });
  }
  const room = rooms[code];
  if (!room) {
    return NextResponse.json({ error: 'الغرفة غير موجودة' }, { status: 404 });
  }
  return NextResponse.json({ messages: room.messages });
} 