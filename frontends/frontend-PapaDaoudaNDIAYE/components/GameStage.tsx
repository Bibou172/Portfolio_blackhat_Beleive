"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { TIPS } from "@/lib/sections";
import { useStore } from "@/lib/store/createStore";
import { gameStore } from "@/lib/store/gameStore";
import { startWipe, ui } from "@/lib/store/uiStore";
import EnterPrompt from "./EnterPrompt";
import LoadingScreen from "./LoadingScreen";
import TouchControls from "./TouchControls";
import styles from "./game.module.css";

// Ce module n'est chargé que dans le navigateur (dynamic + ssr: false) : l'aléatoire est sans risque d'hydratation.
const TIP = TIPS[Math.floor(Math.random() * TIPS.length)];
const MIN_LOADING_MS = 1400;

/** Scène de jeu : crée Phaser au montage, le détruit au démontage (changement de page). */
export default function GameStage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const introSeen = useStore(ui, (s) => s.introSeen);
  const progress = useStore(gameStore, (s) => s.progress);
  const ready = useStore(gameStore, (s) => s.ready);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let stop: (() => void) | null = null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const returnFrom = ui.get().returnFrom;
    gameStore.set({ ready: false, progress: 0.1, busy: false, nearCar: null });

    // Phaser (≈ 1 Mo) est chargé à la demande, dans un fichier séparé.
    import("@/game/createGame").then(async ({ createGame, destroyGame }) => {
      if (cancelled) return;
      gameStore.set({ progress: 0.4 });
      const g = await createGame(
        host,
        {
          reducedMotion,
          onEnter: (section) => startWipe(section.href, section.label),
          onReturnConsumed: () => ui.set({ returnFrom: null }),
        },
        { returnFrom, playerX: returnFrom ? undefined : gameStore.get().playerX },
      );
      if (cancelled) destroyGame(g);
      else stop = () => destroyGame(g);
    });

    return () => {
      cancelled = true;
      stop?.();
      stop = null;
    };
  }, []);

  // Fin de l'écran de chargement : jeu prêt + durée minimale (pour lire l'astuce).
  useEffect(() => {
    if (!ready || ui.get().introSeen) return;
    const t = setTimeout(() => ui.set({ introSeen: true }), MIN_LOADING_MS);
    return () => clearTimeout(t);
  }, [ready]);

  return (
    <div className={styles.stage}>
      <div
        ref={hostRef}
        className={styles.canvas}
        role="img"
        aria-label="Rue au coucher du soleil avec cinq voitures garées, chacune menant à une section du portfolio. Utilise le bouton Mode classique pour une navigation sans jeu."
      />
      <EnterPrompt />
      <TouchControls />
      <AnimatePresence>
        {!introSeen && (
          <motion.div key="loading" exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <LoadingScreen progress={progress} tip={TIP} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
