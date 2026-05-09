import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: mocks.from
  }))
}));

describe("candidate application queries", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.from.mockReset();
  });

  it("loads candidate applications with job and company details", async () => {
    const order = vi.fn(async () => ({
      data: [
        {
          id: "application-1",
          status: "submitted",
          created_at: "2026-05-09T09:00:00.000Z",
          message: "Disponible rapidement.",
          cv_path: "candidate-1/cv.pdf",
          jobs: {
            id: "job-1",
            slug: "designer-uiux",
            title: "Designer UI/UX",
            contract: "CDI",
            city: "Antananarivo",
            sector: "Informatique & Digital",
            companies: {
              name: "Media Click",
              slug: "media-click",
              logo_path: null
            }
          }
        }
      ],
      error: null
    }));
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));

    mocks.from.mockReturnValue({ select });

    const { getCandidateApplications } = await import("@/features/applications/queries");
    const applications = await getCandidateApplications("candidate-1");

    expect(mocks.from).toHaveBeenCalledWith("applications");
    expect(eq).toHaveBeenCalledWith("candidate_id", "candidate-1");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(applications).toEqual([
      {
        id: "application-1",
        status: "submitted",
        created_at: "2026-05-09T09:00:00.000Z",
        message: "Disponible rapidement.",
        cv_path: "candidate-1/cv.pdf",
        job: {
          id: "job-1",
          slug: "designer-uiux",
          title: "Designer UI/UX",
          contract: "CDI",
          city: "Antananarivo",
          sector: "Informatique & Digital",
          company: {
            name: "Media Click",
            slug: "media-click",
            logo_path: null
          }
        }
      }
    ]);
  });
});
