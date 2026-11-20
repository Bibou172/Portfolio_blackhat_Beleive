"use client";

import { usePathname } from "next/navigation";
import { carX, WORLD_WIDTH } from "@/game/layout";
import { SECTIONS, sectionFromPath } from "@/lib/sections";
import { useStore } from "@/lib/store/createStore";
import { gameStore } from "@/lib/store/gameStore";
import styles from "./hud.module.css";

const SIZE = 136;
const C = SIZE / 2;
const MARGIN = 22;
const STREET_Y = C + 12;

const toMap = (x: number) => MARGIN + (Math.max(0, Math.min(WORLD_WIDTH, x)) / WORLD_WIDTH) * (SIZE - MARGIN * 2);

/** Mini-carte ronde : la rue, les 5 voitures et la position du joueur. */
export default function Minimap() {
  const pathname = usePathname();
  const playerX = useStore(gameStore, (s) => s.playerX);
  const nearCar = useStore(gameStore, (s) => s.nearCar);
  const section = sectionFromPath(pathname);
  const inCarIndex = section ? SECTIONS.findIndex((s) => s.id === section.id) : -1;
  const px = toMap(inCarIndex >= 0 ? carX(inCarIndex) : playerX);
  const label = section
    ? `En véhicule · ${section.label}`
    : nearCar
      ? `Près de · ${SECTIONS.find((s) => s.id === nearCar)?.label}`
      : "Sunset Drive";

  return (
    <div
      className={`${styles.minimap} ${pathname !== "/" ? styles.minimapCompact : ""}`}
      role="img"
      aria-label={`Mini-carte : ${label}`}
    >
      <svg className={styles.minimapSvg} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <defs>
          <clipPath id="minimap-clip">
            <circle cx={C} cy={C} r={C - 3} />
          </clipPath>
        </defs>
        <circle cx={C} cy={C} r={C - 2} fill="#0E0820" stroke="#2EE6D6" strokeWidth="3" />
        <g clipPath="url(#minimap-clip)">
          <rect x="0" y={STREET_Y - 30} width={SIZE} height="22" fill="#3b1d6e" />
          <rect x="0" y={STREET_Y - 8} width={SIZE} height="18" fill="#241540" />
          <line x1="0" x2={SIZE} y1={STREET_Y + 1} y2={STREET_Y + 1} stroke="#FFD166" strokeDasharray="4 4" strokeWidth="1" />
          <circle cx={C} cy={C} r={C * 0.62} fill="none" stroke="rgba(46,230,214,0.25)" />
          <circle cx={C} cy={C} r={C * 0.32} fill="none" stroke="rgba(46,230,214,0.25)" />
          {SECTIONS.map((s, i) => (
            <rect
              key={s.id}
              x={toMap(carX(i)) - 5}
              y={STREET_Y - 5}
              width="10"
              height="7"
              rx="2"
              fill={s.color}
              opacity={section && section.id !== s.id ? 0.5 : 1}
            />
          ))}
          <g className={styles.playerDot}>
            <circle cx={px} cy={STREET_Y + 9} r="5" fill="#FFF4E8" stroke="#FF3D8B" strokeWidth="2" />
          </g>
        </g>
        <text x={C} y="14" textAnchor="middle" fill="#C9B8E8" fontSize="9" fontFamily="monospace">
          N
        </text>
      </svg>
      <span className={styles.minimapLabel}>{label}</span>
    </div>
  );
}
