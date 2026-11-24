import { CharacterType, RoomState } from '@together-apart/shared';
import { soundSynth } from '../audio/SoundSynth';

export type UIScreen = 'MAIN_MENU' | 'LOBBY' | 'IN_GAME';

export class UIManager {
  // Screens
  private screenMainMenu = document.getElementById('main-menu')!;
  private screenLobby = document.getElementById('lobby-screen')!;
  private screenInGame = document.getElementById('in-game-hud')!;

  // Modals
  private modalCreate = document.getElementById('create-modal')!;
  private modalJoin = document.getElementById('join-modal')!;
  private modalHowToPlay = document.getElementById('how-to-play-modal')!;
  private modalSettings = document.getElementById('settings-modal')!;
  private modalVictory = document.getElementById('victory-modal')!;

  // Toast & Prompt
  private toastElement = document.getElementById('hud-toast')!;
  private toastText = document.getElementById('toast-text')!;
  private interactPrompt = document.getElementById('hud-interact-prompt')!;
  private promptLabel = document.getElementById('prompt-label')!;

  // Lobby elements
  private lobbyRoomCode = document.getElementById('lobby-room-code')!;
  private slotP1Name = document.querySelector('#slot-player-1 .slot-name')!;
  private slotP1Char = document.querySelector('#slot-player-1 .slot-char')!;
  private slotP1Ready = document.querySelector('#slot-player-1 .ready-badge')!;
  private slotP2Name = document.querySelector('#slot-player-2 .slot-name')!;
  private slotP2Char = document.querySelector('#slot-player-2 .slot-char')!;
  private slotP2Ready = document.querySelector('#slot-player-2 .ready-badge')!;
  private btnLobbyReady = document.getElementById('btn-lobby-ready') as HTMLButtonElement;
  private btnLobbyStart = document.getElementById('btn-lobby-start') as HTMLButtonElement;

  // In-Game HUD elements
  private hudModePill = document.getElementById('hud-mode-pill')!;
  private hudRoomCodePill = document.getElementById('hud-room-code-pill')!;
  private hudCheckpointTitle = document.getElementById('hud-checkpoint-title')!;
  private hudP1Name = document.getElementById('hud-p1-name')!;
  private hudP1CD = document.getElementById('hud-p1-cd')!;
  private hudP2Card = document.getElementById('hud-p2-card')!;
  private hudP2CD = document.getElementById('hud-p2-cd')!;
  private hudPartnerDistance = document.getElementById('hud-partner-distance')!;

  // Actions
  public onCreateRoom?: (name: string, character: CharacterType) => void;
  public onJoinRoom?: (code: string, name: string) => void;
  public onLocalPlay?: () => void;
  public onSwitchCharacter?: () => void;
  public onToggleReady?: (ready: boolean) => void;
  public onStartGame?: () => void;
  public onLeaveLobby?: () => void;
  public onReplay?: () => void;

  private isReady: boolean = false;
  private toastTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Audio trigger on first click
    window.addEventListener('click', () => soundSynth.init(), { once: true });

    // Main Menu navigation
    document.getElementById('btn-menu-create')!.onclick = () => {
      this.modalCreate.classList.remove('hidden');
    };
    document.getElementById('btn-menu-join')!.onclick = () => {
      this.modalJoin.classList.remove('hidden');
    };
    document.getElementById('btn-menu-local')!.onclick = () => {
      if (this.onLocalPlay) this.onLocalPlay();
    };
    document.getElementById('btn-menu-settings')!.onclick = () => {
      this.modalSettings.classList.remove('hidden');
    };
    document.getElementById('btn-menu-how-to-play')!.onclick = () => {
      this.modalHowToPlay.classList.remove('hidden');
    };

    // Create Modal
    document.getElementById('btn-create-cancel')!.onclick = () => {
      this.modalCreate.classList.add('hidden');
    };
    document.getElementById('btn-create-confirm')!.onclick = () => {
      const name = (document.getElementById('create-name') as HTMLInputElement).value;
      const char = (document.querySelector('input[name="create-char"]:checked') as HTMLInputElement).value as CharacterType;
      this.modalCreate.classList.add('hidden');
      if (this.onCreateRoom) this.onCreateRoom(name, char);
    };

    // Join Modal
    document.getElementById('btn-join-cancel')!.onclick = () => {
      this.modalJoin.classList.add('hidden');
    };
    document.getElementById('btn-join-confirm')!.onclick = () => {
      const code = (document.getElementById('join-code') as HTMLInputElement).value;
      const name = (document.getElementById('join-name') as HTMLInputElement).value;
      this.modalJoin.classList.add('hidden');
      if (this.onJoinRoom) this.onJoinRoom(code, name);
    };

    // Modals Close
    document.getElementById('btn-htp-close')!.onclick = () => {
      this.modalHowToPlay.classList.add('hidden');
    };
    document.getElementById('btn-settings-close')!.onclick = () => {
      this.modalSettings.classList.add('hidden');
    };

    // Volume & Mute
    const volSlider = document.getElementById('slider-volume') as HTMLInputElement;
    volSlider.oninput = () => soundSynth.setVolume(parseFloat(volSlider.value));
    const muteCheck = document.getElementById('check-mute') as HTMLInputElement;
    muteCheck.onchange = () => soundSynth.setMuted(muteCheck.checked);

    // Lobby Actions
    document.getElementById('btn-copy-code')!.onclick = () => {
      const code = this.lobbyRoomCode.textContent || '';
      navigator.clipboard.writeText(code);
      this.showToast(`Room code ${code} copied to clipboard!`);
    };

    document.getElementById('btn-lobby-switch-char')!.onclick = () => {
      if (this.onSwitchCharacter) this.onSwitchCharacter();
    };

    this.btnLobbyReady.onclick = () => {
      this.isReady = !this.isReady;
      this.btnLobbyReady.textContent = this.isReady ? 'Cancel Ready' : "I'm Ready!";
      this.btnLobbyReady.className = this.isReady ? 'btn btn-ghost' : 'btn btn-accent';
      if (this.onToggleReady) this.onToggleReady(this.isReady);
    };

    this.btnLobbyStart.onclick = () => {
      if (this.onStartGame) this.onStartGame();
    };

    document.getElementById('btn-lobby-leave')!.onclick = () => {
      if (this.onLeaveLobby) this.onLeaveLobby();
      this.showScreen('MAIN_MENU');
    };

    // Victory Actions
    document.getElementById('btn-victory-replay')!.onclick = () => {
      this.modalVictory.classList.add('hidden');
      if (this.onReplay) this.onReplay();
    };
    document.getElementById('btn-victory-menu')!.onclick = () => {
      this.modalVictory.classList.add('hidden');
      this.showScreen('MAIN_MENU');
    };
  }

  public showScreen(screen: UIScreen) {
    this.screenMainMenu.classList.toggle('hidden', screen !== 'MAIN_MENU');
    this.screenLobby.classList.toggle('hidden', screen !== 'LOBBY');
    this.screenInGame.classList.toggle('hidden', screen !== 'IN_GAME');
  }

  public updateLobby(room: RoomState, myPlayerId: string) {
    this.lobbyRoomCode.textContent = room.code;
    const players = Object.values(room.players);

    // Slot 1
    const p1 = players[0];
    if (p1) {
      this.slotP1Name.textContent = p1.name;
      this.slotP1Char.textContent = p1.character === 'lumi' ? '✨ Lumi' : '⚡ Nova';
      this.slotP1Ready.textContent = p1.ready ? 'Ready!' : 'Not Ready';
      this.slotP1Ready.className = `ready-badge ${p1.ready ? 'ready' : 'not-ready'}`;
    }

    // Slot 2
    const p2 = players[1];
    if (p2) {
      this.slotP2Name.textContent = p2.name;
      this.slotP2Char.textContent = p2.character === 'lumi' ? '✨ Lumi' : '⚡ Nova';
      this.slotP2Ready.textContent = p2.ready ? 'Ready!' : 'Not Ready';
      this.slotP2Ready.className = `ready-badge ${p2.ready ? 'ready' : 'not-ready'}`;
    } else {
      this.slotP2Name.textContent = 'Waiting for partner...';
      this.slotP2Char.textContent = '---';
      this.slotP2Ready.textContent = 'Waiting';
      this.slotP2Ready.className = 'ready-badge not-ready';
    }

    // Start button condition: 2 players and both ready
    const canStart = players.length === 2 && players.every(p => p.ready);
    this.btnLobbyStart.disabled = !canStart;
  }

  public setupHUD(mode: 'online' | 'local', roomCode?: string, char1?: CharacterType, char2?: CharacterType) {
    this.hudModePill.textContent = mode === 'online' ? 'Online Co-Op' : 'Local Shared Screen';
    this.hudRoomCodePill.textContent = roomCode ? `Room: ${roomCode}` : 'Local Play';
    this.hudP1Name.textContent = char1 === 'lumi' ? 'Lumi' : 'Nova';

    if (mode === 'local') {
      this.hudP2Card.classList.remove('hidden');
    } else {
      this.hudP2Card.classList.add('hidden');
    }
  }

  public updateHUD(
    p1CdPercent: number,
    partnerDistanceMeters: number,
    p2CdPercent?: number
  ) {
    this.hudP1CD.style.height = `${p1CdPercent * 100}%`;
    if (p2CdPercent !== undefined) {
      this.hudP2CD.style.height = `${p2CdPercent * 100}%`;
    }

    this.hudPartnerDistance.textContent = `Partner: ${partnerDistanceMeters.toFixed(1)}m`;
  }

  public setCheckpointTitle(title: string) {
    this.hudCheckpointTitle.textContent = `📍 ${title}`;
  }

  public showToast(message: string) {
    this.toastText.textContent = message;
    this.toastElement.classList.remove('hidden');
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastElement.classList.add('hidden');
    }, 3800);
  }

  public setInteractPrompt(visible: boolean, label?: string) {
    if (visible && label) {
      this.promptLabel.textContent = label;
      this.interactPrompt.classList.remove('hidden');
    } else {
      this.interactPrompt.classList.add('hidden');
    }
  }

  public showVictory() {
    this.modalVictory.classList.remove('hidden');
    soundSynth.playVictory();
  }
}
