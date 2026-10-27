import { lerp } from './motion.js';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789<>{}[]()=+-*/\\|$#%&@!?;:~^';
const pick = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

const mix = (from, to, amount) => `rgb(${Math.round(lerp(from[0], to[0], amount))},${Math.round(lerp(from[1], to[1], amount))},${Math.round(lerp(from[2], to[2], amount))})`;
const GREEN_HEAD = [226, 255, 238];
const RED_HEAD = [255, 214, 214];
const GREEN_TAIL = [38, 220, 124];
const RED_TAIL = [255, 48, 66];
const WASH = 0.035; // how much of the screen is faded each 1/60s; lower = longer trails

/**
 * Full-screen falling code. Every column is always in flight, and only each column's head
 * is drawn per step; a translucent black wash fades everything behind it into a long trail.
 */
export function createMatrix(canvas) {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return { render() {}, resize() {}, clear() {}, warm() {} };

  let width = 1;
  let height = 1;
  let cell = 15;
  let columns = [];

  function spawn(column, anywhere) {
    column.row = anywhere ? Math.floor(Math.random() * (height / cell)) : -Math.floor(Math.random() * 14);
    column.pos = column.row;
    column.speed = 10 + Math.random() * 26;
    column.alpha = 0.55 + Math.random() * 0.45;
  }

  function clear() {
    context.globalAlpha = 1;
    context.fillStyle = '#020705';
    context.fillRect(0, 0, width, height);
  }

  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    const scale = Math.min(window.devicePixelRatio || 1, width < 640 ? 1 : 1.5);
    cell = width < 640 ? 13 : 15;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.font = `600 ${cell - 2}px "IBM Plex Mono", Consolas, "Courier New", monospace`;
    context.textBaseline = 'top';
    context.textAlign = 'center';
    columns = Array.from({ length: Math.ceil(width / cell) }, () => {
      const column = { row: 0, pos: 0, speed: 0, alpha: 1 };
      spawn(column, true);
      return column;
    });
    clear();
  }

  // `red` is 0 (hacking, green) .. 1 (alarm, red).
  // `flush` (0..1) multiplies the fade so old-coloured trails vanish quickly.
  function render(dt, red, flush = 0) {
    const step = Math.min(dt, 0.05);
    context.globalAlpha = 1;
    const wash = Math.min(1, WASH * (1 + flush * 14));
    context.fillStyle = `rgba(2, 7, 5, ${(1 - Math.pow(1 - wash, step * 60)).toFixed(3)})`;
    context.fillRect(0, 0, width, height);

    const head = mix(GREEN_HEAD, RED_HEAD, red);
    const tail = mix(GREEN_TAIL, RED_TAIL, red);
    const rows = height / cell;
    for (let index = 0; index < columns.length; index += 1) {
      const column = columns[index];
      column.pos += column.speed * step * (1 + red * 0.9);
      const target = Math.floor(column.pos);
      const x = index * cell + cell / 2;
      while (column.row < target) {
        if (column.row >= 0) {
          // Settle the old head into the trail colour.
          context.globalAlpha = 1;
          context.fillStyle = '#020705';
          context.fillRect(x - cell / 2, column.row * cell, cell, cell);
          context.globalAlpha = column.alpha;
          context.fillStyle = tail;
          context.fillText(pick(), x, column.row * cell);
        }
        column.row += 1;
        if (column.row >= 0) {
          context.globalAlpha = 1;
          context.fillStyle = head;
          context.fillText(pick(), x, column.row * cell);
        }
      }
      // Re-enter from above right away so the screen stays flooded.
      if (column.row > rows) spawn(column, false);
    }
    context.globalAlpha = 1;
  }

  // Build the trails up front so the first frame already looks like a screen full of code.
  function warm(frames = 120, red = 0) {
    clear();
    for (const column of columns) spawn(column, true);
    for (let frame = 0; frame < frames; frame += 1) render(1 / 60, red);
  }

  resize();
  return { render, resize, clear, warm };
}
