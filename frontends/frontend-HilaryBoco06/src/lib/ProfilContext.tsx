import { createContext, useContext, type ReactNode } from "react";
import { useRessource, type Etat } from "./hooks";
import { getProfil } from "./portfolio";
import type { Profil } from "./types";

const Ctx = createContext<Etat<Profil> | null>(null);

/** Le profil (R1) est chargé une seule fois et partagé : navigation, hero, pied de page, contact. */
export function ProfilProvider({ children }: { children: ReactNode }) {
  const etat = useRessource(getProfil, []);
  return <Ctx.Provider value={etat}>{children}</Ctx.Provider>;
}

export function useProfil(): Etat<Profil> {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProfil doit être utilisé dans <ProfilProvider>");
  return v;
}
