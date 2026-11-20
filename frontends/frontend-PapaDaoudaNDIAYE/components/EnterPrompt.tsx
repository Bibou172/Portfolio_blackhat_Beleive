"use client";

import { AnimatePresence, motion } from "framer-motion";
import { getSection } from "@/lib/sections";
import { useStore } from "@/lib/store/createStore";
import { gameStore, sendCommand } from "@/lib/store/gameStore";
import styles from "./game.module.css";

/** Bulle HUD affichée devant une voiture : touche E ou bouton (souris, tactile, clavier). */
export default function EnterPrompt() {
  const nearCar = useStore(gameStore, (s) => s.nearCar);
  const busy = useStore(gameStore, (s) => s.busy);
  const section = nearCar && !busy ? getSection(nearCar) : null;

  return (
    <div aria-live="polite">
      <AnimatePresence>
        {section && (
          <motion.div
            key={section.id}
            className={`panel ${styles.prompt}`}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            <span className={styles.keyboardHint}>
              Appuie sur <kbd className={styles.key}>E</kbd> pour entrer
            </span>
            <button
              type="button"
              className="btn btn--solid"
              style={{ background: section.color, borderColor: section.color }}
              onClick={() => sendCommand("enter")}
            >
              Entrer · {section.label}
            </button>
            <span className="mono muted">{section.carName}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
