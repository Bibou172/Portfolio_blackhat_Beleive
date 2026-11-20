import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { construireIle } from "./construireIle";
import { OBJETS, objet, type IdObjet } from "./objets";

interface Props {
  focus: IdObjet | null;
  onChoisir: (id: IdObjet) => void;
  onPret?: () => void;
}

const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** Scène 3D de l'accueil. Chargée à part (React.lazy) pour ne pas alourdir le reste du site. */
export default function IleScene({ focus, onChoisir, onPret }: Props) {
  const conteneur = useRef<HTMLDivElement>(null);
  const marqueurs = useRef(new Map<IdObjet, HTMLButtonElement>());
  const [survol, setSurvol] = useState<IdObjet | null>(null);
  // Accès depuis la boucle d'animation sans relancer l'effet principal
  const api = useRef<{ viser: (id: IdObjet | null) => void } | null>(null);
  const rappels = useRef({ onChoisir, onPret });
  rappels.current = { onChoisir, onPret };

  useEffect(() => {
    const el = conteneur.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "pan-y";
    el.prepend(renderer.domElement);

    const ile = construireIle();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
    const cliquables = [...ile.cliquables.values()];

    // État caméra
    const vue = { pos: new THREE.Vector3(), cible: new THREE.Vector3() };
    const generale = { pos: new THREE.Vector3(), cible: new THREE.Vector3() };
    let anim: { de: typeof vue; vers: typeof vue; debut: number; duree: number } | null = null;
    let viseeActuelle: IdObjet | null = null;
    let large = true;

    const calculerVueGenerale = () => {
      const aspect = el.clientWidth / Math.max(1, el.clientHeight);
      large = aspect > 1.15;
      ile.monde.position.x = large ? 4.4 : 0;
      if (aspect < 0.8) {
        generale.pos.set(0, 9, 40);
        generale.cible.set(0, 1.2, 0);
      } else if (!large) {
        generale.pos.set(0, 7, 33);
        generale.cible.set(0, 2.2, 0);
      } else {
        generale.pos.set(0, 5.6, 28);
        generale.cible.set(0, 3.0, 0);
      }
    };

    // Cadrage d'un objet d'après sa taille réelle (boîte englobante, faisceau du phare exclu).
    const boite = new THREE.Box3();
    const tmp = new THREE.Box3();
    const vueObjet = (id: IdObjet) => {
      const g = ile.cliquables.get(id)!;
      g.updateMatrixWorld(true);
      boite.makeEmpty();
      g.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        for (let a: THREE.Object3D | null = m; a && a !== g; a = a.parent) if (a.userData.ignorerCadrage) return;
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
        boite.union(tmp.copy(m.geometry.boundingBox!).applyMatrix4(m.matrixWorld));
      });
      const centre = boite.getCenter(new THREE.Vector3());
      const taille = boite.getSize(new THREE.Vector3());
      const o = objet(id);
      const demiFov = THREE.MathUtils.degToRad(camera.fov / 2);
      const demiFovH = Math.atan(Math.tan(demiFov) * camera.aspect * (large ? 0.62 : 1));
      const d = Math.max(7, (Math.max(taille.x, taille.y, taille.z) / 2 / Math.tan(Math.min(demiFov, demiFovH))) * 2.6);
      const az = THREE.MathUtils.degToRad(o.azimut);
      const el = THREE.MathUtils.degToRad(o.elevation);
      const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
      const pos = centre.clone().addScaledVector(dir, d);
      pos.y = Math.max(pos.y, 0.8); // jamais sous la surface de l'eau
      // Le panneau occupe la droite (bureau) ou le bas (mobile) : l'objet est décalé dans la zone libre.
      const avant = new THREE.Vector3().subVectors(centre, pos).normalize();
      const droite = new THREE.Vector3().crossVectors(avant, new THREE.Vector3(0, 1, 0)).normalize();
      const cible = centre.clone();
      if (large) cible.addScaledVector(droite, d * 0.28);
      else cible.y -= d * 0.22;
      return { pos, cible };
    };

    const viser = (id: IdObjet | null) => {
      viseeActuelle = id;
      const vers = id ? vueObjet(id) : { pos: generale.pos.clone(), cible: generale.cible.clone() };
      anim = { de: { pos: vue.pos.clone(), cible: vue.cible.clone() }, vers, debut: performance.now(), duree: 1100 };
    };
    api.current = { viser };

    const redimensionner = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      calculerVueGenerale();
      if (!viseeActuelle && !anim) {
        vue.pos.copy(generale.pos);
        vue.cible.copy(generale.cible);
      } else if (viseeActuelle) {
        Object.assign(vue, vueObjet(viseeActuelle));
      }
    };
    redimensionner();
    const ro = new ResizeObserver(redimensionner);
    ro.observe(el);

    // Pointeur : survol, clic (en ignorant les glissements)
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const viser3D = (e: PointerEvent): IdObjet | null => {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(cliquables, true)[0];
      let o: THREE.Object3D | null = hit?.object ?? null;
      while (o && !o.userData.id) o = o.parent;
      return (o?.userData.id as IdObjet) ?? null;
    };
    let survolCourant: IdObjet | null = null;
    const majSurvol = (id: IdObjet | null) => {
      if (id === survolCourant) return;
      survolCourant = id;
      ile.surligner(id);
      renderer.domElement.style.cursor = id ? "pointer" : "default";
      setSurvol(id);
    };
    const onMove = (e: PointerEvent) => e.pointerType === "mouse" && majSurvol(viser3D(e));
    const onLeave = () => majSurvol(null);
    let depart: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => (depart = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      if (!depart || Math.hypot(e.clientX - depart.x, e.clientY - depart.y) > 8) return;
      const id = viser3D(e);
      if (id) rappels.current.onChoisir(id);
    };
    const c = renderer.domElement;
    c.addEventListener("pointermove", onMove);
    c.addEventListener("pointerleave", onLeave);
    c.addEventListener("pointerdown", onDown);
    c.addEventListener("pointerup", onUp);

    // Boucle d'animation, en pause hors écran ou onglet masqué
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.01 });
    io.observe(el);
    const horloge = new THREE.Clock();
    const proj = new THREE.Vector3();
    let raf = 0;
    let premier = true;
    const boucle = () => {
      raf = requestAnimationFrame(boucle);
      if (!visible || document.hidden) return;
      const t = horloge.getElapsedTime();
      ile.animer(t);

      if (anim) {
        const k = easeInOutCubic(Math.min(1, (performance.now() - anim.debut) / anim.duree));
        vue.pos.lerpVectors(anim.de.pos, anim.vers.pos, k);
        vue.cible.lerpVectors(anim.de.cible, anim.vers.cible, k);
        if (k >= 1) anim = null;
      } else if (!viseeActuelle) {
        // Léger balancement de la caméra au repos
        vue.pos.set(generale.pos.x + Math.sin(t * 0.13) * 1.6, generale.pos.y + Math.sin(t * 0.21) * 0.3, generale.pos.z);
        vue.cible.copy(generale.cible);
      }
      camera.position.copy(vue.pos);
      camera.lookAt(vue.cible);
      renderer.render(ile.scene, camera);

      // Marqueurs HTML au-dessus des objets
      const w = el.clientWidth;
      const h = el.clientHeight;
      ile.ancres.forEach((ancre, id) => {
        const m = marqueurs.current.get(id);
        if (!m) return;
        ancre.getWorldPosition(proj).project(camera);
        const cache = proj.z > 1 || viseeActuelle !== null;
        m.style.opacity = cache ? "0" : "1";
        m.style.pointerEvents = cache ? "none" : "auto";
        m.style.transform = `translate(${(proj.x * 0.5 + 0.5) * w}px, ${(-proj.y * 0.5 + 0.5) * h}px)`;
      });

      if (premier) {
        premier = false;
        rappels.current.onPret?.();
      }
    };
    boucle();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      c.removeEventListener("pointermove", onMove);
      c.removeEventListener("pointerleave", onLeave);
      c.removeEventListener("pointerdown", onDown);
      c.removeEventListener("pointerup", onUp);
      ile.liberer();
      renderer.dispose();
      c.remove();
      api.current = null;
    };
  }, []);

  useEffect(() => {
    api.current?.viser(focus);
  }, [focus]);

  return (
    <div ref={conteneur} className="absolute inset-0">
      {OBJETS.map((o) => (
        <button
          key={o.id}
          ref={(b) => {
            if (b) marqueurs.current.set(o.id, b);
            else marqueurs.current.delete(o.id);
          }}
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={() => onChoisir(o.id)}
          onMouseEnter={() => setSurvol(o.id)}
          onMouseLeave={() => setSurvol(null)}
          className="group absolute left-0 top-0 transition-opacity duration-300"
          style={{ opacity: 0 }}
        >
          <span className="absolute -left-2 -top-2 flex h-4 w-4 items-center justify-center">
            <span className="absolute h-full w-full animate-ping rounded-full bg-lagon-400/60" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-lagon-400 ring-2 ring-ecume-50/80" />
          </span>
          <span
            className={`absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-ocean-950/85 px-3 py-1.5 text-left text-xs font-semibold text-ecume-50 shadow-lift backdrop-blur transition-all duration-200 ${
              survol === o.id ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0"
            }`}
          >
            {o.label} <span className="font-normal text-lagon-300">· {o.titre}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
