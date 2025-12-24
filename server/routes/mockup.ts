import type { Express, Request, Response } from "express";
import type { Middleware } from "./middleware";
import { logger } from "../logger";

export async function registerMockupRoutes(app: Express, middleware: Middleware) {
  const { requireAuth } = middleware;

  // Import gemini mockup services
  const {
    analyzeDesign,
    generateMockupPrompt,
    generateMockup,
  } = await import("../services/gemini");

  // ============== MOCKUP GENERATION ROUTES ==============

  app.post("/api/mockup/analyze", requireAuth, async (req: Request, res: Response) => {
    try {
      const { designImage } = req.body;
      if (!designImage || typeof designImage !== "string") {
        return res.status(400).json({ message: "Design image is required" });
      }

      const base64Data = designImage.replace(/^data:image\/\w+;base64,/, "");
      const analysis = await analyzeDesign(base64Data);
      res.json({ analysis });
    } catch (error) {
      logger.error("Design analysis error", error, { source: "mockup" });
      res.status(500).json({ message: "Analysis failed" });
    }
  });

  app.post("/api/mockup/generate", requireAuth, async (req: Request, res: Response) => {
    try {
      const {
        designImage,
        productType = "t-shirt",
        productColor = "white",
        scene = "studio",
        angle = "front",
        style = "minimal",
      } = req.body;

      if (!designImage || typeof designImage !== "string") {
        return res.status(400).json({ message: "Design image is required" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const sendEvent = (event: string, data: unknown) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      const base64Data = designImage.replace(/^data:image\/\w+;base64,/, "");

      sendEvent("status", { stage: "analyzing", message: "Analyzing your design..." });

      const designAnalysis = await analyzeDesign(base64Data);
      sendEvent("analysis", { analysis: designAnalysis });

      sendEvent("status", { stage: "prompting", message: "Creating mockup prompt..." });

      const { prompt, negativePrompts } = await generateMockupPrompt(designAnalysis, {
        designBase64: base64Data,
        productType,
        productColor,
        scene,
        angle,
        style,
      });
      sendEvent("prompt", { prompt, negativePrompts });

      sendEvent("status", { stage: "generating", message: "Generating mockup image..." });

      const result = await generateMockup(base64Data, prompt, negativePrompts);

      if (result) {
        sendEvent("image", {
          imageData: result.imageData,
          mimeType: result.mimeType,
        });
        sendEvent("complete", { success: true, message: "Mockup generated successfully" });
      } else {
        sendEvent("error", { message: "Failed to generate mockup" });
      }

      res.end();
    } catch (error) {
      logger.error("Mockup generation error", error, { source: "mockup" });
      res.write(`event: error\ndata: ${JSON.stringify({ message: "Mockup generation failed" })}\n\n`);
      res.end();
    }
  });

  app.post("/api/mockup/generate-batch", requireAuth, async (req: Request, res: Response) => {
    try {
      const {
        designImage,
        productType = "t-shirt",
        productColors = ["White"],
        productSizes,
        angles = ["front"],
        scene = "studio",
        style = "minimal",
        modelDetails,
        journey = "DTG",
        patternScale,
        isSeamlessPattern,
        outputQuality: rawOutputQuality = "high",
        modelCustomization,
      } = req.body;

      if (!designImage || typeof designImage !== "string") {
        return res.status(400).json({ message: "Design image is required" });
      }

      const validOutputQualities = ['standard', 'high', 'ultra'] as const;
      const outputQuality = validOutputQualities.includes(rawOutputQuality)
        ? rawOutputQuality as 'standard' | 'high' | 'ultra'
        : 'high';

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.setHeader("Transfer-Encoding", "chunked");
      res.flushHeaders();

      const sendEvent = (event: string, data: unknown) => {
        try {
          res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
          if (typeof (res as { flush?: () => void }).flush === 'function') {
            (res as { flush: () => void }).flush();
          }
        } catch (e) {
          logger.error("Error sending SSE event", e, { source: "mockup", event });
        }
      };

      // Send keepalive comments every 8 seconds to prevent proxy/browser timeout
      let connectionClosed = false;
      const keepaliveInterval = setInterval(() => {
        if (connectionClosed) return;
        try {
          res.write(`:keepalive ${Date.now()}\n\n`);
          if (typeof (res as { flush?: () => void }).flush === 'function') {
            (res as { flush: () => void }).flush();
          }
        } catch (e) {
          connectionClosed = true;
          clearInterval(keepaliveInterval);
        }
      }, 8000);

      res.on('close', () => {
        connectionClosed = true;
        clearInterval(keepaliveInterval);
      });

      const base64Data = designImage.replace(/^data:image\/\w+;base64,/, "");

      const colorNameToHex: Record<string, string> = {
        "White": "#FFFFFF",
        "Black": "#000000",
        "Sport Grey": "#9E9E9E",
        "Dark Heather": "#545454",
        "Charcoal": "#424242",
        "Navy": "#1A237E",
        "Royal": "#0D47A1",
        "Light Blue": "#ADD8E6",
        "Red": "#D32F2F",
        "Cardinal": "#880E4F",
        "Maroon": "#4A148C",
        "Orange": "#F57C00",
        "Gold": "#FBC02D",
        "Yellow": "#FFEB3B",
        "Irish Green": "#388E3C",
        "Military Green": "#558B2F",
        "Forest": "#1B5E20",
        "Purple": "#7B1FA2",
        "Light Pink": "#F8BBD0",
        "Sand": "#F5F5DC",
      };

      const colors = (Array.isArray(productColors) ? productColors : [productColors]).map(colorName => ({
        name: colorName,
        hex: colorNameToHex[colorName] || "#FFFFFF"
      }));

      if (modelDetails) {
        const eliteGenerator = await import("../services/eliteMockupGenerator");
        const knowledge = await import("../services/knowledge");

        const ethnicityMap: Record<string, string> = {
          "CAUCASIAN": "White", "WHITE": "White", "AFRICAN": "Black", "BLACK": "Black",
          "ASIAN": "Asian", "HISPANIC": "Hispanic", "SOUTH_ASIAN": "Indian", "INDIAN": "Indian",
          "MIDDLE_EASTERN": "Middle Eastern", "SOUTHEAST_ASIAN": "Southeast Asian",
          "MIXED": "Diverse", "INDIGENOUS": "Indigenous", "DIVERSE": "Diverse"
        };

        const ageMap: Record<string, string> = {
          "ADULT": "Adult", "YOUNG_ADULT": "Young Adult", "TEEN": "Teen"
        };

        const sexMap: Record<string, string> = {
          "MALE": "Male", "FEMALE": "Female"
        };

        const mappedModelDetails = {
          age: ageMap[modelDetails.age] || "Adult",
          sex: sexMap[modelDetails.sex] || "Male",
          ethnicity: ethnicityMap[modelDetails.ethnicity] || "White",
          modelSize: modelDetails.modelSize || "M"
        };

        const styleMap: Record<string, string> = {
          "minimal": "MINIMALIST_MODERN", "editorial": "EDITORIAL_FASHION",
          "vintage": "VINTAGE_RETRO", "street": "STREET_URBAN",
          "ecommerce": "ECOMMERCE_CLEAN", "clean": "ECOMMERCE_CLEAN",
          "bold": "BOLD_PLAYFUL", "playful": "BOLD_PLAYFUL",
          "premium": "PREMIUM_LUXE", "luxe": "PREMIUM_LUXE",
          "natural": "NATURAL_ORGANIC", "organic": "NATURAL_ORGANIC",
          "ECOMMERCE_CLEAN": "ECOMMERCE_CLEAN", "EDITORIAL_FASHION": "EDITORIAL_FASHION",
          "VINTAGE_RETRO": "VINTAGE_RETRO", "STREET_URBAN": "STREET_URBAN",
          "MINIMALIST_MODERN": "MINIMALIST_MODERN", "BOLD_PLAYFUL": "BOLD_PLAYFUL",
          "PREMIUM_LUXE": "PREMIUM_LUXE", "NATURAL_ORGANIC": "NATURAL_ORGANIC"
        };
        const mappedStyle = styleMap[style] || styleMap[style.toLowerCase()] || "ECOMMERCE_CLEAN";

        sendEvent("status", { stage: "analyzing", message: "Analyzing your design...", progress: 5 });

        const isAopJourney = journey === "AOP";
        const productSource = isAopJourney ? knowledge.getAOPProducts() : knowledge.getDTGProducts();
        const allProducts = knowledge.getAllProducts();

        // Use direct name mapping for accurate product matching
        let product = knowledge.getProductByFrontendName(productType);
        
        // If mapping found a valid product, use it directly (even if outside DTG/AOP for accessories/home products)
        if (product && allProducts.some(p => p.id === product!.id)) {
          logger.info("Product matched via direct mapping", { source: "mockup", productType, productId: product.id, productName: product.name });
        } else {
          // Fallback: try to find in the journey-specific products first
          product = productSource.find(p =>
            p.name.toLowerCase().includes(productType.toLowerCase()) ||
            p.subcategory?.toLowerCase().includes(productType.toLowerCase()) ||
            p.id.toLowerCase().includes(productType.toLowerCase())
          );
          
          // If still not found, try all products
          if (!product) {
            product = allProducts.find(p =>
              p.name.toLowerCase().includes(productType.toLowerCase()) ||
              p.subcategory?.toLowerCase().includes(productType.toLowerCase()) ||
              p.id.toLowerCase().includes(productType.toLowerCase())
            );
          }
          
          // Final fallback: use first product from the source (log warning)
          if (!product) {
            logger.warn("Product not found, using default", { source: "mockup", productType, journey });
            product = productSource[0];
          }
        }

        const sizeMap: Record<string, string> = {
          "XS": "XS", "S": "S", "M": "M", "L": "L", "XL": "XL",
          "2XL": "XXL", "XXL": "XXL", "3XL": "XXXL", "XXXL": "XXXL", "4XL": "XXXL", "5XL": "XXXL"
        };

        const rawSizes: string[] = Array.isArray(productSizes) && productSizes.length > 0
          ? productSizes
          : [mappedModelDetails.modelSize || 'M'];

        const sizesToGenerate: string[] = rawSizes.map(s => sizeMap[s] || s);

        let personaLockFailed = false;
        let batchCompleted = false;
        let totalGeneratedCount = 0;
        const totalSizes = sizesToGenerate.length;
        const jobsPerSize = angles.length * colors.length;
        const totalJobs = jobsPerSize * totalSizes;

        sendEvent("status", { stage: "preparing", message: "Preparing model reference...", progress: 8 });

        let sharedPersonaLock: unknown = undefined;

        try {
          for (let sizeIndex = 0; sizeIndex < sizesToGenerate.length; sizeIndex++) {
            const currentSize = sizesToGenerate[sizeIndex];

            const sizeModelDetails = { ...mappedModelDetails, modelSize: currentSize };
            const sizeLabel = totalSizes > 1 ? ` (Size ${currentSize})` : '';

            sendEvent("status", {
              stage: "generating",
              message: `Generating size ${currentSize}${totalSizes > 1 ? ` (${sizeIndex + 1}/${totalSizes})` : ''}...`,
              progress: 10 + Math.round((sizeIndex / totalSizes) * 10)
            });

            const mergedCustomization = modelDetails?.customization || modelCustomization;

            const batch = await eliteGenerator.generateMockupBatch({
              journey: isAopJourney ? "AOP" : "DTG",
              designImage: base64Data,
              isSeamlessPattern: isAopJourney ? (isSeamlessPattern ?? true) : undefined,
              product: product,
              colors: colors,
              angles: angles as ("front" | "back" | "left" | "right")[],
              modelDetails: { ...sizeModelDetails, customization: mergedCustomization } as Parameters<typeof eliteGenerator.generateMockupBatch>[0]['modelDetails'],
              brandStyle: mappedStyle as Parameters<typeof eliteGenerator.generateMockupBatch>[0]['brandStyle'],
              lightingPreset: 'three-point-classic',
              materialCondition: 'BRAND_NEW',
              environmentPrompt: scene,
              existingPersonaLock: sharedPersonaLock,
              patternScale: isAopJourney ? patternScale : undefined,
              outputQuality: outputQuality
            }, (completed, _total, job) => {
              const completedOverall = (sizeIndex * jobsPerSize) + completed;
              const progress = 10 + Math.round((completedOverall / totalJobs) * 85);

              logger.info("onProgress callback called", { source: "mockup", jobId: job.id, jobStatus: job.status, hasResult: !!job.result, hasImageData: !!job.result?.imageData });

              const batchJob = {
                id: job.id,
                color: job.color.name,
                angle: job.angle,
                size: currentSize,
                status: job.status as 'pending' | 'processing' | 'completed' | 'failed',
                retryCount: job.retryCount || 0,
                imageData: job.result?.imageData,
                mimeType: job.result?.mimeType,
                error: job.error
              };

              if (job.status === 'completed' && job.result) {
                totalGeneratedCount++;
                logger.info("Sending completed image via SSE", { source: "mockup", jobId: job.id, imageDataLength: job.result.imageData?.length || 0 });
                sendEvent("job_update", batchJob);
                sendEvent("image", {
                  jobId: job.id, angle: job.angle, color: job.color.name, size: currentSize,
                  status: 'completed', imageData: job.result.imageData, mimeType: job.result.mimeType,
                  retryCount: job.retryCount || 0
                });
              } else if (job.status === 'failed') {
                sendEvent("job_update", batchJob);
                sendEvent("image_error", {
                  jobId: job.id, angle: job.angle, color: job.color.name, size: currentSize,
                  status: 'failed', error: job.error || "Generation failed", retryCount: job.retryCount || 0
                });
              } else if (job.status === 'processing') {
                sendEvent("job_update", { ...batchJob, status: 'processing' });
              }

              sendEvent("status", { stage: "generating", message: `Generated ${completedOverall}/${totalJobs} mockups${sizeLabel}...`, progress });
            }, (error) => {
              if (error.type === 'persona_lock_failed') {
                personaLockFailed = true;
                sendEvent("persona_lock_failed", { message: error.message, details: error.details, suggestion: "Try again or use a different model configuration" });
              } else {
                sendEvent("batch_error", { type: error.type, message: error.message, details: error.details });
              }
            });

            if (personaLockFailed) break;

            if (sizeIndex === 0 && batch.personaLock) {
              sharedPersonaLock = batch.personaLock;
            }

            if (sizeIndex === 0 && batch.personaLockImage) {
              sendEvent("persona_lock", { headshotImage: batch.personaLockImage });
            }
          }

          if (!personaLockFailed) {
            batchCompleted = true;
            sendEvent("status", { stage: "complete", message: "All mockups generated!", progress: 100 });
            sendEvent("complete", { success: true, totalGenerated: totalGeneratedCount });
          } else {
            sendEvent("status", { stage: "failed", message: "Model generation failed - please try again", progress: 0 });
          }
        } catch (batchErr) {
          logger.error("Elite mockup batch error", batchErr, { source: "mockup" });
          const errorMessage = batchErr instanceof Error ? batchErr.message : String(batchErr);
          const isPersonaLockError = errorMessage.includes('Persona Lock failed');

          if (isPersonaLockError) {
            sendEvent("persona_lock_failed", { message: 'Could not generate a consistent model reference.', details: errorMessage, suggestion: "Please try again or adjust model selection" });
          } else {
            sendEvent("error", { message: errorMessage });
          }
          sendEvent("status", { stage: "failed", message: isPersonaLockError ? "Model generation failed - please try again" : "Generation failed", progress: 0 });
        }

        sendEvent("stream_end", { success: batchCompleted && !personaLockFailed, timestamp: Date.now() });
        clearInterval(keepaliveInterval);
        res.end();
        return;
      }

      // Non-elite batch generation
      sendEvent("status", { stage: "analyzing", message: "Analyzing your design...", progress: 5 });

      const designAnalysis = await analyzeDesign(base64Data);
      sendEvent("analysis", { analysis: designAnalysis });

      const totalJobs = angles.length * colors.length;
      let completedJobs = 0;

      for (const color of colors) {
        for (const angle of angles) {
          sendEvent("status", {
            stage: "generating",
            message: `Generating ${color.name} ${angle} view (${completedJobs + 1}/${totalJobs})...`,
            progress: 10 + Math.round((completedJobs / totalJobs) * 80)
          });

          const { prompt, negativePrompts } = await generateMockupPrompt(designAnalysis, {
            designBase64: base64Data, productType, productColor: color.name, scene, angle, style,
          });

          const result = await generateMockup(base64Data, prompt, negativePrompts);

          if (result) {
            sendEvent("image", { angle, color: color.name, imageData: result.imageData, mimeType: result.mimeType });
          } else {
            sendEvent("image_error", { angle, color: color.name, error: "Failed to generate" });
          }

          completedJobs++;
        }
      }

      sendEvent("status", { stage: "complete", message: "All mockups generated!", progress: 100 });
      sendEvent("complete", { success: true, totalGenerated: completedJobs });

      clearInterval(keepaliveInterval);
      res.end();
    } catch (error) {
      logger.error("Batch mockup generation error", error, { source: "mockup" });
      res.write(`event: error\ndata: ${JSON.stringify({ message: "Batch generation failed" })}\n\n`);
      clearInterval(keepaliveInterval);
      res.end();
    }
  });

  // ============== ELITE MOCKUP GENERATOR ROUTES ==============
  const {
    analyzeDesignForMockup,
    generateMockupBatch,
    refineMockup,
  } = await import("../services/eliteMockupGenerator");

  const {
    getDTGProducts,
    getAOPProducts,
    getAccessoryProducts,
    getHomeLivingProducts,
    BRAND_STYLES
  } = await import("../services/knowledge");

  app.get("/api/elite-mockup/products", requireAuth, async (_req: Request, res: Response) => {
    try {
      const dtgProducts = getDTGProducts();
      const aopProducts = getAOPProducts();
      const accessoryProducts = getAccessoryProducts();
      const homeLivingProducts = getHomeLivingProducts();
      res.json({ dtgProducts, aopProducts, accessoryProducts, homeLivingProducts });
    } catch (error) {
      logger.error("Products fetch error", error, { source: "mockup" });
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/elite-mockup/brand-styles", requireAuth, async (_req: Request, res: Response) => {
    try {
      const styles = Object.values(BRAND_STYLES).map(style => ({
        id: style.id, name: style.name, description: style.description, moodKeywords: style.moodKeywords
      }));
      res.json({ styles });
    } catch (error) {
      logger.error("Brand styles fetch error", error, { source: "mockup" });
      res.status(500).json({ message: "Failed to fetch brand styles" });
    }
  });

  app.post("/api/elite-mockup/analyze", requireAuth, async (req: Request, res: Response) => {
    try {
      const { designImage } = req.body;
      if (!designImage || typeof designImage !== "string") {
        return res.status(400).json({ message: "Design image is required" });
      }

      const base64Data = designImage.replace(/^data:image\/\w+;base64,/, "");
      const analysis = await analyzeDesignForMockup(base64Data);
      res.json({ analysis });
    } catch (error) {
      logger.error("Elite design analysis error", error, { source: "mockup" });
      res.status(500).json({ message: "Analysis failed" });
    }
  });

  app.post("/api/elite-mockup/generate", requireAuth, async (req: Request, res: Response) => {
    try {
      const {
        journey = "DTG", designImage, product, colors, angles, modelDetails,
        brandStyle = "ECOMMERCE_CLEAN", lightingPreset, materialCondition, environmentPrompt
      } = req.body;

      if (!designImage || typeof designImage !== "string") {
        return res.status(400).json({ message: "Design image is required" });
      }

      if (!product || !colors || !angles) {
        return res.status(400).json({ message: "Product, colors, and angles are required" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const sendEvent = (event: string, data: unknown) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        if (typeof (res as { flush?: () => void }).flush === 'function') {
          (res as { flush: () => void }).flush();
        }
      };

      const base64Data = designImage.replace(/^data:image\/\w+;base64,/, "");
      const validatedBrandStyle = brandStyle || 'ECOMMERCE_CLEAN';
      const validatedMaterialCondition = materialCondition || 'BRAND_NEW';
      const validatedLightingPreset = lightingPreset || 'three-point-classic';

      sendEvent("status", { stage: "analyzing", message: "Analyzing your design...", progress: 5 });

      let batchCompleted = false;
      let personaLockFailed = false;

      try {
        const batch = await generateMockupBatch({
          journey, designImage: base64Data, product, colors, angles, modelDetails,
          brandStyle: validatedBrandStyle, lightingPreset: validatedLightingPreset,
          materialCondition: validatedMaterialCondition, environmentPrompt
        }, (completed, total, job) => {
          const progress = 10 + Math.round((completed / total) * 85);

          if (job.status === 'completed' && job.result) {
            sendEvent("image", { jobId: job.id, angle: job.angle, color: job.color.name, imageData: job.result.imageData, mimeType: job.result.mimeType });
          } else if (job.status === 'failed') {
            sendEvent("image_error", { jobId: job.id, angle: job.angle, color: job.color.name, error: job.error || "Generation failed" });
          }

          sendEvent("status", { stage: "generating", message: `Generated ${completed}/${total} mockups...`, progress });
        }, (error) => {
          if (error.type === 'persona_lock_failed') {
            personaLockFailed = true;
            sendEvent("persona_lock_failed", { message: error.message, details: error.details, suggestion: "Try again or use a different model configuration" });
          } else {
            sendEvent("batch_error", { type: error.type, message: error.message, details: error.details });
          }
        });

        if (!personaLockFailed) {
          batchCompleted = true;

          if (batch.personaLockImage) {
            sendEvent("persona_lock", { headshotImage: batch.personaLockImage });
          }

          sendEvent("batch_complete", {
            batchId: batch.id, status: batch.status, totalJobs: batch.jobs.length,
            completedJobs: batch.jobs.filter(j => j.status === 'completed').length,
            failedJobs: batch.jobs.filter(j => j.status === 'failed').length
          });

          sendEvent("status", { stage: "complete", message: "All mockups generated!", progress: 100 });
        } else {
          sendEvent("status", { stage: "failed", message: "Model generation failed - please try again", progress: 0 });
        }
      } catch (batchErr) {
        const errorMessage = batchErr instanceof Error ? batchErr.message : String(batchErr);
        const isPersonaLockError = errorMessage.includes('Persona Lock failed');

        if (isPersonaLockError) {
          sendEvent("persona_lock_failed", { message: 'Could not generate a consistent model reference for this configuration.', details: errorMessage, suggestion: "Please try again or adjust model selection (different age, ethnicity, or size)" });
        } else {
          sendEvent("batch_error", { type: 'batch_failed', message: 'Mockup generation encountered an error.', details: errorMessage });
        }

        sendEvent("status", { stage: "failed", message: isPersonaLockError ? "Model generation failed - please try again" : "Generation failed", progress: 0 });
      }

      sendEvent("stream_end", { success: batchCompleted && !personaLockFailed, timestamp: Date.now() });
      res.end();
    } catch (error) {
      logger.error("Elite mockup generation error", error, { source: "mockup" });
      res.write(`event: error\ndata: ${JSON.stringify({ message: "Elite mockup generation failed", type: "system_error" })}\n\n`);
      res.end();
    }
  });

  app.post("/api/elite-mockup/refine", requireAuth, async (req: Request, res: Response) => {
    try {
      const { originalJob, refinementPrompt, originalDesignImage } = req.body;

      if (!originalJob || !refinementPrompt || !originalDesignImage) {
        return res.status(400).json({ message: "Original job, refinement prompt, and original design are required" });
      }

      const base64Data = originalDesignImage.replace(/^data:image\/\w+;base64,/, "");
      const result = await refineMockup(originalJob, refinementPrompt, base64Data);

      if (result) {
        res.json({ success: true, imageData: result.imageData, mimeType: result.mimeType });
      } else {
        res.status(500).json({ message: "Refinement failed" });
      }
    } catch (error) {
      logger.error("Elite mockup refinement error", error, { source: "mockup" });
      res.status(500).json({ message: "Refinement failed" });
    }
  });

  // ============== PRODUCT DATA ROUTES ==============
  const { getProduct, getProductSizes, getAllProducts, getProductByFrontendName } = await import("../services/knowledge");

  app.get("/api/products", async (_req: Request, res: Response) => {
    try {
      const products = getAllProducts();
      const productList = products.map(p => ({
        id: p.id,
        name: p.name,
        frontendName: p.frontendName,
        category: p.category,
        subcategory: p.subcategory,
        genderTarget: p.genderTarget,
        printMethod: p.printMethod,
        isWearable: p.isWearable,
      }));
      res.json({ products: productList });
    } catch (error) {
      logger.error("Failed to get products", error, { source: "mockup" });
      res.status(500).json({ message: "Failed to get products" });
    }
  });

  app.get("/api/products/:productId", async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const product = getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ product });
    } catch (error) {
      logger.error("Failed to get product", error, { source: "mockup" });
      res.status(500).json({ message: "Failed to get product" });
    }
  });

  app.get("/api/products/:productId/sizes", async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const sizes = getProductSizes(productId);
      if (!sizes) {
        return res.status(404).json({ message: "Product not found or no sizes available" });
      }
      res.json({ sizes });
    } catch (error) {
      logger.error("Failed to get product sizes", error, { source: "mockup" });
      res.status(500).json({ message: "Failed to get product sizes" });
    }
  });

  app.get("/api/products/lookup/:name", async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const product = getProductByFrontendName(decodeURIComponent(name));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ product });
    } catch (error) {
      logger.error("Failed to lookup product", error, { source: "mockup" });
      res.status(500).json({ message: "Failed to lookup product" });
    }
  });

  // ============== AI SEAMLESS PATTERN ROUTES ==============
  const { generateAISeamlessPattern } = await import("../services/gemini");

  app.post("/api/seamless-pattern/ai-enhanced", requireAuth, async (req: Request, res: Response) => {
    try {
      const { designImage } = req.body;

      if (!designImage || typeof designImage !== "string") {
        return res.status(400).json({ message: "Design image is required" });
      }

      const base64Match = designImage.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!base64Match) {
        return res.status(400).json({ message: "Invalid image format. Expected base64 data URL." });
      }

      const mimeType = `image/${base64Match[1]}`;
      const base64Data = base64Match[2];

      const result = await generateAISeamlessPattern(base64Data, mimeType);

      if (result) {
        res.json({
          success: true,
          patternUrl: `data:${result.mimeType};base64,${result.imageData}`,
          mimeType: result.mimeType,
          description: result.text
        });
      } else {
        res.status(500).json({ success: false, message: "Failed to generate AI-enhanced pattern. Please try again." });
      }
    } catch (error) {
      logger.error("AI seamless pattern generation error", error, { source: "mockup" });
      res.status(500).json({ success: false, message: "AI pattern generation failed" });
    }
  });
}
