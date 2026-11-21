// Nightshade — Shadow Courier: keyboard and mouse state.
// Keys are tracked by e.code; wasPressed() is true only on the frame the key
// went down. Clicks are queued as canvas pixel positions for click-to-move.

export class Input {
  constructor() {
    this.down = new Set();
    this.pressed = new Set();
    this.clickQueue = [];
    this._onKeyDown = null;
    this._onKeyUp = null;
    this._onMouseDown = null;
  }

  attach(canvas) {
    this._onKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (!this.down.has(e.code)) this.pressed.add(e.code);
      this.down.add(e.code);
    };
    this._onKeyUp = (e) => {
      this.down.delete(e.code);
    };
    this._onMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.clickQueue.push({
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      });
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    canvas.addEventListener('mousedown', this._onMouseDown);
  }

  isDown(code) {
    return this.down.has(code);
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  anyWasPressed(codes) {
    return codes.some((c) => this.pressed.has(c));
  }

  // Movement keys held right now, as a unit-ish vector.
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.down.has('KeyA') || this.down.has('ArrowLeft')) x -= 1;
    if (this.down.has('KeyD') || this.down.has('ArrowRight')) x += 1;
    if (this.down.has('KeyW') || this.down.has('ArrowUp')) y -= 1;
    if (this.down.has('KeyS') || this.down.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.hypot(x, y);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  takeClick() {
    return this.clickQueue.shift() ?? null;
  }

  // Called at the end of each frame: edge presses live for one frame only.
  endFrame() {
    this.pressed.clear();
  }
}
