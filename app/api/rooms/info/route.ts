import { NextRequest, NextResponse } from 'next/server';
import { rooms } from '../create/route';

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
  return NextResponse.json({
    players: room.players,
    owner: room.owner,
    started: room.started,
    messages: room.messages,
    round: room.round,
    voting: room.voting,
    votes: room.votes,
    mistakeVoting: room.mistakeVoting,
    mistakeVotes: room.mistakeVotes,
    killerName: room.killerName,
    scenario: room.scenario, // Add scenario here
  });
} 