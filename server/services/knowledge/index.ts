/**
 * KNOWLEDGE BASE INDEX
 * Central export for all Elite Mockup Generator knowledge modules
 */

export { BRAND_STYLES } from './brandStyles';

export { CAMERA_SPECS, getCameraSpecsForAngle } from './productAngleDetails';

export {
  TECHNICAL_FLAWS,
  AI_ARTIFACTS,
  UNWANTED_STYLES,
  APPAREL_NEGATIVES,
  HUMAN_SUBJECT_NEGATIVES,
  getNegativePrompts
} from './negativePrompts';

export {
  BODY_CONTOURS,
  CYLINDRICAL_MAPPING,
  FOLD_DISTORTION,
  VERTICAL_PERSPECTIVE,
  getContourDistortionPrompt
} from './contourDistortion';

export {
  STUDIO_LIGHTING,
  NATURAL_LIGHTING,
  getLightingSetup
} from './lightingSetups';

export {
  FABRIC_PHYSICS,
  DTG_PRINTING,
  SCREEN_PRINTING,
  SUBLIMATION_PRINTING,
  MATERIAL_PRESETS,
  getFabricPhysics,
  getPrintMethod,
  getMaterialPreset
} from './materialRealism';

export { NAMES_BY_ETHNICITY_AND_SEX, getRandomName } from './names';

export { ETHNIC_FEATURE_MAP, getEthnicFeatures } from './ethnicFeatures';

export {
  getSomaticProfile,
  getSomaticProfilePrompt
} from './somaticProfiles';

export {
  DTG_PRODUCTS,
  AOP_PRODUCTS,
  ACCESSORY_PRODUCTS,
  HOME_LIVING_PRODUCTS,
  PRODUCT_NAME_MAP,
  PRODUCT_SIZES,
  PRODUCT_COLORS,
  getProduct,
  getProductByFrontendName,
  getProductSizes,
  getDTGProducts,
  getAOPProducts,
  getAccessoryProducts,
  getHomeLivingProducts,
  getAllProducts,
  getProductsByCategory,
  getProductsBySubcategory,
  getGarmentBlueprint,
  getGarmentBlueprintPrompt,
  getProductBlueprint,
  getProductBlueprintPrompt
} from './productBlueprints';

export {
  PHOTOREALISM_CHECKLIST,
  COMMON_AI_FAILURES,
  getPhotorealismPromptAdditions,
  getAIFailureAvoidancePrompt,
  getFullHumanRealismPrompt
} from './humanRealism';

export {
  ALL_PERSONAS,
  ADULT_PERSONAS,
  TEEN_PERSONAS,
  YOUNG_ADULT_PERSONAS,
  getPersona,
  getPersonasByAgeGroup,
  getPersonasBySex,
  getPersonasByEthnicity,
  getRandomPersona
} from './unifiedPersonas';
