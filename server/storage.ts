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
  type GalleryImage
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(userId: string, data: UpdateProfile): Promise<User | undefined>;
  upsertUser(userData: UpsertUser): Promise<User>;
  
  createImage(image: InsertImage): Promise<GeneratedImage>;
  getImagesByUserId(userId: string): Promise<GeneratedImage[]>;
  toggleImageFavorite(imageId: string, userId: string): Promise<GeneratedImage | undefined>;
  deleteImage(imageId: string, userId: string): Promise<boolean>;
  getUserStats(userId: string): Promise<{ images: number; mockups: number; bgRemoved: number; total: number }>;
  
  getUserByAffiliateCode(code: string): Promise<User | undefined>;
  createCommission(affiliateUserId: string, referredUserId: string, amount: number): Promise<AffiliateCommission>;
  getCommissionsByUserId(userId: string): Promise<AffiliateCommission[]>;
  getTotalEarnings(userId: string): Promise<number>;
  
  createWithdrawalRequest(request: InsertWithdrawal): Promise<WithdrawalRequest>;
  getWithdrawalsByUserId(userId: string): Promise<WithdrawalRequest[]>;
  
  updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User | undefined>;
  updateStripeSubscriptionId(userId: string, stripeSubscriptionId: string | null): Promise<User | undefined>;
  
  setPasswordResetToken(email: string, tokenHash: string, expires: Date): Promise<User | undefined>;
  getUserWithResetToken(email: string): Promise<User | undefined>;
  updatePassword(userId: string, hashedPassword: string): Promise<User | undefined>;
  clearPasswordResetToken(userId: string): Promise<void>;

  getContacts(): Promise<CrmContact[]>;
  getContact(id: string): Promise<CrmContact | undefined>;
  createContact(data: InsertContact): Promise<CrmContact>;
  updateContact(id: string, data: Partial<InsertContact>): Promise<CrmContact | undefined>;
  deleteContact(id: string): Promise<void>;

  getDeals(): Promise<CrmDeal[]>;
  getDeal(id: string): Promise<CrmDeal | undefined>;
  getDealsByContact(contactId: string): Promise<CrmDeal[]>;
  createDeal(data: InsertDeal): Promise<CrmDeal>;
  updateDeal(id: string, data: Partial<InsertDeal>): Promise<CrmDeal | undefined>;
  deleteDeal(id: string): Promise<void>;

  getActivities(): Promise<CrmActivity[]>;
  getActivitiesByContact(contactId: string): Promise<CrmActivity[]>;
  getActivitiesByDeal(dealId: string): Promise<CrmActivity[]>;
  createActivity(data: InsertActivity): Promise<CrmActivity>;
  updateActivity(id: string, data: Partial<InsertActivity>): Promise<CrmActivity | undefined>;
  deleteActivity(id: string): Promise<void>;

  getAllUsers(): Promise<User[]>;
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
  addItemToBoard(boardId: string, imageId: string, position: { positionX: number; positionY: number; width?: number; height?: number; zIndex?: number }): Promise<MoodBoardItem>;
  updateBoardItem(itemId: string, position: { positionX?: number; positionY?: number; width?: number; height?: number; zIndex?: number }): Promise<MoodBoardItem | undefined>;
  removeItemFromBoard(itemId: string): Promise<void>;

  getGalleryImages(): Promise<GalleryImage[]>;
  likeGalleryImage(imageId: string, userId: string): Promise<{ liked: boolean; likeCount: number }>;
  hasUserLikedImage(imageId: string, userId: string): Promise<boolean>;
  getUserLikedImages(userId: string): Promise<string[]>;
  
  getPublicImages(limit?: number): Promise<GeneratedImage[]>;
  setImageVisibility(imageId: string, userId: string, isPublic: boolean): Promise<GeneratedImage | undefined>;
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
    const [created] = await db
      .insert(generatedImages)
      .values(image)
      .returning();
    return created;
  }

  async getImagesByUserId(userId: string): Promise<GeneratedImage[]> {
    return db
      .select()
      .from(generatedImages)
      .where(eq(generatedImages.userId, userId))
      .orderBy(desc(generatedImages.createdAt));
  }

  async toggleImageFavorite(imageId: string, userId: string): Promise<GeneratedImage | undefined> {
    const [image] = await db
      .select()
      .from(generatedImages)
      .where(and(eq(generatedImages.id, imageId), eq(generatedImages.userId, userId)));
    
    if (!image) return undefined;

    const [updated] = await db
      .update(generatedImages)
      .set({ isFavorite: !image.isFavorite })
      .where(eq(generatedImages.id, imageId))
      .returning();
    
    return updated;
  }

  async deleteImage(imageId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(generatedImages)
      .where(and(eq(generatedImages.id, imageId), eq(generatedImages.userId, userId)))
      .returning();
    
    return result.length > 0;
  }

  async getUserStats(userId: string): Promise<{ images: number; mockups: number; bgRemoved: number; total: number }> {
    const allImages = await this.getImagesByUserId(userId);
    const images = allImages.filter(img => !img.generationType || img.generationType === 'image').length;
    const mockups = allImages.filter(img => img.generationType === 'mockup').length;
    const bgRemoved = allImages.filter(img => img.generationType === 'bg-removed').length;
    return { images, mockups, bgRemoved, total: allImages.length };
  }

  async getUserByAffiliateCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.affiliateCode, code));
    return user || undefined;
  }

  async createCommission(affiliateUserId: string, referredUserId: string, amount: number): Promise<AffiliateCommission> {
    const [commission] = await db
      .insert(affiliateCommissions)
      .values({ affiliateUserId, referredUserId, amount })
      .returning();
    return commission;
  }

  async getCommissionsByUserId(userId: string): Promise<AffiliateCommission[]> {
    return db
      .select()
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.affiliateUserId, userId))
      .orderBy(desc(affiliateCommissions.createdAt));
  }

  async getTotalEarnings(userId: string): Promise<number> {
    const commissions = await this.getCommissionsByUserId(userId);
    return commissions.reduce((total, c) => total + c.amount, 0);
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

  async getContacts(): Promise<CrmContact[]> {
    return db
      .select()
      .from(crmContacts)
      .orderBy(desc(crmContacts.createdAt));
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

  async getDeals(): Promise<CrmDeal[]> {
    return db
      .select()
      .from(crmDeals)
      .orderBy(desc(crmDeals.createdAt));
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

  async getActivities(): Promise<CrmActivity[]> {
    return db
      .select()
      .from(crmActivities)
      .orderBy(desc(crmActivities.createdAt));
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

  async getAllUsers(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
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
    
    const images = await db
      .select()
      .from(generatedImages)
      .where(
        and(
          eq(generatedImages.userId, userId),
          gte(generatedImages.createdAt, startDate),
          lte(generatedImages.createdAt, endDate)
        )
      );
    
    const countsByDateAndType: Record<string, Record<string, number>> = {};
    
    for (const image of images) {
      const dateKey = image.createdAt.toISOString().split('T')[0];
      const type = image.generationType || 'image';
      
      if (!countsByDateAndType[dateKey]) {
        countsByDateAndType[dateKey] = {};
      }
      
      countsByDateAndType[dateKey][type] = (countsByDateAndType[dateKey][type] || 0) + 1;
    }
    
    const result: { date: string; count: number; type: string }[] = [];
    
    for (const [date, types] of Object.entries(countsByDateAndType)) {
      for (const [type, count] of Object.entries(types)) {
        result.push({ date, count, type });
      }
    }
    
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  async createPromptFavorite(favorite: InsertPromptFavorite): Promise<PromptFavorite> {
    const [created] = await db
      .insert(promptFavorites)
      .values(favorite)
      .returning();
    return created;
  }

  async getPromptFavorites(userId: string): Promise<PromptFavorite[]> {
    return db
      .select()
      .from(promptFavorites)
      .where(eq(promptFavorites.userId, userId))
      .orderBy(desc(promptFavorites.createdAt));
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
    await db.delete(moodBoardItems).where(eq(moodBoardItems.boardId, boardId));
    await db.delete(moodBoards).where(and(eq(moodBoards.id, boardId), eq(moodBoards.userId, userId)));
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

  async getGalleryImages(): Promise<GalleryImage[]> {
    return db.select().from(galleryImages).orderBy(desc(galleryImages.likeCount));
  }

  async likeGalleryImage(imageId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const [existingLike] = await db
      .select()
      .from(galleryImageLikes)
      .where(and(eq(galleryImageLikes.imageId, imageId), eq(galleryImageLikes.userId, userId)));

    if (existingLike) {
      await db
        .delete(galleryImageLikes)
        .where(and(eq(galleryImageLikes.imageId, imageId), eq(galleryImageLikes.userId, userId)));
      
      await db
        .update(galleryImages)
        .set({ likeCount: sql`GREATEST(${galleryImages.likeCount} - 1, 0)` })
        .where(eq(galleryImages.id, imageId));

      const [image] = await db.select().from(galleryImages).where(eq(galleryImages.id, imageId));
      return { liked: false, likeCount: image?.likeCount ?? 0 };
    } else {
      await db.insert(galleryImageLikes).values({ imageId, userId });
      
      await db
        .update(galleryImages)
        .set({ likeCount: sql`${galleryImages.likeCount} + 1` })
        .where(eq(galleryImages.id, imageId));

      const [image] = await db.select().from(galleryImages).where(eq(galleryImages.id, imageId));
      return { liked: true, likeCount: image?.likeCount ?? 0 };
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
    const [image] = await db
      .select()
      .from(generatedImages)
      .where(and(eq(generatedImages.id, imageId), eq(generatedImages.userId, userId)));
    
    if (!image) return undefined;

    const [updated] = await db
      .update(generatedImages)
      .set({ isPublic })
      .where(eq(generatedImages.id, imageId))
      .returning();
    
    return updated;
  }
}

export const storage = new DatabaseStorage();
