import { useState, type FormEvent } from "react";
import { Check, Copy, Github, Linkedin, Mail, Phone, Send } from "lucide-react";
import { useProfil } from "@/lib/ProfilContext";
import { SITE } from "@/lib/site";
import SectionHeader from "@/components/SectionHeader";
import Reveal from "@/components/Reveal";

/**
 * L'API d'équipe n'a pas d'endpoint de contact (voir API_ROUTES.md) : le formulaire n'envoie donc rien
 * lui-même. Il prépare le message et l'ouvre dans la messagerie du visiteur (mailto:), ce qui est dit clairement.
 */
function Formulaire({ email }: { email: string }) {
  const [champs, setChamps] = useState({ nom: "", entreprise: "", message: "" });
  const [pret, setPret] = useState(false);

  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    const sujet = `Opportunité — ${champs.nom}${champs.entreprise ? ` (${champs.entreprise})` : ""}`;
    const corps = `${champs.message}\n\n— ${champs.nom}${champs.entreprise ? `, ${champs.entreprise}` : ""}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
    setPret(true);
  };

  const champ =
    "w-full rounded-xl border border-ocean-900/15 bg-white px-4 py-3 text-ink placeholder:text-ink/40 transition focus:border-lagon-500 focus:outline-none focus:ring-2 focus:ring-lagon-500/25";

  return (
    <form onSubmit={soumettre} className="carte space-y-4 p-6 sm:p-8" noValidate={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ocean-900">Votre nom</span>
          <input required autoComplete="name" className={champ} value={champs.nom} onChange={(e) => setChamps({ ...champs, nom: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ocean-900">
            Entreprise <span className="font-normal text-ink/45">(facultatif)</span>
          </span>
          <input autoComplete="organization" className={champ} value={champs.entreprise} onChange={(e) => setChamps({ ...champs, entreprise: e.target.value })} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ocean-900">Votre message</span>
        <textarea
          required
          rows={5}
          className={`${champ} resize-y`}
          placeholder="Un poste, une alternance, un projet à me proposer…"
          value={champs.message}
          onChange={(e) => setChamps({ ...champs, message: e.target.value })}
        />
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink/55">Le message s'ouvre dans votre messagerie, prêt à être envoyé.</p>
        <button type="submit" className="btn-primaire group">
          Préparer le message <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </button>
      </div>
      {pret && (
        <p role="status" className="rounded-xl bg-lagon-500/10 px-4 py-3 text-sm text-lagon-700">
          Votre messagerie devrait s'ouvrir. Si rien ne se passe, écrivez directement à <strong>{email}</strong>.
        </p>
      )}
    </form>
  );
}

export default function Contact() {
  const { data: p } = useProfil();
  const [copie, setCopie] = useState(false);
  const github = p?.liens?.github ?? `https://github.com/${SITE.githubPseudo}`;

  const copier = async () => {
    if (!p?.email) return;
    try {
      await navigator.clipboard.writeText(p.email);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      /* presse-papiers indisponible */
    }
  };

  return (
    <section id="contact" className="relative isolate overflow-hidden py-24 sm:py-32">
      <img src="/illustrations/lagon.svg" alt="" aria-hidden loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover object-right" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ecume-50 via-ecume-50/90 to-ecume-50/40" aria-hidden />

      <div className="conteneur grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <div>
          <SectionHeader
            etape="07"
            surtitre="Contact"
            titre={
              <>
                Et si la prochaine étape <span className="italic text-lagon-600">se faisait ensemble ?</span>
              </>
            }
            intro={p?.recherche ?? "Une opportunité d'emploi, d'alternance ou de projet ? Échangeons : je réponds rapidement."}
          />
          <Reveal as="ul" className="space-y-3">
            {p?.email && (
              <li className="carte flex items-center justify-between gap-3 p-4">
                <a href={`mailto:${p.email}`} className="flex min-w-0 items-center gap-3 font-medium text-ocean-900 hover:text-lagon-700">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ocean-800 to-lagon-600 text-white">
                    <Mail className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="truncate">{p.email}</span>
                </a>
                <button type="button" onClick={copier} className="rounded-full p-2 text-ink/50 hover:bg-ecume-100 hover:text-ocean-900" aria-label="Copier l'adresse email">
                  {copie ? <Check className="h-4 w-4 text-lagon-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </li>
            )}
            {p?.telephone && (
              <li>
                <a
                  href={`tel:${p.telephone.replace(/\s/g, "")}`}
                  className="carte flex items-center gap-3 p-4 font-medium text-ocean-900 transition hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-lagon-600 to-lagon-400 text-white">
                    <Phone className="h-5 w-5" aria-hidden />
                  </span>
                  {p.telephone}
                </a>
              </li>
            )}
            {p?.liens?.linkedin && (
              <li>
                <a href={p.liens.linkedin} target="_blank" rel="noreferrer" className="carte flex items-center gap-3 p-4 font-medium text-ocean-900 transition hover:-translate-y-0.5 hover:shadow-lift">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a66c2] text-white">
                    <Linkedin className="h-5 w-5" aria-hidden />
                  </span>
                  LinkedIn
                </a>
              </li>
            )}
            <li>
              <a href={github} target="_blank" rel="noreferrer" className="carte flex items-center gap-3 p-4 font-medium text-ocean-900 transition hover:-translate-y-0.5 hover:shadow-lift">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white">
                  <Github className="h-5 w-5" aria-hidden />
                </span>
                GitHub
              </a>
            </li>
          </Reveal>
        </div>

        {p?.email && (
          <Reveal delai={120}>
            <Formulaire email={p.email} />
          </Reveal>
        )}
      </div>
    </section>
  );
}
