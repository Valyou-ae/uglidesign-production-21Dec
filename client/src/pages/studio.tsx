import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Wand2, Loader2, Download, Copy, ImageIcon, Maximize2, RefreshCw,
  X, Sparkles, Pencil, BookOpen, Keyboard, Upload, ImagePlus,
  SlidersHorizontal, Check, AlertCircle, Zap
} from 'lucide-react';
import {
  AgentStatus, AgentType, type AgentState, type GeneratedImage, type QualityLevel,
  type TextStyleIntent, type PromptAnalysis, type ImageQualityScores
} from '@shared/studioTypes';
import AgentCard from '../components/studio/AgentCard';
import KnowledgeBaseModal from '../components/studio/KnowledgeBaseModal';
import LiveBrainstorm from '../components/studio/LiveBrainstorm';
import { refineImage, REFINER_PRESETS } from '../services/studioRefinerService';
import { qualityLearning } from '../services/studioQualityLearning';

type GenerationStage = 'idle' | 'preview' | 'final';

const STYLE_PRESETS = {
  auto: { name: 'Auto', keywords: '', guidance: '', isPhotorealistic: true },
  photorealistic: { name: 'Photorealistic', keywords: 'hyperrealistic, 8K UHD, DSLR quality, natural lighting, shallow depth of field, shot on Canon EOS R5, 85mm lens, professional photography', guidance: 'Focus on real-world physics, accurate shadows, skin texture, fabric weave, environmental reflections', isPhotorealistic: true },
  cinematic: { name: 'Cinematic', keywords: 'cinematic lighting, anamorphic lens flare, film grain, color graded, dramatic shadows, volumetric fog, movie still, directed by Roger Deakins', guidance: 'Use three-point lighting, create mood through color temperature, add atmospheric depth', isPhotorealistic: true },
  anime: { name: 'Anime/Manga', keywords: 'anime style, cel shaded, vibrant colors, clean lineart, Studio Ghibli inspired, expressive eyes, dynamic pose, Japanese animation', guidance: 'Emphasize stylized proportions, bold outlines, flat color areas with subtle gradients', isPhotorealistic: false },
  oilPainting: { name: 'Oil Painting', keywords: 'oil painting, visible brushstrokes, impasto technique, Renaissance lighting, rich pigments, canvas texture, museum quality, classical masters', guidance: 'Emulate classical masters, use chiaroscuro, blend colors at edges', isPhotorealistic: false },
  watercolor: { name: 'Watercolor', keywords: 'watercolor painting, soft edges, color bleeding, paper texture, transparent washes, spontaneous splashes, delicate, artistic', guidance: 'Preserve white of paper for highlights, allow colors to flow naturally', isPhotorealistic: false },
  digitalArt: { name: 'Digital Art', keywords: 'digital illustration, trending on ArtStation, concept art, highly detailed, vibrant palette, matte painting, professional digital artwork', guidance: 'Blend painterly and precise, focus on dynamic composition and rich detail', isPhotorealistic: false },
  minimalist: { name: 'Minimalist', keywords: 'minimalist design, clean lines, negative space, limited color palette, geometric shapes, modern aesthetic, simple, elegant', guidance: 'Remove all unnecessary elements, focus on essential forms and balance', isPhotorealistic: false },
  retrowave: { name: 'Retrowave/Synthwave', keywords: 'synthwave, neon lights, 80s aesthetic, chrome reflections, grid patterns, sunset gradients, cyberpunk, vaporwave, retro futurism', guidance: 'Combine nostalgia with futuristic elements, heavy use of pink/purple/cyan neon', isPhotorealistic: false },
  darkFantasy: { name: 'Dark Fantasy', keywords: 'dark fantasy, gothic atmosphere, dramatic lighting, muted desaturated colors, mysterious fog, ancient ruins, ominous, epic', guidance: 'Create ominous mood, use deep shadows and selective highlights', isPhotorealistic: false },
  popArt: { name: 'Pop Art', keywords: 'pop art style, bold primary colors, Ben-Day dots, thick black outlines, Andy Warhol inspired, Roy Lichtenstein, comic book style', guidance: 'Use flat colors, comic book aesthetic, high contrast', isPhotorealistic: false },
  isometric: { name: 'Isometric 3D', keywords: 'isometric view, 3D render, clean geometry, soft shadows, pastel colors, miniature scene, tilt-shift effect, low poly, cute', guidance: 'Maintain 30-degree angle, consistent lighting, toy-like quality', isPhotorealistic: false },
  pencilSketch: { name: 'Pencil Sketch', keywords: 'pencil sketch, graphite drawing, crosshatching, paper texture, loose strokes, artistic study, hand-drawn, monochrome', guidance: 'Show construction lines, vary line weight, focus on form over color', isPhotorealistic: false }
};

const QUALITY_PRESETS = {
  draft: { name: 'Draft', icon: '⚡️', description: 'Fast preview, good for iteration', thinkingBudget: 512, qualityBooster: 'good quality', modelNote: 'Quick generation' },
  standard: { name: 'Standard', icon: '✨', description: 'Balanced quality and speed', thinkingBudget: 1024, qualityBooster: 'high quality, detailed', modelNote: 'Recommended' },
  premium: { name: 'Premium', icon: '💎', description: 'Higher detail, slower generation', thinkingBudget: 4096, qualityBooster: 'ultra high quality, extremely detailed, professional', modelNote: 'Premium' },
  ultra: { name: 'Ultra', icon: '🔮', description: 'Maximum quality, longest generation', thinkingBudget: 8192, qualityBooster: 'photorealistic, ultra HD, masterpiece, premium quality', modelNote: 'Ultra' }
};

const ASPECT_RATIOS: Record<string, { value: string; label: string }> = {
  square: { value: '1:1', label: 'Square' },
  portrait: { value: '3:4', label: 'Portrait' },
  landscape: { value: '4:3', label: 'Landscape' },
  widescreen: { value: '16:9', label: 'Widescreen' },
  tall: { value: '9:16', label: 'Tall' }
};

const TEXT_STYLE_INTENTS: { key: TextStyleIntent; label: string; description: string }[] = [
  { key: 'integrated', label: 'Integrated', description: 'Text woven into the scene' },
  { key: 'subtle', label: 'Subtle', description: 'Discreet, like a watermark' },
  { key: 'bold', label: 'Bold', description: 'Dominant, focal point text' },
  { key: 'cinematic', label: 'Cinematic', description: 'Professional title overlay' }
];

const createInitialAgentStates = (): AgentState[] => [
  { type: AgentType.TEXT_FIXER, status: AgentStatus.IDLE, message: '' },
  { type: AgentType.STYLE_WIZARD, status: AgentStatus.IDLE, message: '' },
  { type: AgentType.IMAGE_CREATOR, status: AgentStatus.IDLE, message: '' },
  { type: AgentType.MASTER_REFINER, status: AgentStatus.IDLE, message: '' }
];

export default function StudioPage() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVariations, setGeneratedVariations] = useState<GeneratedImage[]>([]);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);
  const [generationStage, setGenerationStage] = useState<GenerationStage>('idle');
  const [generationMessage, setGenerationMessage] = useState('');

  const [selectedStyle, setSelectedStyle] = useState<keyof typeof STYLE_PRESETS>('auto');
  const [selectedQuality, setSelectedQuality] = useState<QualityLevel>('standard');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<keyof typeof ASPECT_RATIOS>('square');
  const [numberOfVariations, setNumberOfVariations] = useState<1 | 2 | 4>(4);
  const [negativePrompt, setNegativePrompt] = useState('');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enableRefiner, setEnableRefiner] = useState(false);
  const [refinerPreset, setRefinerPreset] = useState<keyof typeof REFINER_PRESETS>('cinematic');
  const [useCuratedSelection, setUseCuratedSelection] = useState(false);
  const [processText, setProcessText] = useState(true);
  const [textStyleIntent, setTextStyleIntent] = useState<TextStyleIntent>('integrated');

  const [referenceImage, setReferenceImage] = useState<{ base64Data: string; mimeType: string } | null>(null);
  const [focusedDraft, setFocusedDraft] = useState<GeneratedImage | null>(null);
  const [iterativeEditPrompt, setIterativeEditPrompt] = useState('');
  const [isIterating, setIsIterating] = useState(false);

  const [agentStates, setAgentStates] = useState<AgentState[]>(createInitialAgentStates());
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showEnhanceModal, setShowEnhanceModal] = useState<{ image: GeneratedImage } | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [draftProgress, setDraftProgress] = useState<{ count: number; total: number } | null>(null);

  const remixInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const updateAgentState = (type: AgentType, status: AgentStatus, message: string, output?: string) => {
    setAgentStates(prev => prev.map(a => a.type === type ? { ...a, status, message, output } : a));
  };

  const resetAgentStates = () => setAgentStates(createInitialAgentStates());

  const handleGenerate = useCallback(async () => {
    if (!prompt || isGenerating) return;

    setIsGenerating(true);
    setGeneratedVariations([]);
    setSelectedVariationIndex(0);
    setGenerationStage('preview');
    setDraftProgress({ count: 0, total: numberOfVariations });
    resetAgentStates();

    try {
      updateAgentState(AgentType.TEXT_FIXER, AgentStatus.WORKING, 'Analyzing prompt for text elements...');

      const analysisRes = await fetch('/api/deep-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, processText })
      });
      const analysisData = await analysisRes.json();
      const analysis: PromptAnalysis = analysisData.analysis || {
        subject: { primary: 'unknown', secondary: [] },
        mood: { primary: 'neutral', secondary: [] },
        lighting: { scenario: 'natural' },
        environment: { type: 'studio', details: '' },
        style_intent: 'auto'
      };
      const detectedText = analysisData.detectedText || [];

      updateAgentState(AgentType.TEXT_FIXER, AgentStatus.COMPLETED, 'Text analysis complete', detectedText.length > 0 ? `Detected: ${detectedText.map((t: { text: string }) => t.text).join(', ')}` : 'No text detected');
      updateAgentState(AgentType.STYLE_WIZARD, AgentStatus.WORKING, 'Crafting cinematic master prompt...');

      const enhanceRes = await fetch('/api/generate-image-advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style: selectedStyle,
          quality: 'draft',
          aspectRatio: ASPECT_RATIOS[selectedAspectRatio].value,
          negativePrompt,
          numberOfVariations,
          useCuratedSelection: false,
          processText,
          textStyleIntent,
          referenceImage,
          analysis,
          detectedText,
          enableRefiner: false
        })
      });

      updateAgentState(AgentType.STYLE_WIZARD, AgentStatus.COMPLETED, 'Master prompt crafted');
      updateAgentState(AgentType.IMAGE_CREATOR, AgentStatus.WORKING, 'Generating draft variations...');

      const enhanceData = await enhanceRes.json();

      if (enhanceData.error) {
        throw new Error(enhanceData.error);
      }

      const images: GeneratedImage[] = enhanceData.images || [];
      setGeneratedVariations(images);
      setDraftProgress({ count: images.length, total: numberOfVariations });

      updateAgentState(AgentType.IMAGE_CREATOR, AgentStatus.COMPLETED, `Generated ${images.length} drafts`);

    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showNotification(errorMessage, 'error');
      updateAgentState(AgentType.IMAGE_CREATOR, AgentStatus.ERROR, errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isGenerating, selectedStyle, selectedAspectRatio, negativePrompt, numberOfVariations, processText, textStyleIntent, referenceImage]);

  const handleExecuteEnhance = async (image: GeneratedImage, quality: QualityLevel) => {
    setShowEnhanceModal(null);
    setIsGenerating(true);
    setGenerationStage('final');
    setGenerationMessage('Enhancing to final quality...');
    resetAgentStates();

    try {
      updateAgentState(AgentType.STYLE_WIZARD, AgentStatus.WORKING, `Applying ${quality} quality enhancement...`);

      const enhanceRes = await fetch('/api/draft-to-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftPrompt: image.prompt,
          quality,
          style: selectedStyle,
          aspectRatio: ASPECT_RATIOS[selectedAspectRatio].value,
          negativePrompt,
          referenceImage,
          textStyleIntent
        })
      });

      const enhanceData = await enhanceRes.json();

      if (enhanceData.error) {
        throw new Error(enhanceData.error);
      }

      updateAgentState(AgentType.STYLE_WIZARD, AgentStatus.COMPLETED, 'Enhancement complete');

      if (enableRefiner && enhanceData.images?.[0]?.base64Data) {
        updateAgentState(AgentType.MASTER_REFINER, AgentStatus.WORKING, 'Applying post-processing...');

        const refinedBase64 = await refineImage(enhanceData.images[0].base64Data, { preset: refinerPreset });
        enhanceData.images[0].base64Data = refinedBase64;
        enhanceData.images[0].url = `data:image/png;base64,${refinedBase64}`;

        updateAgentState(AgentType.MASTER_REFINER, AgentStatus.COMPLETED, 'Post-processing complete');
      }

      const finalImages: GeneratedImage[] = enhanceData.images || [];
      setGeneratedVariations(finalImages);
      setSelectedVariationIndex(0);
      setFocusedDraft(null);

    } catch (error) {
      console.error('Enhancement error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Enhancement failed';
      showNotification(errorMessage, 'error');
    } finally {
      setIsGenerating(false);
      setGenerationMessage('');
    }
  };

  const handleUpdateDraft = async () => {
    if (!focusedDraft || !iterativeEditPrompt || isIterating) return;

    setIsIterating(true);
    try {
      const editRes = await fetch('/api/iterative-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrompt: focusedDraft.prompt,
          editInstruction: iterativeEditPrompt,
          textStyleIntent,
          referenceImage: focusedDraft.base64Data ? { base64Data: focusedDraft.base64Data, mimeType: focusedDraft.mimeType || 'image/png' } : null,
          aspectRatio: ASPECT_RATIOS[selectedAspectRatio].value
        })
      });

      const editData = await editRes.json();

      if (editData.error) {
        throw new Error(editData.error);
      }

      if (editData.images?.[0]) {
        const newDraft = editData.images[0];
        setFocusedDraft(newDraft);

        setGeneratedVariations(prev =>
          prev.map(v => v.url === focusedDraft.url ? newDraft : v)
        );
      }

      setIterativeEditPrompt('');

    } catch (error) {
      console.error('Edit error:', error);
      showNotification(error instanceof Error ? error.message : 'Edit failed', 'error');
    } finally {
      setIsIterating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'remix' | 'reference') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const mimeType = file.type;

      if (type === 'reference') {
        setReferenceImage({ base64Data: base64, mimeType });
        showNotification('Reference image loaded', 'success');
      } else {
        try {
          const analyzeRes = await fetch('/api/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Image: base64, mimeType })
          });
          const analyzeData = await analyzeRes.json();
          if (analyzeData.prompt) {
            setPrompt(analyzeData.prompt);
            showNotification('Image analyzed! Prompt generated.', 'success');
          }
        } catch (error) {
          console.error('Analyze error:', error);
          showNotification('Failed to analyze image', 'error');
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const downloadImage = (image: GeneratedImage, format: 'png' | 'jpeg' | 'webp') => {
    const link = document.createElement('a');
    const base64 = image.base64Data || image.url.split(',')[1];
    link.href = `data:image/${format};base64,${base64}`;
    link.download = `studio-image-${Date.now()}.${format}`;
    link.click();
    showNotification(`Downloaded as ${format.toUpperCase()}`, 'success');
  };

  const copyImageToClipboard = async () => {
    const currentImage = generatedVariations[selectedVariationIndex];
    if (!currentImage) return;

    try {
      const base64 = currentImage.base64Data || currentImage.url.split(',')[1];
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/png' });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showNotification('Image copied to clipboard', 'success');
    } catch (error) {
      console.error('Copy error:', error);
      showNotification('Failed to copy image', 'error');
    }
  };

  const handleRating = (rating: number) => {
    setUserRating(rating);
    const currentImage = generatedVariations[selectedVariationIndex];
    if (currentImage) {
      qualityLearning.trackGeneration(
        currentImage.prompt,
        rating,
        currentImage.scores?.overall || 0,
        {
          analysis: { subject: { primary: '', secondary: [] }, mood: { primary: '', secondary: [] }, lighting: { scenario: '' }, environment: { type: '', details: '' }, style_intent: '' },
          selectedStyle,
          selectedQuality,
          refinerPreset,
          enableRefiner,
          useCuratedSelection
        }
      );
      showNotification(`Rated ${rating} stars - Thanks for your feedback!`, 'success');
    }
  };

  const selectVariation = (index: number) => {
    if (index >= 0 && index < generatedVariations.length) {
      setSelectedVariationIndex(index);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        if (isZoomed) setIsZoomed(false);
        else if (focusedDraft) setFocusedDraft(null);
        else if (showKnowledgeBase) setShowKnowledgeBase(false);
        else if (showKeyboardShortcuts) setShowKeyboardShortcuts(false);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowKeyboardShortcuts(s => !s);
      }

      if (generatedVariations.length > 1 && generationStage === 'final') {
        if (e.key === 'ArrowLeft') selectVariation(selectedVariationIndex - 1);
        else if (e.key === 'ArrowRight') selectVariation(selectedVariationIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomed, focusedDraft, showKnowledgeBase, showKeyboardShortcuts, generatedVariations, selectedVariationIndex, generationStage, handleGenerate]);

  const currentImage = generatedVariations[selectedVariationIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-7xl mx-auto flex flex-col">
      {(activeDropdown || showDownloadMenu) && <div className="fixed inset-0 z-10" onClick={() => { setActiveDropdown(null); setShowDownloadMenu(false); }} />}

      {notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in ${notification.type === 'success' ? 'bg-green-600' : notification.type === 'error' ? 'bg-red-600' : 'bg-slate-700'} text-white`}>
          {notification.type === 'success' ? <Check className="w-5 h-5" /> : notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {showKnowledgeBase && <KnowledgeBaseModal onClose={() => setShowKnowledgeBase(false)} />}

      {showKeyboardShortcuts && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowKeyboardShortcuts(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-md w-full animate-in fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Keyboard className="w-6 h-6 text-primary-400" />
                Keyboard Shortcuts
              </h2>
              <button onClick={() => setShowKeyboardShortcuts(false)} className="p-2 -mr-2 hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Generate</span><kbd className="px-2 py-1 bg-slate-800 rounded">Cmd/Ctrl + Enter</kbd></div>
              <div className="flex justify-between"><span className="text-slate-400">Close modal</span><kbd className="px-2 py-1 bg-slate-800 rounded">Escape</kbd></div>
              <div className="flex justify-between"><span className="text-slate-400">Next variation</span><kbd className="px-2 py-1 bg-slate-800 rounded">Arrow Right</kbd></div>
              <div className="flex justify-between"><span className="text-slate-400">Previous variation</span><kbd className="px-2 py-1 bg-slate-800 rounded">Arrow Left</kbd></div>
              <div className="flex justify-between"><span className="text-slate-400">Show shortcuts</span><kbd className="px-2 py-1 bg-slate-800 rounded">?</kbd></div>
            </div>
          </div>
        </div>
      )}

      {showEnhanceModal && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowEnhanceModal(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Select Final Quality</h2>
            <p className="text-slate-400 mb-6">Higher quality takes longer to generate.</p>
            <div className="space-y-3">
              {Object.entries(QUALITY_PRESETS).filter(([k]) => k !== 'draft').map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handleExecuteEnhance(showEnhanceModal.image, key as QualityLevel)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
                  data-testid={`button-quality-${key}`}
                >
                  <span className="text-2xl">{preset.icon}</span>
                  <div className="text-left">
                    <p className="font-semibold text-white">{preset.name}</p>
                    <p className="text-sm text-slate-400">{preset.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowEnhanceModal(null)} className="w-full mt-6 text-center py-2 text-slate-400 hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {focusedDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8 animate-in fade-in" onClick={() => setFocusedDraft(null)}>
          <div className="relative flex flex-col gap-4 w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setFocusedDraft(null)} className="absolute -top-4 -right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full z-50">
              <X className="w-6 h-6" />
            </button>

            <div className="relative w-full rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10 aspect-square">
              {isIterating && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
              <img src={focusedDraft.url} alt="Focused draft" className="w-full h-full object-cover" />
            </div>

            <div className="flex flex-col gap-4 w-full">
              {iterativeEditPrompt.toLowerCase().includes('text') && (
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-700">
                  <label className="text-xs font-semibold text-slate-400 mb-2 block">Text Style Intent</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {TEXT_STYLE_INTENTS.map(intent => (
                      <button
                        key={intent.key}
                        onClick={() => setTextStyleIntent(intent.key)}
                        title={intent.description}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${textStyleIntent === intent.key ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        data-testid={`button-intent-${intent.key}`}
                      >
                        {intent.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative">
                <textarea
                  value={iterativeEditPrompt}
                  onChange={(e) => setIterativeEditPrompt(e.target.value)}
                  placeholder="Describe your changes... e.g., 'change the background to sunset'"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 pr-28 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary-500 outline-none resize-none h-14"
                  data-testid="input-iterative-edit"
                />
                <button
                  onClick={handleUpdateDraft}
                  disabled={isIterating || !iterativeEditPrompt}
                  className="absolute top-1/2 right-3 -translate-y-1/2 px-4 py-2 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-500 disabled:opacity-50 flex items-center gap-2 text-sm"
                  data-testid="button-update-draft"
                >
                  <RefreshCw className={`w-4 h-4 ${isIterating ? 'animate-spin' : ''}`} />
                  Update
                </button>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => { downloadImage(focusedDraft, 'png'); showNotification('Draft downloaded', 'success'); }}
                  disabled={isIterating || isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold bg-slate-700 text-white hover:bg-slate-600 active:scale-95 disabled:bg-slate-800 disabled:text-slate-500 transition-colors"
                  title="Download this draft image"
                  data-testid="button-download-draft"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Draft</span>
                </button>
                <button
                  onClick={() => setShowEnhanceModal({ image: focusedDraft })}
                  disabled={isIterating || isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-500 active:scale-95 disabled:bg-slate-800 disabled:text-slate-500 transition-colors"
                  data-testid="button-enhance"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Enhance</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isZoomed && currentImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in">
          <button onClick={() => setIsZoomed(false)} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full z-50">
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full h-full flex items-center justify-center" onClick={() => setIsZoomed(false)}>
            <img src={currentImage.url} alt="Full size" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
            <div className="absolute bottom-8 flex gap-4" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowEnhanceModal({ image: currentImage })} className="flex items-center gap-2 px-6 py-3 bg-slate-200 text-slate-900 rounded-full font-bold hover:bg-white shadow-lg">
                <Sparkles className="w-5 h-5" />
                <span>Enhance</span>
              </button>
              <button onClick={() => downloadImage(currentImage, 'png')} className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-200 shadow-lg">
                <Download className="w-5 h-5" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="mb-8 flex items-center gap-3 border-b border-slate-800 pb-6">
        <div className="p-3 bg-primary-600 rounded-lg shadow-lg shadow-primary-500/20">
          <Wand2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Studio Image Generator</h1>
          <p className="text-slate-400 text-sm">Multi-Agent Cinematic Image Pipeline</p>
        </div>
      </header>

      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button onClick={() => setShowKnowledgeBase(true)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700" title="Knowledge Base" data-testid="button-knowledge-base">
          <BookOpen className="w-5 h-5" />
        </button>
        <button onClick={() => setShowKeyboardShortcuts(true)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700" title="Keyboard Shortcuts (?)" data-testid="button-shortcuts">
          <Keyboard className="w-5 h-5" />
        </button>
      </div>

      <main className="flex-1 flex flex-col gap-8">
        <div className="grid md:grid-cols-4 gap-3">
          {agentStates.map((agent) => (
            <AgentCard key={agent.type} {...agent} />
          ))}
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl z-20">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your imagination..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 pr-12 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary-500 outline-none resize-none h-24"
              data-testid="input-prompt"
            />
            <div className="absolute top-3 right-3">
              <LiveBrainstorm onIdeaAccepted={setPrompt} currentPrompt={prompt} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input type="file" ref={remixInputRef} onChange={(e) => handleFileUpload(e, 'remix')} className="hidden" accept="image/*" />
              <button onClick={() => remixInputRef.current?.click()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-slate-800" title="Upload image to analyze" data-testid="button-remix">
                <Upload className="w-4 h-4" />
                <span>Remix</span>
              </button>
              <input type="file" ref={referenceInputRef} onChange={(e) => handleFileUpload(e, 'reference')} className="hidden" accept="image/*" />
              <button
                onClick={() => referenceInputRef.current?.click()}
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${referenceImage ? 'text-primary-400 bg-primary-900/20 border-primary-500/50' : 'text-slate-400 hover:text-white hover:bg-slate-800 border-transparent'}`}
                title="Use image as visual reference"
                data-testid="button-reference"
              >
                <ImagePlus className="w-4 h-4" />
                <span>Reference</span>
              </button>
              {referenceImage && (
                <button onClick={() => setReferenceImage(null)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800" data-testid="button-clear-reference">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowAdvanced(s => !s)}
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${showAdvanced ? 'bg-slate-700 text-white border-slate-600' : 'text-slate-400 hover:text-white hover:bg-slate-800 border-transparent'}`}
                title="Advanced Settings"
                data-testid="button-advanced"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'style' ? null : 'style')}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg"
                  data-testid="dropdown-style"
                >
                  <span>{STYLE_PRESETS[selectedStyle].name}</span>
                </button>
                {activeDropdown === 'style' && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-30 max-h-64 overflow-y-auto">
                    {Object.entries(STYLE_PRESETS).map(([key, preset]) => (
                      <button
                        key={key}
                        onClick={() => { setSelectedStyle(key as keyof typeof STYLE_PRESETS); setActiveDropdown(null); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 ${selectedStyle === key ? 'bg-primary-600 text-white' : ''}`}
                        data-testid={`option-style-${key}`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'aspect' ? null : 'aspect')}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg"
                  data-testid="dropdown-aspect"
                >
                  <span>{ASPECT_RATIOS[selectedAspectRatio].label}</span>
                </button>
                {activeDropdown === 'aspect' && (
                  <div className="absolute top-full left-0 mt-2 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-30">
                    {Object.entries(ASPECT_RATIOS).map(([key, preset]) => (
                      <button
                        key={key}
                        onClick={() => { setSelectedAspectRatio(key as keyof typeof ASPECT_RATIOS); setActiveDropdown(null); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 ${selectedAspectRatio === key ? 'bg-primary-600 text-white' : ''}`}
                        data-testid={`option-aspect-${key}`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'variations' ? null : 'variations')}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg"
                  data-testid="dropdown-variations"
                >
                  <span>{numberOfVariations} Drafts</span>
                </button>
                {activeDropdown === 'variations' && (
                  <div className="absolute top-full left-0 mt-2 w-28 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-30">
                    {([1, 2, 4] as const).map((num) => (
                      <button
                        key={num}
                        onClick={() => { setNumberOfVariations(num); setActiveDropdown(null); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 ${numberOfVariations === num ? 'bg-primary-600 text-white' : ''}`}
                        data-testid={`option-variations-${num}`}
                      >
                        {num} Draft{num > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={!prompt || isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed bg-primary-600 text-white hover:bg-primary-500 active:scale-95"
                data-testid="button-generate"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                <span>{generationStage === 'preview' ? 'New Drafts' : 'Generate'}</span>
              </button>
            </div>
          </div>

          {showAdvanced && (
            <div className="mt-4 space-y-4 animate-in fade-in p-4 bg-slate-850 rounded-xl border border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">Negative Prompt</label>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Things to avoid: blurry, distorted, low quality..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary-500 outline-none"
                  data-testid="input-negative-prompt"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex flex-col cursor-pointer">
                  <span className="text-sm font-medium text-slate-200">Enable Master Refiner</span>
                  <span className="text-xs text-slate-500">Apply cinematic post-processing.</span>
                </label>
                <button
                  type="button"
                  onClick={() => setEnableRefiner(!enableRefiner)}
                  className={`${enableRefiner ? 'bg-primary-600' : 'bg-slate-700'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors`}
                  role="switch"
                  aria-checked={enableRefiner}
                  data-testid="toggle-refiner"
                >
                  <span className={`${enableRefiner ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition`} />
                </button>
              </div>

              {enableRefiner && (
                <div className="pl-4 border-l-2 border-primary-600">
                  <label className="text-xs font-semibold text-slate-400 mb-2 block">Refiner Preset</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(REFINER_PRESETS).map(([key, preset]) => (
                      <button
                        key={key}
                        onClick={() => setRefinerPreset(key as keyof typeof REFINER_PRESETS)}
                        className={`px-3 py-2 text-sm rounded-lg transition ${refinerPreset === key ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        data-testid={`button-refiner-${key}`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex flex-col cursor-pointer">
                  <span className="text-sm font-medium text-slate-200">Use AI Curation</span>
                  <span className="text-xs text-slate-500">Generate a larger batch and select the best results. Slower.</span>
                </label>
                <button
                  type="button"
                  onClick={() => setUseCuratedSelection(!useCuratedSelection)}
                  className={`${useCuratedSelection ? 'bg-primary-600' : 'bg-slate-700'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors`}
                  role="switch"
                  aria-checked={useCuratedSelection}
                  data-testid="toggle-curation"
                >
                  <span className={`${useCuratedSelection ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex flex-col cursor-pointer">
                  <span className="text-sm font-medium text-slate-200">Process Text in Prompt</span>
                  <span className="text-xs text-slate-500">Allow AI to detect and render text. Turn off to prevent errors.</span>
                </label>
                <button
                  type="button"
                  onClick={() => setProcessText(!processText)}
                  className={`${processText ? 'bg-primary-600' : 'bg-slate-700'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors`}
                  role="switch"
                  aria-checked={processText}
                  data-testid="toggle-text-processing"
                >
                  <span className={`${processText ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition`} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm z-10">
            <h2 className="font-semibold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary-400" />
              Canvas
            </h2>
            {generationStage === 'final' && currentImage && (
              <div className="flex gap-2 relative">
                <button onClick={() => setIsZoomed(true)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300" title="Zoom View" data-testid="button-zoom">
                  <Maximize2 className="w-5 h-5" />
                </button>
                <button onClick={copyImageToClipboard} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300" title="Copy Image" data-testid="button-copy">
                  <Copy className="w-5 h-5" />
                </button>
                <button onClick={() => setShowDownloadMenu(s => !s)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300" title="Download Image" data-testid="button-download-menu">
                  <Download className="w-5 h-5" />
                </button>
                {showDownloadMenu && (
                  <div className="absolute top-full right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-20 animate-in fade-in">
                    <button onClick={() => { downloadImage(currentImage, 'png'); setShowDownloadMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700 rounded-t-lg" data-testid="button-download-png">Save as PNG</button>
                    <button onClick={() => { downloadImage(currentImage, 'jpeg'); setShowDownloadMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700" data-testid="button-download-jpeg">Save as JPEG</button>
                    <button onClick={() => { downloadImage(currentImage, 'webp'); setShowDownloadMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700 rounded-b-lg" data-testid="button-download-webp">Save as WEBP</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-slate-950 flex flex-col items-center justify-center p-8 gap-4">
            {isGenerating && generatedVariations.length === 0 && generationStage !== 'preview' ? (
              <div className="text-center text-slate-400 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="font-semibold text-lg">{generationMessage || 'Generating...'}</p>
              </div>
            ) : generatedVariations.length === 0 && !isGenerating ? (
              <div className="text-center text-slate-600">
                <div className="w-24 h-24 border-4 border-slate-800 border-dashed rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 opacity-50" />
                </div>
                <p>Your imagination, visualized.</p>
              </div>
            ) : generationStage === 'preview' && !focusedDraft ? (
              <div className="text-center w-full">
                <div className={`grid gap-4 max-w-xl mx-auto ${numberOfVariations === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {generatedVariations.map((variation, index) => (
                    <div key={variation.url} onClick={() => setFocusedDraft(variation)} className="relative group aspect-square rounded-lg bg-slate-800 cursor-pointer overflow-hidden" data-testid={`card-draft-${index}`}>
                      <img src={variation.url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="text-white font-semibold flex items-center gap-2">
                          <Pencil className="w-4 h-4" />
                          <span>Edit & Enhance</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadImage(variation, 'png'); showNotification('Draft downloaded', 'success'); }}
                          className="absolute bottom-3 right-3 p-2 bg-slate-700/80 text-white rounded-full hover:bg-slate-600 transition"
                          title="Download Draft"
                          data-testid={`button-download-draft-${index}`}
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, numberOfVariations - generatedVariations.length) }).map((_, index) => (
                    <div key={`placeholder-${index}`} className="aspect-square bg-slate-800 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
                    </div>
                  ))}
                </div>
                {isGenerating && draftProgress && draftProgress.count < draftProgress.total && (
                  <p className="text-sm text-slate-400 mt-4">{generationMessage || `Generating draft ${draftProgress.count + 1} of ${draftProgress.total}...`}</p>
                )}
                {generatedVariations.length > 0 && <p className="text-xs text-slate-500 mt-4">Choose a preview to start editing or download.</p>}
              </div>
            ) : currentImage && (
              <>
                <div className={`relative w-full max-w-xl rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10 ${ASPECT_RATIOS[selectedAspectRatio].label === 'Portrait' || ASPECT_RATIOS[selectedAspectRatio].label === 'Tall' ? 'aspect-[9/16] max-w-sm' : 'aspect-square'}`}>
                  <img src={currentImage.url} alt="Generated Content" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col items-center gap-2 text-slate-400 mt-4">
                  <p className="text-sm">Rate this result:</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => handleRating(star)}
                        className={`p-1.5 rounded-full transition-all ${star <= userRating ? 'text-yellow-400 scale-110' : 'text-slate-600 hover:text-yellow-500 hover:scale-110'}`}
                        data-testid={`button-rate-${star}`}
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
                {generatedVariations.length > 1 && (
                  <div className="flex gap-2 mt-2">
                    {generatedVariations.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => selectVariation(index)}
                        className={`w-3 h-3 rounded-full transition-all ${selectedVariationIndex === index ? 'bg-primary-500 scale-125' : 'bg-slate-600 hover:bg-slate-500'}`}
                        data-testid={`button-variation-${index}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
