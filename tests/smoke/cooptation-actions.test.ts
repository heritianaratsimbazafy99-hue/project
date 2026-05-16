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

function cooptationForm(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

describe("cooptation referral actions", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.revalidatePath.mockReset();
    mocks.from.mockReset();
    mocks.storageFrom.mockReset();
  });

  it("uploads a referred candidate CV and stores the referral privately", async () => {
    const dateSpy = vi.spyOn(Date, "now").mockReturnValue(1778339000000);
    const upload = vi.fn(async () => ({ error: null }));
    const insertReferral = vi.fn(async () => ({ error: null }));

    mocks.storageFrom.mockReturnValue({ upload });
    mocks.from.mockImplementation((table: string) => {
      if (table === "cooptation_referrals") {
        return { insert: insertReferral };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const formData = cooptationForm({
      referrer_name: "Miora Rakoto",
      referrer_email: "miora@example.com",
      referrer_phone: "+261 34 11 222 33",
      candidate_name: "Hery Ranaivo",
      candidate_email: "hery@example.com",
      candidate_phone: "+261 32 44 555 66",
      candidate_city: "Antananarivo",
      target_role: "Comptable",
      message: "Très rigoureux et disponible rapidement.",
      company: ""
    });
    formData.set("candidate_cv", new File(["fake pdf"], "CV Hery.pdf", { type: "application/pdf" }));

    const { submitCooptationReferral } = await import("@/features/cooptation/actions");
    const result = await submitCooptationReferral(formData);

    expect(result).toEqual({ ok: true, message: "Cooptation envoyée. Merci pour votre recommandation." });
    expect(mocks.storageFrom).toHaveBeenCalledWith("cooptation-cvs");
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^referrals\/1778339000000-[a-f0-9-]+-cv-hery\.pdf$/),
      expect.any(File),
      expect.objectContaining({ contentType: "application/pdf", upsert: false })
    );
    expect(insertReferral).toHaveBeenCalledWith(
      expect.objectContaining({
        referrer_name: "Miora Rakoto",
        referrer_email: "miora@example.com",
        referrer_phone: "+261 34 11 222 33",
        candidate_name: "Hery Ranaivo",
        candidate_email: "hery@example.com",
        candidate_phone: "+261 32 44 555 66",
        candidate_city: "Antananarivo",
        target_role: "Comptable",
        message: "Très rigoureux et disponible rapidement.",
        cv_path: expect.stringMatching(/^referrals\/1778339000000-[a-f0-9-]+-cv-hery\.pdf$/)
      })
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/cooptation");

    dateSpy.mockRestore();
  });

  it("rejects invalid public submissions before storage upload", async () => {
    const formData = cooptationForm({
      referrer_name: "Miora Rakoto",
      referrer_email: "miora@example.com",
      candidate_name: "Hery Ranaivo"
    });
    formData.set("candidate_cv", new File(["plain text"], "cv.txt", { type: "text/plain" }));

    const { submitCooptationReferral } = await import("@/features/cooptation/actions");
    const result = await submitCooptationReferral(formData);

    expect(result).toEqual({
      ok: false,
      message: "Ajoutez le CV du candidat au format PDF, DOC ou DOCX."
    });
    expect(mocks.storageFrom).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("removes the uploaded cooptation CV when referral persistence fails", async () => {
    const upload = vi.fn(async () => ({ error: null }));
    const remove = vi.fn(async () => ({ error: null }));
    const insertReferral = vi.fn(async () => ({ error: { message: "RLS denied" } }));

    mocks.storageFrom.mockReturnValue({ upload, remove });
    mocks.from.mockImplementation((table: string) => {
      if (table === "cooptation_referrals") {
        return { insert: insertReferral };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const formData = cooptationForm({
      referrer_name: "Miora Rakoto",
      referrer_email: "miora@example.com",
      candidate_name: "Hery Ranaivo",
      candidate_email: "hery@example.com",
      company: ""
    });
    formData.set("candidate_cv", new File(["fake pdf"], "cv.pdf", { type: "application/pdf" }));

    const { submitCooptationReferral } = await import("@/features/cooptation/actions");
    const result = await submitCooptationReferral(formData);

    expect(result).toEqual({
      ok: false,
      message: "La cooptation n'a pas pu être enregistrée."
    });
    expect(remove).toHaveBeenCalledWith([expect.stringMatching(/^referrals\/.+-cv\.pdf$/)]);
  });
});
