"use client";

import { useEffect } from "react";
import { reportOffline } from "@/lib/store/uiStore";

/** Placé dans une page serveur : signale au HUD si les données viennent des mocks. */
export default function ApiStatusReporter({ offline }: { offline: boolean }) {
  useEffect(() => {
    reportOffline(offline);
  }, [offline]);
  return null;
}
