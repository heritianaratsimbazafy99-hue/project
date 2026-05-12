import { createHmac, timingSafeEqual } from "node:crypto";

import type { UserRole } from "@/types/database";

export const DEMO_SESSION_COOKIE = "jobmada_demo_session";
export const DEMO_PASSWORD = "jobmada-demo-password";
const LOCAL_DEMO_AUTH_SECRET = "jobmada-local-demo-auth-secret";

export type DemoAccount = {
  id: string;
  role: UserRole;
  email: string;
  displayName: string;
  onboardingCompletion: number;
};

export const demoAccounts: DemoAccount[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    role: "recruiter",
    email: "recruteur.demo@jobmada.mg",
    displayName: "Recruteur demo JobMada",
    onboardingCompletion: 100
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    role: "candidate",
    email: "candidat.demo@jobmada.mg",
    displayName: "Candidat demo JobMada",
    onboardingCompletion: 75
  }
];

export function isDemoAuthEnabled() {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  if (process.env.ENABLE_DEMO_AUTH === "true") {
    return true;
  }

  if (process.env.ENABLE_DEMO_AUTH === "false") {
    return false;
  }

  return true;
}

function getDemoAuthSecret() {
  return process.env.DEMO_AUTH_SECRET || process.env.AUTH_SECRET || LOCAL_DEMO_AUTH_SECRET;
}

export function getDemoAccountForCredentials(email: string, password: string) {
  if (!isDemoAuthEnabled()) {
    return null;
  }

  if (password !== DEMO_PASSWORD) {
    return null;
  }

  return demoAccounts.find((account) => account.email === email.toLowerCase()) ?? null;
}

export function serializeDemoSession(account: DemoAccount) {
  const payload = Buffer.from(
    JSON.stringify({
      id: account.id,
      role: account.role,
      email: account.email,
      displayName: account.displayName
    }),
    "utf8"
  ).toString("base64url");
  const signature = createHmac("sha256", getDemoAuthSecret()).update(payload).digest("base64url");

  return `${payload}.${signature}`;
}

function hasValidDemoSessionSignature(payload: string, signature: string) {
  const expectedSignature = createHmac("sha256", getDemoAuthSecret()).update(payload).digest("base64url");
  const provided = Buffer.from(signature, "base64url");
  const expected = Buffer.from(expectedSignature, "base64url");

  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export function parseDemoSession(value: string | undefined) {
  if (!isDemoAuthEnabled()) {
    return null;
  }

  if (!value) {
    return null;
  }

  try {
    const [payload, signature] = value.split(".");

    if (!payload || !signature || !hasValidDemoSessionSignature(payload, signature)) {
      return null;
    }

    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<{
      id: string;
      role: UserRole;
      email: string;
      displayName: string;
    }>;
    const account = demoAccounts.find(
      (demoAccount) =>
        demoAccount.id === parsed.id &&
        demoAccount.role === parsed.role &&
        demoAccount.email === parsed.email
    );

    return account ?? null;
  } catch {
    return null;
  }
}

export function dashboardPathForRole(role: UserRole) {
  if (role === "recruiter") {
    return "/recruteur/dashboard";
  }

  if (role === "admin") {
    return "/admin";
  }

  return "/candidat/dashboard";
}
