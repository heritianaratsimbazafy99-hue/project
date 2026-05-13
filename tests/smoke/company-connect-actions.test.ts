import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  from: vi.fn(),
  storageFrom: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: mocks.from,
    storage: {
      from: mocks.storageFrom
    }
  }))
}));

function connectForm(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

describe("company Connect actions", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.revalidatePath.mockReset();
    mocks.from.mockReset();
    mocks.storageFrom.mockReset();
  });

  it("uploads a CV and stores a private company Connect lead", async () => {
    const dateSpy = vi.spyOn(Date, "now").mockReturnValue(1778339000000);
    const companyQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({
        data: {
          id: "company-1",
          slug: "media-click",
          name: "Media Click",
          career_connect_enabled: true
        },
        error: null
      }))
    };
    const upload = vi.fn(async () => ({ error: null }));
    const insertLead = vi.fn(async () => ({ error: null }));

    mocks.storageFrom.mockReturnValue({ upload });
    mocks.from.mockImplementation((table: string) => {
      if (table === "companies") {
        return companyQuery;
      }

      if (table === "company_connect_profiles") {
        return { insert: insertLead };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const formData = connectForm({
      full_name: "Miora Rakoto",
      email: "MIORA@EXAMPLE.COM",
      phone: "+261 34 11 222 33",
      desired_role: "Product designer",
      message: "Je souhaite rejoindre votre vivier.",
      consent_accepted: "on",
      company: ""
    });
    formData.set("cv", new File(["fake pdf"], "CV Miora.pdf", { type: "application/pdf" }));

    const { submitCompanyConnect } = await import("@/features/companies/connect-actions");
    const result = await submitCompanyConnect("media-click", formData);

    expect(result).toEqual({ ok: true, message: "Votre profil a été transmis à Media Click." });
    expect(mocks.storageFrom).toHaveBeenCalledWith("company-connect-cvs");
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^company-1\/1778339000000-[a-f0-9-]+-cv-miora\.pdf$/),
      expect.any(File),
      expect.objectContaining({ contentType: "application/pdf", upsert: false })
    );
    expect(insertLead).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "company-1",
        full_name: "Miora Rakoto",
        email: "miora@example.com",
        phone: "+261 34 11 222 33",
        desired_role: "Product designer",
        message: "Je souhaite rejoindre votre vivier.",
        consent_accepted: true,
        status: "new",
        cv_path: expect.stringMatching(/^company-1\/1778339000000-[a-f0-9-]+-cv-miora\.pdf$/)
      })
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/entreprises/media-click");

    dateSpy.mockRestore();
  });

  it("rejects submissions without explicit consent before upload", async () => {
    const formData = connectForm({
      full_name: "Miora Rakoto",
      email: "miora@example.com",
      company: ""
    });
    formData.set("cv", new File(["fake pdf"], "cv.pdf", { type: "application/pdf" }));

    const { submitCompanyConnect } = await import("@/features/companies/connect-actions");
    const result = await submitCompanyConnect("media-click", formData);

    expect(result).toEqual({
      ok: false,
      message: "Acceptez d'être contacté par l'entreprise pour envoyer votre profil."
    });
    expect(mocks.storageFrom).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
