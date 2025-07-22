import { NextRequest, NextResponse } from 'next/server';
import { rooms, saveRooms } from '../create/route';
import { scenarios, Scenario } from '../../../lib/scenarios'; // Corrected import path again

const ROLES = ['قاضي', 'محامي', 'مجرم', 'شاهد', 'مزيف']; // Keep existing roles

function getRandomItems<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < count && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

export async function POST(req: NextRequest) {
  const { code, nickname, newRound } = await req.json();
  if (!code || !nickname) {
    return NextResponse.json({ error: 'كود الغرفة واسم اللاعب مطلوبان' }, { status: 400 });
  }
  const room = rooms[code];
  if (!room) {
    return NextResponse.json({ error: 'الغرفة غير موجودة' }, { status: 404 });
  }
  if (room.owner !== nickname) {
    return NextResponse.json({ error: 'فقط صاحب الغرفة يمكنه بدء اللعبة' }, { status: 403 });
  }
  // Start new round if already started
  if (room.started && newRound) {
    room.round = (room.round || 1) + 1;
    // Assign new scenario
    const selectedScenario: Scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    room.scenario = {
      description: selectedScenario.description,
      title: selectedScenario.title,
    };

    // Shuffle players and assign new roles/info/mistake, keep points
    const shuffled = [...room.players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    let nonCriminalInfoIndex = 0;
    let criminalInfoIndex = 0;
    const usedLogicalMistakes: Set<string> = new Set(); // Use Set for unique mistakes

    for (let i = 0; i < shuffled.length; i++) {
      const player = shuffled[i];
      player.role = ROLES[i % ROLES.length]; // Assign roles

      if (player.role === 'مجرم') {
        player.info = [selectedScenario.criminalInfoSets[criminalInfoIndex % selectedScenario.criminalInfoSets.length]]; // Criminal gets 1 info
        criminalInfoIndex++;
        // Criminal gets 2 mistakes as an array
        const mistake1 = getRandomItemUnique(selectedScenario.logicalMistakes, usedLogicalMistakes);
        const mistake2 = getRandomItemUnique(selectedScenario.logicalMistakes, usedLogicalMistakes, mistake1);
        player.mistake = [mistake1, mistake2].filter(Boolean);
      } else {
        player.info = selectedScenario.nonCriminalInfoSets[nonCriminalInfoIndex % selectedScenario.nonCriminalInfoSets.length]; // Non-criminal gets 3 infos
        nonCriminalInfoIndex++;
        // Non-criminal gets 1 mistake as a string
        player.mistake = getRandomItemUnique(selectedScenario.logicalMistakes, usedLogicalMistakes);
      }
      // keep points as is
    }
    room.players = shuffled;
    room.voting = false;
    room.votes = [];
    room.mistakeVoting = false;
    room.mistakeVotes = [];
    room.killerName = undefined;
    saveRooms();
    return NextResponse.json({ success: true, players: room.players, round: room.round, scenario: room.scenario });
  }

  // Start first game
  if (room.started) {
    return NextResponse.json({ error: 'اللعبة بدأت بالفعل' }, { status: 409 });
  }

  // Assign roles randomly
  const shuffled = [...room.players];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Assign initial scenario for the first game
  const selectedScenario: Scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  room.scenario = {
    description: selectedScenario.description,
    title: selectedScenario.title,
  };

  let nonCriminalInfoIndex = 0;
  let criminalInfoIndex = 0;
  const usedLogicalMistakes: Set<string> = new Set();

  for (let i = 0; i < shuffled.length; i++) {
    const player = shuffled[i];
    player.role = ROLES[i % ROLES.length]; // Assign roles

    if (player.role === 'مجرم') {
      player.info = [selectedScenario.criminalInfoSets[criminalInfoIndex % selectedScenario.criminalInfoSets.length]]; // Criminal gets 1 info
      criminalInfoIndex++;
      const mistake1 = getRandomItemUnique(selectedScenario.logicalMistakes, usedLogicalMistakes);
      const mistake2 = getRandomItemUnique(selectedScenario.logicalMistakes, usedLogicalMistakes, mistake1);
      player.mistake = [mistake1, mistake2].filter(Boolean); // Two mistakes as an array
    } else {
      player.info = selectedScenario.nonCriminalInfoSets[nonCriminalInfoIndex % selectedScenario.nonCriminalInfoSets.length]; // Non-criminal gets 3 infos
      nonCriminalInfoIndex++;
      player.mistake = getRandomItemUnique(selectedScenario.logicalMistakes, usedLogicalMistakes); // One mistake as a string
    }
    player.points = 0; // Reset points for first game
  }

  room.players = shuffled;
  room.started = true;
  room.round = 1;
  saveRooms();
  return NextResponse.json({ success: true, players: room.players, scenario: room.scenario });
}

function getRandomItemUnique<T>(arr: T[], usedSet: Set<T>, excludeItem?: T): T {
  const availableItems = arr.filter(item => !usedSet.has(item) && item !== excludeItem);
  if (availableItems.length === 0) {
    // If no unique items left, reset the set or handle error
    usedSet.clear();
    return getRandomItemUnique(arr, usedSet, excludeItem); // Try again with cleared set
  }
  const item = availableItems[Math.floor(Math.random() * availableItems.length)];
  usedSet.add(item);
  return item;
} 