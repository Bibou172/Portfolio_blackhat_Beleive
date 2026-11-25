"use client";

import { type PointerEvent, useState } from "react";
import { touchInput } from "@/lib/store/gameStore";
import styles from "./game.module.css";

const DEAD_ZONE = 14;
const MAX = 34;

/** Joystick tactile (gauche / droite, glisser vers le haut = saut) + bouton de saut. Visible sur écran tactile. */
export default function TouchControls() {
  const [thumb, setThumb] = useState({ x: 0, y: 0 });

  const update = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const dx = Math.max(-MAX, Math.min(MAX, e.clientX - (r.left + r.width / 2)));
    const dy = Math.max(-MAX, Math.min(MAX, e.clientY - (r.top + r.height / 2)));
    touchInput.left = dx < -DEAD_ZONE;
    touchInput.right = dx > DEAD_ZONE;
    touchInput.jump = dy < -MAX * 0.8;
    setThumb({ x: dx, y: dy });
  };

  const release = () => {
    touchInput.left = touchInput.right = touchInput.jump = false;
    setThumb({ x: 0, y: 0 });
  };

  return (
    <div className={styles.touch}>
      <div
        className={styles.joystick}
        role="application"
        aria-label="Joystick : glisser à gauche ou à droite pour marcher, vers le haut pour sauter"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          update(e);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) update(e);
        }}
        onPointerUp={release}
        onPointerCancel={release}
      >
        <span className={styles.thumb} style={{ transform: `translate(${thumb.x}px, ${thumb.y}px)` }} />
      </div>
      <button
        type="button"
        className={styles.jumpBtn}
        aria-label="Sauter"
        onPointerDown={() => (touchInput.jump = true)}
        onPointerUp={() => (touchInput.jump = false)}
        onPointerCancel={() => (touchInput.jump = false)}
        onPointerLeave={() => (touchInput.jump = false)}
      >
        SAUT
      </button>
    </div>
  );
}
