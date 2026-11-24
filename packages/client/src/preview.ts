import '../style.css';
import { CharacterShowcase, ShowcaseStats } from './graphics/CharacterShowcase';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('preview-canvas-container');
  if (!container) return;

  const showcase = new CharacterShowcase(container);

  // Stats
  showcase.onStatsUpdated = (stats: ShowcaseStats) => {
    document.getElementById('stat-tris')!.textContent = stats.triangles.toLocaleString();
    document.getElementById('stat-verts')!.textContent = stats.vertices.toLocaleString();
    document.getElementById('stat-meshes')!.textContent = stats.meshes.toString();
    document.getElementById('stat-mats')!.textContent = stats.materials.toString();
  };

  // Animations dropdown
  const animSelect = document.getElementById('anim-select') as HTMLSelectElement;
  showcase.onAnimationsLoaded = (names: string[]) => {
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
    showcase.playAnimation(animSelect.value);
  };

  // Character switch buttons
  const btnLumi = document.getElementById('btn-char-lumi') as HTMLButtonElement;
  const btnNova = document.getElementById('btn-char-nova') as HTMLButtonElement;
  const conceptImg = document.getElementById('concept-img') as HTMLImageElement;

  const setChar = async (char: 'lumi' | 'nova') => {
    if (char === 'lumi') {
      btnLumi.classList.add('active');
      btnNova.classList.remove('active');
      conceptImg.src = '/assets/references/lumi-concept.png';
    } else {
      btnNova.classList.add('active');
      btnLumi.classList.remove('active');
      conceptImg.src = '/assets/references/nova-concept.png';
    }
    await showcase.loadCharacter(char);
  };

  btnLumi.onclick = () => setChar('lumi');
  btnNova.onclick = () => setChar('nova');

  // Camera presets
  document.querySelectorAll<HTMLButtonElement>('.cam-btn').forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll('.cam-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.dataset.cam as any;
      if (preset) showcase.setViewPreset(preset);
    };
  });

  // Play / Pause & Speed
  const btnPlayPause = document.getElementById('btn-play-pause') as HTMLButtonElement;
  btnPlayPause.onclick = () => {
    const isPlaying = showcase.togglePlayPause();
    btnPlayPause.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
  };

  const speedSlider = document.getElementById('slider-speed') as HTMLInputElement;
  const speedVal = document.getElementById('val-speed') as HTMLElement;
  speedSlider.oninput = () => {
    const spd = parseFloat(speedSlider.value);
    speedVal.textContent = spd.toFixed(1) + 'x';
    showcase.setAnimationSpeed(spd);
  };

  // Morph Target Sliders
  document.querySelectorAll<HTMLInputElement>('.morph-slider').forEach((slider) => {
    slider.oninput = () => {
      const morph = slider.dataset.morph!;
      const val = parseFloat(slider.value);
      const valSpan = document.getElementById(`val-${morph.toLowerCase()}`);
      if (valSpan) valSpan.textContent = val.toFixed(2);

      if (morph === 'BlinkBoth') {
        showcase.setMorphTargetValue('BlinkLeft', val);
        showcase.setMorphTargetValue('BlinkRight', val);
      } else {
        showcase.setMorphTargetValue(morph, val);
      }
    };
  });

  // Turntable & Wireframe
  const checkTurntable = document.getElementById('check-turntable') as HTMLInputElement;
  checkTurntable.onchange = () => showcase.toggleTurntable(checkTurntable.checked);

  const checkWireframe = document.getElementById('check-wireframe') as HTMLInputElement;
  checkWireframe.onchange = () => showcase.toggleWireframe(checkWireframe.checked);

  // Concept Art Split View Toggle
  const conceptBox = document.getElementById('concept-split-box')!;
  const btnToggleConcept = document.getElementById('btn-toggle-concept')!;
  btnToggleConcept.onclick = () => {
    conceptBox.classList.toggle('hidden');
  };

  // Initial load
  await setChar('lumi');
});
