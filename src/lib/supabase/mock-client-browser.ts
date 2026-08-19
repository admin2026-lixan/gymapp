/**
 * Parte del MODO MOCK (ver mock-shared.ts para cómo desactivarlo).
 *
 * Cliente mock usado desde componentes de cliente ("use client"). Corre en
 * el navegador, así que no puede tocar el store en memoria del servidor
 * directamente: manda cada operación por `fetch` a las rutas
 * `/api/mock/db` y `/api/mock/storage`, que sí corren en el proceso de
 * Node y ejecutan contra el mismo store que usan los Server Components.
 * Así una mutación hecha en el navegador (agregar una serie, crear una
 * rutina, etc.) se ve reflejada al navegar a una página que se renderiza
 * en el servidor.
 */

import { MockQueryBuilder } from "./mock-builder";
import { FAKE_USER } from "./mock-shared";

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export function createMockBrowserClient() {
  return {
    from(table: string) {
      return new MockQueryBuilder(table, (op) => post("/api/mock/db", op));
    },
    auth: {
      getUser: async () => ({ data: { user: FAKE_USER }, error: null }),
      getSession: async () => ({ data: { session: { user: FAKE_USER } }, error: null }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({ data: { user: FAKE_USER, session: {} }, error: null }),
      signUp: async () => ({ data: { user: FAKE_USER, session: null }, error: null }),
    },
    storage: {
      from(bucket: string) {
        return {
          upload: async (path: string, file: File) => {
            const form = new FormData();
            form.append("action", "upload");
            form.append("bucket", bucket);
            form.append("path", path);
            form.append("file", file);
            const res = await fetch("/api/mock/storage", { method: "POST", body: form });
            return res.json();
          },
          remove: async (paths: string[]) => post("/api/mock/storage", { action: "remove", bucket, paths }),
          createSignedUrl: async (path: string, expiresIn?: number) =>
            post("/api/mock/storage", { action: "createSignedUrl", bucket, path, expiresIn }),
          list: async (prefix?: string) => post("/api/mock/storage", { action: "list", bucket, prefix }),
        };
      },
    },
  };
}
