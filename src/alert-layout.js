// A deliberately uneven cascade, with enough windows on each side of the warning.
export function alertLayout(width, height, mainHeight = 350, count = 12) {
  const mobile = width <= 700;
  const sideScale = mobile ? 1 : Math.min(1, Math.max(.54, (width - 500) / 640));
  const rest = mobile ? {
    A: { x: -width * .14, y: -height * .29 },
    B: { x: width * .12, y: height * .23 },
    C: { x: 0, y: Math.min(-height * .04, Math.max(height - 310 - mainHeight / 2, 76 + mainHeight / 2) - height / 2) }
  } : {
    A: { x: -Math.min(width * .21, 300), y: -Math.min(height * .2, 150) },
    B: { x: Math.min(width * .19, 270), y: Math.min(height * .2, 155) },
    C: { x: 0, y: height < 560 ? 14 : 8 }
  };
  const scatter = [
    [-.34, -.31, -3.2], [.31, -.33, 2.4], [-.27, .05, 1.8], [.38, .09, -3.3],
    [-.38, .29, -2.1], [.22, .36, 2.7], [-.11, -.37, 3.6], [.28, -.06, -4.1],
    [-.34, -.11, -1.5], [.39, .27, 1.2], [-.23, .37, -3.8], [.12, .29, 4.2]
  ];
  const pops = Array.from({ length: count }, (_, index) => {
    const [x, y, rotation] = scatter[index % scatter.length];
    return {
      x: x * width * (mobile ? .56 : 1),
      y: y * height,
      rotation,
      scale: (mobile ? .8 : sideScale) * (.88 + index % 4 * .045)
    };
  });
  return { rest, pops, sideScale };
}
