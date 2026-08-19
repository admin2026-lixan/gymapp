/**
 * Parte del MODO MOCK (ver mock-shared.ts para cómo desactivarlo).
 *
 * Cliente mock usado desde Server Components / Route Handlers (mismo
 * proceso de Node que `mock-engine.ts`, así que llama a `runQuery` /
 * `runStorage` directamente, sin red).
 */

import { MockQueryBuilder } from "./mock-builder";
import { runQuery, runStorage } from "./mock-engine";
import { FAKE_USER } from "./mock-shared";

async function fileLikeToDataUrl(file: unknown, contentType?: string): Promise<string> {
  const maybeBlob = file as { arrayBuffer?: () => Promise<ArrayBuffer>; type?: string };
  if (typeof maybeBlob?.arrayBuffer === "function") {
    const buf = Buffer.from(await maybeBlob.arrayBuffer());
    return `data:${contentType || maybeBlob.type || "application/octet-stream"};base64,${buf.toString("base64")}`;
  }
  return `data:${contentType || "application/octet-stream"};base64,`;
}

export function createMockServerClient() {
  return {
    from(table: string) {
      return new MockQueryBuilder(table, (op) => runQuery(op));
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
          upload: async (path: string, file: unknown, opts?: { contentType?: string }) => {
            const dataUrl = await fileLikeToDataUrl(file, opts?.contentType);
            return runStorage({ action: "upload", bucket, path, dataUrl });
          },
          remove: async (paths: string[]) => runStorage({ action: "remove", bucket, paths }),
          createSignedUrl: async (path: string, _expiresIn?: number) =>
            runStorage({ action: "createSignedUrl", bucket, path }),
          list: async (prefix?: string) => runStorage({ action: "list", bucket, prefix }),
        };
      },
    },
  };
}
