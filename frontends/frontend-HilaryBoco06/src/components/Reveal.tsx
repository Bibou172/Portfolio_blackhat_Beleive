import type { CSSProperties, ElementType, ReactNode } from "react";
import { useReveal } from "@/lib/hooks";

interface Props {
  children: ReactNode;
  delai?: number;
  className?: string;
  as?: ElementType;
}

/** Fait apparaître doucement son contenu quand il entre dans l'écran. */
export default function Reveal({ children, delai = 0, className = "", as: Tag = "div" }: Props) {
  const ref = useReveal<HTMLElement>();
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ "--delai": `${delai}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}
