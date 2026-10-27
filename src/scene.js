import * as THREE from 'three';
import { clamp, damp, flightPath, lerp, ease } from './motion.js';

const COOL_DUST = new THREE.Color('#92b7bd');
const WARM_DUST = new THREE.Color('#ffffff');
const COOL_RING = new THREE.Color('#23555b');
const WARM_RING = new THREE.Color('#ffffff');
const COOL_KEY = new THREE.Color('#7896a6');
const WARM_KEY = new THREE.Color('#fff4df');

function makeSmokeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 3, 64, 64, 62);
  gradient.addColorStop(0, 'rgba(241,246,244,0.62)');
  gradient.addColorStop(0.22, 'rgba(220,232,233,0.38)');
  gradient.addColorStop(0.58, 'rgba(181,203,207,0.14)');
  gradient.addColorStop(1, 'rgba(160,190,197,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

// A classic high-wing propeller plane, the kind that tows banners over a ceremony.
function makePlane(phone) {
  // Phones get a light plane: Lambert shading instead of physically based, no rim lights, fewer segments.
  const surface = ({ roughness, metalness, ...rest }) => phone ? new THREE.MeshLambertMaterial(rest) : new THREE.MeshStandardMaterial({ roughness, metalness, ...rest });
  const seg = (full, lite) => (phone ? lite : full);
  const group = new THREE.Group();
  const cream = surface({ color: '#f7f2e4', roughness: 0.5, metalness: 0.05, emissive: '#8a8676', emissiveIntensity: 0.55 });
  const red = surface({ color: '#d8453a', roughness: 0.4, metalness: 0.2 });
  const navy = surface({ color: '#24425e', roughness: 0.4, metalness: 0.3 });
  const dark = surface({ color: '#1b232c', roughness: 0.7, metalness: 0.3 });
  const glassOptions = { color: '#7fc4d2', emissive: '#16424d', emissiveIntensity: 0.5, metalness: 0.2, roughness: 0.1 };
  const glass = phone ? surface(glassOptions) : new THREE.MeshPhysicalMaterial({ ...glassOptions, clearcoat: 1 });

  const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(11, 96, seg(8, 4), seg(20, 10)), cream);
  fuselage.rotation.z = -Math.PI / 2;
  group.add(fuselage);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(11.6, 11.6, 14, seg(24, 12), 1, true), navy);
  band.rotation.z = -Math.PI / 2;
  band.position.x = -14;
  group.add(band);
  const cowling = new THREE.Mesh(new THREE.SphereGeometry(11.6, seg(20, 10), seg(14, 8)), red);
  cowling.scale.set(1.15, 1, 1);
  cowling.position.x = 50;
  group.add(cowling);

  // Propeller (spun by the caller) with a faint blur disc.
  const propeller = new THREE.Group();
  propeller.position.x = 66;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 7, seg(14, 8)), surface({ color: '#e1bb73', metalness: 0.7, roughness: 0.3 }));
  hub.rotation.z = -Math.PI / 2;
  propeller.add(hub);
  propeller.add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 52, 6), dark));
  propeller.add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 6, 52), dark));
  const blur = new THREE.Mesh(new THREE.CircleGeometry(26, seg(32, 16)), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
  blur.rotation.y = Math.PI / 2;
  propeller.add(blur);
  group.add(propeller);

  // High wing with red tips and two struts.
  const wingWidth = 28;
  const wingSpan = 170;
  const corner = 10;
  const wingShape = new THREE.Shape();
  wingShape.moveTo(-wingWidth / 2 + corner, -wingSpan / 2);
  wingShape.lineTo(wingWidth / 2 - corner, -wingSpan / 2);
  wingShape.quadraticCurveTo(wingWidth / 2, -wingSpan / 2, wingWidth / 2, -wingSpan / 2 + corner);
  wingShape.lineTo(wingWidth / 2, wingSpan / 2 - corner);
  wingShape.quadraticCurveTo(wingWidth / 2, wingSpan / 2, wingWidth / 2 - corner, wingSpan / 2);
  wingShape.lineTo(-wingWidth / 2 + corner, wingSpan / 2);
  wingShape.quadraticCurveTo(-wingWidth / 2, wingSpan / 2, -wingWidth / 2, wingSpan / 2 - corner);
  wingShape.lineTo(-wingWidth / 2, -wingSpan / 2 + corner);
  wingShape.quadraticCurveTo(-wingWidth / 2, -wingSpan / 2, -wingWidth / 2 + corner, -wingSpan / 2);
  const wing = new THREE.Mesh(new THREE.ExtrudeGeometry(wingShape, { depth: 3, bevelEnabled: true, bevelSize: 0.8, bevelThickness: 0.8, bevelSegments: 1 }), cream);
  wing.position.set(16, 0, 10);
  group.add(wing);
  for (const side of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.BoxGeometry(wingWidth + 0.6, 17, 4.2), red);
    tip.position.set(16, side * (wingSpan / 2 - 10), 11.5);
    group.add(tip);
    const from = new THREE.Vector3(16, 0, -8);
    const to = new THREE.Vector3(16, side * 50, 10);
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, from.distanceTo(to), seg(8, 5)), dark);
    strut.position.copy(from).lerp(to, 0.5);
    strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    group.add(strut);
  }

  // Tail: stabilizer plus a vertical fin.
  const stabilizer = new THREE.Mesh(new THREE.BoxGeometry(16, 58, 2.6), cream);
  stabilizer.position.set(-52, 0, 2);
  group.add(stabilizer);
  for (const side of [-1, 1]) {
    const stabTip = new THREE.Mesh(new THREE.BoxGeometry(16.4, 9, 3), red);
    stabTip.position.set(-52, side * 26, 2);
    group.add(stabTip);
  }
  const finShape = new THREE.Shape();
  finShape.moveTo(-36, 6);
  finShape.lineTo(-64, 6);
  finShape.lineTo(-70, 38);
  finShape.lineTo(-58, 38);
  finShape.closePath();
  const finGeometry = new THREE.ExtrudeGeometry(finShape, { depth: 3, bevelEnabled: true, bevelSize: 0.5, bevelThickness: 0.5, bevelSegments: 1 });
  finGeometry.rotateX(Math.PI / 2); // shape's y becomes world z (up from the fuselage)
  const fin = new THREE.Mesh(finGeometry, navy);
  fin.position.set(0, 1.5, 3);
  group.add(fin);

  // Windscreen, side windows, landing gear.
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1, seg(16, 10), seg(10, 6)), glass);
  canopy.scale.set(16, 8.5, 7);
  canopy.position.set(30, 0, 7);
  group.add(canopy);
  const windowGeometry = new THREE.SphereGeometry(1, seg(10, 6), seg(8, 5));
  for (const side of [-1, 1]) {
    for (const x of [4, 20]) {
      const cabinWindow = new THREE.Mesh(windowGeometry, glass);
      cabinWindow.scale.set(5.5, 1.2, 4);
      cabinWindow.position.set(x, side * 10.6, 3);
      group.add(cabinWindow);
    }
    const legFrom = new THREE.Vector3(22, side * 6, -9);
    const legTo = new THREE.Vector3(22, side * 14, -21);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, legFrom.distanceTo(legTo), seg(8, 5)), dark);
    leg.position.copy(legFrom).lerp(legTo, 0.5);
    leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), legTo.clone().sub(legFrom).normalize());
    group.add(leg);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, 4, seg(18, 10)), dark);
    wheel.position.set(22, side * 15, -21);
    group.add(wheel);
  }

  if (!phone) {
    const cyanRim = new THREE.PointLight(0x9be3e5, 5.5, 430, 1.5);
    cyanRim.position.set(5, 22, 76);
    group.add(cyanRim);
    const warmRim = new THREE.PointLight(0xffcc82, 3.1, 320, 1.6);
    warmRim.position.set(-47, -20, 34);
    group.add(warmRim);
  }

  return { group, propeller };
}

// A banner towed behind the plane. Its right edge is pinned to the tail; the free end ripples.
// The banner covers well under 300 px of a phone screen, so a phone gets a half-size texture. It is drawn at
// 1:1 and never minified, so it needs no mipmaps (building them costs time and a third more memory).
function makeBanner(phone) {
  const canvas = document.createElement('canvas');
  const bannerScale = phone ? 0.5 : 1;
  canvas.width = Math.round(1680 * bannerScale);
  canvas.height = Math.round(220 * bannerScale);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  const paint = () => {
    const context = canvas.getContext('2d');
    context.setTransform(bannerScale, 0, 0, bannerScale, 0, 0);
    context.clearRect(0, 0, 1680, 220);
    context.fillStyle = '#f8f1de';
    context.beginPath();
    context.roundRect(8, 12, 1680 - 16, 196, 16);
    context.fill();
    context.strokeStyle = '#d6b46e';
    context.lineWidth = 9;
    context.stroke();
    context.fillStyle = '#1e3447';
    const message = 'BẢO MỜI BẠN DỰ LỄ TỐT NGHIỆP!';
    let size = 78;
    do {
      context.font = `700 ${size}px "Space Grotesk", system-ui, sans-serif`;
      if (context.measureText(message).width <= 1680 - 140) break;
      size -= 2;
    } while (size > 40);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(message, 1680 / 2, 112);
    texture.needsUpdate = true;
  };
  paint();
  if (document.fonts?.load) document.fonts.load('700 78px "Space Grotesk"').then(paint).catch(() => {});

  const width = 450;
  const height = 59;
  const geometry = new THREE.PlaneGeometry(width, height, 34, 1);
  const base = geometry.attributes.position.array.slice();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, toneMapped: false, depthWrite: false }));
  mesh.position.x = -102 - width / 2;

  const ropes = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-84, 0, 0), new THREE.Vector3(-102, height / 2, 0),
      new THREE.Vector3(-84, 0, 0), new THREE.Vector3(-102, -height / 2, 0)
    ]),
    new THREE.LineBasicMaterial({ color: '#d9d2c0' })
  );

  const group = new THREE.Group();
  group.add(mesh, ropes);
  const positions = geometry.attributes.position;
  return {
    group,
    texture,
    update(time) {
      for (let index = 0; index < positions.count; index += 1) {
        const u = (base[index * 3] + width / 2) / width; // 0 at the free end, 1 at the tail
        const sway = Math.pow(1 - u, 1.3) * 4;
        const phase = u * 7 - time * 3;
        positions.setY(index, base[index * 3 + 1] + Math.sin(phase) * sway);
        positions.setZ(index, Math.sin(phase + 1.2) * sway * 0.25);
      }
      positions.needsUpdate = true;
    }
  };
}

function makeSmokeGeometry(count) {
  const positions = new Float32Array(count * 4 * 3);
  const alphas = new Float32Array(count * 4);
  const uvs = new Float32Array(count * 4 * 2);
  const indices = new Uint16Array(count * 6);
  for (let index = 0; index < count; index += 1) {
    const vertex = index * 4;
    uvs.set([0, 0, 1, 0, 1, 1, 0, 1], vertex * 2);
    indices.set([vertex, vertex + 1, vertex + 2, vertex, vertex + 2, vertex + 3], index * 6);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 2400);
  return geometry;
}

/**
 * Background stage: dust, rings, plane and smoke (the code rain is matrix.js).
 * It owns no clock. The director calls render(state) once per frame:
 * { t, dt, alert, warm, push, drift, impulse, flight }
 */
export function createScene({ canvas }) {
  const fallback = { available: false, render() {}, resize() {}, dispose() {} };

  let renderer;
  const initialDpr = window.devicePixelRatio || 1;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: initialDpr <= 1.5, powerPreference: 'low-power' });
  } catch {
    return fallback;
  }

  const cameraDistance = 1000;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 3600);
  camera.position.set(0, 0, cameraDistance);

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setClearColor('#05090d', 0);
  let pixelCap = window.innerWidth < 640 ? 1 : 1.55;
  renderer.setPixelRatio(Math.min(initialDpr, pixelCap));

  scene.add(new THREE.HemisphereLight(0x99b4c6, 0x10151a, 1.05));
  const keyLight = new THREE.DirectionalLight(0x7896a6, 1.5);
  keyLight.position.set(-240, 360, 420);
  scene.add(keyLight);
  const cyanLight = new THREE.PointLight(0x1dcbce, 0.75, 1100, 1.7);
  cyanLight.position.set(-360, -210, 180);
  scene.add(cyanLight);

  const world = new THREE.Group();
  scene.add(world);

  // Plane and smoke
  const flightGroup = new THREE.Group();
  flightGroup.visible = false;
  world.add(flightGroup);
  const aircraft = new THREE.Group(); // position and heading
  const phone = window.innerWidth < 640;
  const plane = makePlane(phone);
  const airliner = plane.group;
  airliner.scale.setScalar(1.05);
  airliner.rotation.x = 1.3; // restrained side profile, keeping the wing out of the ticket's path
  const banner = makeBanner(phone);
  aircraft.add(airliner, banner.group);
  flightGroup.add(aircraft);
  const smokeTexture = makeSmokeTexture();
  const smokeCount = phone ? 48 : 128;
  const smokeGeometry = makeSmokeGeometry(smokeCount);
  const smokeMaterial = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: smokeTexture }, uTint: { value: new THREE.Color('#fffbed') } },
    vertexShader: `
      attribute float alpha;
      varying vec2 vUv;
      varying float vAlpha;
      void main() {
        vUv = uv;
        vAlpha = alpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform vec3 uTint;
      varying vec2 vUv;
      varying float vAlpha;
      void main() {
        float alpha = texture2D(uMap, vUv).a * vAlpha;
        if (alpha < 0.008) discard;
        gl_FragColor = vec4(uTint, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
  smoke.renderOrder = 2;
  aircraft.traverse((object) => {
    if (object.isMesh) object.renderOrder = 3;
  });
  flightGroup.add(smoke);

  // Ambient dust
  const dustCount = 110;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let index = 0; index < dustCount; index += 1) {
    const depth = -80 - Math.random() * 1450;
    const viewScale = 1 - depth / cameraDistance;
    dustPositions[index * 3] = (Math.random() - 0.5) * 1300 * viewScale;
    dustPositions[index * 3 + 1] = (Math.random() - 0.5) * 900 * viewScale;
    dustPositions[index * 3 + 2] = depth;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMaterial = new THREE.PointsMaterial({ color: '#92b7bd', size: 1.5, transparent: true, opacity: 0.44, sizeAttenuation: false, depthWrite: false });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  world.add(dust);

  // Orbit rings
  const rings = new THREE.Group();
  const ringMaterial = new THREE.LineBasicMaterial({ color: '#23555b', transparent: true, opacity: 0.3, depthWrite: false });
  for (let ring = 0; ring < 5; ring += 1) {
    const points = [];
    const radiusX = 160 + ring * 85;
    const radiusY = 35 + ring * 20;
    for (let step = 0; step <= 100; step += 1) {
      const angle = (step / 100) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radiusX, Math.sin(angle) * radiusY - 170, -230 - ring * 8));
    }
    rings.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), ringMaterial));
  }
  world.add(rings);

  let viewportWidth = 1;
  let viewportHeight = 1;
  let disposed = false;
  let camBaseX = 0;
  let camBaseY = 0;
  let frameAverage = 1 / 60;
  let slowFrames = 0;
  let lowered = false;

  function resize() {
    viewportWidth = Math.max(1, window.innerWidth);
    viewportHeight = Math.max(1, window.innerHeight);
    camera.aspect = viewportWidth / viewportHeight;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(viewportHeight / (2 * cameraDistance)));
    camera.updateProjectionMatrix();
    pixelCap = viewportWidth < 640 ? 1 : 1.55;
    renderer.setPixelRatio(lowered ? 1 : Math.min(window.devicePixelRatio || 1, pixelCap));
    renderer.setSize(viewportWidth, viewportHeight, false);
    rings.scale.set(Math.max(0.6, Math.min(1.35, viewportWidth / 900)), Math.max(0.65, Math.min(1.4, viewportHeight / 640)), 1);
  }

  function updateFlight(s, dt) {
    const active = s.flight !== null && s.flight !== undefined;
    flightGroup.visible = active;
    if (!active) return;
    const path = flightPath(s.flight, viewportWidth, viewportHeight);
    airliner.rotation.x = 1.08 + Math.sin(s.flight * Math.PI * 2) * .2;
    airliner.rotation.y = Math.sin(s.flight * Math.PI * 2) * .045;
    banner.update(s.t);
    plane.propeller.rotation.x = s.t * 45;
    aircraft.position.set(path.x, path.y, 0);
    aircraft.rotation.set(0, 0, path.angle);
    aircraft.scale.setScalar(path.scale);
    aircraft.updateMatrixWorld(true);

    const positions = smokeGeometry.attributes.position.array;
    const alphas = smokeGeometry.attributes.alpha.array;
    for (let index = 0; index < smokeCount; index += 1) {
      const age = Math.floor(index / 2) / (smokeCount / 2 - 1);
      const past = s.flight - age * .2;
      const history = flightPath(Math.max(0, past), viewportWidth, viewportHeight);
      const side = index % 2 ? 1 : -1;
      const cosine = Math.cos(history.angle), sine = Math.sin(history.angle);
      const centerX = history.x + (-65 * cosine - side * 19 * sine) * history.scale - (viewportWidth < 640 ? age * viewportWidth * .35 : 0);
      const centerY = history.y + (-65 * sine + side * 19 * cosine) * history.scale + Math.sin(age * 7) * age * 6;
      const size = (4 + age * 13) * history.scale;
      const fadeIn = clamp(s.flight / .055);
      const fadeOut = 1 - clamp((s.flight - .9) / .1);
      const alpha = past >= 0 ? .65 * Math.pow(1 - age, 1.3) * fadeIn * fadeOut : 0;
      const vertex = index * 4;
      const offset = vertex * 3;
      positions[offset] = centerX - size;
      positions[offset + 1] = centerY - size * 0.7;
      positions[offset + 2] = -30;
      positions[offset + 3] = centerX + size;
      positions[offset + 4] = centerY - size * 0.7;
      positions[offset + 5] = -30;
      positions[offset + 6] = centerX + size;
      positions[offset + 7] = centerY + size * 0.7;
      positions[offset + 8] = -30;
      positions[offset + 9] = centerX - size;
      positions[offset + 10] = centerY + size * 0.7;
      positions[offset + 11] = -30;
      alphas[vertex] = alpha;
      alphas[vertex + 1] = alpha;
      alphas[vertex + 2] = alpha;
      alphas[vertex + 3] = alpha;
    }
    smokeGeometry.attributes.position.needsUpdate = true;
    smokeGeometry.attributes.alpha.needsUpdate = true;
  }

  function render(s) {
    if (disposed) return;
    const dt = Math.min(s.dt || 1 / 60, 0.05);

    // If the device can't hold ~40fps, drop to 1x pixel ratio once.
    frameAverage = lerp(frameAverage, dt, 0.05);
    if (!lowered && frameAverage > 0.026) {
      slowFrames += 1;
      if (slowFrames > 90) {
        lowered = true;
        renderer.setPixelRatio(1);
        renderer.setSize(viewportWidth, viewportHeight, false);
      }
    } else if (frameAverage <= 0.026) {
      slowFrames = 0;
    }

    // Camera: damped toward the target so every transition eases, plus a tiny impulse shake.
    camBaseX = damp(camBaseX, Math.sin(s.t * 0.23) * s.drift, 2.4, dt);
    camBaseY = damp(camBaseY, Math.sin(s.t * 0.31 + 0.8) * s.drift * 0.52, 2.4, dt);
    camera.position.z = damp(camera.position.z, cameraDistance - s.push - s.impulse * 10, 2.4, dt);
    camera.position.x = camBaseX + Math.sin(s.t * 47) * s.impulse * 3;
    camera.position.y = camBaseY + Math.cos(s.t * 53) * s.impulse * 2.4;
    camera.lookAt(camBaseX, camBaseY, 0);

    dustMaterial.color.lerpColors(COOL_DUST, WARM_DUST, s.sky);
    dustMaterial.opacity = 0.44 + s.sky * 0.4;
    ringMaterial.color.lerpColors(COOL_RING, WARM_RING, s.sky);
    ringMaterial.opacity = 0.3 * (1 - s.sky);
    cyanLight.intensity = 0.72 + s.warm * 0.9;
    keyLight.color.lerpColors(COOL_KEY, WARM_KEY, s.sky);
    keyLight.intensity = 1.5 + s.sky * .7;
    dust.rotation.y = Math.sin(s.t * 0.09) * 0.012;
    rings.rotation.z = Math.sin(s.t * 0.16) * (0.026 + s.alert * 0.026);

    updateFlight(s, dt);
    renderer.render(scene, camera);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (material.map) material.map.dispose();
          material.dispose();
        }
      }
    });
    smokeTexture.dispose();
    renderer.dispose();
  }

  // The first frames of the flight used to compile shaders and upload textures as each part of the plane
  // came on screen, a long stall on phones. Compiling ahead is not enough: Safari and ANGLE finish a shader
  // only at its first draw. So, while the check-in screen is idle, draw the whole flight once into a single
  // pixel, with the aircraft parked mid-screen so no part is culled, then hide it again.
  function warmFlight() {
    if (disposed) return;
    flightGroup.visible = true;
    aircraft.position.set(0, 0, 0);
    aircraft.rotation.set(0, 0, 0);
    aircraft.scale.setScalar(0.4);
    renderer.setScissorTest(true);
    renderer.setScissor(0, 0, 1, 1);
    renderer.render(scene, camera);
    renderer.setScissorTest(false);
    flightGroup.visible = false;
  }

  resize();
  window.setTimeout(warmFlight, 500);
  return { available: true, render, resize, dispose };
}
