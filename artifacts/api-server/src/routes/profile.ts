import { Router, type IRouter, type Request, type Response } from "express";
import type { Clock } from "@workspace/domain-core";
import {
  GetProfileResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";
import {
  deleteProfile,
  getProfile,
  updateProfile,
} from "../application/profile/profile";
import type { ProfileRepository } from "../application/profile/ProfileRepository";

export interface ProfileRouterDependencies {
  repo: ProfileRepository;
  clock: Clock;
}

function formatZodIssues(
  error: Readonly<{ issues: ReadonlyArray<{ path: ReadonlyArray<string | number>; message: string }> }>,
): string {
  return error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
}

export function createProfileRouter(
  deps: ProfileRouterDependencies,
): IRouter {
  const router: IRouter = Router();

  // GET /api/profile - Get authenticated user's profile
  router.get("/profile", async (req: Request, res: Response): Promise<void> => {
    const actor = req.actor;
    if (!actor) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await getProfile(actor, { repo: deps.repo });
    if (!result.ok) {
      if (result.error.kind === "not-found") {
        res.status(404).json({ error: "Profile not found" });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    const parsed = GetProfileResponse.safeParse(result.value);
    if (!parsed.success) {
      res.status(500).json({ error: formatZodIssues(parsed.error) });
      return;
    }

    res.json(parsed.data);
  });

  // PUT /api/profile - Update authenticated user's profile
  router.put("/profile", async (req: Request, res: Response): Promise<void> => {
    const actor = req.actor;
    if (!actor) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const bodyParse = UpdateProfileBody.safeParse(req.body);
    if (!bodyParse.success) {
      res.status(400).json({ error: formatZodIssues(bodyParse.error) });
      return;
    }

    const updateResult = await updateProfile(actor, bodyParse.data, {
      repo: deps.repo,
      clock: deps.clock,
    });

    if (!updateResult.ok) {
      if (updateResult.error.kind === "validation") {
        res.status(400).json({ error: updateResult.error.issues.join("; ") });
        return;
      }
      if (updateResult.error.kind === "conflict") {
        res.status(409).json({ error: updateResult.error.reason });
        return;
      }
      if (updateResult.error.kind === "not-found") {
        res.status(404).json({ error: "Profile not found" });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    const parsed = UpdateProfileResponse.safeParse(updateResult.value);
    if (!parsed.success) {
      res.status(500).json({ error: formatZodIssues(parsed.error) });
      return;
    }

    res.json(parsed.data);
  });

  // DELETE /api/profile - Delete authenticated user's profile
  router.delete(
    "/profile",
    async (req: Request, res: Response): Promise<void> => {
      const actor = req.actor;
      if (!actor) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Verify the profile exists before deleting so the route can return 404
      // when appropriate. The actual deletion is delegated to the use case.
      const existing = await getProfile(actor, { repo: deps.repo });
      if (!existing.ok) {
        if (existing.error.kind === "not-found") {
          res.status(404).json({ error: "Profile not found" });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
        return;
      }

      const result = await deleteProfile(actor, { repo: deps.repo });
      if (!result.ok) {
        res.status(500).json({ error: "Internal server error" });
        return;
      }

      res.status(204).send();
    },
  );

  return router;
}
