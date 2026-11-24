import { io } from 'socket.io-client';

async function runMultiplayerTest() {
  console.log('=== TOGETHER APART MULTIPLAYER INTEGRATION TEST ===\n');

  const URL = 'http://localhost:3001';

  // 1. Connect Client 1 (Lumi)
  const client1 = io(URL);
  await new Promise((res) => client1.on('connect', res));
  console.log(`[Client 1] Connected with ID: ${client1.id}`);

  // 2. Create Room
  let roomCode = '';
  await new Promise((resolve) => {
    client1.emit('room:create', { playerName: 'Lumi_Host', character: 'lumi' }, (res) => {
      console.log(`[Client 1] Created Room: ${res.room?.code}`);
      roomCode = res.room.code;
      resolve(res);
    });
  });

  if (!roomCode || roomCode.length !== 6) {
    throw new Error(`Invalid room code: ${roomCode}`);
  }

  // 3. Connect Client 2 (Nova)
  const client2 = io(URL);
  await new Promise((res) => client2.on('connect', res));
  console.log(`[Client 2] Connected with ID: ${client2.id}`);

  // 4. Client 2 joins Room
  await new Promise((resolve) => {
    client2.emit('room:join', { roomCode, playerName: 'Nova_Partner' }, (res) => {
      console.log(`[Client 2] Joined Room ${roomCode}:`, res.success);
      resolve(res);
    });
  });

  // 5. Ready Status and wait for both to be ready
  const readyPromise = new Promise((resolve) => {
    client1.on('room:updated', (room) => {
      const players = Object.values(room.players);
      if (players.length === 2 && players.every((p) => p.ready)) {
        resolve(room);
      }
    });
  });

  client1.emit('room:ready', { ready: true });
  client2.emit('room:ready', { ready: true });
  await readyPromise;
  console.log('[Lobby] Both players confirmed ready by server.');

  // 6. Start Game
  const gameStartedPromise = Promise.all([
    new Promise((res) => client1.once('game:started', res)),
    new Promise((res) => client2.once('game:started', res)),
  ]);
  client1.emit('game:start');
  await gameStartedPromise;
  console.log('[Game] Game successfully started for both players!');

  // 7. Verify Real-time State Tick Sync
  const tickPromise = new Promise((resolve) => {
    client2.once('state:tick', (data) => {
      console.log('[Sync] Received state tick containing players:', Object.keys(data.players));
      resolve(data);
    });
  });

  // Client 1 sends transform
  client1.emit('player:update', {
    transform: {
      position: { x: 0, y: 1.5, z: 5 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      velocity: { x: 0, y: 0, z: 2 },
    },
    isGrounded: true,
    isMoving: true,
  });
  await tickPromise;

  // 8. Test Challenge 1: Trust Bridge
  console.log('\n--- Testing Challenge 1: Trust Bridge ---');
  // Lumi steps on pressure plate
  client1.emit('player:interact', { action: 'switch', targetId: 'plate_on' });
  // Nova locks lever
  const leverPromise = new Promise((resolve) => {
    client1.once('event:message', (msg) => {
      console.log('[Puzzle 1 Event]:', msg.text);
      resolve(msg);
    });
  });
  client2.emit('player:interact', { action: 'lever' });
  await leverPromise;

  // 9. Test Challenge 2: Magical Crossing
  console.log('\n--- Testing Challenge 2: Magical Crossing ---');
  // Lumi spawns platform
  client1.emit('player:ability', {
    abilityType: 'platform',
    position: { x: 0, y: 1.5, z: 62 },
  });
  // Nova pulses mechanism
  const novaPromise = new Promise((resolve) => {
    client1.once('event:message', (msg) => {
      console.log('[Puzzle 2 Event]:', msg.text);
      resolve(msg);
    });
  });
  client2.emit('player:ability', {
    abilityType: 'pulse',
    position: { x: 4.0, y: 2.5, z: 72.0 },
  });
  await novaPromise;

  // 10. Test High-Five
  console.log('\n--- Testing Couple Mechanic: High-Five ---');
  // Position both close together
  client1.emit('player:update', {
    transform: { position: { x: 0, y: 3.5, z: 100 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, velocity: { x: 0, y: 0, z: 0 } },
    isGrounded: true,
    isMoving: false,
  });
  client2.emit('player:update', {
    transform: { position: { x: 1, y: 3.5, z: 100 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, velocity: { x: 0, y: 0, z: 0 } },
    isGrounded: true,
    isMoving: false,
  });

  const highFivePromise = new Promise((resolve) => {
    client2.once('event:highfive', (data) => {
      console.log('[High-Five]: High-five triggered at position:', data.position);
      resolve(data);
    });
  });
  // Wait a tick for positions to sync
  await new Promise((r) => setTimeout(r, 100));
  client1.emit('player:interact', { action: 'highfive' });
  await highFivePromise;

  // 11. Test Challenge 3: Heart Gate Simultaneous Synchronization
  console.log('\n--- Testing Challenge 3: Heart Gate ---');
  const gatePromise = new Promise((resolve) => {
    client1.on('event:message', (msg) => {
      if (msg.text.includes('Heart Gate unlocked')) {
        console.log('[Heart Gate Event]:', msg.text);
        resolve(msg);
      }
    });
  });
  client1.emit('player:interact', { action: 'switch', targetId: 'switch1' });
  client2.emit('player:interact', { action: 'switch', targetId: 'switch2' });
  await gatePromise;

  // 12. Test Level Completion
  console.log('\n--- Testing Level Completion at Victory Summit ---');
  const victoryPromise = new Promise((resolve) => {
    client1.once('event:level_complete', () => {
      console.log('[Victory] event:level_complete received on Client 1!');
      resolve(true);
    });
  });

  // Both players step onto the victory shrine (z > 125)
  client1.emit('player:update', {
    transform: { position: { x: -1, y: 4.5, z: 130 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, velocity: { x: 0, y: 0, z: 0 } },
    isGrounded: true,
    isMoving: false,
  });
  client2.emit('player:update', {
    transform: { position: { x: 1, y: 4.5, z: 130 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, velocity: { x: 0, y: 0, z: 0 } },
    isGrounded: true,
    isMoving: false,
  });

  await victoryPromise;

  // Cleanup
  client1.disconnect();
  client2.disconnect();

  console.log('\n>>> ALL 12 MULTIPLAYER INTEGRATION TESTS PASSED PERFECTLY! <<<');
  process.exit(0);
}

runMultiplayerTest().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
