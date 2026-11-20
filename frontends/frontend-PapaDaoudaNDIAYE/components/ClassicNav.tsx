"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS } from "@/lib/sections";
import { useStore } from "@/lib/store/createStore";
import { ui } from "@/lib/store/uiStore";
import styles from "./hud.module.css";

/** Navigation HTML normale vers toutes les sections, affichée en « Mode classique ». */
export default function ClassicNav() {
  const classic = useStore(ui, (s) => s.classic);
  const pathname = usePathname();
  if (!classic) return null;

  const links = [{ href: "/", label: "Accueil" }, ...SECTIONS.map((s) => ({ href: s.href, label: s.label }))];
  return (
    <nav className={styles.classicNav} aria-label="Navigation principale">
      <ul>
        {links.map((l) => {
          const current = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link href={l.href} className="chip" aria-current={current ? "page" : undefined}>
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
