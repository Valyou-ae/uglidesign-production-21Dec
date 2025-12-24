import { pool } from './db';
import { 
  users, 
  generatedImages, 
  withdrawalRequests, 
  affiliateCommissions, 
  crmContacts, 
  crmDeals, 
  crmActivities,
  promptFavorites,
  moodBoards,
  moodBoardItems,
  galleryImages,
  galleryImageLikes,
  imageLikes,
  dailyInspirations,
  chatSessions,
  chatMessages,
  userPreferences,
  imageFolders,
  type User, 
  type InsertUser, 
  type UpdateProfile, 
  type GeneratedImage, 
  type InsertImage, 
  type WithdrawalRequest, 
  type InsertWithdrawal, 
  type AffiliateCommission, 
  type UpsertUser,
  type CrmContact,
  type InsertContact,
  type CrmDeal,
  type InsertDeal,
  type CrmActivity,
  type InsertActivity,
  type PromptFavorite,
  type InsertPromptFavorite,
  type MoodBoard,
  type InsertMoodBoard,
  type MoodBoardItem,
  type InsertMoodBoardItem,
  type GalleryImage,
  type DailyInspiration,
  type ChatSession,
  type InsertChatSession,
  type ChatMessage,
  type InsertChatMessage,
  type UserPreferences,
  type InsertUserPreferences,
  type ImageFolder,
  type InsertImageFolder,
  type MockupVersion,
  type InsertMockupVersion,
  mockupVersions
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, gte, lte, sql, inArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(userId: string, data: UpdateProfile): Promise<User | undefined>;
  upsertUser(userData: UpsertUser): Promise<User>;
  
  createImage(image: InsertImage): Promise<GeneratedImage>;
  getImageById(imageId: string, userId: string): Promise<GeneratedImage | undefined>;
  getImagesByIds(imageIds: string[], userId: string): Promise<GeneratedImage[]>;
  getPublicImageById(imageId: string): Promise<(GeneratedImage & { username?: string }) | undefined>;
  getImagesByUserId(userId: string, limit?: number, offset?: number): Promise<{ images: GeneratedImage[]; total: number }>;
  getImageCountByUserId(userId: string): Promise<number>;
  toggleImageFavorite(imageId: string, userId: string): Promise<GeneratedImage | undefined>;
  deleteImage(imageId: string, userId: string): Promise<boolean>;
  getUserStats(userId: string): Promise<{ images: number; mockups: number; bgRemoved: number; total: number }>;
  
  getUserByAffiliateCode(code: string): Promise<User | undefined>;
  createCommission(affiliateUserId: string, referredUserId: string, amount: number, stripeSessionId?: string): Promise<AffiliateCommission>;
  getCommissionByStripeSessionId(stripeSessionId: string): Promise<AffiliateCommission | undefined>;
  getCommissionsByUserId(userId: string): Promise<AffiliateCommission[]>;
  getTotalEarnings(userId: string): Promise<number>;
  getPendingPayout(userId: string): Promise<number>;
  getTotalWithdrawn(userId: string): Promise<number>;
  getReferredUsers(userId: string): Promise<User[]>;
  
  createWithdrawalRequest(request: InsertWithdrawal): Promise<WithdrawalRequest>;
  getWithdrawalsByUserId(userId: string): Promise<WithdrawalRequest[]>;
  
  updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User | undefined>;
  updateStripeSubscriptionId(userId: string, stripeSubscriptionId: string | null): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  
  setPasswordResetToken(email: string, tokenHash: string, expires: Date): Promise<User | undefined>;
  getUserWithResetToken(email: string): Promise<User | undefined>;
  updatePassword(userId: string, hashedPassword: string): Promise<User | undefined>;
  clearPasswordResetToken(userId: string): Promise<void>;

  getContacts(limit?: number, offset?: number): Promise<{ contacts: CrmContact[]; total: number }>;
  getContact(id: string): Promise<CrmContact | undefined>;
  createContact(data: InsertContact): Promise<CrmContact>;
  updateContact(id: string, data: Partial<InsertContact>): Promise<CrmContact | undefined>;
  deleteContact(id: string): Promise<void>;

  getDeals(limit?: number, offset?: number): Promise<{ deals: CrmDeal[]; total: number }>;
  getDeal(id: string): Promise<CrmDeal | undefined>;
  getDealsByContact(contactId: string): Promise<CrmDeal[]>;
  createDeal(data: InsertDeal): Promise<CrmDeal>;
  updateDeal(id: string, data: Partial<InsertDeal>): Promise<CrmDeal | undefined>;
  deleteDeal(id: string): Promise<void>;

  getActivities(limit?: number, offset?: number): Promise<{ activities: CrmActivity[]; total: number }>;
  getActivitiesByContact(contactId: string): Promise<CrmActivity[]>;
  getActivitiesByDeal(dealId: string): Promise<CrmActivity[]>;
  createActivity(data: InsertActivity): Promise<CrmActivity>;
  updateActivity(id: string, data: Partial<InsertActivity>): Promise<CrmActivity | undefined>;
  deleteActivity(id: string): Promise<void>;

  getAllUsers(limit?: number, offset?: number): Promise<{ users: User[]; total: number }>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  getAnalytics(): Promise<{ totalUsers: number; totalImages: number; totalCommissions: number }>;
  
  getUserCredits(userId: string): Promise<number>;
  addCredits(userId: string, amount: number): Promise<User | undefined>;
  deductCredits(userId: string, amount: number): Promise<User | undefined>;
  
  getImagesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<GeneratedImage[]>;
  getImageCountsByMonth(userId: string, year: number, month: number): Promise<{ date: string; count: number; type: string }[]>;

  createPromptFavorite(favorite: InsertPromptFavorite): Promise<PromptFavorite>;
  getPromptFavorites(userId: string): Promise<PromptFavorite[]>;
  deletePromptFavorite(id: string, userId: string): Promise<void>;

  createMoodBoard(userId: string, name: string, description?: string): Promise<MoodBoard>;
  getMoodBoards(userId: string): Promise<MoodBoard[]>;
  getMoodBoard(userId: string, boardId: string): Promise<{ board: MoodBoard; items: (MoodBoardItem & { image: GeneratedImage })[] } | undefined>;
  updateMoodBoard(userId: string, boardId: string, data: { name?: string; description?: string }): Promise<MoodBoard | undefined>;
  deleteMoodBoard(userId: string, boardId: string): Promise<void>;
  verifyBoardOwnership(userId: string, boardId: string): Promise<boolean>;
  addItemToBoard(boardId: string, imageId: string, position: { positionX: number; positionY: number; width?: number; height?: number; zIndex?: number }): Promise<MoodBoardItem>;
  updateBoardItem(itemId: string, position: { positionX?: number; positionY?: number; width?: number; height?: number; zIndex?: number }): Promise<MoodBoardItem | undefined>;
  removeItemFromBoard(itemId: string): Promise<void>;
  verifyBoardItemOwnership(userId: string, itemId: string): Promise<boolean>;

  getGalleryImages(limit?: number): Promise<Omit<GalleryImage, 'imageUrl'>[]>;
  getGalleryImageById(imageId: string): Promise<GalleryImage | undefined>;
  getGalleryImageBySourceId(sourceImageId: string): Promise<GalleryImage | undefined>;
  createGalleryImage(data: { title: string; imageUrl: string; creator: string; category?: string; aspectRatio?: string; prompt?: string; sourceImageId?: string }): Promise<GalleryImage>;
  deleteGalleryImageBySourceId(sourceImageId: string, imageUrl?: string, prompt?: string): Promise<void>;
  likeGalleryImage(imageId: string, userId: string): Promise<{ liked: boolean; likeCount: number }>;
  hasUserLikedImage(imageId: string, userId: string): Promise<boolean>;
  getUserLikedImages(userId: string): Promise<string[]>;
  incrementGalleryImageView(imageId: string): Promise<GalleryImage | undefined>;
  incrementGalleryImageUse(imageId: string): Promise<GalleryImage | undefined>;
  
  getPublicImages(limit?: number): Promise<GeneratedImage[]>;
  setImageVisibility(imageId: string, userId: string, isPublic: boolean): Promise<GeneratedImage | undefined>;
  
  getLeaderboard(period: 'weekly' | 'monthly' | 'all-time', limit?: number): Promise<{ userId: string; username: string | null; displayName: string | null; profileImageUrl: string | null; imageCount: number; likeCount: number; viewCount: number; rank: number }[]>;
  getReferralStats(userId: string): Promise<{ referralCode: string | null; referredCount: number; bonusCreditsEarned: number }>;
  applyReferralCode(userId: string, referralCode: string): Promise<{ success: boolean; referrerCredits?: number; error?: string }>;
  
  getDailyInspirations(limit?: number): Promise<DailyInspiration[]>;
  getTodaysInspiration(): Promise<DailyInspiration | undefined>;
  getFeaturedInspirations(limit?: number): Promise<DailyInspiration[]>;
  
  createChatSession(userId: string, name: string, projectId?: string): Promise<ChatSession>;
  getChatSessions(userId: string): Promise<ChatSession[]>;
  getChatSession(sessionId: string, userId: string): Promise<ChatSession | undefined>;
  updateChatSession(sessionId: string, userId: string, data: Partial<InsertChatSession>): Promise<ChatSession | undefined>;
  deleteChatSession(sessionId: string, userId: string): Promise<void>;
  
  addChatMessage(sessionId: string, message: Omit<InsertChatMessage, 'sessionId'>): Promise<ChatMessage>;
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(userId: string, data: Partial<InsertUserPreferences>): Promise<UserPreferences>;
  updateUserPreferences(userId: string, data: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined>;
  
  // Super Admin Analytics
  getSuperAdminOverview(): Promise<{
    totalUsers: number;
    totalGenerations: number;
    activeUsersLast30Days: number;
    totalCommissions: number;
  }>;
  getUserGrowthByDay(days: number): Promise<{ date: string; count: number }[]>;
  getGenerationsByDay(days: number): Promise<{ date: string; count: number }[]>;
  getTopCreators(limit: number): Promise<{ userId: string; username: string | null; displayName: string | null; imageCount: number }[]>;
  getUsersByRole(): Promise<{ role: string; count: number }[]>;
  
  // Enhanced Super Admin Analytics
  getFeatureUsageBreakdown(): Promise<{ type: string; count: number }[]>;
  getSubscriptionStats(): Promise<{ activeSubscriptions: number; totalSubscribers: number }>;
  getAffiliatePerformance(limit: number): Promise<{ userId: string; username: string | null; referralCount: number; totalEarnings: number }[]>;
  getRevenueByDay(days: number): Promise<{ date: string; amount: number }[]>;
  getDailyActiveUsers(days: number): Promise<{ date: string; count: number }[]>;
  getRetentionRate(): Promise<{ weeklyRetention: number; monthlyRetention: number }>;
  
  // Image Folders
  getFoldersByUser(userId: string): Promise<ImageFolder[]>;
  createFolder(data: InsertImageFolder): Promise<ImageFolder>;
  updateFolder(id: string, userId: string, data: Partial<InsertImageFolder>): Promise<ImageFolder | undefined>;
  deleteFolder(id: string, userId: string): Promise<void>;
  moveImageToFolder(imageId: string, userId: string, folderId: string | null): Promise<GeneratedImage | undefined>;
  getOrCreateDefaultFolder(userId: string): Promise<ImageFolder>;
  
  // Image Version History
  getImageVersionHistory(rootImageId: string, userId: string): Promise<GeneratedImage[]>;
  
  // Mockup Version History
  saveMockupVersion(version: InsertMockupVersion): Promise<MockupVersion>;
  getMockupVersions(userId: string, sessionId: string, filters?: { angle?: string; color?: string; size?: string; productName?: string }): Promise<MockupVersion[]>;
  getMockupVersion(userId: string, versionId: string): Promise<MockupVersion | undefined>;
  getLatestVersionNumber(userId: string, sessionId: string): Promise<number>;
  deleteMockupVersion(userId: string, versionId: string): Promise<void>;
  getUserMockupSessions(userId: string, limit?: number): Promise<{ sessionId: string; latestVersion: MockupVersion; versionCount: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserProfile(userId: string, data: UpdateProfile): Promise<User | undefined> {
    const updateData: Partial<User> = {};
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.affiliateCode !== undefined) updateData.affiliateCode = data.affiliateCode;
    if (data.socialLinks !== undefined) updateData.socialLinks = data.socialLinks as { label: string; url: string }[];
    if (data.profileImageUrl !== undefined) updateData.profileImageUrl = data.profileImageUrl;
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createImage(image: InsertImage): Promise<GeneratedImage> {
    try {
      const result = await pool.query(
        `INSERT INTO generated_images (
          user_id, folder_id, image_url, prompt, style, aspect_ratio, 
          generation_type, is_favorite, is_public, view_count, 
          parent_image_id, edit_prompt, version_number, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
         RETURNING id, user_id, folder_id, image_url, prompt, style, aspect_ratio,
                   generation_type, is_favorite, is_public, view_count, 
                   parent_image_id, edit_prompt, version_number, created_at`,
        [
          image.userId,
          image.folderId ?? null,
          image.imageUrl,
          image.prompt,
          image.style ?? null,
          image.aspectRatio ?? null,
          image.generationType ?? 'image',
          image.isFavorite ?? false,
          image.isPublic ?? false,
          image.viewCount ?? 0,
          image.parentImageId ?? null,
          image.editPrompt ?? null,
          image.versionNumber ?? 0
        ]
      );
      
      if (!result.rows || !result.rows[0]) {
        console.error("Image insert returned no result for userId:", image.userId);
        throw new Error("Failed to insert image into database");
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        folderId: row.folder_id,
        imageUrl: row.image_url,
        prompt: row.prompt,
        style: row.style,
        aspectRatio: row.aspect_ratio,
        generationType: row.generation_type,
        isFavorite: row.is_favorite,
        isPublic: row.is_public,
        viewCount: row.view_count,
        parentImageId: row.parent_image_id,
        editPrompt: row.edit_prompt,
        versionNumber: row.version_number,
        createdAt: row.created_at
      };
    } catch (error) {
      console.error("Database error in createImage:", error);
      throw error;
    }
  }

  async getImageById(imageId: string, userId: string): Promise<GeneratedImage | undefined> {
    const [image] = await db
      .select()
      .from(generatedImages)
      .where(and(eq(generatedImages.id, imageId), eq(generatedImages.userId, userId)));
    return image;
  }

  async getImagesByIds(imageIds: string[], userId: string): Promise<GeneratedImage[]> {
    if (imageIds.length === 0) return [];
    return db
      .select()
      .from(generatedImages)
      .where(and(
        inArray(generatedImages.id, imageIds),
        eq(generatedImages.userId, userId)
      ));
  }

  async getPublicImageById(imageId: string): Promise<(GeneratedImage & { username?: string }) | undefined> {
    const [result] = await db
      .select({
        image: generatedImages,
        username: users.username,
      })
      .from(generatedImages)
      .leftJoin(users, eq(generatedImages.userId, users.id))
      .where(and(eq(generatedImages.id, imageId), eq(generatedImages.isPublic, true)));
    
    if (!result) return undefined;
    return { ...result.image, username: result.username || undefined };
  }

  async getImagesByUserId(userId: string, limit: number = 20, offset: number = 0): Promise<{ images: GeneratedImage[]; total: number }> {
    // Use pool directly to avoid Neon HTTP driver caching issues
    const { pool } = await import("./db");
    
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM generated_images WHERE user_id = $1`,
      [userId]
    );
    const total = parseInt(countResult.rows[0]?.count || '0');
    
    const imagesResult = await pool.query(
      `SELECT * FROM generated_images WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    // Map database column names to schema field names
    const images: GeneratedImage[] = imagesResult.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      folderId: row.folder_id,
      imageUrl: row.image_url,
      prompt: row.prompt,
      style: row.style,
      aspectRatio: row.aspect_ratio,
      generationType: row.generation_type,
      isFavorite: row.is_favorite,
      isPublic: row.is_public,
      viewCount: row.view_count,
      parentImageId: row.parent_image_id,
      editPrompt: row.edit_prompt,
      versionNumber: row.version_number,
      createdAt: row.created_at,
    }));
    
    return { images, total };
  }

  async getImageCountByUserId(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(generatedImages)
      .where(eq(generatedImages.userId, userId));
    return result?.count || 0;
  }

  async toggleImageFavorite(imageId: string, userId: string): Promise<GeneratedImage | undefined> {
    // Use pool directly to avoid Neon HTTP driver caching issues
    const { pool } = await import("./db");
    
    // First check if image exists for this user
    const checkResult = await pool.query(
      `SELECT id, is_favorite FROM generated_images WHERE id = $1 AND user_id = $2`,
      [imageId, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return undefined;
    }
    
    const currentFavorite = checkResult.rows[0].is_favorite;
    
    // Toggle the favorite status
    const updateResult = await pool.query(
      `UPDATE generated_images SET is_favorite = $1 WHERE id = $2 RETURNING *`,
      [!currentFavorite, imageId]
    );
    
    if (updateResult.rows.length === 0) {
      return undefined;
    }
    
    // Map database column names to schema field names
    const row = updateResult.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      folderId: row.folder_id,
      imageUrl: row.image_url,
      prompt: row.prompt,
      style: row.style,
      aspectRatio: row.aspect_ratio,
      generationType: row.generation_type,
      isFavorite: row.is_favorite,
      isPublic: row.is_public,
      viewCount: row.view_count,
      parentImageId: row.parent_image_id,
      editPrompt: row.edit_prompt,
      versionNumber: row.version_number,
      createdAt: row.created_at,
    };
  }

  async deleteImage(imageId: string, userId: string): Promise<boolean> {
    // Use pool directly to avoid Neon HTTP driver caching issues
    const { pool } = await import("./db");
    
    const result = await pool.query(
      `DELETE FROM generated_images WHERE id = $1 AND user_id = $2 RETURNING id`,
      [imageId, userId]
    );
    
    return result.rows.length > 0;
  }

  async getUserStats(userId: string): Promise<{ images: number; mockups: number; bgRemoved: number; total: number }> {
    // Optimized: Single query with CASE statements instead of 4 separate queries
    const [result] = await db
      .select({
        total: count(),
        images: sql<number>`COUNT(CASE WHEN ${generatedImages.generationType} IS NULL OR ${generatedImages.generationType} = 'image' THEN 1 END)`,
        mockups: sql<number>`COUNT(CASE WHEN ${generatedImages.generationType} = 'mockup' THEN 1 END)`,
        bgRemoved: sql<number>`COUNT(CASE WHEN ${generatedImages.generationType} = 'bg-removed' THEN 1 END)`,
      })
      .from(generatedImages)
      .where(eq(generatedImages.userId, userId));

    return {
      images: Number(result?.images) || 0,
      mockups: Number(result?.mockups) || 0,
      bgRemoved: Number(result?.bgRemoved) || 0,
      total: result?.total || 0
    };
  }

  async getUserByAffiliateCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.affiliateCode, code));
    return user || undefined;
  }

  async createCommission(affiliateUserId: string, referredUserId: string, amount: number, stripeSessionId?: string): Promise<AffiliateCommission> {
    const [commission] = await db
      .insert(affiliateCommissions)
      .values({ affiliateUserId, referredUserId, amount, stripeSessionId })
      .returning();
    return commission;
  }

  async getCommissionByStripeSessionId(stripeSessionId: string): Promise<AffiliateCommission | undefined> {
    const [commission] = await db
      .select()
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.stripeSessionId, stripeSessionId));
    return commission || undefined;
  }

  async getCommissionsByUserId(userId: string): Promise<AffiliateCommission[]> {
    return db
      .select()
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.affiliateUserId, userId))
      .orderBy(desc(affiliateCommissions.createdAt));
  }

  async getTotalEarnings(userId: string): Promise<number> {
    // Optimized: Use DB SUM() instead of fetching all records
    const [result] = await db
      .select({ total: sql<number>`COALESCE(SUM(${affiliateCommissions.amount}), 0)` })
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.affiliateUserId, userId));
    return Number(result?.total) || 0;
  }

  async getPendingPayout(userId: string): Promise<number> {
    // Optimized: Use DB SUM() with filter instead of fetching all records
    const [result] = await db
      .select({ total: sql<number>`COALESCE(SUM(${affiliateCommissions.amount}), 0)` })
      .from(affiliateCommissions)
      .where(and(
        eq(affiliateCommissions.affiliateUserId, userId),
        eq(affiliateCommissions.status, 'pending')
      ));
    return Number(result?.total) || 0;
  }

  async getTotalWithdrawn(userId: string): Promise<number> {
    // Optimized: Use DB SUM() with filter instead of fetching all records
    const [result] = await db
      .select({ total: sql<number>`COALESCE(SUM(${withdrawalRequests.amount}), 0)` })
      .from(withdrawalRequests)
      .where(and(
        eq(withdrawalRequests.userId, userId),
        eq(withdrawalRequests.status, 'completed')
      ));
    return Number(result?.total) || 0;
  }

  async getReferredUsers(userId: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(eq(users.referredBy, userId))
      .orderBy(desc(users.createdAt));
  }

  async createWithdrawalRequest(request: InsertWithdrawal): Promise<WithdrawalRequest> {
    const [withdrawal] = await db
      .insert(withdrawalRequests)
      .values(request)
      .returning();
    return withdrawal;
  }

  async getWithdrawalsByUserId(userId: string): Promise<WithdrawalRequest[]> {
    return db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, userId))
      .orderBy(desc(withdrawalRequests.createdAt));
  }
  
  async updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateStripeSubscriptionId(userId: string, stripeSubscriptionId: string | null): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ stripeSubscriptionId })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, stripeCustomerId));
    return user || undefined;
  }

  async setPasswordResetToken(email: string, tokenHash: string, expires: Date): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ passwordResetToken: tokenHash, passwordResetExpires: expires })
      .where(eq(users.email, email))
      .returning();
    return user || undefined;
  }

  async getUserWithResetToken(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user || undefined;
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordResetToken: null, passwordResetExpires: null })
      .where(eq(users.id, userId));
  }

  async getContacts(limit: number = 100, offset: number = 0): Promise<{ contacts: CrmContact[]; total: number }> {
    // Optimized: Added pagination
    const [totalResult] = await db.select({ count: count() }).from(crmContacts);
    const total = totalResult?.count || 0;

    const contacts = await db
      .select()
      .from(crmContacts)
      .orderBy(desc(crmContacts.createdAt))
      .limit(limit)
      .offset(offset);

    return { contacts, total };
  }

  async getContact(id: string): Promise<CrmContact | undefined> {
    const [contact] = await db
      .select()
      .from(crmContacts)
      .where(eq(crmContacts.id, id));
    return contact || undefined;
  }

  async createContact(data: InsertContact): Promise<CrmContact> {
    const insertData = {
      ...data,
      tags: data.tags ? (data.tags as string[]) : undefined,
    };
    const [contact] = await db
      .insert(crmContacts)
      .values(insertData)
      .returning();
    return contact;
  }

  async updateContact(id: string, data: Partial<InsertContact>): Promise<CrmContact | undefined> {
    const updateData: Record<string, any> = {
      ...data,
      updatedAt: new Date(),
    };
    if (data.tags) {
      updateData.tags = data.tags as string[];
    }
    const [contact] = await db
      .update(crmContacts)
      .set(updateData)
      .where(eq(crmContacts.id, id))
      .returning();
    return contact || undefined;
  }

  async deleteContact(id: string): Promise<void> {
    await db.delete(crmContacts).where(eq(crmContacts.id, id));
  }

  async getDeals(limit: number = 100, offset: number = 0): Promise<{ deals: CrmDeal[]; total: number }> {
    // Optimized: Added pagination
    const [totalResult] = await db.select({ count: count() }).from(crmDeals);
    const total = totalResult?.count || 0;

    const deals = await db
      .select()
      .from(crmDeals)
      .orderBy(desc(crmDeals.createdAt))
      .limit(limit)
      .offset(offset);

    return { deals, total };
  }

  async getDeal(id: string): Promise<CrmDeal | undefined> {
    const [deal] = await db
      .select()
      .from(crmDeals)
      .where(eq(crmDeals.id, id));
    return deal || undefined;
  }

  async getDealsByContact(contactId: string): Promise<CrmDeal[]> {
    return db
      .select()
      .from(crmDeals)
      .where(eq(crmDeals.contactId, contactId))
      .orderBy(desc(crmDeals.createdAt));
  }

  async createDeal(data: InsertDeal): Promise<CrmDeal> {
    const [deal] = await db
      .insert(crmDeals)
      .values(data)
      .returning();
    return deal;
  }

  async updateDeal(id: string, data: Partial<InsertDeal>): Promise<CrmDeal | undefined> {
    const [deal] = await db
      .update(crmDeals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(crmDeals.id, id))
      .returning();
    return deal || undefined;
  }

  async deleteDeal(id: string): Promise<void> {
    await db.delete(crmDeals).where(eq(crmDeals.id, id));
  }

  async getActivities(limit: number = 100, offset: number = 0): Promise<{ activities: CrmActivity[]; total: number }> {
    // Optimized: Added pagination
    const [totalResult] = await db.select({ count: count() }).from(crmActivities);
    const total = totalResult?.count || 0;

    const activities = await db
      .select()
      .from(crmActivities)
      .orderBy(desc(crmActivities.createdAt))
      .limit(limit)
      .offset(offset);

    return { activities, total };
  }

  async getActivitiesByContact(contactId: string): Promise<CrmActivity[]> {
    return db
      .select()
      .from(crmActivities)
      .where(eq(crmActivities.contactId, contactId))
      .orderBy(desc(crmActivities.createdAt));
  }

  async getActivitiesByDeal(dealId: string): Promise<CrmActivity[]> {
    return db
      .select()
      .from(crmActivities)
      .where(eq(crmActivities.dealId, dealId))
      .orderBy(desc(crmActivities.createdAt));
  }

  async createActivity(data: InsertActivity): Promise<CrmActivity> {
    const [activity] = await db
      .insert(crmActivities)
      .values(data)
      .returning();
    return activity;
  }

  async updateActivity(id: string, data: Partial<InsertActivity>): Promise<CrmActivity | undefined> {
    const [activity] = await db
      .update(crmActivities)
      .set(data)
      .where(eq(crmActivities.id, id))
      .returning();
    return activity || undefined;
  }

  async deleteActivity(id: string): Promise<void> {
    await db.delete(crmActivities).where(eq(crmActivities.id, id));
  }

  async getAllUsers(limit: number = 100, offset: number = 0): Promise<{ users: User[]; total: number }> {
    // Optimized: Added pagination to prevent loading all users at once
    const [totalResult] = await db.select({ count: count() }).from(users);
    const total = totalResult?.count || 0;

    const userList = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return { users: userList, total };
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async getAnalytics(): Promise<{ totalUsers: number; totalImages: number; totalCommissions: number }> {
    const [usersCount] = await db.select({ count: count() }).from(users);
    const [imagesCount] = await db.select({ count: count() }).from(generatedImages);
    const [commissionsCount] = await db.select({ count: count() }).from(affiliateCommissions);
    
    return {
      totalUsers: usersCount?.count || 0,
      totalImages: imagesCount?.count || 0,
      totalCommissions: commissionsCount?.count || 0,
    };
  }

  async getUserCredits(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    return user?.credits ?? 0;
  }

  async addCredits(userId: string, amount: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const [updated] = await db
      .update(users)
      .set({ 
        credits: (user.credits || 0) + amount,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return updated || undefined;
  }

  async deductCredits(userId: string, amount: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const currentCredits = user.credits || 0;
    if (currentCredits < amount) {
      throw new Error('Insufficient credits');
    }
    
    const [updated] = await db
      .update(users)
      .set({ 
        credits: currentCredits - amount,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return updated || undefined;
  }

  async getImagesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<GeneratedImage[]> {
    return db
      .select()
      .from(generatedImages)
      .where(
        and(
          eq(generatedImages.userId, userId),
          gte(generatedImages.createdAt, startDate),
          lte(generatedImages.createdAt, endDate)
        )
      )
      .orderBy(desc(generatedImages.createdAt));
  }

  async getImageCountsByMonth(userId: string, year: number, month: number): Promise<{ date: string; count: number; type: string }[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Optimized: Use GROUP BY in database instead of fetching all images and processing in memory
    const results = await db
      .select({
        date: sql<string>`DATE(${generatedImages.createdAt})::text`,
        type: sql<string>`COALESCE(${generatedImages.generationType}, 'image')`,
        count: count(),
      })
      .from(generatedImages)
      .where(
        and(
          eq(generatedImages.userId, userId),
          gte(generatedImages.createdAt, startDate),
          lte(generatedImages.createdAt, endDate)
        )
      )
      .groupBy(sql`DATE(${generatedImages.createdAt})`, generatedImages.generationType)
      .orderBy(sql`DATE(${generatedImages.createdAt})`);

    return results.map(r => ({
      date: r.date,
      count: r.count,
      type: r.type,
    }));
  }

  async createPromptFavorite(favorite: InsertPromptFavorite): Promise<PromptFavorite> {
    const [created] = await db
      .insert(promptFavorites)
      .values(favorite)
      .returning();
    return created;
  }

  async getPromptFavorites(userId: string): Promise<PromptFavorite[]> {
    // Use pool directly to avoid Neon HTTP driver issues
    const { pool } = await import("./db");
    
    const result = await pool.query(
      `SELECT * FROM prompt_favorites WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    
    return result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      prompt: row.prompt,
      style: row.style,
      aspectRatio: row.aspect_ratio,
      quality: row.quality,
      detail: row.detail,
      speed: row.speed,
      createdAt: row.created_at,
    }));
  }

  async deletePromptFavorite(id: string, userId: string): Promise<void> {
    await db
      .delete(promptFavorites)
      .where(and(eq(promptFavorites.id, id), eq(promptFavorites.userId, userId)));
  }

  async createMoodBoard(userId: string, name: string, description?: string): Promise<MoodBoard> {
    const [board] = await db
      .insert(moodBoards)
      .values({ userId, name, description })
      .returning();
    return board;
  }

  async getMoodBoards(userId: string): Promise<MoodBoard[]> {
    return db
      .select()
      .from(moodBoards)
      .where(eq(moodBoards.userId, userId))
      .orderBy(desc(moodBoards.createdAt));
  }

  async getMoodBoard(userId: string, boardId: string): Promise<{ board: MoodBoard; items: (MoodBoardItem & { image: GeneratedImage })[] } | undefined> {
    const [board] = await db
      .select()
      .from(moodBoards)
      .where(and(eq(moodBoards.id, boardId), eq(moodBoards.userId, userId)));
    
    if (!board) return undefined;

    const items = await db
      .select({
        id: moodBoardItems.id,
        boardId: moodBoardItems.boardId,
        imageId: moodBoardItems.imageId,
        positionX: moodBoardItems.positionX,
        positionY: moodBoardItems.positionY,
        width: moodBoardItems.width,
        height: moodBoardItems.height,
        zIndex: moodBoardItems.zIndex,
        createdAt: moodBoardItems.createdAt,
        image: generatedImages,
      })
      .from(moodBoardItems)
      .innerJoin(generatedImages, eq(moodBoardItems.imageId, generatedImages.id))
      .where(eq(moodBoardItems.boardId, boardId))
      .orderBy(moodBoardItems.zIndex);

    return { board, items };
  }

  async updateMoodBoard(userId: string, boardId: string, data: { name?: string; description?: string }): Promise<MoodBoard | undefined> {
    const [board] = await db
      .update(moodBoards)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(moodBoards.id, boardId), eq(moodBoards.userId, userId)))
      .returning();
    return board || undefined;
  }

  async deleteMoodBoard(userId: string, boardId: string): Promise<void> {
    // First unlink any chat sessions referencing this board
    await db.update(chatSessions).set({ projectId: null }).where(eq(chatSessions.projectId, boardId));
    await db.delete(moodBoardItems).where(eq(moodBoardItems.boardId, boardId));
    await db.delete(moodBoards).where(and(eq(moodBoards.id, boardId), eq(moodBoards.userId, userId)));
  }

  async verifyBoardOwnership(userId: string, boardId: string): Promise<boolean> {
    const [board] = await db
      .select({ id: moodBoards.id })
      .from(moodBoards)
      .where(and(eq(moodBoards.id, boardId), eq(moodBoards.userId, userId)));
    return !!board;
  }

  async verifyBoardItemOwnership(userId: string, itemId: string): Promise<boolean> {
    const [item] = await db
      .select({ id: moodBoardItems.id })
      .from(moodBoardItems)
      .innerJoin(moodBoards, eq(moodBoardItems.boardId, moodBoards.id))
      .where(and(eq(moodBoardItems.id, itemId), eq(moodBoards.userId, userId)));
    return !!item;
  }

  async addItemToBoard(boardId: string, imageId: string, position: { positionX: number; positionY: number; width?: number; height?: number; zIndex?: number }): Promise<MoodBoardItem> {
    const [item] = await db
      .insert(moodBoardItems)
      .values({
        boardId,
        imageId,
        positionX: position.positionX,
        positionY: position.positionY,
        width: position.width ?? 200,
        height: position.height ?? 200,
        zIndex: position.zIndex ?? 0,
      })
      .returning();
    return item;
  }

  async updateBoardItem(itemId: string, position: { positionX?: number; positionY?: number; width?: number; height?: number; zIndex?: number }): Promise<MoodBoardItem | undefined> {
    const updateData: Record<string, any> = {};
    if (position.positionX !== undefined) updateData.positionX = position.positionX;
    if (position.positionY !== undefined) updateData.positionY = position.positionY;
    if (position.width !== undefined) updateData.width = position.width;
    if (position.height !== undefined) updateData.height = position.height;
    if (position.zIndex !== undefined) updateData.zIndex = position.zIndex;

    const [item] = await db
      .update(moodBoardItems)
      .set(updateData)
      .where(eq(moodBoardItems.id, itemId))
      .returning();
    return item || undefined;
  }

  async removeItemFromBoard(itemId: string): Promise<void> {
    await db.delete(moodBoardItems).where(eq(moodBoardItems.id, itemId));
  }

  async getGalleryImages(limit: number = 200): Promise<Omit<GalleryImage, 'imageUrl'>[]> {
    return db.select({
      id: galleryImages.id,
      sourceImageId: galleryImages.sourceImageId,
      title: galleryImages.title,
      creator: galleryImages.creator,
      verified: galleryImages.verified,
      category: galleryImages.category,
      aspectRatio: galleryImages.aspectRatio,
      prompt: galleryImages.prompt,
      likeCount: galleryImages.likeCount,
      viewCount: galleryImages.viewCount,
      useCount: galleryImages.useCount,
      createdAt: galleryImages.createdAt,
    }).from(galleryImages)
      .orderBy(desc(galleryImages.createdAt))
      .limit(limit);
  }

  async getGalleryImageById(imageId: string): Promise<GalleryImage | undefined> {
    const [image] = await db.select().from(galleryImages).where(eq(galleryImages.id, imageId));
    return image || undefined;
  }

  async createGalleryImage(data: { title: string; imageUrl: string; creator: string; category?: string; aspectRatio?: string; prompt?: string; sourceImageId?: string }): Promise<GalleryImage> {
    const [image] = await db
      .insert(galleryImages)
      .values({
        sourceImageId: data.sourceImageId,
        title: data.title,
        imageUrl: data.imageUrl,
        creator: data.creator,
        category: data.category || "ai-generated",
        aspectRatio: data.aspectRatio || "1:1",
        prompt: data.prompt,
      })
      .returning();
    return image;
  }

  async deleteGalleryImageBySourceId(sourceImageId: string, imageUrl?: string, prompt?: string): Promise<void> {
    // Use pool directly to avoid Neon HTTP driver caching issues
    const { pool } = await import("./db");
    
    // First try to find by sourceImageId
    let result = await pool.query(
      `SELECT id FROM gallery_images WHERE source_image_id = $1`,
      [sourceImageId]
    );
    
    let galleryImageId = result.rows[0]?.id;
    
    // Fallback: try to find by imageUrl for older images without sourceImageId
    if (!galleryImageId && imageUrl) {
      result = await pool.query(
        `SELECT id FROM gallery_images WHERE image_url = $1`,
        [imageUrl]
      );
      galleryImageId = result.rows[0]?.id;
    }
    
    // Fallback 2: try to find by prompt for older images without sourceImageId or different imageUrl
    if (!galleryImageId && prompt) {
      result = await pool.query(
        `SELECT id FROM gallery_images WHERE prompt = $1`,
        [prompt]
      );
      galleryImageId = result.rows[0]?.id;
    }
    
    if (galleryImageId) {
      // Delete associated likes
      await pool.query(`DELETE FROM gallery_image_likes WHERE image_id = $1`, [galleryImageId]);
      // Delete the gallery image
      await pool.query(`DELETE FROM gallery_images WHERE id = $1`, [galleryImageId]);
    }
  }

  async getGalleryImageBySourceId(sourceImageId: string): Promise<GalleryImage | undefined> {
    // Use pool directly to avoid Neon HTTP driver caching issues
    const { pool } = await import("./db");
    
    const result = await pool.query(
      `SELECT * FROM gallery_images WHERE source_image_id = $1`,
      [sourceImageId]
    );
    
    if (result.rows.length === 0) return undefined;
    
    const row = result.rows[0];
    return {
      id: row.id,
      sourceImageId: row.source_image_id,
      title: row.title,
      imageUrl: row.image_url,
      creator: row.creator,
      verified: row.verified,
      category: row.category,
      likeCount: row.like_count,
      viewCount: row.view_count,
      useCount: row.use_count,
      prompt: row.prompt,
      aspectRatio: row.aspect_ratio,
      createdAt: row.created_at,
    };
  }

  async incrementGalleryImageView(imageId: string): Promise<GalleryImage | undefined> {
    const [updated] = await db
      .update(galleryImages)
      .set({ viewCount: sql`${galleryImages.viewCount} + 1` })
      .where(eq(galleryImages.id, imageId))
      .returning();
    return updated || undefined;
  }

  async incrementGalleryImageUse(imageId: string): Promise<GalleryImage | undefined> {
    const [updated] = await db
      .update(galleryImages)
      .set({ useCount: sql`${galleryImages.useCount} + 1` })
      .where(eq(galleryImages.id, imageId))
      .returning();
    return updated || undefined;
  }

  async likeGalleryImage(imageId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    // Use raw pool queries to avoid Neon HTTP driver issues
    const client = await pool.connect();
    try {
      // Check if user already liked this image
      const existingLikeResult = await client.query(
        'SELECT id FROM gallery_image_likes WHERE image_id = $1 AND user_id = $2',
        [imageId, userId]
      );
      
      const existingLike = existingLikeResult.rows[0];

      if (existingLike) {
        // Unlike: remove like and decrement count
        await client.query(
          'DELETE FROM gallery_image_likes WHERE image_id = $1 AND user_id = $2',
          [imageId, userId]
        );
        
        await client.query(
          'UPDATE gallery_images SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1',
          [imageId]
        );

        const imageResult = await client.query(
          'SELECT like_count FROM gallery_images WHERE id = $1',
          [imageId]
        );
        return { liked: false, likeCount: imageResult.rows[0]?.like_count ?? 0 };
      } else {
        // Like: add like and increment count
        await client.query(
          'INSERT INTO gallery_image_likes (image_id, user_id) VALUES ($1, $2)',
          [imageId, userId]
        );
        
        await client.query(
          'UPDATE gallery_images SET like_count = like_count + 1 WHERE id = $1',
          [imageId]
        );

        const imageResult = await client.query(
          'SELECT like_count FROM gallery_images WHERE id = $1',
          [imageId]
        );
        return { liked: true, likeCount: imageResult.rows[0]?.like_count ?? 0 };
      }
    } finally {
      client.release();
    }
  }

  async hasUserLikedImage(imageId: string, userId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(galleryImageLikes)
      .where(and(eq(galleryImageLikes.imageId, imageId), eq(galleryImageLikes.userId, userId)));
    return !!like;
  }

  async getUserLikedImages(userId: string): Promise<string[]> {
    const likes = await db
      .select({ imageId: galleryImageLikes.imageId })
      .from(galleryImageLikes)
      .where(eq(galleryImageLikes.userId, userId));
    return likes.map(l => l.imageId);
  }

  async getPublicImages(limit: number = 50): Promise<GeneratedImage[]> {
    return db
      .select()
      .from(generatedImages)
      .where(eq(generatedImages.isPublic, true))
      .orderBy(desc(generatedImages.createdAt))
      .limit(limit);
  }

  async setImageVisibility(imageId: string, userId: string, isPublic: boolean): Promise<GeneratedImage | undefined> {
    // Use pool directly to avoid Neon HTTP driver caching issues
    const { pool } = await import("./db");
    
    // First check if image exists and belongs to user
    const checkResult = await pool.query(
      `SELECT * FROM generated_images WHERE id = $1 AND user_id = $2`,
      [imageId, userId]
    );
    
    if (checkResult.rows.length === 0) return undefined;
    const image = checkResult.rows[0];

    // Update the visibility
    const updateResult = await pool.query(
      `UPDATE generated_images SET is_public = $1 WHERE id = $2 RETURNING *`,
      [isPublic, imageId]
    );
    
    if (updateResult.rows.length === 0) return undefined;
    const row = updateResult.rows[0];
    const updated: GeneratedImage = {
      id: row.id,
      userId: row.user_id,
      folderId: row.folder_id,
      imageUrl: row.image_url,
      prompt: row.prompt,
      style: row.style,
      aspectRatio: row.aspect_ratio,
      generationType: row.generation_type,
      isFavorite: row.is_favorite,
      isPublic: row.is_public,
      viewCount: row.view_count,
      parentImageId: row.parent_image_id,
      editPrompt: row.edit_prompt,
      versionNumber: row.version_number,
      createdAt: row.created_at,
    };
    
    // Handle gallery sync
    if (isPublic) {
      // Check if already in gallery
      const existingGalleryImage = await this.getGalleryImageBySourceId(imageId);
      if (!existingGalleryImage) {
        // Get user info for creator name
        const user = await this.getUser(userId);
        const creatorName = user?.displayName || user?.username || "UGLI User";
        
        // Add to gallery - use snake_case from raw database row
        await this.createGalleryImage({
          sourceImageId: imageId,
          title: image.prompt?.slice(0, 100) || "AI Generated Image",
          imageUrl: image.image_url,
          creator: creatorName,
          category: image.style || "ai-generated",
          aspectRatio: image.aspect_ratio || "1:1",
          prompt: image.prompt || "",
        });
      }
    } else {
      // Remove from gallery - use snake_case from raw database row
      await this.deleteGalleryImageBySourceId(imageId, image.image_url, image.prompt || undefined);
    }
    
    return updated;
  }

  async getLeaderboard(period: 'weekly' | 'monthly' | 'all-time', limit: number = 50): Promise<{ userId: string; username: string | null; displayName: string | null; profileImageUrl: string | null; imageCount: number; likeCount: number; viewCount: number; rank: number }[]> {
    let startDate: Date | null = null;
    const now = new Date();

    if (period === 'weekly') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'monthly') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Optimized: Use LEFT JOIN instead of correlated subqueries for like_count
    const query = startDate
      ? sql`
          SELECT
            u.id as user_id,
            u.username,
            u.display_name,
            u.profile_image_url,
            COUNT(DISTINCT gi.id) as image_count,
            COUNT(DISTINCT il.id) as like_count,
            COALESCE(SUM(gi.view_count), 0) as view_count
          FROM ${users} u
          INNER JOIN ${generatedImages} gi ON gi.user_id = u.id AND gi.created_at >= ${startDate}
          LEFT JOIN ${imageLikes} il ON il.image_id = gi.id
          GROUP BY u.id, u.username, u.display_name, u.profile_image_url
          ORDER BY image_count DESC
          LIMIT ${limit}
        `
      : sql`
          SELECT
            u.id as user_id,
            u.username,
            u.display_name,
            u.profile_image_url,
            COUNT(DISTINCT gi.id) as image_count,
            COUNT(DISTINCT il.id) as like_count,
            COALESCE(SUM(gi.view_count), 0) as view_count
          FROM ${users} u
          INNER JOIN ${generatedImages} gi ON gi.user_id = u.id
          LEFT JOIN ${imageLikes} il ON il.image_id = gi.id
          GROUP BY u.id, u.username, u.display_name, u.profile_image_url
          ORDER BY image_count DESC
          LIMIT ${limit}
        `;

    const results = await db.execute(query);

    return (results.rows as any[]).map((row, index) => ({
      userId: row.user_id,
      username: row.username,
      displayName: row.display_name,
      profileImageUrl: row.profile_image_url,
      imageCount: Number(row.image_count),
      likeCount: Number(row.like_count),
      viewCount: Number(row.view_count),
      rank: index + 1,
    }));
  }

  async getReferralStats(userId: string): Promise<{ referralCode: string | null; referredCount: number; bonusCreditsEarned: number }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { referralCode: null, referredCount: 0, bonusCreditsEarned: 0 };
    }
    
    const [referredResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.referredBy, userId));
    
    const referredCount = referredResult?.count || 0;
    const bonusCreditsEarned = referredCount * 5;
    
    return {
      referralCode: user.affiliateCode,
      referredCount,
      bonusCreditsEarned,
    };
  }

  async applyReferralCode(userId: string, referralCode: string): Promise<{ success: boolean; referrerCredits?: number; error?: string }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    if (user.referredBy) {
      return { success: false, error: 'You have already used a referral code' };
    }
    
    const referrer = await this.getUserByAffiliateCode(referralCode);
    if (!referrer) {
      return { success: false, error: 'Invalid referral code' };
    }
    
    if (referrer.id === userId) {
      return { success: false, error: 'You cannot use your own referral code' };
    }
    
    await db.update(users).set({ referredBy: referrer.id }).where(eq(users.id, userId));
    
    // Give 5 bonus credits to the referrer only (one-time signup bonus)
    await this.addCredits(referrer.id, 5);
    
    return { success: true, referrerCredits: 5 };
  }

  async getDailyInspirations(limit: number = 20): Promise<DailyInspiration[]> {
    return db
      .select()
      .from(dailyInspirations)
      .orderBy(desc(dailyInspirations.activeDate))
      .limit(limit);
  }

  async getTodaysInspiration(): Promise<DailyInspiration | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [inspiration] = await db
      .select()
      .from(dailyInspirations)
      .where(and(
        gte(dailyInspirations.activeDate, today),
        lte(dailyInspirations.activeDate, tomorrow)
      ))
      .orderBy(desc(dailyInspirations.activeDate))
      .limit(1);
    
    if (inspiration) return inspiration;
    
    // Fallback: get most recent featured inspiration
    const [featured] = await db
      .select()
      .from(dailyInspirations)
      .where(eq(dailyInspirations.featured, true))
      .orderBy(desc(dailyInspirations.activeDate))
      .limit(1);
    
    return featured || undefined;
  }

  async getFeaturedInspirations(limit: number = 10): Promise<DailyInspiration[]> {
    return db
      .select()
      .from(dailyInspirations)
      .where(eq(dailyInspirations.featured, true))
      .orderBy(desc(dailyInspirations.activeDate))
      .limit(limit);
  }

  async createChatSession(userId: string, name: string, projectId?: string): Promise<ChatSession> {
    const [session] = await db
      .insert(chatSessions)
      .values({ userId, name, projectId: projectId || null })
      .returning();
    return session;
  }

  async getChatSessions(userId: string): Promise<ChatSession[]> {
    return db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt));
  }

  async getChatSession(sessionId: string, userId: string): Promise<ChatSession | undefined> {
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)));
    return session || undefined;
  }

  async updateChatSession(sessionId: string, userId: string, data: Partial<InsertChatSession>): Promise<ChatSession | undefined> {
    const [session] = await db
      .update(chatSessions)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
      .returning();
    return session || undefined;
  }

  async deleteChatSession(sessionId: string, userId: string): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));
    await db.delete(chatSessions).where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)));
  }

  async addChatMessage(sessionId: string, message: Omit<InsertChatMessage, 'sessionId'>): Promise<ChatMessage> {
    const [chatMessage] = await db
      .insert(chatMessages)
      .values({ ...message, sessionId })
      .returning();
    await db.update(chatSessions).set({ updatedAt: new Date() }).where(eq(chatSessions.id, sessionId));
    return chatMessage;
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return prefs || undefined;
  }

  async upsertUserPreferences(userId: string, data: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(userId);
    if (existing) {
      const [updated] = await db
        .update(userPreferences)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(userPreferences)
      .values({ userId, ...data })
      .returning();
    return created;
  }

  async updateUserPreferences(userId: string, data: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const [prefs] = await db
      .update(userPreferences)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId))
      .returning();
    return prefs || undefined;
  }

  // Super Admin Analytics
  async getSuperAdminOverview(): Promise<{
    totalUsers: number;
    totalGenerations: number;
    activeUsersLast30Days: number;
    totalCommissions: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [userCount] = await db.select({ count: count() }).from(users);
    const [genCount] = await db.select({ count: count() }).from(generatedImages);
    
    const activeUsersResult = await db
      .selectDistinct({ userId: generatedImages.userId })
      .from(generatedImages)
      .where(gte(generatedImages.createdAt, thirtyDaysAgo));
    
    const [commissionsResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(affiliateCommissions);

    return {
      totalUsers: userCount?.count || 0,
      totalGenerations: genCount?.count || 0,
      activeUsersLast30Days: activeUsersResult.length,
      totalCommissions: Number(commissionsResult?.total) || 0,
    };
  }

  async getUserGrowthByDay(days: number): Promise<{ date: string; count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await db
      .select({
        date: sql<string>`DATE(${users.createdAt})`,
        count: count(),
      })
      .from(users)
      .where(gte(users.createdAt, startDate))
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`);

    return result.map(r => ({ date: r.date, count: r.count }));
  }

  async getGenerationsByDay(days: number): Promise<{ date: string; count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await db
      .select({
        date: sql<string>`DATE(${generatedImages.createdAt})`,
        count: count(),
      })
      .from(generatedImages)
      .where(gte(generatedImages.createdAt, startDate))
      .groupBy(sql`DATE(${generatedImages.createdAt})`)
      .orderBy(sql`DATE(${generatedImages.createdAt})`);

    return result.map(r => ({ date: r.date, count: r.count }));
  }

  async getTopCreators(limit: number): Promise<{ userId: string; username: string | null; displayName: string | null; imageCount: number }[]> {
    const result = await db
      .select({
        userId: generatedImages.userId,
        username: users.username,
        displayName: users.displayName,
        imageCount: count(),
      })
      .from(generatedImages)
      .leftJoin(users, eq(generatedImages.userId, users.id))
      .groupBy(generatedImages.userId, users.username, users.displayName)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(limit);

    return result.map(r => ({
      userId: r.userId,
      username: r.username,
      displayName: r.displayName,
      imageCount: r.imageCount,
    }));
  }

  async getUsersByRole(): Promise<{ role: string; count: number }[]> {
    const result = await db
      .select({
        role: users.role,
        count: count(),
      })
      .from(users)
      .groupBy(users.role);

    return result.map(r => ({ role: r.role, count: r.count }));
  }

  async getFeatureUsageBreakdown(): Promise<{ type: string; count: number }[]> {
    const result = await db
      .select({
        type: generatedImages.generationType,
        count: count(),
      })
      .from(generatedImages)
      .groupBy(generatedImages.generationType);

    return result.map(r => ({ 
      type: r.type || 'image', 
      count: r.count 
    }));
  }

  async getSubscriptionStats(): Promise<{ activeSubscriptions: number; totalSubscribers: number }> {
    const [activeResult] = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.stripeSubscriptionId} IS NOT NULL`);
    
    const [totalResult] = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.stripeCustomerId} IS NOT NULL`);

    return {
      activeSubscriptions: activeResult?.count || 0,
      totalSubscribers: totalResult?.count || 0,
    };
  }

  async getAffiliatePerformance(limit: number): Promise<{ userId: string; username: string | null; referralCount: number; totalEarnings: number }[]> {
    const result = await db
      .select({
        userId: affiliateCommissions.affiliateUserId,
        username: users.username,
        referralCount: count(),
        totalEarnings: sql<number>`COALESCE(SUM(${affiliateCommissions.amount}), 0)`,
      })
      .from(affiliateCommissions)
      .leftJoin(users, eq(affiliateCommissions.affiliateUserId, users.id))
      .groupBy(affiliateCommissions.affiliateUserId, users.username)
      .orderBy(sql`SUM(${affiliateCommissions.amount}) DESC`)
      .limit(limit);

    return result.map(r => ({
      userId: r.userId,
      username: r.username,
      referralCount: r.referralCount,
      totalEarnings: Number(r.totalEarnings) || 0,
    }));
  }

  async getRevenueByDay(days: number): Promise<{ date: string; amount: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await db
      .select({
        date: sql<string>`DATE(${affiliateCommissions.createdAt})`,
        amount: sql<number>`COALESCE(SUM(${affiliateCommissions.amount}), 0)`,
      })
      .from(affiliateCommissions)
      .where(gte(affiliateCommissions.createdAt, startDate))
      .groupBy(sql`DATE(${affiliateCommissions.createdAt})`)
      .orderBy(sql`DATE(${affiliateCommissions.createdAt})`);

    return result.map(r => ({ date: r.date, amount: Number(r.amount) || 0 }));
  }

  async getDailyActiveUsers(days: number): Promise<{ date: string; count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await db
      .select({
        date: sql<string>`DATE(${generatedImages.createdAt})`,
        count: sql<number>`COUNT(DISTINCT ${generatedImages.userId})`,
      })
      .from(generatedImages)
      .where(gte(generatedImages.createdAt, startDate))
      .groupBy(sql`DATE(${generatedImages.createdAt})`)
      .orderBy(sql`DATE(${generatedImages.createdAt})`);

    return result.map(r => ({ date: r.date, count: Number(r.count) || 0 }));
  }

  async getRetentionRate(): Promise<{ weeklyRetention: number; monthlyRetention: number }> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const [weeklyResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${generatedImages.userId})` })
      .from(generatedImages)
      .where(gte(generatedImages.createdAt, oneWeekAgo));

    const [monthlyResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${generatedImages.userId})` })
      .from(generatedImages)
      .where(gte(generatedImages.createdAt, oneMonthAgo));

    const [totalUsers] = await db.select({ count: count() }).from(users);
    const total = totalUsers?.count || 1;

    return {
      weeklyRetention: Math.round((Number(weeklyResult?.count) || 0) / total * 100),
      monthlyRetention: Math.round((Number(monthlyResult?.count) || 0) / total * 100),
    };
  }

  // Image Folders
  async getFoldersByUser(userId: string): Promise<ImageFolder[]> {
    return await db
      .select()
      .from(imageFolders)
      .where(eq(imageFolders.userId, userId))
      .orderBy(desc(imageFolders.createdAt));
  }

  async createFolder(data: InsertImageFolder): Promise<ImageFolder> {
    const [folder] = await db.insert(imageFolders).values(data).returning();
    return folder;
  }

  async updateFolder(id: string, userId: string, data: Partial<InsertImageFolder>): Promise<ImageFolder | undefined> {
    const [folder] = await db
      .update(imageFolders)
      .set(data)
      .where(and(eq(imageFolders.id, id), eq(imageFolders.userId, userId)))
      .returning();
    return folder || undefined;
  }

  async deleteFolder(id: string, userId: string): Promise<void> {
    // First, unset folderId for all images in this folder
    await db
      .update(generatedImages)
      .set({ folderId: null })
      .where(and(eq(generatedImages.folderId, id), eq(generatedImages.userId, userId)));
    
    // Then delete the folder
    await db
      .delete(imageFolders)
      .where(and(eq(imageFolders.id, id), eq(imageFolders.userId, userId)));
  }

  async moveImageToFolder(imageId: string, userId: string, folderId: string | null): Promise<GeneratedImage | undefined> {
    if (folderId) {
      const [folder] = await db.select().from(imageFolders).where(and(eq(imageFolders.id, folderId), eq(imageFolders.userId, userId)));
      if (!folder) {
        return undefined;
      }
    }
    
    const [image] = await db
      .update(generatedImages)
      .set({ folderId })
      .where(and(eq(generatedImages.id, imageId), eq(generatedImages.userId, userId)))
      .returning();
    return image || undefined;
  }

  async getOrCreateDefaultFolder(userId: string): Promise<ImageFolder> {
    const existingFolders = await db
      .select()
      .from(imageFolders)
      .where(and(eq(imageFolders.userId, userId), eq(imageFolders.name, "My Folder")));
    
    if (existingFolders.length > 0) {
      return existingFolders[0];
    }

    const [folder] = await db.insert(imageFolders).values({
      userId,
      name: "My Folder",
      color: "#6366f1"
    }).returning();
    
    return folder;
  }

  // Image Version History
  async getImageVersionHistory(rootImageId: string, userId: string): Promise<GeneratedImage[]> {
    // Get the original image and all its children (edited versions) - only for this user
    const versions = await db
      .select()
      .from(generatedImages)
      .where(
        and(
          eq(generatedImages.userId, userId),
          sql`(${generatedImages.id} = ${rootImageId} OR ${generatedImages.parentImageId} = ${rootImageId})`
        )
      )
      .orderBy(generatedImages.versionNumber);
    
    return versions;
  }

  // Mockup Version History
  async saveMockupVersion(version: InsertMockupVersion): Promise<MockupVersion> {
    const [result] = await db.insert(mockupVersions).values(version).returning();
    return result;
  }

  async getMockupVersions(userId: string, sessionId: string, filters?: { angle?: string; color?: string; size?: string; productName?: string }): Promise<MockupVersion[]> {
    const conditions = [
      eq(mockupVersions.userId, userId),
      eq(mockupVersions.mockupSessionId, sessionId)
    ];
    
    if (filters?.angle) {
      conditions.push(eq(mockupVersions.angle, filters.angle));
    }
    if (filters?.color) {
      conditions.push(eq(mockupVersions.productColor, filters.color));
    }
    if (filters?.size) {
      conditions.push(eq(mockupVersions.productSize, filters.size));
    }
    if (filters?.productName) {
      conditions.push(eq(mockupVersions.productName, filters.productName));
    }
    
    return await db
      .select()
      .from(mockupVersions)
      .where(and(...conditions))
      .orderBy(desc(mockupVersions.versionNumber));
  }

  async getMockupVersion(userId: string, versionId: string): Promise<MockupVersion | undefined> {
    const [version] = await db
      .select()
      .from(mockupVersions)
      .where(and(eq(mockupVersions.id, versionId), eq(mockupVersions.userId, userId)));
    return version || undefined;
  }

  async getLatestVersionNumber(userId: string, sessionId: string): Promise<number> {
    const [result] = await db
      .select({ maxVersion: sql<number>`COALESCE(MAX(${mockupVersions.versionNumber}), 0)` })
      .from(mockupVersions)
      .where(and(eq(mockupVersions.userId, userId), eq(mockupVersions.mockupSessionId, sessionId)));
    return result?.maxVersion || 0;
  }

  async deleteMockupVersion(userId: string, versionId: string): Promise<void> {
    await db
      .delete(mockupVersions)
      .where(and(eq(mockupVersions.id, versionId), eq(mockupVersions.userId, userId)));
  }

  async getUserMockupSessions(userId: string, limit = 20): Promise<{ sessionId: string; latestVersion: MockupVersion; versionCount: number }[]> {
    const sessions = await db
      .selectDistinct({ mockupSessionId: mockupVersions.mockupSessionId })
      .from(mockupVersions)
      .where(eq(mockupVersions.userId, userId))
      .orderBy(desc(mockupVersions.createdAt))
      .limit(limit);

    const results = await Promise.all(
      sessions.map(async (s) => {
        const versions = await db
          .select()
          .from(mockupVersions)
          .where(and(eq(mockupVersions.userId, userId), eq(mockupVersions.mockupSessionId, s.mockupSessionId)))
          .orderBy(desc(mockupVersions.versionNumber));
        
        return {
          sessionId: s.mockupSessionId,
          latestVersion: versions[0],
          versionCount: versions.length
        };
      })
    );

    return results.filter(r => r.latestVersion);
  }
}

export const storage = new DatabaseStorage();
