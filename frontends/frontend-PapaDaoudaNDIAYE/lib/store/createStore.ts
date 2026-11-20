import { useSyncExternalStore } from "react";

/**
 * Mini-store sans dépendance : partage d'état entre React et la scène Phaser
 * (Phaser n'est pas un composant React, il lit/écrit ici directement).
 */
export interface Store<T extends object> {
  readonly initial: T;
  get(): T;
  set(patch: Partial<T> | ((s: T) => Partial<T>)): void;
  subscribe(listener: () => void): () => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    initial,
    get: () => state,
    set(patch) {
      const p = typeof patch === "function" ? patch(state) : patch;
      state = { ...state, ...p };
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** Hook React : `selector` doit renvoyer une valeur stable (primitive ou référence stockée). */
export function useStore<T extends object, S>(store: Store<T>, selector: (s: T) => S): S {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.initial),
  );
}
