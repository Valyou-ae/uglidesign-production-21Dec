import { useState, useEffect, useRef } from 'react';
import { X, BookOpen, Loader2 } from 'lucide-react';

const articles = [
  { slug: 'master_overview', title: '🎬 Cinematic DNA: Overview' },
  { slug: 'deep_analysis_system', title: 'Stage 1: Deep Analysis' },
  { slug: 'gemini_optimization', title: 'Stage 7: Gemini Optimization' },
  { slug: 'agent_4_master_refiner', title: '🔮 Agent 4: Master Refiner' },
  { slug: 'volumetric_atmospheric_effects', title: 'Volumetric Atmospherics' },
  { slug: 'professional_lighting_systems', title: 'Professional Lighting' },
  { slug: 'depth_layering_system', title: 'Depth Layering' },
  { slug: 'professional_color_grading', title: 'Professional Color Grading' },
  { slug: 'material_and_surface_rendering', title: 'Material Rendering' },
  { slug: 'cinematic_composition_rules', title: 'Cinematic Composition' },
  { slug: 'cinema_camera_systems', title: 'Cinema Cameras' },
  { slug: 'artistic_styles_library_part1', title: '🎨 Styles Pt. 1: Classical-Contemporary' },
  { slug: 'artistic_styles_library_part2', title: '🎨 Styles Pt. 2: Digital & Design' },
];

const parseMarkdown = (markdown: string): React.ReactNode[] => {
  const lines = markdown.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent = '';
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-2 my-4 pl-4">
          {listItems.map((item, index) => (
            <li key={`li-${index}`} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const processLine = (line: string) => {
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    line = line.replace(/`(.*?)`/g, '<code class="bg-slate-800 text-sm rounded px-1.5 py-0.5 font-mono text-primary-400">$1</code>');
    return line;
  };

  lines.forEach((line, index) => {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (!inCodeBlock) {
        flushList();
        elements.push(
          <pre key={`pre-${index}`} className="bg-slate-950 p-4 rounded-lg my-4 overflow-x-auto text-sm border border-slate-700">
            <code>{codeBlockContent}</code>
          </pre>
        );
        codeBlockContent = '';
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent += line + '\n';
      return;
    }

    if (line.startsWith('# ')) {
      flushList();
      elements.push(<h1 key={index} className="text-3xl font-bold mt-8 mb-4 border-b border-slate-700 pb-2" dangerouslySetInnerHTML={{ __html: processLine(line.substring(2)) }} />);
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={index} className="text-2xl font-bold mt-6 mb-3" dangerouslySetInnerHTML={{ __html: processLine(line.substring(3)) }} />);
    } else if (line.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={index} className="text-xl font-semibold mt-4 mb-2 text-slate-300" dangerouslySetInnerHTML={{ __html: processLine(line.substring(4)) }} />);
    } else if (line.trim().startsWith('- ')) {
      listItems.push(processLine(line.trim().substring(2)));
    } else if (line.trim() === '---') {
      flushList();
      elements.push(<hr key={index} className="my-6 border-slate-700" />);
    } else if (line.trim() !== '') {
      flushList();
      elements.push(<p key={index} className="my-2 text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: processLine(line) }} />);
    }
  });

  flushList();
  return elements;
};

interface KnowledgeBaseModalProps {
  onClose: () => void;
}

export default function KnowledgeBaseModal({ onClose }: KnowledgeBaseModalProps) {
  const [selectedArticle, setSelectedArticle] = useState(articles[0].slug);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      setIsLoading(true);
      contentRef.current?.scrollTo(0, 0);
      try {
        const response = await fetch(`/api/knowledge-base/${selectedArticle}`);
        const data = await response.json();
        setContent(data.content || 'Error: Could not load article.');
      } catch (error) {
        console.error('Failed to fetch article:', error);
        setContent('Error: Could not load article.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticle();
  }, [selectedArticle]);

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden animate-in fade-in">
        <nav className="w-1/4 bg-slate-950 p-4 border-r border-slate-800 overflow-y-auto">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-6 text-primary-400">
            <BookOpen className="w-5 h-5" />
            Knowledge Base
          </h2>
          <ul className="space-y-1">
            {articles.map(article => (
              <li key={article.slug}>
                <button
                  onClick={() => setSelectedArticle(article.slug)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedArticle === article.slug
                      ? 'bg-primary-600 text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                >
                  {article.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main ref={contentRef} className="w-3/4 overflow-y-auto p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg z-10">
            <X className="w-6 h-6" />
          </button>

          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <article className="prose prose-invert max-w-none">
              {parseMarkdown(content)}
            </article>
          )}
        </main>
      </div>
    </div>
  );
}
