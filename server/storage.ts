import { users, generatedImages, withdrawalRequests, affiliateCommissions, type User, type InsertUser, type UpdateProfile, type GeneratedImage, type InsertImage, type WithdrawalRequest, type InsertWithdrawal, type AffiliateCommission } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(userId: string, data: UpdateProfile): Promise<User | undefined>;
  
  // Image operations
  createImage(image: InsertImage): Promise<GeneratedImage>;
  getImagesByUserId(userId: string): Promise<GeneratedImage[]>;
  toggleImageFavorite(imageId: string, userId: string): Promise<GeneratedImage | undefined>;
  deleteImage(imageId: string, userId: string): Promise<boolean>;
  getUserStats(userId: string): Promise<{ images: number; mockups: number; bgRemoved: number; total: number }>;
  
  // Affiliate operations
  getUserByAffiliateCode(code: string): Promise<User | undefined>;
  createCommission(affiliateUserId: string, referredUserId: string, amount: number): Promise<AffiliateCommission>;
  getCommissionsByUserId(userId: string): Promise<AffiliateCommission[]>;
  getTotalEarnings(userId: string): Promise<number>;
  
  // Withdrawal operations
  createWithdrawalRequest(request: InsertWithdrawal): Promise<WithdrawalRequest>;
  getWithdrawalsByUserId(userId: string): Promise<WithdrawalRequest[]>;
  
  // Stripe operations
  updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User | undefined>;
  updateStripeSubscriptionId(userId: string, stripeSubscriptionId: string | null): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
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

  // Image operations
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

  // Affiliate operations
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

  // Withdrawal operations
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
  
  // Stripe operations
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
}

export const storage = new DatabaseStorage();
