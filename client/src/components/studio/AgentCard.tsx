import { AgentStatus, AgentType } from '@shared/studioTypes';
import { Bot, Sparkles, Palette, Loader2, CheckCircle2, XCircle, SlidersHorizontal, BrainCircuit } from 'lucide-react';

interface AgentCardProps {
  type: AgentType;
  status: AgentStatus;
  message: string;
  output?: string;
}

export default function AgentCard({ type, status, message, output }: AgentCardProps) {
  const getIcon = () => {
    switch (type) {
      case AgentType.TEXT_FIXER: return <Bot className="w-6 h-6" />;
      case AgentType.STYLE_WIZARD: return <Sparkles className="w-6 h-6" />;
      case AgentType.IMAGE_CREATOR: return <Palette className="w-6 h-6" />;
      case AgentType.MASTER_REFINER: return <SlidersHorizontal className="w-6 h-6" />;
      case AgentType.QUALITY_ANALYST: return <BrainCircuit className="w-6 h-6" />;
      default: return <Bot className="w-6 h-6" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case AgentStatus.IDLE: return 'border-slate-700 bg-slate-800/50 text-slate-400';
      case AgentStatus.THINKING:
      case AgentStatus.WORKING: return 'border-primary-500 bg-primary-900/20 text-primary-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]';
      case AgentStatus.COMPLETED: return 'border-green-500 bg-green-900/20 text-green-300';
      case AgentStatus.ERROR: return 'border-red-500 bg-red-900/20 text-red-300';
      default: return 'border-slate-700';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case AgentStatus.THINKING:
      case AgentStatus.WORKING: return <Loader2 className="w-4 h-4 animate-spin" />;
      case AgentStatus.COMPLETED: return <CheckCircle2 className="w-4 h-4" />;
      case AgentStatus.ERROR: return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className={`flex flex-col p-4 rounded-xl border transition-all duration-300 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 font-semibold">
          {getIcon()}
          <span>{type}</span>
        </div>
        {getStatusIcon()}
      </div>
      <div className="text-sm opacity-80 min-h-[2.5rem]">
        {status === AgentStatus.IDLE ? 'Waiting...' : message}
      </div>
      {output && status === AgentStatus.COMPLETED && (
        <div className="mt-3 p-2 bg-black/30 rounded text-xs font-mono break-words max-h-20 overflow-y-auto border border-white/10">
          <span className="opacity-50 select-none">Output: </span>
          {output}
        </div>
      )}
    </div>
  );
}
