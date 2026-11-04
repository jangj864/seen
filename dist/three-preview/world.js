import * as THREE from 'three';
import { material, roundedBox, box, sphere, label, contactShadow } from './kit.js';

const C = {
  paper: '#f2e8ce', cream: '#fff5da', plaster: '#e7dbc0', trim: '#bead88',
  olive: '#526c54', darkOlive: '#354f3c', red: '#a44f42', velvet: '#84443b',
  wood: '#bc8b62', brass: '#c9a76a', soil: '#58483c', ink: '#3c4a3a',
};
const cylinderGeometries = new Map();
function cylinder(radius, height, color, x, y, z, topRadius = radius, segments = 16) {
  const key = `${radius}:${topRadius}:${height}:${segments}`;
  if (!cylinderGeometries.has(key)) cylinderGeometries.set(key, new THREE.CylinderGeometry(topRadius, radius, height, segments));
  const mesh = new THREE.Mesh(cylinderGeometries.get(key), material(color));
  mesh.position.set(x, y, z);
  return mesh;
}
function addText(parent, text, width, height, x, y, z, color = C.ink, fontSize = 56) {
  const canvasHeight = Math.max(128, Math.round(1024 * height / width));
  const typeScale = THREE.MathUtils.clamp(fontSize / 60, .65, 1.15);
  const mesh = label(text, { width, height, color, background: 'transparent', fontSize: Math.round(canvasHeight * .74 * typeScale) });
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
function floorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');
  const tile = 90;
  const colors = ['#e7ddc4', '#d7cdb5'];
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 18; col++) {
      ctx.fillStyle = colors[(row + col) % 2];
      ctx.fillRect(col * tile, row * tile, tile, tile);
      ctx.strokeStyle = '#c5b99d';
      ctx.lineWidth = 1;
      ctx.strokeRect(col * tile + .5, row * tile + .5, tile, tile);
    }
  }
  // Quiet speckling keeps the large tile surfaces from feeling computer-perfect.
  let seed = 93;
  for (let i = 0; i < 14000; i++) {
    seed = (seed * 16807) % 2147483647;
    const x = seed % canvas.width;
    seed = (seed * 16807) % 2147483647;
    ctx.fillStyle = i % 2 ? '#fff8df16' : '#726b5910';
    ctx.fillRect(x, seed % canvas.height, 1.2, 1.2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createCinema() {
  const group = new THREE.Group();
  group.name = 'SEEN cinema';
  const colliders = [];
  const doors = [];
  const pointsOfInterest = [];
  const textureLoader = new THREE.TextureLoader();
  function add(mesh, parent = group) { parent.add(mesh); return mesh; }
  function shadow(x, z, rx, rz, opacity = .2, parent = group) {
    const mesh = contactShadow(rx, rz, opacity);
    mesh.position.set(x, .012, z);
    parent.add(mesh);
    return mesh;
  }
  function obstacle(x, z, width, depth, padding = .12) {
    colliders.push({ left: x - width / 2 - padding, right: x + width / 2 + padding, top: z - depth / 2 - padding, bottom: z + depth / 2 + padding });
  }
  function poster(filename, x, y, z, width = .94, height = 1.45, parent = group) {
    const frame = roundedBox(width + .14, height + .14, .11, .045, C.brass, x, y, z);
    add(frame, parent);
    add(box(width + .035, height + .035, .018, C.cream, x, y, z + .065), parent);
    const texture = textureLoader.load(new URL(`../assets/${filename}`, import.meta.url).href, loaded => {
      const imageAspect = loaded.image.width / loaded.image.height;
      const frameAspect = width / height;
      if (imageAspect > frameAspect) {
        loaded.repeat.x = frameAspect / imageAspect;
        loaded.offset.x = (1 - loaded.repeat.x) / 2;
      } else {
        loaded.repeat.y = imageAspect / frameAspect;
        loaded.offset.y = (1 - loaded.repeat.y) / 2;
      }
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: texture, roughness: .86 }));
    mesh.position.set(x, y, z + .079);
    add(mesh, parent);
    return frame;
  }
  function planter(x, z, scale = 1, tone = C.red) {
    const plant = new THREE.Group();
    plant.position.set(x, 0, z);
    add(plant);
    shadow(0, 0, .54 * scale, .4 * scale, .18, plant);
    add(cylinder(.35 * scale, .63 * scale, tone, 0, .34 * scale, 0, .43 * scale), plant);
    add(cylinder(.43 * scale, .09 * scale, tone, 0, .65 * scale, 0), plant);
    add(cylinder(.355 * scale, .025 * scale, C.soil, 0, .702 * scale, 0), plant);
    const stem = cylinder(.035 * scale, .95 * scale, C.olive, 0, 1.15 * scale, 0);
    add(stem, plant);
    const leaves = [
      [-.27, 1.01, .05, -.65, '#617d55'], [.28, 1.17, .02, .8, '#6e885b'],
      [-.22, 1.43, -.06, -.6, '#42634a'], [.24, 1.62, -.02, .6, '#6b8557'],
      [0, 1.83, 0, -.12, '#809469'],
    ];
    for (const [lx, ly, lz, tilt, color] of leaves) {
      const leaf = sphere(.16 * scale, .4 * scale, .12 * scale, color, lx * scale, ly * scale, lz * scale);
      leaf.rotation.z = tilt;
      add(leaf, plant);
    }
    obstacle(x, z, .8 * scale, .8 * scale, .04);
    return plant;
  }

  // A thick, softly rounded plinth makes the room read as a small physical model.
  add(roundedBox(17.4, .48, 10.4, .2, '#b9aa87', 0, -.3, 0));
  add(roundedBox(17.05, .12, 10.05, .09, C.paper, 0, -.02, 0));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16.95, 9.96), new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: .93 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = .048;
  floor.receiveShadow = true;
  add(floor);
  add(roundedBox(17.1, 5.2, .3, .1, C.plaster, 0, 2.58, -5.04));
  add(roundedBox(.3, 2.45, 10.05, .1, C.plaster, -8.52, 1.2, 0));
  add(box(16.9, .25, .09, C.olive, 0, .2, -4.83));
  add(box(.09, .25, 9.7, C.olive, -8.31, .2, 0));
  add(roundedBox(17.15, .14, .38, .045, C.cream, 0, 5.16, -5.02));
  add(roundedBox(.38, .14, 10.1, .045, C.cream, -8.52, 2.44, 0));
  // Subtle dado rail and wall panels, kept clear of the doors.
  add(box(16.9, .055, .045, C.trim, 0, 1.08, -4.84));
  add(box(.045, .055, 9.7, C.trim, -8.34, 1.08, 0));
  addText(group, 'S E E N', 3.2, .48, 0, 4.55, -4.855, C.red, 78);
  addText(group, 'GOOD FILMS. GOOD COMPANY.', 4.5, .24, 0, 4.06, -4.85, '#776d54', 34);

  const stories = ['A seat at the table', 'The distance between us', 'The things we keep', 'A home still taking shape'];
  [-5.4, -1.8, 1.8, 5.4].forEach((x, i) => {
    const door = new THREE.Group();
    door.name = `Screen ${i + 1}`;
    door.position.set(x, 0, -4.75);
    add(door);
    shadow(0, .32, 1.2, .4, .18, door);
    add(roundedBox(2.3, 3.36, .24, .09, C.wood, 0, 1.7, 0), door);
    add(roundedBox(2.04, 3.13, .15, .055, C.velvet, 0, 1.61, .145), door);
    for (const side of [-1, 1]) {
      add(roundedBox(.94, 2.98, .07, .035, i % 2 ? '#9e5549' : '#a65a4c', side * .495, 1.61, .235), door);
      add(box(.7, .025, .018, '#b8775f', side * .495, .55, .278), door);
      add(box(.7, .025, .018, '#b8775f', side * .495, 2.65, .278), door);
      add(roundedBox(.035, .34, .06, .016, C.brass, side * .13, 1.47, .31), door);
    }
    add(box(.025, 3.02, .012, '#643930', 0, 1.6, .28), door);
    add(roundedBox(2.3, .4, .16, .05, C.cream, 0, 3.59, .04), door);
    addText(door, `SCREEN 0${i + 1}`, 2.05, .29, 0, 3.59, .13, C.ink, 53);
    addText(door, `0${i + 1}`, .68, .69, 0, 2.18, .29, '#efcda1', 96);
    add(roundedBox(2.32, .045, .68, .025, C.brass, 0, .07, .39), door);
    const mat = roundedBox(1.94, .035, .79, .05, i % 2 ? '#626c4f' : '#866052', 0, .07, .96);
    add(mat, door);
    doors.push({ id: `screen-${i + 1}`, title: stories[i], position: new THREE.Vector3(x, 0, -4.2), approach: new THREE.Vector3(x, 0, -3.2), group: door });
  });
  const posters = ['yang-poster.jpg', 'hexed.jpg', 'focker-poster.jpg', 'ebenezer-poster.jpg', 'godzilla-poster.png'];
  [-7.25, -3.6, 0, 3.6, 7.25].forEach((x, i) => {
    poster(posters[i], x, 2.15, -4.84, .91, 1.44);
    addText(group, i ? 'COMING SOON' : 'IN FOCUS', 1.15, .15, x, 1.25, -4.745, '#776a50', 28);
  });

  // A compact Art Deco ticket desk with wood fluting and a brass service lamp.
  const ticket = new THREE.Group();
  ticket.position.set(-4.8, 0, -.85);
  ticket.name = 'Ticket counter';
  add(ticket);
  shadow(0, 0, 1.9, 1.0, .24, ticket);
  add(roundedBox(3.28, 1.14, 1.22, .14, C.olive, 0, .65, 0), ticket);
  add(roundedBox(3.08, .12, 1.1, .035, C.darkOlive, 0, .15, .02), ticket);
  for (let i = 0; i < 13; i++) add(roundedBox(.055, .83, .045, .022, '#7b8b64', -1.42 + i * .237, .68, .62), ticket);
  add(roundedBox(3.48, .18, 1.42, .085, C.cream, 0, 1.3, 0), ticket);
  add(roundedBox(1.2, .3, .035, .035, C.cream, 0, .71, .66), ticket);
  addText(ticket, 'TICKETS', 1.05, .24, 0, .71, .685, C.ink, 55);
  add(roundedBox(.45, .18, .39, .04, '#48554b', .75, 1.48, .05), ticket);
  add(roundedBox(.26, .035, .45, .013, C.paper, .75, 1.58, .15), ticket);
  add(roundedBox(.48, .08, .35, .02, C.red, -.7, 1.43, .1), ticket);
  add(roundedBox(.35, .018, .24, .008, C.cream, -.7, 1.48, .1), ticket);
  add(cylinder(.21, .045, C.brass, -1.23, 1.42, -.1), ticket);
  add(cylinder(.025, .57, C.brass, -1.23, 1.72, -.1), ticket);
  const shade = sphere(.3, .145, .22, '#5e765c', -1.23, 2.0, -.1);
  add(shade, ticket);
  for (const x of [-1.28, 1.28]) add(cylinder(.025, .74, C.brass, x, 1.83, -.43), ticket);
  add(roundedBox(2.92, .56, .14, .07, C.cream, 0, 2.29, -.43), ticket);
  addText(ticket, 'WELCOME TO SEEN', 2.63, .33, 0, 2.3, -.35, C.red, 53);
  obstacle(-4.8, -.85, 3.5, 1.42);
  pointsOfInterest.push({ id: 'tickets', title: 'A ticket to a good story', description: 'Four screens. Four ways to see the world. Pick a film and find your seat.', position: new THREE.Vector3(-4.8, 1.4, -.85), approach: new THREE.Vector3(-4.8, 0, .55), group: ticket });

  // The arcade entrance sits in the left wall, with a little striped threshold.
  const arcade = new THREE.Group();
  arcade.name = 'Arcade entrance';
  arcade.position.set(-8.25, 0, 2.72);
  arcade.rotation.y = Math.PI / 2;
  add(arcade);
  add(roundedBox(2.0, 2.8, .19, .095, C.darkOlive, 0, 1.42, 0), arcade);
  add(roundedBox(1.68, 2.5, .12, .08, '#485b42', 0, 1.34, .13), arcade);
  add(box(.025, 2.42, .025, '#293d30', 0, 1.32, .205), arcade);
  add(roundedBox(2.11, .46, .27, .05, C.cream, 0, 2.74, .05), arcade);
  addText(arcade, 'ARCADE', 1.8, .34, 0, 2.74, .192, C.olive, 64);
  addText(arcade, 'PLAY A LITTLE', 1.35, .17, 0, 1.83, .205, '#d4d0a3', 33);
  for (const side of [-1, 1]) add(roundedBox(.035, .35, .055, .012, C.brass, side * .14, 1.23, .24), arcade);
  add(roundedBox(2.05, .04, 1.22, .035, '#6d7d54', 0, .075, .66), arcade);
  for (const x of [-.78, .78]) add(box(.035, .015, 1.12, C.brass, x, .105, .66), arcade);
  pointsOfInterest.push({ id: 'arcade', title: 'The little arcade', description: 'A few games, a little curiosity, and absolutely no coins needed.', position: new THREE.Vector3(-8, 1.3, 2.72), approach: new THREE.Vector3(-6.55, 0, 2.72), group: arcade });

  // A glass popcorn warmer and terracotta cups add a familiar cinema ritual.
  const bar = new THREE.Group();
  bar.position.set(5.45, 0, .35);
  bar.name = 'Popcorn bar';
  add(bar);
  shadow(0, 0, 1.65, .95, .22, bar);
  add(roundedBox(2.8, 1.16, 1.2, .13, C.red, 0, .65, 0), bar);
  add(roundedBox(2.58, .9, .03, .04, '#b7624d', 0, .66, .618), bar);
  add(roundedBox(2.96, .15, 1.4, .08, C.cream, 0, 1.3, 0), bar);
  add(roundedBox(2.7, .09, 1.08, .03, '#783e35', 0, .15, 0), bar);
  addText(bar, 'POPCORN & CO.', 2.4, .4, 0, .69, .65, C.cream, 61);
  const machine = new THREE.Group();
  machine.position.set(-.55, 1.4, -.05);
  add(machine, bar);
  add(roundedBox(1.18, .15, .83, .045, C.red, 0, .08, 0), machine);
  add(roundedBox(1.22, .22, .88, .055, C.red, 0, 1.25, 0), machine);
  for (const x of [-.53, .53]) for (const z of [-.34, .34]) add(box(.04, 1.03, .04, C.brass, x, .66, z), machine);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.04, 1.0, .68), new THREE.MeshPhysicalMaterial({ color: '#edf0d6', roughness: .12, transparent: true, opacity: .14, depthWrite: false }));
  glass.position.y = .67;
  add(glass, machine);
  addText(machine, 'FRESH', .91, .2, 0, 1.26, .452, C.cream, 49);
  add(cylinder(.25, .14, C.brass, 0, .92, 0, .31), machine);
  add(cylinder(.019, .3, C.brass, 0, 1.12, 0), machine);
  for (let i = 0; i < 18; i++) {
    const x = ((i * 17) % 11 - 5) * .078;
    const z = ((i * 7) % 9 - 4) * .06;
    add(sphere(.105, .09, .09, i % 3 ? '#f3daa1' : '#fff0c6', x, .24 + (i % 3) * .065, z), machine);
  }
  for (const [x, z] of [[.58, .02], [1.03, -.19]]) {
    add(cylinder(.13, .38, C.cream, x, 1.57, z, .17), bar);
    add(cylinder(.172, .025, C.red, x, 1.77, z), bar);
    add(cylinder(.016, .29, C.red, x + .015, 1.9, z), bar);
  }
  obstacle(5.45, .35, 2.96, 1.4);
  pointsOfInterest.push({ id: 'popcorn', title: 'A little something for the film', description: 'Fresh popcorn, a favourite drink, and a few minutes before the lights go down.', position: new THREE.Vector3(5.45, 1.2, .35), approach: new THREE.Vector3(5.45, 0, 1.85), group: bar });

  // A free-standing poster case replaces the old outdoor-style wooden sign.
  const upcoming = new THREE.Group();
  upcoming.position.set(-1.47, 0, 2.45);
  upcoming.name = 'Coming soon poster';
  upcoming.rotation.y = -.14;
  add(upcoming);
  shadow(0, 0, .92, .48, .15, upcoming);
  add(roundedBox(1.58, .075, .68, .045, C.darkOlive, 0, .12, 0), upcoming);
  for (const x of [-.56, .56]) add(cylinder(.033, .53, C.brass, x, .4, -.035), upcoming);
  add(roundedBox(1.42, 2.1, .16, .065, C.darkOlive, 0, 1.55, -.035), upcoming);
  poster('hexed.jpg', 0, 1.45, .062, 1.15, 1.58, upcoming);
  add(roundedBox(1.4, .34, .18, .035, C.cream, 0, 2.49, -.02), upcoming);
  addText(upcoming, 'COMING SOON', 1.25, .23, 0, 2.49, .08, C.red, 48);
  obstacle(-1.47, 2.45, 1.62, .69, .13);
  pointsOfInterest.push({ id: 'upcoming', title: 'Next on the big screen', description: 'Good stories are always on the way. Discover the films coming soon to SEEN.', position: new THREE.Vector3(-1.47, 1.4, 2.45), approach: new THREE.Vector3(-1.47, 0, 3.55), group: upcoming });

  // Soft bench cushions and rounded timber legs give the furniture a tactile feel.
  const bench = new THREE.Group();
  bench.position.set(3.6, 0, 3.65);
  bench.name = 'Lobby bench';
  add(bench);
  shadow(0, 0, 1.76, .53, .18, bench);
  for (const x of [-1.14, 1.14]) {
    add(roundedBox(.15, .57, .58, .055, C.wood, x, .36, 0), bench);
    // Keep the uprights behind the upholstery instead of sharing its front face.
    add(roundedBox(.16, 1.05, .16, .055, C.wood, x, .8, -.37), bench);
  }
  add(roundedBox(2.85, .16, .86, .07, C.wood, 0, .64, 0), bench);
  for (const x of [-.69, .69]) add(roundedBox(1.32, .23, .8, .105, '#899371', x, .81, .025), bench);
  add(roundedBox(2.77, .52, .18, .085, '#758364', 0, 1.15, -.33), bench);
  obstacle(3.6, 3.65, 2.85, .91);

  planter(-7.2, -2.45, 1.12, '#ba7652');
  planter(7.35, -2.55, 1.1, '#af7150');
  planter(7.1, 3.48, .94, C.olive);

  // A short velvet queue keeps the foyer open, with generous space to walk around it.
  for (const x of [-5.95, -3.65]) {
    add(cylinder(.19, .055, C.brass, x, .08, 1.58));
    add(cylinder(.035, .83, C.brass, x, .52, 1.58));
    add(sphere(.09, .09, .09, C.brass, x, .97, 1.58));
  }
  const ropeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-5.95, .91, 1.58), new THREE.Vector3(-4.8, .65, 1.58), new THREE.Vector3(-3.65, .91, 1.58),
  ]);
  add(new THREE.Mesh(new THREE.TubeGeometry(ropeCurve, 16, .045, 8, false), material('#995244')));
  obstacle(-4.8, 1.58, 2.4, .12, .05);

  group.traverse(object => {
    if (!object.isMesh) return;
    const isFlat = object.geometry?.type === 'PlaneGeometry';
    object.castShadow = !isFlat && !object.material.transparent;
    object.receiveShadow = !object.material.transparent;
  });
  return { group, colliders, doors, pointsOfInterest };
}
