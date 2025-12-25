-- Migration: Add Mockup Features (History, Presets, Watermarks)
-- Date: 2024-12-25
-- Description: Add tables and columns to support mockup history, presets, watermarks, and sharing

-- ============================================
-- Table: mockups (Mockup History & Gallery)
-- ============================================
CREATE TABLE IF NOT EXISTS mockups (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  designId VARCHAR(255),
  imageId VARCHAR(255) NOT NULL,
  prompt TEXT,
  settings JSON,
  isPublic BOOLEAN DEFAULT FALSE,
  isFavorite BOOLEAN DEFAULT FALSE,
  tags TEXT,
  watermarkId VARCHAR(255),
  shareToken VARCHAR(255) UNIQUE,
  viewCount INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mockups_user_id (userId),
  INDEX idx_mockups_created_at (createdAt),
  INDEX idx_mockups_is_public (isPublic),
  INDEX idx_mockups_share_token (shareToken)
);

-- ============================================
-- Table: mockup_presets (Save Settings)
-- ============================================
CREATE TABLE IF NOT EXISTS mockup_presets (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  settings JSON NOT NULL,
  isDefault BOOLEAN DEFAULT FALSE,
  usageCount INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_presets_user_id (userId),
  INDEX idx_presets_is_default (isDefault)
);

-- ============================================
-- Table: user_watermarks (Custom Branding)
-- ============================================
CREATE TABLE IF NOT EXISTS user_watermarks (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  imageId VARCHAR(255) NOT NULL,
  position VARCHAR(50) DEFAULT 'bottom-right',
  opacity FLOAT DEFAULT 0.5,
  scale FLOAT DEFAULT 0.1,
  isDefault BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_watermarks_user_id (userId),
  INDEX idx_watermarks_is_default (isDefault)
);

-- ============================================
-- Table: mockup_comparisons (Comparison Sets)
-- ============================================
CREATE TABLE IF NOT EXISTS mockup_comparisons (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  mockupIds JSON NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_comparisons_user_id (userId)
);

-- ============================================
-- Table: mockup_refinements (Edit History)
-- ============================================
CREATE TABLE IF NOT EXISTS mockup_refinements (
  id VARCHAR(255) PRIMARY KEY,
  mockupId VARCHAR(255) NOT NULL,
  userId VARCHAR(255) NOT NULL,
  refinementPrompt TEXT NOT NULL,
  resultImageId VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_refinements_mockup_id (mockupId),
  INDEX idx_refinements_user_id (userId)
);
