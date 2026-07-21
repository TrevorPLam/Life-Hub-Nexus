/**
 * Profile context application boundary.
 *
 * This module defines the profile domain model, update input, structured
 * errors, and the repository port. It depends only on shared domain primitives
 * and the authenticated actor contract; it has no knowledge of HTTP or
 * database details.
 */

import { type EntityId, createEntityId } from "@workspace/domain-core";
import type { Result } from "@workspace/domain-core";

export type PrivacyLevel = "public" | "friends" | "private";

export interface ProfilePrivacy {
  bio: PrivacyLevel;
  birthday: PrivacyLevel;
  location: PrivacyLevel;
  occupation: PrivacyLevel;
  website: PrivacyLevel;
  phone: PrivacyLevel;
  email: PrivacyLevel;
  about: PrivacyLevel;
  pronouns: PrivacyLevel;
  socialLinks: PrivacyLevel;
}

export interface Profile {
  id: EntityId<"user">;
  name: string;
  username: string;
  avatarColor: string;
  avatarUri: string;
  pronouns: string;
  bio: string;
  about: string;
  birthday: string;
  location: string;
  occupation: string;
  website: string;
  phone: string;
  email: string;
  socialTwitter: string;
  socialInstagram: string;
  socialLinkedin: string;
  onboarded: boolean;
  privacy: ProfilePrivacy;
  createdAt: Date;
  updatedAt: Date;
}

export type ProfileUpdate = {
  name?: string;
  username?: string;
  avatarColor?: string;
  avatarUri?: string;
  pronouns?: string;
  bio?: string;
  about?: string;
  birthday?: string;
  location?: string;
  occupation?: string;
  website?: string;
  phone?: string;
  email?: string;
  socialTwitter?: string;
  socialInstagram?: string;
  socialLinkedin?: string;
  onboarded?: boolean;
  privacy?: ProfilePrivacy;
  updatedAt?: Date;
};

export type ProfileError =
  | { kind: "not-found" }
  | { kind: "validation"; issues: readonly string[] }
  | { kind: "conflict"; reason: string }
  | { kind: "storage"; message: string };

/**
 * Repository port for profile persistence. Implementations are responsible for
 * mapping between the domain `Profile` and their storage representation while
 * enforcing the primary-key/ownership boundary (the profile id is the user id).
 */
export interface ProfileRepository {
  getByUserId(
    userId: EntityId<"user">,
  ): Promise<Result<Profile, ProfileError>>;
  save(profile: Profile): Promise<Result<Profile, ProfileError>>;
  deleteByUserId(userId: EntityId<"user">): Promise<Result<void, ProfileError>>;
}

export const DEFAULT_PROFILE_PRIVACY: ProfilePrivacy = {
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
};

export function createDefaultProfile(
  id: EntityId<"user">,
  now: Date,
): Profile {
  return {
    id,
    name: "",
    username: "",
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
    privacy: { ...DEFAULT_PROFILE_PRIVACY },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Reconstruct a profile id from its raw string value. This is intended for
 * adapters that read the id from storage and need to re-apply the user brand.
 */
export function createUserId(raw: string): EntityId<"user"> {
  return createEntityId(raw, "user");
}
