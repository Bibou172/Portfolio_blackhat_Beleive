"use client";

import dynamic from "next/dynamic";
import { TIPS } from "@/lib/sections";
import { useStore } from "@/lib/store/createStore";
import { ui } from "@/lib/store/uiStore";
import ClassicHome from "./ClassicHome";
import LoadingScreen from "./LoadingScreen";

function StageFallback() {
  const introSeen = useStore(ui, (s) => s.introSeen);
  return introSeen ? <div style={{ position: "fixed", inset: 0, background: "var(--night)" }} /> : <LoadingScreen progress={0.05} tip={TIPS[0]} />;
}

// Phaser accède à window/document : la scène n'est jamais rendue côté serveur.
const GameStage = dynamic(() => import("./GameStage"), { ssr: false, loading: () => <StageFallback /> });

export default function HomeClient() {
  const classic = useStore(ui, (s) => s.classic);
  return classic ? <ClassicHome /> : <GameStage />;
}
