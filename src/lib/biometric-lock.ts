"use client";

/**
 * Candado biométrico de la app (huella / Face ID) usando la Web Authentication
 * API con un autenticador de plataforma (Touch ID, Face ID, huella de Android).
 *
 * Importante: esto NO reemplaza el login de Supabase, es una capa extra local.
 * La credencial se registra y se verifica en el propio dispositivo (no hay
 * challenge/firma verificados en un servidor) — su función es confirmar
 * "sos vos sosteniendo el teléfono" antes de mostrar la app, reutilizando el
 * lector biométrico nativo. La sesión real sigue siendo la de Supabase.
 *
 * La credencial queda guardada en localStorage, por lo tanto es por
 * dispositivo + navegador: si instalás la PWA en otro celular vas a tener que
 * activarla de nuevo ahí.
 */

const CREDENTIAL_PREFIX = "app-gym:biometric-credential:";
const UNLOCKED_PREFIX = "app-gym:biometric-unlocked:";

function credentialKey(userId: string) {
  return `${CREDENTIAL_PREFIX}${userId}`;
}

function unlockedKey(userId: string) {
  return `${UNLOCKED_PREFIX}${userId}`;
}

function randomChallenge(): ArrayBuffer {
  return crypto.getRandomValues(new Uint8Array(32)).buffer as ArrayBuffer;
}

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64url: string): ArrayBuffer {
  const b64 = b64url
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(b64url.length / 4) * 4, "=");
  const binary = atob(b64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0)).buffer as ArrayBuffer;
}

/** true si el navegador/dispositivo soporta un autenticador biométrico de plataforma. */
export async function isBiometricSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** true si este dispositivo/navegador ya tiene una credencial registrada para el usuario. */
export function isBiometricEnabled(userId: string): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(credentialKey(userId)));
}

/** Abre el prompt nativo de huella/Face ID para registrar el candado. */
export async function enableBiometric(userId: string, email: string): Promise<void> {
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: randomChallenge(),
      rp: { name: "App Gym" },
      user: {
        id: new TextEncoder().encode(userId),
        name: email,
        displayName: email,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "required",
      },
      timeout: 60000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("No se pudo registrar la biometría");

  localStorage.setItem(credentialKey(userId), toBase64Url(credential.rawId));
}

/** Quita el candado de este dispositivo. */
export function disableBiometric(userId: string): void {
  localStorage.removeItem(credentialKey(userId));
  sessionStorage.removeItem(unlockedKey(userId));
}

/** Abre el prompt nativo de huella/Face ID para desbloquear. */
export async function verifyBiometric(userId: string): Promise<boolean> {
  const storedId = localStorage.getItem(credentialKey(userId));
  if (!storedId) return false;

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomChallenge(),
        allowCredentials: [
          { id: fromBase64Url(storedId), type: "public-key", transports: ["internal"] },
        ],
        userVerification: "required",
        timeout: 60000,
      },
    });
    return Boolean(assertion);
  } catch {
    return false;
  }
}

export function isUnlockedThisSession(userId: string): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(unlockedKey(userId)) === "1";
}

export function markUnlockedThisSession(userId: string): void {
  sessionStorage.setItem(unlockedKey(userId), "1");
}
