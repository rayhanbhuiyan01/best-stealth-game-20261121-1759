// Keyboard and mouse input for Nightshade.
// WASD or arrows to move, Shift to sneak, P pause, R restart, M mute,
// Enter to start / continue. Clicking the floor sets a move target.
// The canvas keeps focus so keys work the moment the page opens.

export function makeInput(canvas) {
  const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
  };
  const pressed = new Set(); // edge-triggered keys, consumed by main.js
  let clickTarget = null; // {x, y} in canvas pixels, or null
  let muted = false;

  const KEYMAP = {
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    ShiftLeft: 'sneak',
    ShiftRight: 'sneak',
  };

  function onKeyDown(e) {
    if (e.code === 'KeyM') {
      muted = !muted;
      pressed.add('mute');
      e.preventDefault();
      return;
    }
    const name = KEYMAP[e.code];
    if (name) {
      keys[name] = true;
      e.preventDefault();
      return;
    }
    if (['Enter', 'Space', 'KeyP', 'KeyR', 'KeyH'].includes(e.code)) {
      pressed.add(e.code);
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    const name = KEYMAP[e.code];
    if (name) keys[name] = false;
  }

  function onMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    clickTarget = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.setAttribute('tabindex', '0');
  canvas.focus();

  return {
    keys,
    // True once for each press of the named code since the last check.
    wasPressed(code) {
      if (pressed.has(code)) {
        pressed.delete(code);
        return true;
      }
      return false;
    },
    // The latest click target, or null when there is none / it was read.
    takeClick() {
      const t = clickTarget;
      clickTarget = null;
      return t;
    },
    isMuted() {
      return muted;
    },
  };
}
