/**
 * Drizzle ORM adapter for the profile repository port.
 *
 * All PostgreSQL-specific details (tables, columns, `eq`, upserts) are
 * confined to this file. The adapter maps between the domain `Profile`
 * and the Drizzle row representation and never inspects request headers.
 */

import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db/schema";
import { err, ok } from "@workspace/domain-core";
import type { Result } from "@workspace/domain-core";
import {
  type Profile,
  type ProfileError,
  type ProfilePrivacy,
  type ProfileRepository,
  DEFAULT_PROFILE_PRIVACY,
  createUserId,
} from "../../application/profile/ProfileRepository";

function mapToProfile(row: typeof profilesTable.$inferSelect): Profile {
  const privacy: ProfilePrivacy = {
    ...DEFAULT_PROFILE_PRIVACY,
    ...(row.privacy ?? {}),
  };

  return {
    id: createUserId(row.id),
    name: row.name,
    username: row.username,
    avatarColor: row.avatarColor,
    avatarUri: row.avatarUri,
    pronouns: row.pronouns,
    bio: row.bio,
    about: row.about,
    birthday: row.birthday,
    location: row.location,
    occupation: row.occupation,
    website: row.website,
    phone: row.phone,
    email: row.email,
    socialTwitter: row.socialTwitter,
    socialInstagram: row.socialInstagram,
    socialLinkedin: row.socialLinkedin,
    onboarded: row.onboarded,
    privacy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapToRow(profile: Profile): typeof profilesTable.$inferInsert {
  return {
    id: profile.id,
    name: profile.name,
    username: profile.username,
    avatarColor: profile.avatarColor,
    avatarUri: profile.avatarUri,
    pronouns: profile.pronouns,
    bio: profile.bio,
    about: profile.about,
    birthday: profile.birthday,
    location: profile.location,
    occupation: profile.occupation,
    website: profile.website,
    phone: profile.phone,
    email: profile.email,
    socialTwitter: profile.socialTwitter,
    socialInstagram: profile.socialInstagram,
    socialLinkedin: profile.socialLinkedin,
    onboarded: profile.onboarded,
    privacy: profile.privacy,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function storageError(error: unknown): ProfileError {
  return {
    kind: "storage",
    message: error instanceof Error ? error.message : "Unknown storage error",
  };
}

export class DrizzleProfileRepository implements ProfileRepository {
  async getByUserId(
    userId: Profile["id"],
  ): Promise<Result<Profile, ProfileError>> {
    try {
      const rows = await db
        .select()
        .from(profilesTable)
        .where(eq(profilesTable.id, userId))
        .limit(1);

      if (rows.length === 0) {
        return err({ kind: "not-found" });
      }

      return ok(mapToProfile(rows[0]));
    } catch (error) {
      return err(storageError(error));
    }
  }

  async save(profile: Profile): Promise<Result<Profile, ProfileError>> {
    try {
      const values = mapToRow(profile);
      // On conflict, preserve the original created_at and overwrite everything
      // else (including updated_at) with the domain profile's values.
      const { id: _id, createdAt: _createdAt, ...updateSet } = values;

      const rows = await db
        .insert(profilesTable)
        .values(values)
        .onConflictDoUpdate({
          target: profilesTable.id,
          set: updateSet,
        })
        .returning();

      const row = rows[0];
      if (!row) {
        return err({ kind: "storage", message: "No row returned after save" });
      }

      return ok(mapToProfile(row));
    } catch (error) {
      return err(storageError(error));
    }
  }

  async deleteByUserId(
    userId: Profile["id"],
  ): Promise<Result<void, ProfileError>> {
    try {
      await db.delete(profilesTable).where(eq(profilesTable.id, userId));
      return ok(undefined);
    } catch (error) {
      return err(storageError(error));
    }
  }
}
