import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shuffle, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function RandomPrompt() {
  return (
    <div className="min-h-screen bg-background flex font-sans text-foreground overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 h-screen overflow-y-auto relative">
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto animate-fade-in">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Random Prompt Generator</h1>
            <p className="text-muted-foreground mt-2">Get inspired with AI-generated creative prompts.</p>
          </div>
          
          <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border rounded-2xl bg-card/50">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Shuffle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-6">Feeling stuck?</h2>
            
            <div className="bg-background border border-border p-6 rounded-xl shadow-sm max-w-lg w-full mb-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#ed5387] to-[#C2185B]"></div>
              <p className="text-lg font-medium leading-relaxed">
                "A futuristic city floating in the clouds, art deco style, golden hour lighting, cinematic composition, 8k resolution."
              </p>
              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-[#ed5387]" />
                <span>AI Generated</span>
              </div>
            </div>
            
            <Button size="lg" className="gap-2">
              <Shuffle className="h-4 w-4" />
              Generate Another
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
