import { Router, type IRouter, type Request, type Response } from "express";
import type { AuthenticatedActor } from "../application/identity/actor";
import { GetProfileResponse, UpdateProfileBody } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /api/profile - Get authenticated user's profile
router.get("/profile", (req: Request, res: Response): void => {
  const actor = req.actor;
  
  if (!actor) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // TODO: Fetch from database using actor.userId
  // For now, return mock data
  const mockProfile = {
    id: actor.userId,
    name: "Test User",
    username: "testuser",
    avatarColor: "#6366F1",
    avatarUri: "",
    pronouns: "",
    bio: "",
    about: "",
    birthday: "",
    location: "",
    occupation: "",
    website: "",
    phone: "",
    email: "",
    socialTwitter: "",
    socialInstagram: "",
    socialLinkedin: "",
    onboarded: false,
    privacy: {
      bio: "public",
      birthday: "friends",
      location: "public",
      occupation: "public",
      website: "public",
      phone: "private",
      email: "private",
      about: "public",
      pronouns: "public",
      socialLinks: "public",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validated = GetProfileResponse.parse(mockProfile);
  res.json(validated);
});

// PUT /api/profile - Update authenticated user's profile
router.put("/profile", (req: Request, res: Response): void => {
  const actor = req.actor;
  
  if (!actor) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const updates = UpdateProfileBody.parse(req.body);
    
    // TODO: Update in database using actor.userId
    // For now, return mock updated profile
    const mockProfile = {
      id: actor.userId,
      name: updates.name || "Test User",
      username: updates.username || "testuser",
      avatarColor: updates.avatarColor || "#6366F1",
      avatarUri: updates.avatarUri || "",
      pronouns: updates.pronouns || "",
      bio: updates.bio || "",
      about: updates.about || "",
      birthday: updates.birthday || "",
      location: updates.location || "",
      occupation: updates.occupation || "",
      website: updates.website || "",
      phone: updates.phone || "",
      email: updates.email || "",
      socialTwitter: updates.socialTwitter || "",
      socialInstagram: updates.socialInstagram || "",
      socialLinkedin: updates.socialLinkedin || "",
      onboarded: updates.onboarded ?? false,
      privacy: updates.privacy || {
        bio: "public",
        birthday: "friends",
        location: "public",
        occupation: "public",
        website: "public",
        phone: "private",
        email: "private",
        about: "public",
        pronouns: "public",
        socialLinks: "public",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const validated = GetProfileResponse.parse(mockProfile);
    res.json(validated);
  } catch (error) {
    res.status(400).json({ error: "Validation error" });
    return;
  }
});

// DELETE /api/profile - Delete authenticated user's profile
router.delete("/profile", (req: Request, res: Response): void => {
  const actor = req.actor;
  
  if (!actor) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // TODO: Delete from database using actor.userId (permanent deletion, no retention)
  // For now, return success
  res.status(204).send();
});

export default router;
