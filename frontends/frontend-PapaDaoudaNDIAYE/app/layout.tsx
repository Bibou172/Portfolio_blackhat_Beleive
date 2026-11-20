import type { Metadata, Viewport } from "next";
import { Anton, Inter, JetBrains_Mono, Yellowtail } from "next/font/google";
import { Suspense } from "react";
import ClassicNav from "@/components/ClassicNav";
import Hud from "@/components/Hud";
import Providers from "@/components/Providers";
import TransitionOverlay from "@/components/TransitionOverlay";
import "./globals.css";

const anton = Anton({ variable: "--font-anton", weight: "400", subsets: ["latin"], display: "swap" });
const yellowtail = Yellowtail({ variable: "--font-yellowtail", weight: "400", subsets: ["latin"], display: "swap" });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Portfolio jouable — Papa Daouda Ndiaye", template: "%s · Portfolio jouable" },
  description:
    "Portfolio jouable d'un élève-ingénieur Big Data : parcours, projets, compétences et graphe Neo4j, sur une côte au coucher du soleil.",
};

export const viewport: Viewport = {
  themeColor: "#0E0820",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${anton.variable} ${yellowtail.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>
        <a href="#contenu" className="skip-link">
          Aller au contenu
        </a>
        <Providers>
          <Hud />
          {/* usePathname() dépend de l'URL : ces composants sont streamés (Cache Components). */}
          <Suspense fallback={null}>
            <ClassicNav />
          </Suspense>
          <main id="contenu">{children}</main>
          <Suspense fallback={null}>
            <TransitionOverlay />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
