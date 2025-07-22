import { NextRequest, NextResponse } from 'next/server';
import { rooms, saveRooms } from '../create/route';

function calculatePoints(room: any) {
  // Identify the killer
  const killer = room.players.find((p: any) => p.role === 'مجرم');
  if (!killer) return;
  room.killerName = killer.name;
  
  // Initialize points if they don't exist
  room.players.forEach((p: any) => {
    if (typeof p.points !== 'number') p.points = 0;
  });

  // Killer points logic: +1 for each wrong vote
  const wrongVotes = room.votes.filter((v: any) => v.suspect !== killer.name);
  killer.points += wrongVotes.length;
  
  // +2 for correct killer vote
  for (const vote of room.votes) {
    if (vote.suspect === killer.name) {
      const player = room.players.find((p: any) => p.name === vote.voter);
      if (player) player.points += 2;
    }
  }
  
  // +1 for correct mistake vote
  for (const mvote of room.mistakeVotes) {
    // We need to know the actual mistake for each player to validate.
    // Assuming the mistake card is stored on the player object.
    const targetPlayer = room.players.find((p: any) => p.name === mvote.target);
    // This logic needs to be more specific. For now, let's assume if the target has a mistake, it's a correct vote.
    // This part might need refinement based on how mistakes are assigned and identified.
    if (targetPlayer && targetPlayer.mistake) { 
      const voterPlayer = room.players.find((p: any) => p.name === mvote.voter);
      if (voterPlayer) voterPlayer.points += 1;
    }
  }
}

export async function POST(req: NextRequest) {
  const { code, nickname, suspect, start, startMistakeVoting, target } = await req.json();

  if (!code || !nickname) {
    return NextResponse.json({ error: 'كود الغرفة واسم اللاعب مطلوبان' }, { status: 400 });
  }

  const room = rooms[code];
  if (!room) {
    return NextResponse.json({ error: 'الغرفة غير موجودة' }, { status: 404 });
  }

  // Owner starts the "suspect" voting phase
  if (start) {
    if (room.owner !== nickname) {
      return NextResponse.json({ error: 'فقط صاحب الغرفة يمكنه بدء التصويت' }, { status: 403 });
    }
    if (!room.started) {
      return NextResponse.json({ error: 'اللعبة لم تبدأ بعد' }, { status: 400 });
    }
    room.voting = true;
    room.votes = [];
    room.mistakeVoting = false;
    room.mistakeVotes = [];
    saveRooms();
    return NextResponse.json({ success: true, voting: true });
  }

  // Owner starts the "mistake" voting phase
  if (startMistakeVoting) {
    if (room.owner !== nickname) {
        return NextResponse.json({ error: 'فقط صاحب الغرفة يمكنه بدء تصويت الغلطة' }, { status: 403 });
    }
    // This can only start after the first voting is done
    if (room.voting) {
        return NextResponse.json({ error: 'لا يمكن بدء تصويت الغلطة أثناء التصويت على المجرم' }, { status: 400 });
    }
    room.mistakeVoting = true;
    room.mistakeVotes = []; // Reset mistake votes for the new phase
    saveRooms();
    return NextResponse.json({ success: true, mistakeVoting: true });
  }

  // A player submits a vote for a "mistake"
  if (room.mistakeVoting) {
    if (!target) {
      return NextResponse.json({ error: 'يجب اختيار لاعب للتصويت على غلطته' }, { status: 400 });
    }
    if (room.mistakeVotes.some((v:any) => v.voter === nickname)) {
      return NextResponse.json({ error: 'لقد قمت بالتصويت بالفعل' }, { status: 409 });
    }
    room.mistakeVotes.push({ voter: nickname, target });
    
    // End mistake voting if all players voted
    if (room.mistakeVotes.length >= room.players.length) {
      room.mistakeVoting = false;
      // Now, calculate all points
      calculatePoints(room);
    }
    saveRooms();
    return NextResponse.json({ success: true, mistakeVotes: room.mistakeVotes, mistakeVoting: room.mistakeVoting });
  }

  // A player submits a vote for a "suspect"
  if (room.voting) {
    if (!suspect) {
      return NextResponse.json({ error: 'يجب اختيار مشتبه به' }, { status: 400 });
    }
    if (room.votes.some((v:any) => v.voter === nickname)) {
      return NextResponse.json({ error: 'لقد قمت بالتصويت بالفعل' }, { status: 409 });
    }
    room.votes.push({ voter: nickname, suspect });

    // End "suspect" voting if all players voted
    if (room.votes.length >= room.players.length) {
      room.voting = false; // Just end this phase, don't start the next one automatically
      // Identify and set the criminal's name for the reveal scene
      const killer = room.players.find((p: any) => p.role === 'مجرم');
      if (killer) {
        room.killerName = killer.name;
      }
      // DO NOT start mistake voting automatically anymore
    }
    saveRooms();
    return NextResponse.json({ success: true, votes: room.votes, voting: room.voting });
  }

  return NextResponse.json({ error: 'لا يوجد تصويت متاح حالياً' }, { status: 400 });
} 