export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const range = (t, a, b) => clamp((t - a) / (b - a));
// Frame-rate independent smoothing: same feel at 30, 60 or 120 fps.
export const damp = (current, target, rate, dt) => lerp(current, target, 1 - Math.exp(-rate * dt));

export const ease = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  // Damped spring from 0 to 1 over t in [0, 1]; overshoots then settles.
  spring: (t, freq = 1.6, decay = 6.5) => (t >= 1 ? 1 : 1 - Math.exp(-decay * t) * Math.cos(2 * Math.PI * freq * t))
};

// Smooth, never-decreasing curve through the given [x, y] points (monotone cubic Hermite).
// Slows near flat stretches and speeds up on steep ones, so a progress bar can stall and surge
// like a real transfer without ever stepping or going backwards.
export function monotoneCurve(points) {
  const count = points.length;
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const widths = [];
  const slopes = [];
  for (let index = 0; index < count - 1; index += 1) {
    widths.push(xs[index + 1] - xs[index]);
    slopes.push((ys[index + 1] - ys[index]) / widths[index]);
  }
  const tangents = [slopes[0]];
  for (let index = 1; index < count - 1; index += 1) {
    tangents.push(slopes[index - 1] * slopes[index] <= 0 ? 0 : (slopes[index - 1] + slopes[index]) / 2);
  }
  tangents.push(slopes[count - 2]);
  for (let index = 0; index < count - 1; index += 1) {
    if (slopes[index] === 0) {
      tangents[index] = 0;
      tangents[index + 1] = 0;
      continue;
    }
    const a = tangents[index] / slopes[index];
    const b = tangents[index + 1] / slopes[index];
    const size = a * a + b * b;
    if (size > 9) {
      const tau = 3 / Math.sqrt(size);
      tangents[index] = tau * a * slopes[index];
      tangents[index + 1] = tau * b * slopes[index];
    }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[count - 1]) return ys[count - 1];
    let index = 0;
    while (x > xs[index + 1]) index += 1;
    const width = widths[index];
    const u = (x - xs[index]) / width;
    const u2 = u * u;
    const u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[index]
      + (u3 - 2 * u2 + u) * width * tangents[index]
      + (-2 * u3 + 3 * u2) * ys[index + 1]
      + (u3 - u2) * width * tangents[index + 1];
  };
}

// Gaussian bump centred on `center`, used for heartbeat-style pulses.
export const pulseAt = (time, center, width) => {
  const distance = (time - center) / width;
  return Math.exp(-(distance * distance));
};

// Plane route in screen pixels measured from the viewport centre (y points up).
export function flightPath(progress, viewportWidth, viewportHeight) {
  const p = clamp(progress);
  const mobile = viewportWidth < 640;
  const baseScale = mobile ? Math.min(0.62, (viewportWidth - 32) / 660) : viewportHeight < 500 ? 0.72 : Math.min(1.02, (viewportWidth - 48) / 800);
  // Both viewports track the aircraft during delivery; the letter releases at ~.61.
  const approach = ease.outCubic(clamp(p / .34)) * (1 - ease.inCubic(clamp((p - .66) / .34)));
  const scale = baseScale * (.78 + .22 * approach);
  const startX = -viewportWidth / 2 - 130 * baseScale;
  // Exits far enough that the towed banner has cleared the screen too.
  const endX = viewportWidth / 2 + 650 * baseScale;
  const at = (p) => {
    const arrive = ease.outCubic(clamp(p / .34));
    const leave = ease.inCubic(clamp((p - .66) / .34));
    const trackingX = 231 * baseScale;
    return {
      x: p <= .66 ? lerp(startX, trackingX, arrive) : lerp(trackingX, endX, leave),
      y: viewportHeight * (mobile ? .2 + .06 * arrive - .04 * leave : .18 + .09 * arrive - .05 * leave)
    };
  };
  const here = at(p);
  const ahead = at(Math.min(1, p + 0.01));
  const behind = at(Math.max(0, p - 0.01));
  const trackingBank = p < .34 ? 1 - range(p, .29, .34) : p > .66 ? range(p, .66, .71) : 0;
  return { x: here.x, y: here.y, angle: clamp(Math.atan2(ahead.y - behind.y, ahead.x - behind.x), -.15, .15) * trackingBank, scale };
}
