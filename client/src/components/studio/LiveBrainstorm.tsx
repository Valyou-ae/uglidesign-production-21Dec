import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Lightbulb, X, Loader2, Volume2 } from 'lucide-react';

interface LiveBrainstormProps {
  onIdeaAccepted: (idea: string) => void;
  currentPrompt: string;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export default function LiveBrainstorm({ onIdeaAccepted, currentPrompt }: LiveBrainstormProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedIdea, setGeneratedIdea] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (recognitionRef.current) {
        const finalTranscript = transcript;
        if (finalTranscript.trim()) {
          processWithAI(finalTranscript);
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript('');
    setGeneratedIdea('');
    setShowPanel(true);
  }, [transcript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const processWithAI = async (voiceInput: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceInput, currentPrompt }),
      });
      const data = await response.json();
      setGeneratedIdea(data.idea || voiceInput);
    } catch (error) {
      console.error('Brainstorm error:', error);
      setGeneratedIdea(voiceInput);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAccept = () => {
    onIdeaAccepted(generatedIdea);
    setShowPanel(false);
    setTranscript('');
    setGeneratedIdea('');
  };

  const handleClose = () => {
    setShowPanel(false);
    setTranscript('');
    setGeneratedIdea('');
  };

  if (!showPanel) {
    return (
      <button
        onClick={startListening}
        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
        title="Voice Brainstorm"
        data-testid="button-start-brainstorm"
      >
        <Mic className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="absolute top-0 right-0 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 animate-in fade-in">
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <div className="flex items-center gap-2 text-primary-400">
          <Lightbulb className="w-4 h-4" />
          <span className="text-sm font-semibold">Voice Brainstorm</span>
        </div>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-slate-700 rounded"
          data-testid="button-close-brainstorm"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4">
        {isListening && (
          <div className="flex items-center justify-center gap-3 text-red-400 mb-4">
            <Volume2 className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-medium">Listening...</span>
            <button
              onClick={stopListening}
              className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-full"
              data-testid="button-stop-listening"
            >
              <MicOff className="w-4 h-4" />
            </button>
          </div>
        )}

        {transcript && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-1">You said:</p>
            <p className="text-sm text-slate-300 italic">&quot;{transcript}&quot;</p>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center justify-center gap-2 text-primary-400 my-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Processing with AI...</span>
          </div>
        )}

        {generatedIdea && !isProcessing && (
          <div className="mt-2">
            <p className="text-xs text-slate-500 mb-1">Generated Prompt:</p>
            <p className="text-sm text-white bg-slate-900 p-3 rounded-lg border border-slate-700">
              {generatedIdea}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAccept}
                className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-500 text-sm"
                data-testid="button-accept-idea"
              >
                Use This
              </button>
              <button
                onClick={startListening}
                className="flex-1 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 text-sm"
                data-testid="button-retry-brainstorm"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {!isListening && !transcript && !generatedIdea && (
          <button
            onClick={startListening}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-500"
            data-testid="button-start-recording"
          >
            <Mic className="w-5 h-5" />
            <span>Start Speaking</span>
          </button>
        )}
      </div>
    </div>
  );
}
