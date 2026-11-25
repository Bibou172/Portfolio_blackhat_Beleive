import { Link } from "react-router-dom";
import { Dessin } from "@/components/Motif";

export default function NotFound() {
  return (
    <section className="topo flex min-h-[80vh] items-center pt-16">
      <div className="conteneur text-center">
        <div className="mx-auto w-24 animate-float" aria-hidden><Dessin nom="boussole" /></div>
        <p className="surtitre mt-6">Erreur 404 · Hors des sentiers battus</p>
        <h1 className="mt-4 text-4xl font-semibold text-ocean-900 sm:text-5xl">Cette page ne figure sur aucune carte.</h1>
        <Link to="/" className="btn-sombre mt-10">
          Revenir au point de départ
        </Link>
      </div>
    </section>
  );
}
