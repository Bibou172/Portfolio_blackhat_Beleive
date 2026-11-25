/**
 * Île low-poly construite entièrement en code (aucun modèle externe), palette Ocean Blue.
 * Chaque objet cliquable est un THREE.Group portant userData.id ; une « ancre » marque le point
 * au-dessus de l'objet (étiquette HTML et cible de la caméra).
 */
import * as THREE from "three";
import type { IdObjet } from "./objets";

export const C = {
  oceanProfond: 0x063b5c,
  marine: 0x082c46,
  lagon: 0x18a7b5,
  turquoise: 0x55c9d0,
  ciel: 0xa9ddeb,
  ecume: 0xf4fafc,
  sable: 0xf1e6d2,
  sableFonce: 0xe4d3b5,
  bois: 0xb99b6b,
  roche: 0x1d4a6e,
  lagonFonce: 0x0f7f8b,
};

export interface Ile {
  scene: THREE.Scene;
  monde: THREE.Group;
  cliquables: Map<IdObjet, THREE.Group>;
  ancres: Map<IdObjet, THREE.Object3D>;
  animer(t: number): void;
  surligner(id: IdObjet | null): void;
  liberer(): void;
}

const mat = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0, ...extra });

function maillage(geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Bouscule légèrement les sommets pour un rendu « fait main ». */
function bousculer(geo: THREE.BufferGeometry, force: number, garderHaut = false) {
  const pos = geo.attributes.position;
  const vus = new Map<string, [number, number, number]>();
  for (let i = 0; i < pos.count; i++) {
    const cle = `${pos.getX(i).toFixed(3)}|${pos.getY(i).toFixed(3)}|${pos.getZ(i).toFixed(3)}`;
    if (!vus.has(cle)) vus.set(cle, [(Math.random() - 0.5) * force, garderHaut ? 0 : (Math.random() - 0.5) * force, (Math.random() - 0.5) * force]);
    const [dx, dy, dz] = vus.get(cle)!;
    pos.setXYZ(i, pos.getX(i) + dx, pos.getY(i) + dy, pos.getZ(i) + dz);
  }
  geo.computeVertexNormals();
}

function texteCanvas(l: number, h: number, dessiner: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = l;
  c.height = h;
  dessiner(c.getContext("2d")!);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ───────────────────────── Objets ─────────────────────────

function palmier(echelle = 1): THREE.Group {
  const g = new THREE.Group();
  const courbe = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.15, 1.2, 0),
    new THREE.Vector3(0.5, 2.3, 0.05),
    new THREE.Vector3(0.95, 3.1, 0.1),
  ]);
  g.add(maillage(new THREE.TubeGeometry(courbe, 8, 0.13, 6), mat(C.bois)));
  const couronne = new THREE.Group();
  couronne.position.set(0.95, 3.1, 0.1);
  const forme = new THREE.Shape();
  forme.moveTo(0, 0);
  forme.quadraticCurveTo(0.8, 0.35, 1.9, 0);
  forme.quadraticCurveTo(0.8, -0.35, 0, 0);
  const geoFeuille = new THREE.ShapeGeometry(forme, 4);
  for (let i = 0; i < 7; i++) {
    const f = maillage(geoFeuille, mat(i % 2 ? C.lagon : C.turquoise, { side: THREE.DoubleSide }));
    f.rotation.set(-Math.PI / 2, 0, 0);
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / 7) * Math.PI * 2;
    pivot.rotation.z = -0.55 - (i % 2) * 0.15;
    pivot.add(f);
    couronne.add(pivot);
  }
  couronne.add(maillage(new THREE.IcosahedronGeometry(0.2, 0), mat(C.bois), 0, -0.1, 0));
  g.add(couronne);
  g.userData.couronne = couronne;
  g.scale.setScalar(echelle);
  return g;
}

function phare(): { g: THREE.Group; faisceau: THREE.Object3D } {
  const g = new THREE.Group();
  // Rochers
  const geoRoche = new THREE.DodecahedronGeometry(0.9, 0);
  [[0, 0.1, 0, 1.2], [0.9, 0, 0.5, 0.8], [-0.8, 0, 0.4, 0.7], [0.3, 0, -0.8, 0.9]].forEach(([x, y, z, s]) => {
    const r = maillage(geoRoche, mat(C.roche), x, y, z);
    r.scale.set(s, s * 0.6, s);
    g.add(r);
  });
  // Tour effilée, bandes lagon
  const H = 3.4;
  g.add(maillage(new THREE.CylinderGeometry(0.42, 0.68, H, 12), mat(C.ecume), 0, 0.5 + H / 2, 0));
  const rayon = (y: number) => 0.68 - ((y - 0.5) / H) * 0.26 + 0.015;
  [1.3, 2.5].forEach((y) => g.add(maillage(new THREE.CylinderGeometry(rayon(y + 0.25), rayon(y - 0.25), 0.5, 12), mat(C.lagon), 0, y, 0)));
  // Galerie, lanterne, toit
  const yHaut = 0.5 + H;
  g.add(maillage(new THREE.CylinderGeometry(0.72, 0.72, 0.14, 14), mat(C.marine), 0, yHaut + 0.07, 0));
  const lanterne = maillage(
    new THREE.CylinderGeometry(0.36, 0.36, 0.55, 10),
    mat(C.ciel, { emissive: new THREE.Color(C.turquoise), emissiveIntensity: 1.4 }),
    0,
    yHaut + 0.42,
    0,
  );
  g.add(lanterne);
  g.add(maillage(new THREE.ConeGeometry(0.55, 0.55, 10), mat(C.marine), 0, yHaut + 0.97, 0));
  g.add(maillage(new THREE.SphereGeometry(0.08, 6, 4), mat(C.marine), 0, yHaut + 1.3, 0));
  // Porte
  g.add(maillage(new THREE.BoxGeometry(0.28, 0.45, 0.05), mat(C.marine), 0, 0.85, 0.66));
  // Lumière + faisceau tournant
  const lumiere = new THREE.PointLight(C.turquoise, 18, 14, 2);
  lumiere.position.set(0, yHaut + 0.42, 0);
  g.add(lumiere);
  const faisceau = new THREE.Group();
  faisceau.userData.ignorerCadrage = true;
  faisceau.position.set(0, yHaut + 0.42, 0);
  const geoCone = new THREE.ConeGeometry(1.2, 9, 24, 6, true);
  geoCone.translate(0, -4.5, 0);
  // Alpha décroissant du phare vers l'extrémité : le faisceau s'estompe au lieu de finir net.
  const pc = geoCone.attributes.position;
  const rgba = new Float32Array(pc.count * 4);
  for (let i = 0; i < pc.count; i++) rgba.set([1, 1, 1, Math.pow(1 - Math.min(1, Math.abs(pc.getY(i)) / 9), 1.6)], i * 4);
  geoCone.setAttribute("color", new THREE.BufferAttribute(rgba, 4));
  geoCone.rotateZ(Math.PI / 2);
  const matCone = new THREE.MeshBasicMaterial({
    color: C.ciel,
    vertexColors: true,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  faisceau.add(new THREE.Mesh(geoCone, matCone));
  const cone2 = new THREE.Mesh(geoCone, matCone);
  cone2.rotation.y = Math.PI;
  faisceau.add(cone2);
  g.add(faisceau);
  return { g, faisceau };
}

function voilier(): THREE.Group {
  const g = new THREE.Group();
  const coque = new THREE.Shape();
  coque.moveTo(-1.7, 0.55);
  coque.lineTo(1.9, 0.55);
  coque.quadraticCurveTo(1.5, -0.1, 0.9, -0.25);
  coque.lineTo(-1.2, -0.25);
  coque.quadraticCurveTo(-1.6, 0, -1.7, 0.55);
  const geoCoque = new THREE.ExtrudeGeometry(coque, { depth: 1, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 1 });
  geoCoque.translate(0, 0, -0.5);
  g.add(maillage(geoCoque, mat(C.ecume)));
  g.add(maillage(new THREE.BoxGeometry(3.5, 0.12, 1.16), mat(C.lagon), 0.1, 0.42, 0));
  g.add(maillage(new THREE.BoxGeometry(2.6, 0.08, 0.9), mat(C.bois), 0, 0.62, 0));
  // Mât
  g.add(maillage(new THREE.CylinderGeometry(0.05, 0.06, 3.6, 6), mat(C.marine), 0, 2.4, 0));
  // Voiles
  const voile = (pts: [number, number][], couleur: number) => {
    const s = new THREE.Shape();
    s.moveTo(...pts[0]);
    pts.slice(1).forEach((p) => s.lineTo(...p));
    // Légère émission : la voile reste claire même éclairée par l'arrière.
    return maillage(new THREE.ShapeGeometry(s), mat(couleur, { side: THREE.DoubleSide, emissive: new THREE.Color(couleur), emissiveIntensity: 0.25 }));
  };
  g.add(voile([[0.08, 0.8], [1.5, 0.85], [0.08, 4.0]], C.ecume));
  g.add(voile([[-0.08, 0.9], [-1.3, 0.95], [-0.08, 3.5]], C.turquoise));
  // Fanion
  const fanion = voile([[0, 4.15], [0.5, 4.02], [0, 3.9]], C.lagon);
  g.add(fanion);
  return g;
}

function malle(): THREE.Group {
  const g = new THREE.Group();
  g.add(maillage(new THREE.BoxGeometry(1.3, 0.7, 0.8), mat(C.bois), 0, 0.35, 0));
  const couvercle = new THREE.CylinderGeometry(0.4, 0.4, 1.3, 10, 1, false, 0, Math.PI);
  couvercle.rotateZ(Math.PI / 2);
  couvercle.rotateX(-Math.PI / 2);
  g.add(maillage(couvercle, mat(0xa98a5c), 0, 0.7, 0));
  [-0.4, 0.4].forEach((x) => {
    g.add(maillage(new THREE.BoxGeometry(0.12, 0.72, 0.84), mat(C.marine), x, 0.36, 0));
    const sangle = new THREE.TorusGeometry(0.41, 0.06, 4, 10, Math.PI);
    sangle.rotateY(Math.PI / 2);
    g.add(maillage(sangle, mat(C.marine), x, 0.7, 0));
  });
  g.add(maillage(new THREE.BoxGeometry(0.22, 0.24, 0.06), mat(C.lagon, { metalness: 0.4, roughness: 0.4 }), 0, 0.62, 0.43));
  // Étiquette de voyage
  g.add(maillage(new THREE.BoxGeometry(0.34, 0.22, 0.02), mat(C.ecume), -0.08, 0.3, 0.41));
  return g;
}

function chevaletCarte(): THREE.Group {
  const g = new THREE.Group();
  const bois = mat(C.marine);
  const pied = (x: number, z: number, rx: number, rz: number) => {
    const p = maillage(new THREE.BoxGeometry(0.08, 2.1, 0.08), bois, x, 1.0, z);
    p.rotation.set(rx, 0, rz);
    return p;
  };
  g.add(pied(-0.45, 0.1, -0.12, 0.12), pied(0.45, 0.1, -0.12, -0.12), pied(0, -0.4, 0.35, 0));
  g.add(maillage(new THREE.BoxGeometry(1.5, 0.08, 0.12), bois, 0, 0.75, 0.22));
  const tex = texteCanvas(512, 384, (ctx) => {
    ctx.fillStyle = "#F1E6D2";
    ctx.fillRect(0, 0, 512, 384);
    ctx.fillStyle = "#A9DDEB";
    ctx.beginPath();
    ctx.roundRect(22, 22, 468, 340, 18);
    ctx.fill();
    const ile = (x: number, y: number, rx: number, ry: number) => {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0.3, 0, Math.PI * 2);
      ctx.fillStyle = "#F1E6D2";
      ctx.fill();
      ctx.strokeStyle = "rgba(6,59,92,.45)";
      ctx.lineWidth = 4;
      ctx.stroke();
    };
    ile(120, 110, 70, 42);
    ile(380, 150, 80, 55);
    ile(200, 290, 60, 34);
    ile(410, 300, 40, 26);
    ctx.setLineDash([4, 14]);
    ctx.lineCap = "round";
    ctx.strokeStyle = "#063B5C";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(120, 110);
    ctx.bezierCurveTo(230, 60, 300, 200, 380, 150);
    ctx.bezierCurveTo(440, 230, 260, 240, 200, 290);
    ctx.bezierCurveTo(300, 340, 360, 320, 410, 300);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "#18A7B5";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(396, 286);
    ctx.lineTo(424, 314);
    ctx.moveTo(424, 286);
    ctx.lineTo(396, 314);
    ctx.stroke();
    // Rose des vents
    ctx.translate(70, 310);
    ctx.fillStyle = "#063B5C";
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 34);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#18A7B5";
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(8, 0);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
  });
  const tableau = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.28, 0.06), [
    mat(C.marine),
    mat(C.marine),
    mat(C.marine),
    mat(C.marine),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }),
    mat(C.marine),
  ]);
  tableau.position.set(0, 1.45, 0.18);
  tableau.rotation.x = -0.12;
  tableau.castShadow = true;
  g.add(tableau);
  return g;
}

function montgolfiere(): THREE.Group {
  const g = new THREE.Group();
  const profil: THREE.Vector2[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const y = -1.2 + t * 2.8;
    const r = t < 0.15 ? 0.35 + t * 2.4 : Math.sin(Math.min(1, (t - 0.05) / 0.95) * Math.PI * 0.92) * 1.35 + 0.02;
    profil.push(new THREE.Vector2(Math.max(0.05, r), y));
  }
  profil.push(new THREE.Vector2(0.01, 1.62));
  const geo = new THREE.LatheGeometry(profil, 12).toNonIndexed();
  // Bandes alternées lagon / écume, une couleur par face
  const pos = geo.attributes.position;
  const couleurs = new Float32Array(pos.count * 3);
  const a = new THREE.Color(C.lagon);
  const b = new THREE.Color(C.ecume);
  for (let f = 0; f < pos.count; f += 3) {
    const cx = (pos.getX(f) + pos.getX(f + 1) + pos.getX(f + 2)) / 3;
    const cz = (pos.getZ(f) + pos.getZ(f + 1) + pos.getZ(f + 2)) / 3;
    const secteur = Math.floor(((Math.atan2(cz, cx) + Math.PI) / (Math.PI * 2)) * 12);
    const c = secteur % 2 ? a : b;
    for (let k = 0; k < 3; k++) couleurs.set([c.r, c.g, c.b], (f + k) * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(couleurs, 3));
  g.add(maillage(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.7 }), 0, 0, 0));
  // Nacelle et cordes
  g.add(maillage(new THREE.BoxGeometry(0.55, 0.42, 0.55), mat(C.bois), 0, -2.25, 0));
  [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]].forEach(([x, z]) => {
    const corde = maillage(new THREE.CylinderGeometry(0.015, 0.015, 1.05, 3), mat(C.marine), x * 1.25, -1.6, z * 1.25);
    g.add(corde);
  });
  g.add(maillage(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 8), mat(C.marine), 0, -1.12, 0));
  return g;
}

function bouteille(): THREE.Group {
  const g = new THREE.Group();
  const verre = new THREE.MeshStandardMaterial({
    color: C.ciel,
    transparent: true,
    opacity: 0.55,
    roughness: 0.15,
    metalness: 0.1,
    flatShading: true,
  });
  g.add(maillage(new THREE.CylinderGeometry(0.32, 0.32, 1.1, 10), verre));
  g.add(maillage(new THREE.CylinderGeometry(0.13, 0.3, 0.35, 10), verre, 0, 0.72, 0));
  g.add(maillage(new THREE.CylinderGeometry(0.11, 0.11, 0.25, 8), verre, 0, 1.0, 0));
  g.add(maillage(new THREE.CylinderGeometry(0.1, 0.12, 0.2, 8), mat(C.bois), 0, 1.2, 0));
  // Message roulé
  const message = maillage(new THREE.CylinderGeometry(0.16, 0.16, 0.8, 8), mat(C.sable), 0, 0, 0);
  g.add(message);
  g.add(maillage(new THREE.TorusGeometry(0.17, 0.03, 4, 10), mat(C.lagon), 0, 0, 0));
  g.children[g.children.length - 1].rotation.x = Math.PI / 2;
  g.rotation.z = Math.PI / 2.3;
  return g;
}

function nuage(): THREE.Group {
  const g = new THREE.Group();
  const m = mat(C.ciel, { transparent: true, opacity: 0.85, roughness: 1, emissive: new THREE.Color(C.ciel), emissiveIntensity: 0.45 });
  [[0, 0, 0, 1.4], [1.3, -0.2, 0.2, 1.0], [-1.3, -0.25, -0.1, 1.05], [0.5, 0.5, -0.2, 0.9]].forEach(([x, y, z, s]) => {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), m);
    b.position.set(x, y, z);
    g.add(b);
  });
  g.scale.set(1.4, 0.8, 1);
  return g;
}

function mouette(): THREE.Group {
  const g = new THREE.Group();
  const m = mat(C.ecume, { side: THREE.DoubleSide });
  const aile = new THREE.BufferGeometry();
  aile.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0.7, 0.18, -0.15, 0.7, 0.18, 0.15], 3));
  aile.computeVertexNormals();
  const ad = new THREE.Mesh(aile, m);
  const ag = new THREE.Mesh(aile, m);
  ag.scale.x = -1;
  g.add(ad, ag);
  g.userData.ailes = [ad, ag];
  return g;
}

// ───────────────────────── Scène ─────────────────────────

export function construireIle(): Ile {
  const scene = new THREE.Scene();
  scene.background = texteCanvas(4, 512, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#051f33");
    g.addColorStop(0.55, "#082C46");
    g.addColorStop(1, "#11618a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 512);
  });
  scene.fog = new THREE.Fog(0x0d4f74, 34, 95);

  // Lumières : heure bleue
  scene.add(new THREE.HemisphereLight(C.ciel, C.oceanProfond, 1.7));
  const lune = new THREE.DirectionalLight(0xf4fafc, 2.4);
  lune.position.set(12, 16, 9);
  lune.castShadow = true;
  lune.shadow.mapSize.set(1024, 1024);
  Object.assign(lune.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 });
  lune.shadow.bias = -0.0015;
  scene.add(lune);

  // Ciel : étoiles et lune
  const nbEtoiles = 450;
  const posEtoiles = new Float32Array(nbEtoiles * 3);
  for (let i = 0; i < nbEtoiles; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.random() * Math.PI * 0.42;
    const r = 110;
    posEtoiles.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) + 6, r * Math.sin(ph) * Math.sin(th) - 30], i * 3);
  }
  const geoEtoiles = new THREE.BufferGeometry();
  geoEtoiles.setAttribute("position", new THREE.BufferAttribute(posEtoiles, 3));
  scene.add(new THREE.Points(geoEtoiles, new THREE.PointsMaterial({ color: C.ciel, size: 0.45, transparent: true, opacity: 0.85, fog: false })));
  const lunePos = new THREE.Vector3(40, 24, -90);
  const astre = new THREE.Mesh(new THREE.SphereGeometry(4, 20, 14), new THREE.MeshBasicMaterial({ color: 0xd3ebf2, fog: false }));
  astre.position.copy(lunePos);
  scene.add(astre);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texteCanvas(256, 256, (ctx) => {
        const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        g.addColorStop(0, "rgba(169,221,235,.55)");
        g.addColorStop(0.4, "rgba(85,201,208,.16)");
        g.addColorStop(1, "rgba(85,201,208,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 256);
      }),
      transparent: true,
      depthWrite: false,
      fog: false,
    }),
  );
  halo.scale.setScalar(36);
  halo.position.copy(lunePos);
  scene.add(halo);

  // Océan animé
  const geoMer = new THREE.PlaneGeometry(220, 220, 90, 90);
  geoMer.rotateX(-Math.PI / 2);
  const base = Float32Array.from(geoMer.attributes.position.array as Float32Array);
  const mer = new THREE.Mesh(geoMer, mat(0x0d6a8f, { roughness: 0.45, metalness: 0.1 }));
  mer.receiveShadow = true;
  scene.add(mer);

  // Monde (décalé à droite sur grand écran)
  const monde = new THREE.Group();
  scene.add(monde);

  // Lagon clair autour de l'île
  const lagonAnneau = new THREE.Mesh(
    new THREE.CircleGeometry(9.5, 24),
    new THREE.MeshStandardMaterial({ color: C.turquoise, transparent: true, opacity: 0.35, flatShading: true, depthWrite: false }),
  );
  lagonAnneau.rotation.x = -Math.PI / 2;
  lagonAnneau.position.y = 0.32;
  monde.add(lagonAnneau);

  // Île : plage, herbe, collines, rochers
  const geoIle = new THREE.CylinderGeometry(5.6, 7.2, 1.8, 11, 2);
  bousculer(geoIle, 0.45, false);
  const ile = maillage(geoIle, mat(C.sable), 0, -0.3, 0);
  monde.add(ile);
  const geoHerbe = new THREE.CylinderGeometry(3.7, 4.3, 0.5, 9);
  bousculer(geoHerbe, 0.3, true);
  monde.add(maillage(geoHerbe, mat(C.lagon), -0.4, 0.75, -0.9));
  const colline1 = maillage(new THREE.ConeGeometry(2.4, 2.2, 7), mat(C.lagonFonce), -1.3, 2.0, -1.9);
  const colline2 = maillage(new THREE.ConeGeometry(1.7, 1.5, 6), mat(C.lagonFonce), 1.2, 1.6, -2.4);
  monde.add(colline1, colline2);
  [[3.6, 0.5, 2.6, 0.5], [-4.6, 0.4, 2.2, 0.45], [4.9, 0.3, -1.4, 0.6]].forEach(([x, y, z, s]) => {
    const r = maillage(new THREE.DodecahedronGeometry(1, 0), mat(C.roche), x, y, z);
    r.scale.set(s, s * 0.7, s);
    monde.add(r);
  });

  // Palmiers
  const palmiers = [
    [2.6, 0.95, -0.6, 1, 0.3],
    [0.3, 0.95, -2.6, 0.85, 2.1],
    [-2.2, 0.6, 3.0, 0.9, -0.6],
    [3.4, 0.6, 1.6, 0.7, 1.4],
  ].map(([x, y, z, s, ry]) => {
    const p = palmier(s);
    p.position.set(x, y, z);
    p.rotation.y = ry;
    monde.add(p);
    return p;
  });

  // Objets cliquables
  const cliquables = new Map<IdObjet, THREE.Group>();
  const ancres = new Map<IdObjet, THREE.Object3D>();
  const enregistrer = (id: IdObjet, g: THREE.Group, hauteurAncre: number) => {
    g.userData.id = id;
    g.userData.echelleBase = g.scale.x;
    const ancre = new THREE.Object3D();
    ancre.position.y = hauteurAncre;
    g.add(ancre);
    cliquables.set(id, g);
    ancres.set(id, ancre);
    monde.add(g);
  };

  const { g: gPhare, faisceau } = phare();
  gPhare.position.set(-4.3, 0.55, 0.2);
  enregistrer("phare", gPhare, 5.6);

  const gVoilier = voilier();
  gVoilier.position.set(8.2, 0.1, 3.2);
  gVoilier.rotation.y = -0.5;
  enregistrer("voilier", gVoilier, 4.6);

  const gMalle = malle();
  gMalle.position.set(0.2, 0.6, 3.6);
  gMalle.rotation.y = -0.35;
  enregistrer("malle", gMalle, 1.4);

  const gCarte = chevaletCarte();
  gCarte.position.set(1.8, 0.95, 1.0);
  gCarte.rotation.y = -0.3;
  enregistrer("carte", gCarte, 2.5);

  const gBallon = montgolfiere();
  gBallon.position.set(4.6, 7.4, -2.6);
  enregistrer("montgolfiere", gBallon, 2.0);

  const gBouteille = bouteille();
  gBouteille.position.set(-7.6, 0.25, 5.0);
  enregistrer("bouteille", gBouteille, 1.1);

  // Nuages et mouettes
  const nuages = [
    [8, 15, -38],
    [20, 12, -26],
    [32, 10, -18],
    [-34, 19, -60],
  ].map(([x, y, z]) => {
    const n = nuage();
    n.position.set(x, y, z);
    scene.add(n);
    return n;
  });
  const vol = new THREE.Group();
  vol.position.set(0, 6, 0);
  const mouettes = [0, 1, 2].map((i) => {
    const m = mouette();
    m.position.set(Math.cos(i * 2.1) * (6 + i), i * 0.6, Math.sin(i * 2.1) * (6 + i));
    m.rotation.y = -i * 2.1;
    vol.add(m);
    return m;
  });
  monde.add(vol);

  // Surlignage
  let survol: IdObjet | null = null;
  const appliquerSurlignage = (id: IdObjet | null) => {
    cliquables.forEach((g, cle) => {
      g.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[] | undefined;
        (Array.isArray(m) ? m : m ? [m] : []).forEach((mm) => {
          if (!(mm instanceof THREE.MeshStandardMaterial)) return;
          if (mm.userData.emissionBase === undefined) {
            mm.userData.emissionBase = mm.emissiveIntensity;
            mm.userData.couleurEmission = mm.emissive.getHex();
          }
          if (cle === id) {
            mm.emissive.setHex(C.turquoise);
            mm.emissiveIntensity = Math.max(0.35, mm.userData.emissionBase);
          } else {
            mm.emissive.setHex(mm.userData.couleurEmission);
            mm.emissiveIntensity = mm.userData.emissionBase;
          }
        });
      });
    });
  };

  const basesY = new Map([...cliquables].map(([id, g]) => [id, g.position.y]));

  function animer(t: number) {
    // Vagues
    const pos = geoMer.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const z = base[i * 3 + 2];
      pos.setY(i, Math.sin(x * 0.32 + t * 1.1) * 0.2 + Math.cos(z * 0.28 + t * 0.9) * 0.2 + Math.sin((x + z) * 0.12 + t * 0.6) * 0.12);
    }
    pos.needsUpdate = true;

    faisceau.rotation.y = t * 0.7;
    gVoilier.position.y = basesY.get("voilier")! + Math.sin(t * 1.2) * 0.14;
    gVoilier.rotation.z = Math.sin(t * 0.9) * 0.05;
    gVoilier.rotation.x = Math.cos(t * 0.8) * 0.04;
    gBallon.position.y = basesY.get("montgolfiere")! + Math.sin(t * 0.6) * 0.35;
    gBallon.rotation.y = t * 0.12;
    gBouteille.position.y = basesY.get("bouteille")! + Math.sin(t * 1.5) * 0.12;
    gBouteille.rotation.x = Math.sin(t * 1.1) * 0.15;
    palmiers.forEach((p, i) => {
      (p.userData.couronne as THREE.Group).rotation.z = Math.sin(t * 0.9 + i) * 0.05;
    });
    nuages.forEach((n, i) => {
      n.position.x += 0.004 * (i % 2 ? 1 : -1);
      if (Math.abs(n.position.x) > 40) n.position.x *= -0.95;
    });
    vol.rotation.y = -t * 0.22;
    mouettes.forEach((m, i) => {
      const [ad, ag] = m.userData.ailes as THREE.Mesh[];
      const battement = Math.sin(t * 6 + i) * 0.45;
      ad.rotation.z = battement;
      ag.rotation.z = -battement;
    });
    // Mise en relief de l'objet survolé
    cliquables.forEach((g, id) => {
      const cible = g.userData.echelleBase * (id === survol ? 1.12 : 1);
      g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, cible, 0.15));
    });
  }

  function surligner(id: IdObjet | null) {
    if (id === survol) return;
    survol = id;
    appliquerSurlignage(id);
  }

  function liberer() {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((mm) => {
        Object.values(mm).forEach((v) => v instanceof THREE.Texture && v.dispose());
        mm.dispose();
      });
    });
    (scene.background as THREE.Texture | null)?.dispose();
  }

  return { scene, monde, cliquables, ancres, animer, surligner, liberer };
}
