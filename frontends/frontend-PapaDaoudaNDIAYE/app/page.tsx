import Link from "next/link";
import HomeClient from "@/components/HomeClient";
import { SECTIONS } from "@/lib/sections";

export default function Home() {
  return (
    <>
      {/* Contenu lisible par les moteurs de recherche et les lecteurs d'écran, même sans le jeu. */}
      <div className="visually-hidden">
        <h1>Papa Daouda Ndiaye — portfolio jouable</h1>
        <p>
          Une rue au coucher du soleil : chaque voiture mène à une section. Toutes les sections sont aussi accessibles
          par ces liens.
        </p>
        <ul>
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <Link href={s.href}>
                {s.label} — {s.description}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <HomeClient />
    </>
  );
}
