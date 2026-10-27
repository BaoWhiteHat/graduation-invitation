// The arrival mascot has two hand-built poses next to the story artwork, which stays untouched:
//  - "sturdy": follows the Vinflow "Sturdy" tutorial: kick the front foot twice on each side, sit and kick
//    out left and right, then stay low and lift the feet in turn. One arm reaches out while the other
//    crosses the belt. Poses and timing live in styles.css (one 3.2 s loop, keyed by percentages).
//  - "freeze": a tripod headstand. The crown of the head and both palms touch the floor (palms either
//    side of the head), the shoulders stack over the hands, the hips over the shoulders, and the legs go
//    up, one straight and one with a bent knee. The mortarboard rests on the floor beside him.
const SLEEVE = '#254b66', SLEEVE_LINE = '#0d2337', CUFF = '#58c83b';
const SKIN = '#f4cba8', SKIN_LINE = '#915f50';
const PANTS = '#223756', PANTS_LINE = '#0c182a', SHOE = '#fff9e9', SHOE_LINE = '#172034';

// A limb is two strokes: a dark outline underneath and the cloth colour on top.
const limb = (d, width, color, line) =>
  `<path d="${d}" fill="none" stroke="${line}" stroke-width="${width + 7}"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${width}"/>`;

// An arm hangs straight down from its shoulder at (0, 0); rotating the group swings it from the shoulder
// and rotating .dance-fore bends the elbow. Positive angles swing the hand toward the viewer's left.
const standingArm = side => `<g class="dance-arm dance-arm-${side}" stroke-linecap="round" stroke-linejoin="round">
  ${limb('M0 0V38', 13, SLEEVE, SLEEVE_LINE)}
  <g transform="translate(0 38)"><g class="dance-fore">
    ${limb('M0 0V28', 12, SLEEVE, SLEEVE_LINE)}
    <path d="M-6.5 23h13" stroke="${CUFF}" stroke-width="5" fill="none"/>
    <circle cx="0" cy="34" r="11" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="3"/>
  </g></g>
</g>`;

const leftShoe = '<path d="M60 271q23-12 45 2l-4 10-42-1Z" fill="#fff9e9" stroke="#172034" stroke-width="4"/>';
const rightShoe = '<path d="M123 272q23-12 39-1l9 13h-49Z" fill="#fff9e9" stroke="#172034" stroke-width="4"/>';

// A leg hangs from its hip at (hipX, 220), hidden under the robe: the group swings the thigh from the hip and
// .dance-shin bends the knee. Positive angles swing the foot toward the viewer's left, like the arms. The
// legs are long enough for a kick to leave the robe, and a deep squat drops the hips by 23 px. The shoe's own
// coordinates are the story artwork's, so it is shifted to sit at the end of the shin.
const standingLeg = (side, hipX, shoe, shoeCenter) => `<g transform="translate(${hipX} 220)"><g class="dance-leg dance-leg-${side}" stroke-linecap="round" stroke-linejoin="round">
  ${limb('M0 0V28', 17, PANTS, PANTS_LINE)}
  <g transform="translate(0 28)"><g class="dance-shin">
    ${limb('M0 0V24', 16, PANTS, PANTS_LINE)}
    <g transform="translate(-${shoeCenter} -253)">${shoe}</g>
  </g></g>
</g></g>`;

// Upside-down shoe at an ankle: the sole faces the sky.
const flippedShoe = (x, y, angle, mirror) =>
  `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${mirror ? -0.8 : 0.8} -0.8) translate(-${mirror ? 147 : 82} -277)" stroke-linejoin="round">${mirror ? rightShoe : leftShoe}</g>`;

const freezeLeg = (className, path, pivot, shoe) =>
  `<g class="${className}" style="transform-origin:${pivot}" stroke-linecap="round" stroke-linejoin="round">${limb(path, 17, PANTS, PANTS_LINE)}${shoe}</g>`;

export function createArrivalDance(stage, artwork) {
  const ns = 'http://www.w3.org/2000/svg';
  const group = (className, transform) => {
    const node = document.createElementNS(ns, 'g');
    if (className) node.setAttribute('class', className);
    if (transform) node.setAttribute('transform', transform);
    return node;
  };

  // --- Standing rig: the story mascot split into legs, torso, head, and two new arms.
  const children = [...artwork.children];
  const shadow = children[0];
  const oldLegs = children.slice(1, 3);
  const bodyStart = children.indexOf(artwork.querySelector('.m-cloth'));
  const headStart = children.indexOf(artwork.querySelector('.m-hair-back'));
  const headEnd = children.indexOf(artwork.querySelector('[id$="-mShades"]'));
  const body = group('dance-torso');
  children.slice(bodyStart, headStart).filter(node => !node.matches('.fit-security, .fit-captain')).forEach(node => body.append(node));
  // The certificate is put aside before dancing; the sash stays on the robe.
  body.querySelector('.fit-grad > g:last-child')?.remove();
  const head = group('dance-head');
  children.slice(headStart, headEnd).forEach(node => head.append(node));
  const hat = artwork.querySelector('[id$="-mHat"]');
  head.append(hat);

  const legs = group('dance-feet');
  legs.innerHTML = `${standingLeg('left', 89, leftShoe, 82)}${standingLeg('right', 136, rightShoe, 147)}`;
  oldLegs.forEach(node => node.remove());

  const arms = group('dance-arms');
  arms.innerHTML = `<g transform="translate(62 172)">${standingArm('l')}</g><g transform="translate(160 172)">${standingArm('r')}</g>`;

  artwork.replaceChildren(shadow, legs, body, arms, head);
  artwork.classList.add('dance-upright');

  // --- Tripod headstand rig, drawn upside-down on a floor at y = 290.
  const freeze = document.createElementNS(ns, 'svg');
  freeze.setAttribute('viewBox', '0 0 300 310');
  freeze.classList.add('dance-freeze');
  freeze.innerHTML = `<ellipse cx="150" cy="293" rx="112" ry="7" fill="#19364c" opacity=".14"/>
    <g class="freeze-wobble">
      ${freezeLeg('freeze-leg-straight', 'M137 160 119 92', '137px 160px', flippedShoe(117, 84, -14, false))}
      ${freezeLeg('freeze-leg-bent', 'M164 160 180 118 152 94', '164px 160px', flippedShoe(147, 86, 62, true))}
      <g class="freeze-torso"></g>
      <g stroke-linecap="round" stroke-linejoin="round">
        ${limb('M192 205 226 244 230 270', 13, SLEEVE, SLEEVE_LINE)}
        <path d="M222 259h16" stroke="${CUFF}" stroke-width="5" fill="none"/>
        <circle cx="231" cy="279" r="11" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="3"/>
        ${limb('M108 205 74 244 70 270', 13, SLEEVE, SLEEVE_LINE)}
        <path d="M62 259h16" stroke="${CUFF}" stroke-width="5" fill="none"/>
        <circle cx="69" cy="279" r="11" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="3"/>
      </g>
      <g class="freeze-head"></g>
    </g>
    <g class="freeze-hat"></g>`;
  // Shoulders sit directly above the head and the robe hangs toward the sky.
  const freezeBody = group('', 'translate(150 216) rotate(180) scale(.8) translate(-111 -152)');
  freezeBody.append(body.cloneNode(true));
  freeze.querySelector('.freeze-torso').append(freezeBody);
  // The head is upside-down with its crown on the floor; the cap is off, so the hair shows.
  const freezeHead = group('', 'translate(150 240) rotate(180) scale(.8) translate(-111 -98)');
  const headCopy = head.cloneNode(true);
  headCopy.querySelector('[id$="-mHat"]')?.remove();
  headCopy.querySelector('.fit-grad')?.remove();
  headCopy.querySelectorAll('.m-hair-back, .m-hair-front').forEach(node => node.classList.add('freeze-hair'));
  freezeHead.append(headCopy);
  freeze.querySelector('.freeze-head').append(freezeHead);
  const restingHat = group('', 'translate(258 277) rotate(-30) scale(.42) translate(-111 -70)');
  restingHat.append(hat.cloneNode(true));
  freeze.querySelector('.freeze-hat').append(restingHat);
  // Cloned gradients and clips must never collide with the standing pose.
  freeze.querySelectorAll('[id]').forEach(node => { node.id = `freeze-${node.id}`; });
  freeze.querySelectorAll('*').forEach(node => {
    for (const attr of [...node.attributes]) {
      if (attr.value.includes('url(#')) node.setAttribute(attr.name, attr.value.replace(/url\(#([^)]+)\)/g, 'url(#freeze-$1)'));
    }
  });

  stage.dataset.pose = 'auto';
  stage.append(artwork, freeze);
  const controls = document.querySelector('.dance-controls');
  controls.addEventListener('click', event => {
    const button = event.target.closest('button[data-pose]');
    if (!button) return;
    stage.dataset.pose = button.dataset.pose;
    controls.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  });
}
