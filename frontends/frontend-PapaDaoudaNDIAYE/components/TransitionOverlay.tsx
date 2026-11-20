"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store/createStore";
import { ui } from "@/lib/store/uiStore";
import styles from "./hud.module.css";

/**
 * Wipe diagonal façon écran de chargement :
 * cover (le volet couvre l'écran) -> router.push() -> reveal (le volet repart) -> idle.
 */
export default function TransitionOverlay() {
  const t = useStore(ui, (s) => s.transition);
  const router = useRouter();
  const pathname = usePathname();
  const reduced = useReducedMotion();

  // La nouvelle page est affichée : on découvre l'écran.
  useEffect(() => {
    if (t.phase === "covered" && pathname === t.href) ui.set({ transition: { ...t, phase: "reveal" } });
  }, [pathname, t]);

  if (t.phase === "idle") return null;

  const variants = reduced
    ? { hidden: { opacity: 0 }, in: { opacity: 1 }, out: { opacity: 0 } }
    : { hidden: { x: "-135%" }, in: { x: "0%" }, out: { x: "135%" } };

  return (
    <motion.div
      key={`${t.href}-${t.label}`}
      className={styles.wipe}
      role="status"
      aria-live="assertive"
      initial="hidden"
      animate={t.phase === "reveal" ? "out" : "in"}
      variants={variants}
      transition={{ duration: reduced ? 0.15 : 0.55, ease: [0.7, 0, 0.3, 1] }}
      onAnimationComplete={(def) => {
        if (def === "in" && ui.get().transition.phase === "cover") {
          ui.set({ transition: { ...t, phase: "covered" } });
          if (pathname === t.href) ui.set({ transition: { ...t, phase: "reveal" } });
          else router.push(t.href);
        } else if (def === "out") {
          ui.set({ transition: { phase: "idle", href: t.href, label: "" } });
        }
      }}
    >
      <div className={styles.wipePanel} />
      <div className={styles.wipeContent}>
        <span className="mono">Chargement</span>
        <span className={`title ${styles.wipeTitle}`}>{t.label}</span>
        <span className={styles.wipeNeon}>Sunset Drive</span>
        <span className={styles.wipeDots} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </div>
    </motion.div>
  );
}
