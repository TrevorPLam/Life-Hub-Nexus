import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Profile table with ownership enforcement and timestamps for conflict resolution
export const profilesTable = pgTable("profiles", {
  id: text("id").primaryKey(), // User ID from identity context
  name: text("name").notNull().default(""),
  username: text("username").notNull().default(""),
  avatarColor: text("avatar_color").notNull().default("#6366F1"),
  avatarUri: text("avatar_uri").notNull().default(""),
  pronouns: text("pronouns").notNull().default(""),
  bio: text("bio").notNull().default(""),
  about: text("about").notNull().default(""),
  birthday: text("birthday").notNull().default(""),
  location: text("location").notNull().default(""),
  occupation: text("occupation").notNull().default(""),
  website: text("website").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  socialTwitter: text("social_twitter").notNull().default(""),
  socialInstagram: text("social_instagram").notNull().default(""),
  socialLinkedin: text("social_linkedin").notNull().default(""),
  onboarded: boolean("onboarded").notNull().default(false),
  privacy: jsonb("privacy").notNull().$type<{
    bio: 'public' | 'friends' | 'private';
    birthday: 'public' | 'friends' | 'private';
    location: 'public' | 'friends' | 'private';
    occupation: 'public' | 'friends' | 'private';
    website: 'public' | 'friends' | 'private';
    phone: 'public' | 'friends' | 'private';
    email: 'public' | 'friends' | 'private';
    about: 'public' | 'friends' | 'private';
    pronouns: 'public' | 'friends' | 'private';
    socialLinks: 'public' | 'friends' | 'private';
  }>().notNull().default({
    bio: 'public',
    birthday: 'friends',
    location: 'public',
    occupation: 'public',
    website: 'public',
    phone: 'private',
    email: 'private',
    about: 'public',
    pronouns: 'public',
    socialLinks: 'public',
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schema (excludes id, createdAt, updatedAt - server-generated)
export const insertProfileSchema = createInsertSchema(profilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Update schema (all fields optional)
export const updateProfileSchema = createInsertSchema(profilesTable).partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;
