import * as THREE from 'three';

// Original, soft sculpted visitors. All dimensions are in scene units; the
// character looks along +Z and its shoes rest on Y=0 in the neutral pose.
const geometryCache = new Map();
const materialCache = new Map();
const sphereGeometry = new THREE.SphereGeometry(1, 24, 18);

function material(color, roughness = .82) {
  const key = `${color}:${roughness}`;
  if (!materialCache.has(key)) {
    materialCache.set(key, new THREE.MeshStandardMaterial({color, roughness}));
  }
  return materialCache.get(key);
}

function mesh(geometry, color, roughness) {
  const object = new THREE.Mesh(geometry, material(color, roughness));
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}

function ball(parent, size, color, position = [0, 0, 0], roughness) {
  const object = mesh(sphereGeometry, color, roughness);
  object.scale.set(...size);
  object.position.set(...position);
  parent.add(object);
  return object;
}

function roundedGeometry(width, height, depth, radius) {
  const key = `box:${width}:${height}:${depth}:${radius}`;
  if (!geometryCache.has(key)) {
    const geometry = new THREE.BoxGeometry(width, height, depth, 6, 6, 6);
    const position = geometry.attributes.position;
    const inner = new THREE.Vector3(width / 2 - radius, height / 2 - radius, depth / 2 - radius);
    const point = new THREE.Vector3();
    const nearest = new THREE.Vector3();
    const normal = geometry.attributes.normal;
    for (let i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i);
      nearest.set(
        THREE.MathUtils.clamp(point.x, -inner.x, inner.x),
        THREE.MathUtils.clamp(point.y, -inner.y, inner.y),
        THREE.MathUtils.clamp(point.z, -inner.z, inner.z)
      );
      point.sub(nearest).normalize();
      normal.setXYZ(i, point.x, point.y, point.z);
      point.multiplyScalar(radius).add(nearest);
      position.setXYZ(i, point.x, point.y, point.z);
    }
    geometryCache.set(key, geometry);
  }
  return geometryCache.get(key);
}

function softBox(parent, size, radius, color, position = [0, 0, 0]) {
  const object = mesh(roundedGeometry(...size, radius), color);
  object.position.set(...position);
  parent.add(object);
  return object;
}

function capsule(parent, radius, length, color, position = [0, 0, 0]) {
  const key = `capsule:${radius}:${length}`;
  if (!geometryCache.has(key)) {
    geometryCache.set(key, new THREE.CapsuleGeometry(radius, length, 8, 16));
  }
  const object = mesh(geometryCache.get(key), color);
  object.position.set(...position);
  parent.add(object);
  return object;
}

function lineGeometry(points, radius) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 20, radius, 7, false);
}

// Average normals at the polar/seam duplicates as well as within the indexed
// surface. This keeps the crown smooth under the broad cinema key light.
function smoothSeams(geometry) {
  geometry.computeVertexNormals();
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const groups = new Map();
  for (let i = 0; i < position.count; i++) {
    const key = `${Math.round(position.getX(i) * 100000)},${Math.round(position.getY(i) * 100000)},${Math.round(position.getZ(i) * 100000)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(i);
  }
  const average = new THREE.Vector3();
  for (const indices of groups.values()) {
    if (indices.length < 2) continue;
    average.set(0, 0, 0);
    for (const i of indices) average.add(new THREE.Vector3().fromBufferAttribute(normal, i));
    average.normalize();
    for (const i of indices) normal.setXYZ(i, average.x, average.y, average.z);
  }
  return geometry;
}

function hairCapGeometry(style) {
  const key = `hair:${style}`;
  if (geometryCache.has(key)) return geometryCache.get(key);
  const segments = 64;
  const rings = 28;
  const vertices = [];
  const indices = [];
  // The fringe is part of the cap's continuous curved surface, rather than an
  // extruded flat shape placed on top. Its asymmetric edge creates soft locks
  // without overlapping triangles or a hard seam across the forehead.
  for (let ring = 0; ring <= rings + 2; ring++) {
    for (let column = 0; column <= segments; column++) {
      const theta = column / segments * Math.PI * 2;
      const signedTheta = Math.atan2(Math.sin(theta), Math.cos(theta));
      const front = (Math.cos(theta) + 1) / 2;
      const backLength = style === 'bob' ? 2.22 : style === 'crop' ? 1.85 : 1.98;
      const base = backLength - (backLength - 1.16) * Math.pow(front, 3);
      const leftLock = Math.exp(-Math.pow((signedTheta + .34) / .26, 2));
      const part = Math.exp(-Math.pow((signedTheta - .20) / .19, 2));
      const hairline = base + (style === 'crop' ? .035 : .105) * leftLock - .055 * part;
      const phi = Math.min(ring, rings) / rings * hairline + (ring > rings ? .012 : 0);
      const sink = ring > rings ? (ring - rings) * .014 : 0;
      const sweep = style === 'crop' ? 0 : .012 * Math.exp(-Math.pow((signedTheta + .18 + phi * .18) / .65, 2)) * Math.sin(phi) * front;
      const softPart = style === 'crop' ? 0 : .009 * Math.exp(-Math.pow((signedTheta - .60 + phi * .60) / .18, 2)) * Math.sin(phi) * front * front;
      const sculpt = sweep - softPart;
      vertices.push(
        Math.sin(phi) * Math.sin(theta) * (.485 - sink + sculpt),
        Math.cos(phi) * (.505 - sink + sculpt),
        Math.sin(phi) * Math.cos(theta) * (.445 - sink + sculpt)
      );
      if (ring < rings + 2 && column < segments) {
        const a = ring * (segments + 1) + column;
        const b = a + segments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  smoothSeams(geometry);
  geometryCache.set(key, geometry);
  return geometry;
}

function headGeometry() {
  if (geometryCache.has('head')) return geometryCache.get('head');
  const geometry = sphereGeometry.clone();
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    const cheek = 1 + .055 * Math.exp(-Math.pow((y + .22) / .39, 2));
    const chin = y < -.5 ? 1 + (y + .5) * .13 : 1;
    position.setXYZ(i, x * .46 * cheek * chin, y * .475, z * .42);
  }
  smoothSeams(geometry);
  geometryCache.set('head', geometry);
  return geometry;
}

function shade(color, amount) {
  return `#${new THREE.Color(color).offsetHSL(0, 0, amount).getHexString()}`;
}

export function createAvatar({shirt = '#cb7052', skin = '#e8b48d', hair = '#49382f', style = 'swoop', pants = '#e5d6b3', name = ''} = {}) {
  const group = new THREE.Group();
  group.name = name || 'Cinema visitor';
  const rig = new THREE.Group();
  group.add(rig);
  const torso = new THREE.Group();
  rig.add(torso);
  const darkHair = shade(hair, -.025);

  softBox(torso, [.64, .61, .40], .13, shirt, [0, .98, 0]);
  softBox(torso, [.51, .20, .34], .09, pants, [0, .665, -.005]);
  capsule(torso, .085, .10, skin, [0, 1.305, 0]);
  for (const side of [-1, 1]) {
    const collar = softBox(torso, [.095, .12, .035], .017, shade(shirt, .14), [side * .063, 1.24, .193]);
    collar.rotation.z = side * .36;
  }
  softBox(torso, [.10, .105, .018], .017, shade(shirt, .045), [.16, 1.075, .203]);
  ball(torso, [.014, .014, .009], '#eadbc3', [0, 1.14, .213]);
  ball(torso, [.014, .014, .009], '#eadbc3', [0, 1.065, .213]);

  const arms = [];
  const elbows = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * .35, 1.21, 0);
    torso.add(arm);
    capsule(arm, .073, .16, skin, [side * .012, -.15, 0]);
    capsule(arm, .105, .05, shirt, [0, -.055, 0]);
    const elbow = new THREE.Group();
    elbow.position.set(side * .012, -.25, 0);
    arm.add(elbow);
    capsule(elbow, .064, .12, skin, [0, -.11, .012]);
    ball(elbow, [.078, .09, .072], skin, [0, -.235, .02]);
    arms.push(arm);
    elbows.push(elbow);
  }

  const legs = [];
  const knees = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * .145, .64, 0);
    rig.add(leg);
    capsule(leg, .089, .18, pants, [0, -.12, 0]);
    const knee = new THREE.Group();
    knee.position.y = -.25;
    leg.add(knee);
    capsule(knee, .083, .17, pants, [0, -.13, 0]);
    softBox(knee, [.19, .16, .29], .065, '#695b48', [0, -.31, .045]);
    softBox(knee, [.195, .035, .295], .016, '#d8cbb2', [0, -.3725, .045]);
    legs.push(leg);
    knees.push(knee);
  }

  const head = new THREE.Group();
  head.position.y = 1.72;
  torso.add(head);
  head.add(mesh(headGeometry(), skin));
  for (const side of [-1, 1]) {
    ball(head, [.084, .115, .068], skin, [side * .451, -.015, -.005]);
    ball(head, [.037, .06, .018], shade(skin, -.075), [side * .487, -.015, .042]);
  }
  head.add(mesh(hairCapGeometry(style), hair));
  for (const side of [-1, 1]) {
    const tuft = ball(head, [.046, style === 'bob' ? .155 : .092, .065], hair, [side * .444, style === 'bob' ? -.10 : .025, .035]);
    tuft.rotation.z = side * -.13;
  }

  const eyes = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(side * .172, .035, .394);
    head.add(eye);
    ball(eye, [.088, .108, .028], '#fff9e9', [0, 0, 0], .45);
    ball(eye, [.052, .073, .014], '#655647', [side * -.008, -.004, .027], .32);
    ball(eye, [.031, .052, .008], '#252c26', [side * -.008, -.003, .039], .24);
    ball(eye, [.016, .020, .006], '#fffdf4', [-.018, .025, .047], .18);
    eyes.push(eye);
    const eyebrow = mesh(lineGeometry([[side * .10, .178, .389], [side * .17, .193, .365], [side * .235, .181, .340]], .014), darkHair);
    head.add(eyebrow);
    ball(head, [.065, .034, .012], shade(skin, -.025), [side * .275, -.10, .342]);
  }
  ball(head, [.052, .058, .057], skin, [0, -.062, .414]);
  const mouth = mesh(lineGeometry([[-.09, -.182, .383], [-.045, -.208, .399], [0, -.214, .403], [.045, -.208, .399], [.09, -.182, .383]], .011), '#925d4e');
  head.add(mouth);

  // Distinct phase offsets keep a group of visitors from breathing/blinking
  // in lockstep, while remaining deterministic for screenshots and revisits.
  const seed = [...`${name}${shirt}${style}`].reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 7);
  const idleOffset = seed % 631 / 100;
  let previousTime;
  let currentHeading = 0;
  let movement = 0;
  let posture = 0;
  let gait = idleOffset;

  function update(time, {walking = false, speed = 1, heading = 0, jump = 0, talking = false, sitting = 0} = {}) {
    const dt = previousTime === undefined ? 1 / 60 : THREE.MathUtils.clamp(time - previousTime, 0, .1);
    previousTime = time;
    const easing = 1 - Math.exp(-dt * 11);
    posture += (sitting - posture) * easing;
    walking = walking && sitting < .1;
    movement += ((walking ? 1 : 0) - movement) * easing;
    const turn = Math.atan2(Math.sin(heading - currentHeading), Math.cos(heading - currentHeading));
    currentHeading += turn * (1 - Math.exp(-dt * 12));
    group.rotation.y = currentHeading;
    gait += dt * Math.max(.25, speed) * 9.5 * movement;
    const stride = Math.sin(gait) * movement;
    const breathe = Math.sin(time * 2.1 + idleOffset);
    rig.position.y = jump + Math.abs(Math.cos(gait)) * .035 * movement - .20 * posture;
    torso.position.y = breathe * .006 * (1 - movement);
    torso.rotation.z = Math.sin(gait) * .025 * movement;
    torso.rotation.x = .025 * movement;
    head.rotation.y = Math.sin(time * .7 + idleOffset) * .045 * (1 - movement);
    head.rotation.z = Math.sin(time * 1.2 + idleOffset) * .018 * (1 - movement);
    head.rotation.x = talking ? Math.sin(time * 5.5) * .025 : -.012;
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;
      const swing = stride * side;
      legs[i].rotation.x = THREE.MathUtils.lerp(swing * .40,-1.35,posture);
      knees[i].rotation.x = THREE.MathUtils.lerp(Math.max(0, -swing) * .48,1.4,posture);
      arms[i].rotation.x = THREE.MathUtils.lerp(-swing * .34 - .035,-.5,posture);
      arms[i].rotation.z = side * (.055 + (talking ? .035 + Math.sin(time * 3.2) * .02 : 0));
      elbows[i].rotation.x = -.10 - Math.max(0, swing) * .12;
    }
    const blinkClock = (time + idleOffset) % 4.6;
    const blink = blinkClock < .17 ? Math.max(.06, Math.abs(blinkClock / .085 - 1)) : 1;
    for (const eye of eyes) eye.scale.y = blink;
    mouth.scale.y = talking ? 1 + Math.sin(time * 13) * .10 : 1;
  }

  update(0);
  return {group, update, headAnchor(target=new THREE.Vector3()){return head.localToWorld(target.set(0,.63,0))}};
}
