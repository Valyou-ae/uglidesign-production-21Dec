import { storage } from "../storage";
import { nanoid } from "nanoid";
import { logger } from "../logger";

export interface MockupMetadata {
  userId: string;
  designId?: string;
  imageId: string;
  prompt?: string;
  settings: {
    productType?: string;
    productColor?: string;
    scene?: string;
    angle?: string;
    style?: string;
    quality?: string;
    [key: string]: any;
  };
  watermarkId?: string;
}

/**
 * Save mockup metadata to database for history/gallery
 */
export async function saveMockupMetadata(metadata: MockupMetadata): Promise<string> {
  try {
    const id = nanoid();
    
    await storage.query(
      `INSERT INTO mockups (id, userId, designId, imageId, prompt, settings, watermarkId) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        metadata.userId,
        metadata.designId || null,
        metadata.imageId,
        metadata.prompt || null,
        JSON.stringify(metadata.settings),
        metadata.watermarkId || null
      ]
    );

    return id;
  } catch (error) {
    logger.error("Failed to save mockup metadata", error, { source: "mockupMetadata" });
    throw error;
  }
}

/**
 * Update mockup metadata
 */
export async function updateMockupMetadata(
  mockupId: string,
  updates: Partial<Omit<MockupMetadata, 'userId' | 'imageId'>>
): Promise<void> {
  try {
    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.designId !== undefined) {
      setClauses.push('designId = ?');
      values.push(updates.designId);
    }
    if (updates.prompt !== undefined) {
      setClauses.push('prompt = ?');
      values.push(updates.prompt);
    }
    if (updates.settings !== undefined) {
      setClauses.push('settings = ?');
      values.push(JSON.stringify(updates.settings));
    }
    if (updates.watermarkId !== undefined) {
      setClauses.push('watermarkId = ?');
      values.push(updates.watermarkId);
    }

    if (setClauses.length === 0) return;

    values.push(mockupId);
    await storage.query(
      `UPDATE mockups SET ${setClauses.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
  } catch (error) {
    logger.error("Failed to update mockup metadata", error, { source: "mockupMetadata" });
    throw error;
  }
}
