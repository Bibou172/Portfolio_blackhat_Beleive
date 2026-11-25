import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ProfilProvider, useProfil } from "./lib/ProfilContext";
import { nomComplet } from "./lib/format";
import { SITE } from "./lib/site";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SourceBadge from "./components/SourceBadge";
import Home from "./pages/Home";
import ProjectPage from "./pages/ProjectPage";
import NotFound from "./pages/NotFound";

function GestionScroll() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Laisse le temps à la page d'afficher la section avant d'y aller.
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 80);
      return () => clearTimeout(t);
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

function TitreDocument() {
  const { data } = useProfil();
  useEffect(() => {
    const nom = data ? nomComplet(data.prenom, data.nom) : SITE.nomParDefaut;
    document.title = data?.titre ? `${nom} — ${data.titre}` : `${nom} — Portfolio`;
  }, [data]);
  return null;
}

export default function App() {
  return (
    <ProfilProvider>
      <TitreDocument />
      <GestionScroll />
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] btn-clair">
        Aller au contenu
      </a>
      <Navbar />
      <main id="contenu">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projets/:slug" element={<ProjectPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <SourceBadge />
    </ProfilProvider>
  );
}
