import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").unique(),
  email: text("email").unique(),
  password: text("password"),
  displayName: text("display_name"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  bio: text("bio"),
  profileImageUrl: varchar("profile_image_url"),
  socialLinks: jsonb("social_links").$type<{ label: string; url: string }[]>().default([]),
  role: text("role").default("user").notNull(),
  credits: integer("credits").default(20).notNull(),
  affiliateCode: text("affiliate_code").unique(),
  referredBy: varchar("referred_by"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_users_referred_by").on(table.referredBy),
  index("idx_users_stripe_customer_id").on(table.stripeCustomerId),
  index("idx_users_created_at").on(table.createdAt),
]);

export const generatedImages = pgTable("generated_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  imageUrl: text("image_url").notNull(),
  prompt: text("prompt").notNull(),
  style: text("style"),
  aspectRatio: text("aspect_ratio"),
  generationType: text("generation_type").default("image"),
  isFavorite: boolean("is_favorite").default(false),
  isPublic: boolean("is_public").default(false),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_generated_images_user_id").on(table.userId),
  index("idx_generated_images_created_at").on(table.createdAt),
  index("idx_generated_images_user_created").on(table.userId, table.createdAt),
  index("idx_generated_images_is_public").on(table.isPublic),
]);

export const affiliateCommissions = pgTable("affiliate_commissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateUserId: varchar("affiliate_user_id").references(() => users.id).notNull(),
  referredUserId: varchar("referred_user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"),
  stripeSessionId: text("stripe_session_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_affiliate_commissions_affiliate_user_id").on(table.affiliateUserId),
  index("idx_affiliate_commissions_status").on(table.status),
]);

export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(),
  accountHolderName: text("account_holder_name").notNull(),
  bankName: text("bank_name").notNull(),
  routingNumber: text("routing_number").notNull(),
  accountNumber: text("account_number").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_withdrawal_requests_user_id").on(table.userId),
  index("idx_withdrawal_requests_status").on(table.status),
]);

export const crmContacts = pgTable("crm_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  status: text("status").default("lead").notNull(),
  source: text("source"),
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_crm_contacts_user_id").on(table.userId),
  index("idx_crm_contacts_status").on(table.status),
  index("idx_crm_contacts_created_at").on(table.createdAt),
]);

export const crmDeals = pgTable("crm_deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contactId: varchar("contact_id").references(() => crmContacts.id),
  title: text("title").notNull(),
  value: integer("value").default(0),
  stage: text("stage").default("lead").notNull(),
  probability: integer("probability").default(0),
  expectedCloseDate: timestamp("expected_close_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_crm_deals_contact_id").on(table.contactId),
  index("idx_crm_deals_stage").on(table.stage),
  index("idx_crm_deals_created_at").on(table.createdAt),
]);

export const crmActivities = pgTable("crm_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contactId: varchar("contact_id").references(() => crmContacts.id),
  dealId: varchar("deal_id").references(() => crmDeals.id),
  type: text("type").notNull(),
  subject: text("subject").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_crm_activities_contact_id").on(table.contactId),
  index("idx_crm_activities_deal_id").on(table.dealId),
  index("idx_crm_activities_created_at").on(table.createdAt),
]);

export const promptFavorites = pgTable("prompt_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  prompt: text("prompt").notNull(),
  style: text("style").notNull(),
  aspectRatio: text("aspect_ratio").notNull(),
  quality: text("quality"),
  detail: text("detail"),
  speed: text("speed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const moodBoards = pgTable("mood_boards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const moodBoardItems = pgTable("mood_board_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardId: varchar("board_id").references(() => moodBoards.id).notNull(),
  imageId: varchar("image_id").references(() => generatedImages.id).notNull(),
  positionX: integer("position_x").default(0).notNull(),
  positionY: integer("position_y").default(0).notNull(),
  width: integer("width").default(200).notNull(),
  height: integer("height").default(200).notNull(),
  zIndex: integer("z_index").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const guestGenerations = pgTable("guest_generations", {
  id: serial("id").primaryKey(),
  guestId: text("guest_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const imageLikes = pgTable("image_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageId: varchar("image_id").references(() => generatedImages.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_image_likes_image_id").on(table.imageId),
  index("idx_image_likes_user_id").on(table.userId),
]);

export const galleryImageLikes = pgTable("gallery_image_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageId: varchar("image_id").notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_gallery_image_likes_image_id").on(table.imageId),
  index("idx_gallery_image_likes_user_id").on(table.userId),
]);

export const galleryImages = pgTable("gallery_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceImageId: varchar("source_image_id"),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  creator: text("creator").notNull(),
  verified: boolean("verified").default(false),
  category: text("category"),
  aspectRatio: text("aspect_ratio").default("1:1"),
  prompt: text("prompt"),
  likeCount: integer("like_count").default(0).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  useCount: integer("use_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const updateProfileSchema = createInsertSchema(users).pick({
  displayName: true,
  firstName: true,
  lastName: true,
  bio: true,
  socialLinks: true,
  affiliateCode: true,
  profileImageUrl: true,
}).partial();

export const insertImageSchema = createInsertSchema(generatedImages).omit({
  id: true,
  createdAt: true,
});

export const insertWithdrawalSchema = createInsertSchema(withdrawalRequests).omit({
  id: true,
  createdAt: true,
  status: true,
});

// Enhanced withdrawal validation with stricter banking field checks
export const withdrawalRequestSchema = z.object({
  amount: z.number()
    .positive("Amount must be positive")
    .max(100000, "Amount exceeds maximum withdrawal limit"),
  accountHolderName: z.string()
    .min(2, "Account holder name is required")
    .max(100, "Account holder name too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Account holder name contains invalid characters")
    .transform(s => s.trim()),
  bankName: z.string()
    .min(2, "Bank name is required")
    .max(100, "Bank name too long")
    .transform(s => s.trim()),
  routingNumber: z.string()
    .regex(/^\d{9}$/, "Routing number must be exactly 9 digits"),
  accountNumber: z.string()
    .min(4, "Account number too short")
    .max(17, "Account number too long")
    .regex(/^\d+$/, "Account number must contain only digits"),
});

export const insertContactSchema = createInsertSchema(crmContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDealSchema = createInsertSchema(crmDeals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(crmActivities).omit({
  id: true,
  createdAt: true,
});

export const insertPromptFavoriteSchema = createInsertSchema(promptFavorites).omit({
  id: true,
  createdAt: true,
});

export const insertMoodBoardSchema = createInsertSchema(moodBoards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMoodBoardItemSchema = createInsertSchema(moodBoardItems).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type GeneratedImage = typeof generatedImages.$inferSelect;
export type InsertImage = z.infer<typeof insertImageSchema>;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type WithdrawalRequestInput = z.infer<typeof withdrawalRequestSchema>;
export type AffiliateCommission = typeof affiliateCommissions.$inferSelect;
export type CrmContact = typeof crmContacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type CrmDeal = typeof crmDeals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type CrmActivity = typeof crmActivities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type PromptFavorite = typeof promptFavorites.$inferSelect;
export type InsertPromptFavorite = z.infer<typeof insertPromptFavoriteSchema>;
export type MoodBoard = typeof moodBoards.$inferSelect;
export type InsertMoodBoard = z.infer<typeof insertMoodBoardSchema>;
export type MoodBoardItem = typeof moodBoardItems.$inferSelect;
export type InsertMoodBoardItem = z.infer<typeof insertMoodBoardItemSchema>;
export type ImageLike = typeof imageLikes.$inferSelect;
export type GalleryImage = typeof galleryImages.$inferSelect;
export type GalleryImageLike = typeof galleryImageLikes.$inferSelect;

// ============== VALIDATION SCHEMAS ==============

// UUID validation helper
export const uuidSchema = z.string().uuid("Invalid ID format");

// Prompt validation for generation endpoints
export const promptSchema = z.string()
  .min(1, "Prompt is required")
  .max(2000, "Prompt must be less than 2000 characters")
  .transform(s => s.trim());

// Guest generation validation
export const guestGenerationSchema = z.object({
  prompt: promptSchema,
  guestId: z.string()
    .min(10, "Invalid guest ID")
    .max(100, "Invalid guest ID")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid guest ID format"),
});

// Mood board creation validation
export const createMoodBoardSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .transform(s => s.trim()),
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .transform(s => s?.trim()),
});

// Admin role update validation
export const updateRoleSchema = z.object({
  role: z.enum(["user", "admin", "moderator"], {
    errorMap: () => ({ message: "Invalid role. Must be one of: user, admin, moderator" })
  }),
});

// Image generation options validation
export const generationOptionsSchema = z.object({
  prompt: promptSchema,
  stylePreset: z.enum(["auto", "photorealistic", "digital-art", "anime", "oil-painting", "watercolor", "sketch", "3d-render"]).default("auto"),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).default("1:1"),
  detail: z.enum(["low", "medium", "high"]).default("medium"),
  speed: z.enum(["fast", "quality"]).default("quality"),
});

// Background removal options validation
export const backgroundRemovalOptionsSchema = z.object({
  quality: z.enum(["standard", "high", "ultra"]).default("standard"),
  outputFormat: z.enum(["png", "webp"]).default("png"),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// Type exports for new schemas
export type GuestGeneration = z.infer<typeof guestGenerationSchema>;
export type CreateMoodBoard = z.infer<typeof createMoodBoardSchema>;
export type UpdateRole = z.infer<typeof updateRoleSchema>;
export type GenerationOptions = z.infer<typeof generationOptionsSchema>;
export type BackgroundRemovalOptions = z.infer<typeof backgroundRemovalOptionsSchema>;
