"use client";

import { type FormEvent, type KeyboardEvent, useState } from "react";
import { createExperience, createFormation, createProjet, type WriteResult } from "@/lib/api/admin";
import { ui } from "@/lib/store/uiStore";
import styles from "./admin.module.css";

type Kind = "experience" | "projet" | "formation";
type Values = Record<string, string>;
type Errors = Record<string, string>;

interface FieldDef {
  name: string;
  label: string;
  required?: boolean;
  type?: "text" | "month" | "number" | "url" | "textarea";
  hint?: string;
  placeholder?: string;
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const v = (values: Values, k: string) => (values[k] ?? "").trim();
const skills = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

function isHttpUrl(s: string) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Règles communes : champs obligatoires, longueurs, dates AAAA-MM, fin ≥ début. */
function baseErrors(values: Values, fields: FieldDef[]): Errors {
  const e: Errors = {};
  for (const f of fields) {
    const val = v(values, f.name);
    if (f.required && !val) e[f.name] = "Champ obligatoire.";
    else if (val.length > (f.type === "textarea" ? 2000 : 160)) e[f.name] = "Texte trop long.";
    else if (val && f.type === "month" && !MONTH.test(val)) e[f.name] = "Format attendu : AAAA-MM (ex. 2026-04).";
    else if (val && f.type === "url" && !isHttpUrl(val)) e[f.name] = "URL invalide (doit commencer par http:// ou https://).";
  }
  const debut = v(values, "debut");
  const fin = v(values, "fin");
  if (!e.debut && !e.fin && debut && fin && fin < debut) e.fin = "La fin doit être après le début.";
  if (values.competences !== undefined) {
    const bad = skills(values.competences).filter((s) => !SLUG.test(s));
    if (bad.length) e.competences = `Slugs invalides : ${bad.join(", ")} (minuscules, chiffres et tirets).`;
  }
  return e;
}

const FORMS: Record<Kind, { tab: string; fields: FieldDef[]; validate: (v: Values) => Errors; submit: (v: Values) => Promise<WriteResult> }> = {
  experience: {
    tab: "Expérience",
    fields: [
      { name: "entreprise", label: "Entreprise", required: true },
      { name: "poste", label: "Poste", required: true },
      { name: "lieu", label: "Ville", placeholder: "Rouen" },
      { name: "debut", label: "Début", required: true, type: "month", placeholder: "2026-04" },
      { name: "fin", label: "Fin", type: "month", hint: "Laisser vide si en cours." },
      { name: "description", label: "Description", type: "textarea" },
      { name: "competences", label: "Compétences", hint: "Slugs séparés par des virgules : python, mongodb" },
    ],
    validate: (values) => baseErrors(values, FORMS.experience.fields),
    submit: (values) =>
      createExperience({
        entreprise: v(values, "entreprise"),
        poste: v(values, "poste"),
        lieu: v(values, "lieu") || null,
        debut: v(values, "debut"),
        fin: v(values, "fin") || null,
        description: v(values, "description") || null,
        competences: skills(values.competences ?? ""),
      }),
  },
  projet: {
    tab: "Projet",
    fields: [
      { name: "projet_slug", label: "Slug", required: true, placeholder: "smartcity-explorer", hint: "Identifiant unique : minuscules et tirets." },
      { name: "titre", label: "Titre", required: true },
      { name: "annee", label: "Année", required: true, type: "number", placeholder: "2026" },
      { name: "description", label: "Description courte", required: true, type: "textarea" },
      { name: "description_longue", label: "Description longue (briefing)", type: "textarea" },
      { name: "competences", label: "Compétences", required: true, hint: "Slugs séparés par des virgules : python, neo4j" },
      { name: "lien_repo", label: "Lien du dépôt", type: "url", placeholder: "https://github.com/…" },
      { name: "lien_demo", label: "Lien de démo", type: "url" },
    ],
    validate: (values) => {
      const e = baseErrors(values, FORMS.projet.fields);
      const slug = v(values, "projet_slug");
      if (!e.projet_slug && slug && !SLUG.test(slug)) e.projet_slug = "Minuscules, chiffres et tirets uniquement.";
      const annee = Number(v(values, "annee"));
      if (!e.annee && (!Number.isInteger(annee) || annee < 2000 || annee > 2100)) e.annee = "Année entre 2000 et 2100.";
      if (!e.competences && skills(values.competences ?? "").length === 0) e.competences = "Au moins une compétence.";
      return e;
    },
    submit: (values) =>
      createProjet({
        projet_slug: v(values, "projet_slug"),
        candidat_slug: ui.get().profil?.candidat_slug ?? null,
        titre: v(values, "titre"),
        annee: Number(v(values, "annee")),
        description: v(values, "description"),
        description_longue: v(values, "description_longue") || null,
        competences: skills(values.competences ?? ""),
        lien_repo: v(values, "lien_repo") || null,
        lien_demo: v(values, "lien_demo") || null,
      }),
  },
  formation: {
    tab: "Formation",
    fields: [
      { name: "ecole", label: "École", required: true },
      { name: "diplome", label: "Diplôme", required: true },
      { name: "lieu", label: "Ville" },
      { name: "debut", label: "Début", required: true, type: "month", placeholder: "2024-09" },
      { name: "fin", label: "Fin", type: "month", hint: "Laisser vide si en cours." },
    ],
    validate: (values) => baseErrors(values, FORMS.formation.fields),
    submit: (values) =>
      createFormation({
        ecole: v(values, "ecole"),
        diplome: v(values, "diplome"),
        lieu: v(values, "lieu") || null,
        debut: v(values, "debut"),
        fin: v(values, "fin") || null,
      }),
  },
};

const KINDS = Object.keys(FORMS) as Kind[];

function AdminForm({ kind }: { kind: Kind }) {
  const def = FORMS[kind];
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<WriteResult | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = def.validate(values);
    setErrors(errs);
    setStatus(null);
    const first = def.fields.find((f) => errs[f.name]);
    if (first) {
      document.getElementById(`${kind}-${first.name}`)?.focus();
      return;
    }
    setPending(true);
    const res = await def.submit(values);
    setPending(false);
    setStatus(res);
    if (res.ok) setValues({});
  }

  return (
    <form className={`panel ${styles.form}`} onSubmit={onSubmit} noValidate aria-label={`Ajouter : ${def.tab}`}>
      {def.fields.map((f) => {
        const id = `${kind}-${f.name}`;
        const err = errors[f.name];
        const describedBy = [f.hint ? `${id}-hint` : "", err ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
        const common = {
          id,
          name: f.name,
          className: styles.input,
          value: values[f.name] ?? "",
          placeholder: f.placeholder,
          required: f.required,
          "aria-invalid": err ? true : undefined,
          "aria-describedby": describedBy,
          onChange: (ev: { target: { value: string } }) => setValues((s) => ({ ...s, [f.name]: ev.target.value })),
        };
        return (
          <div key={f.name} className={styles.field}>
            <label htmlFor={id} className={styles.label}>
              {f.label} {f.required && <span className={styles.required} aria-hidden="true">*</span>}
            </label>
            {f.type === "textarea" ? (
              <textarea {...common} />
            ) : (
              <input
                {...common}
                type={f.type === "month" ? "text" : f.type === "number" ? "number" : f.type === "url" ? "url" : "text"}
                inputMode={f.type === "month" || f.type === "number" ? "numeric" : undefined}
              />
            )}
            {f.hint && (
              <span id={`${id}-hint`} className={styles.hint}>
                {f.hint}
              </span>
            )}
            {err && (
              <span id={`${id}-err`} className={styles.error}>
                {err}
              </span>
            )}
          </div>
        );
      })}
      <p className="hint muted" style={{ margin: 0 }}>
        <span className={styles.required}>*</span> champ obligatoire
      </p>
      <div>
        <button type="submit" className="btn btn--solid" disabled={pending}>
          {pending ? "Envoi…" : `Ajouter ${def.tab.toLowerCase()}`}
        </button>
      </div>
      <div aria-live="polite">
        {status && <p className={`${styles.status} ${status.ok ? styles.ok : styles.ko}`}>{status.message}</p>}
      </div>
    </form>
  );
}

/** Onglets Expérience / Projet / Formation (clavier : flèches gauche/droite). */
export default function AdminForms() {
  const [kind, setKind] = useState<Kind>("experience");

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = KINDS.indexOf(kind);
    const next = KINDS[(i + (e.key === "ArrowRight" ? 1 : KINDS.length - 1)) % KINDS.length];
    setKind(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Type d'élément à ajouter">
        {KINDS.map((k) => (
          <button
            key={k}
            id={`tab-${k}`}
            type="button"
            role="tab"
            className={`btn ${styles.tab}`}
            aria-selected={k === kind}
            aria-controls={`panel-${k}`}
            tabIndex={k === kind ? 0 : -1}
            onClick={() => setKind(k)}
            onKeyDown={onTabKey}
          >
            {FORMS[k].tab}
          </button>
        ))}
      </div>
      <div id={`panel-${kind}`} role="tabpanel" aria-labelledby={`tab-${kind}`}>
        <AdminForm key={kind} kind={kind} />
      </div>
    </>
  );
}
