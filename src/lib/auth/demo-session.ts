import type { UserRole } from "@/types/database";

export const DEMO_SESSION_COOKIE = "jobmada_demo_session";
export const DEMO_PASSWORD = "jobmada-demo-password";

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
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    role: "admin",
    email: "admin.demo@jobmada.mg",
    displayName: "Admin demo JobMada",
    onboardingCompletion: 100
  }
];

export function isDemoAuthEnabled() {
  if (process.env.ENABLE_DEMO_AUTH === "true") {
    return true;
  }

  if (process.env.ENABLE_DEMO_AUTH === "false") {
    return false;
  }

  return process.env.NODE_ENV !== "production";
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
  return encodeURIComponent(
    JSON.stringify({
      id: account.id,
      role: account.role,
      email: account.email,
      displayName: account.displayName
    })
  );
}

export function parseDemoSession(value: string | undefined) {
  if (!isDemoAuthEnabled()) {
    return null;
  }

  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<{
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
