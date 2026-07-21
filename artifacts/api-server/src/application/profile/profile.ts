/**
 * Profile context use cases.
 *
 * These functions define the application behavior for profile retrieval,
 * update, and deletion. They receive an `AuthenticatedActor` and a repository
 * port, never raw request headers or Drizzle types.
 */

import type { AuthenticatedActor } from "../identity/actor";
import type { Clock, Result } from "@workspace/domain-core";
import { err, ok } from "@workspace/domain-core";
import {
  type Profile,
  type ProfileError,
  type ProfilePrivacy,
  type ProfileRepository,
  type ProfileUpdate,
  DEFAULT_PROFILE_PRIVACY,
  createDefaultProfile,
} from "./ProfileRepository";

const PRIVACY_KEYS: (keyof ProfilePrivacy)[] = [
  "bio",
  "birthday",
  "location",
  "occupation",
  "website",
  "phone",
  "email",
  "about",
  "pronouns",
  "socialLinks",
];

const PRIVACY_LEVELS: readonly string[] = ["public", "friends", "private"];

function isPrivacyLevel(value: unknown): value is ProfilePrivacy[keyof ProfilePrivacy] {
  return typeof value === "string" && PRIVACY_LEVELS.includes(value);
}

function validatePrivacy(value: unknown): { valid: true; privacy: ProfilePrivacy } | { valid: false; issues: string[] } {
  if (typeof value !== "object" || value === null) {
    return { valid: false, issues: ["privacy must be an object"] };
  }
  const issues: string[] = [];
  const privacy = value as Record<string, unknown>;
  const result: Partial<ProfilePrivacy> = {};
  for (const key of PRIVACY_KEYS) {
    const level = privacy[key];
    if (level === undefined) {
      issues.push(`privacy.${key} is required`);
      continue;
    }
    if (!isPrivacyLevel(level)) {
      issues.push(`privacy.${key} must be one of ${PRIVACY_LEVELS.join(", ")}`);
      continue;
    }
    result[key] = level;
  }
  if (issues.length > 0) {
    return { valid: false, issues };
  }
  return { valid: true, privacy: result as ProfilePrivacy };
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export function validateProfileUpdate(
  input: unknown,
): { success: true; value: ProfileUpdate } | { success: false; issues: readonly string[] } {
  if (typeof input !== "object" || input === null) {
    return { success: false, issues: ["Update input must be an object"] };
  }

  const raw = input as Record<string, unknown>;
  const update: ProfileUpdate = {};
  const issues: string[] = [];

  const stringFields: (keyof Omit<ProfileUpdate, "onboarded" | "privacy" | "updatedAt">)[] = [
    "name",
    "username",
    "avatarColor",
    "avatarUri",
    "pronouns",
    "bio",
    "about",
    "birthday",
    "location",
    "occupation",
    "website",
    "phone",
    "email",
    "socialTwitter",
    "socialInstagram",
    "socialLinkedin",
  ];

  for (const field of stringFields) {
    const value = raw[field];
    if (value !== undefined) {
      if (typeof value !== "string") {
        issues.push(`${field} must be a string`);
      } else {
        update[field] = value;
      }
    }
  }

  if (raw.onboarded !== undefined) {
    if (typeof raw.onboarded !== "boolean") {
      issues.push("onboarded must be a boolean");
    } else {
      update.onboarded = raw.onboarded;
    }
  }

  if (raw.privacy !== undefined) {
    const privacyResult = validatePrivacy(raw.privacy);
    if (!privacyResult.valid) {
      issues.push(...privacyResult.issues);
    } else {
      update.privacy = privacyResult.privacy;
    }
  }

  if (raw.updatedAt !== undefined) {
    if (!isValidDate(raw.updatedAt)) {
      issues.push("updatedAt must be a valid Date");
    } else {
      update.updatedAt = raw.updatedAt;
    }
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return { success: true, value: update };
}

function applyUpdate(base: Profile, update: ProfileUpdate, now: Date): Profile {
  // The client may send an updatedAt for conflict detection; it must never
  // overwrite the server's timestamps.
  const { updatedAt: _, ...fields } = update;
  const merged: Profile = {
    ...base,
    ...fields,
    updatedAt: now,
  };
  if (update.privacy) {
    merged.privacy = { ...DEFAULT_PROFILE_PRIVACY, ...update.privacy };
  }
  return merged;
}

export async function getProfile(
  actor: AuthenticatedActor,
  deps: { repo: ProfileRepository },
): Promise<Result<Profile, ProfileError>> {
  return await deps.repo.getByUserId(actor.userId);
}

export async function updateProfile(
  actor: AuthenticatedActor,
  input: unknown,
  deps: { repo: ProfileRepository; clock: Clock },
): Promise<Result<Profile, ProfileError>> {
  const validation = validateProfileUpdate(input);
  if (!validation.success) {
    return err({ kind: "validation", issues: validation.issues });
  }

  const existing = await deps.repo.getByUserId(actor.userId);
  if (!existing.ok) {
    if (existing.error.kind === "not-found") {
      const profile = createDefaultProfile(actor.userId, deps.clock.now());
      const merged = applyUpdate(profile, validation.value, deps.clock.now());
      return await deps.repo.save(merged);
    }
    return existing;
  }

  if (
    validation.value.updatedAt &&
    existing.value.updatedAt.getTime() > validation.value.updatedAt.getTime()
  ) {
    return err({
      kind: "conflict",
      reason: "Profile has been modified since last retrieval",
    });
  }

  const merged = applyUpdate(existing.value, validation.value, deps.clock.now());
  return await deps.repo.save(merged);
}

export async function deleteProfile(
  actor: AuthenticatedActor,
  deps: { repo: ProfileRepository },
): Promise<Result<void, ProfileError>> {
  return await deps.repo.deleteByUserId(actor.userId);
}
