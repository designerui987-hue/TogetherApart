import { CharacterType, EmoteType, RoomState } from '@together-apart/shared';
import { soundSynth } from '../audio/SoundSynth';
import { PerformanceStats, QualityPreset } from '../graphics/SceneManager';
import { CharacterShowcase, ShowcaseStats } from '../graphics/CharacterShowcase';

export type UIScreen = 'MAIN_MENU' | 'LOBBY' | 'IN_GAME';

export class UIManager {
  public onTriggerEmote?: (emote: EmoteType) => void;
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
  private modalShowcase = document.getElementById('showcase-modal')!;

  // Performance Overlay
  private perfOverlay = document.getElementById('perf-overlay')!;
  private perfFps = document.getElementById('perf-fps')!;
  private perfMs = document.getElementById('perf-ms')!;
  private perfCalls = document.getElementById('perf-calls')!;
  private perfTris = document.getElementById('perf-tris')!;

  // Showcase
  private showcase: CharacterShowcase | null = null;
  private hudModelPill = document.getElementById('hud-model-pill');

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
  public onQualityPresetChange?: (preset: QualityPreset) => void;
  public onReducedMotionChange?: (enabled: boolean) => void;

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
    const btnMenuShowcase = document.getElementById('btn-menu-showcase');
    if (btnMenuShowcase) {
      btnMenuShowcase.onclick = () => {
        this.openCharacterShowcase();
      };
    }
    const btnCloseShowcase = document.getElementById('btn-showcase-close');
    if (btnCloseShowcase) {
      btnCloseShowcase.onclick = () => {
        this.modalShowcase.classList.add('hidden');
      };
    }

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

    // Graphics Quality Selector
    const selectGraphics = document.getElementById('select-graphics') as HTMLSelectElement;
    if (selectGraphics) {
      selectGraphics.onchange = () => {
        const val = selectGraphics.value as QualityPreset;
        if (this.onQualityPresetChange) this.onQualityPresetChange(val);
      };
    }

    // Reduced Motion Toggle
    const checkMotion = document.getElementById('check-reduced-motion') as HTMLInputElement;
    if (checkMotion) {
      checkMotion.onchange = () => {
        if (this.onReducedMotionChange) this.onReducedMotionChange(checkMotion.checked);
      };
    }

    // Developer Performance Overlay Toggle
    const checkPerf = document.getElementById('check-show-perf') as HTMLInputElement;
    if (checkPerf) {
      checkPerf.onchange = () => {
        this.perfOverlay.classList.toggle('hidden', !checkPerf.checked);
      };
    }

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

    // Couple Emotes
    document.querySelectorAll('.emote-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const emote = btn.getAttribute('data-emote') as EmoteType;
        if (emote && this.onTriggerEmote) {
          this.onTriggerEmote(emote);
        }
      });
    });

    window.addEventListener('keydown', (e) => {
      if (this.screenInGame.classList.contains('hidden')) return;
      const keyMap: Record<string, EmoteType> = {
        '1': 'wave',
        '2': 'highfive',
        '3': 'hug',
        '4': 'dance',
        '5': 'celebrate',
      };
      if (keyMap[e.key] && this.onTriggerEmote) {
        this.onTriggerEmote(keyMap[e.key]);
      }
    });
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
      this.slotP1Char.textContent = p1.character === 'lumi' ? '✨ Lumi (Light Weaver)' : '⚡ Nova (Kinetic Shaper)';
      this.slotP1Ready.textContent = p1.ready ? 'Ready!' : 'Not Ready';
      this.slotP1Ready.className = `ready-badge ${p1.ready ? 'ready' : 'not-ready'}`;
    }

    // Slot 2
    const p2 = players[1];
    if (p2) {
      this.slotP2Name.textContent = p2.name;
      this.slotP2Char.textContent = p2.character === 'lumi' ? '✨ Lumi (Light Weaver)' : '⚡ Nova (Kinetic Shaper)';
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

  public updatePerformanceStats(stats: PerformanceStats) {
    this.perfFps.textContent = `${stats.fps}`;
    this.perfMs.textContent = `${stats.frameTimeMs}ms`;
    this.perfCalls.textContent = `${stats.drawCalls}`;
    this.perfTris.textContent = stats.triangles > 1000 ? `${(stats.triangles / 1000).toFixed(1)}k` : `${stats.triangles}`;
  }

  public setModelVersion(version: 'v2-reference' | 'v1' | 'procedural') {
    if (this.hudModelPill) {
      if (version === 'v2-reference') {
        this.hudModelPill.textContent = 'Model: V2 Reference-Accurate';
        this.hudModelPill.style.borderColor = '#f28b9d';
      } else if (version === 'v1') {
        this.hudModelPill.textContent = 'Model: V1 Production';
        this.hudModelPill.style.borderColor = '#56c5d5';
      } else {
        this.hudModelPill.textContent = 'Model: Procedural Fallback';
        this.hudModelPill.style.borderColor = '#888';
      }
    }
  }

  private openCharacterShowcase() {
    this.modalShowcase.classList.remove('hidden');
    const container = document.getElementById('showcase-3d-canvas');
    if (!container) return;

    if (!this.showcase) {
      this.showcase = new CharacterShowcase(container);

      this.showcase.onStatsUpdated = (stats: ShowcaseStats) => {
        const triElem = document.getElementById('sc-stat-tris');
        if (triElem) triElem.textContent = stats.triangles.toLocaleString();
        const vertElem = document.getElementById('sc-stat-verts');
        if (vertElem) vertElem.textContent = stats.vertices.toLocaleString();
        const meshElem = document.getElementById('sc-stat-meshes');
        if (meshElem) meshElem.textContent = stats.meshes.toString();
        const matElem = document.getElementById('sc-stat-mats');
        if (matElem) matElem.textContent = stats.materials.toString();
      };

      const animSelect = document.getElementById('sc-anim-select') as HTMLSelectElement;
      if (animSelect) {
        this.showcase.onAnimationsLoaded = (names: string[]) => {
          animSelect.innerHTML = '';
          names.forEach((name) => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            animSelect.appendChild(opt);
          });
          animSelect.value = 'Idle';
        };

        animSelect.onchange = () => {
          this.showcase?.playAnimation(animSelect.value);
        };
      }

      const btnLumi = document.getElementById('showcase-btn-lumi');
      const btnNova = document.getElementById('showcase-btn-nova');
      const conceptImg = document.getElementById('showcase-concept-img') as HTMLImageElement;

      const setChar = async (char: 'lumi' | 'nova') => {
        if (char === 'lumi') {
          btnLumi?.classList.add('active');
          btnNova?.classList.remove('active');
          if (conceptImg) conceptImg.src = '/assets/references/lumi-concept.png';
        } else {
          btnNova?.classList.add('active');
          btnLumi?.classList.remove('active');
          if (conceptImg) conceptImg.src = '/assets/references/nova-concept.png';
        }
        await this.showcase?.loadCharacter(char);
      };

      if (btnLumi) btnLumi.onclick = () => setChar('lumi');
      if (btnNova) btnNova.onclick = () => setChar('nova');

      // Camera presets
      document.querySelectorAll<HTMLButtonElement>('.cam-preset-btn').forEach((btn) => {
        btn.onclick = () => {
          document.querySelectorAll('.cam-preset-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          const preset = btn.dataset.cam as any;
          if (preset) this.showcase?.setViewPreset(preset);
        };
      });

      // Anim play/pause & speed
      const btnPlayPause = document.getElementById('sc-anim-toggle');
      if (btnPlayPause) {
        btnPlayPause.onclick = () => {
          if (!this.showcase) return;
          const isPlaying = this.showcase.togglePlayPause();
          btnPlayPause.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
        };
      }

      const speedSlider = document.getElementById('sc-anim-speed') as HTMLInputElement;
      const speedVal = document.getElementById('sc-speed-val');
      if (speedSlider) {
        speedSlider.oninput = () => {
          const spd = parseFloat(speedSlider.value);
          if (speedVal) speedVal.textContent = spd.toFixed(1) + 'x';
          this.showcase?.setAnimationSpeed(spd);
        };
      }

      // Morph target sliders
      document.querySelectorAll<HTMLInputElement>('.morph-slider').forEach((slider) => {
        slider.oninput = () => {
          const morph = slider.dataset.morph!;
          const val = parseFloat(slider.value);
          const valSpan = document.getElementById(`val-${morph.toLowerCase()}`);
          if (valSpan) valSpan.textContent = val.toFixed(2);

          if (morph === 'BlinkBoth') {
            this.showcase?.setMorphTargetValue('BlinkLeft', val);
            this.showcase?.setMorphTargetValue('BlinkRight', val);
          } else {
            this.showcase?.setMorphTargetValue(morph, val);
          }
        };
      });

      // Turntable & Wireframe
      const checkTurntable = document.getElementById('sc-check-turntable') as HTMLInputElement;
      if (checkTurntable) {
        checkTurntable.onchange = () => this.showcase?.toggleTurntable(checkTurntable.checked);
      }

      const checkWireframe = document.getElementById('sc-check-wireframe') as HTMLInputElement;
      if (checkWireframe) {
        checkWireframe.onchange = () => this.showcase?.toggleWireframe(checkWireframe.checked);
      }

      // Concept Drawer Toggle
      const conceptDrawer = document.getElementById('showcase-concept-drawer');
      const btnToggleConcept = document.getElementById('btn-toggle-concept');
      const btnCloseConcept = document.getElementById('btn-concept-drawer-close');
      if (btnToggleConcept && conceptDrawer) {
        btnToggleConcept.onclick = () => conceptDrawer.classList.toggle('hidden');
      }
      if (btnCloseConcept && conceptDrawer) {
        btnCloseConcept.onclick = () => conceptDrawer.classList.add('hidden');
      }

      // Initial load
      setChar('lumi');
    }
  }
}
