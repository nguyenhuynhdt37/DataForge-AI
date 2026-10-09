import { cn } from "@/shared/lib/utils";
import { Activity, Bell, Settings } from "lucide-react";

export function TopHeader() {
  return (
    <header className="h-14 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-100">
          GreenSM <span className="text-emerald-500 font-medium">HITL MLOps</span>
        </h2>
      </div>
      <div className="flex items-center gap-4 text-zinc-400">
        <div className="flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Backend Connected
        </div>
        <button className="hover:text-zinc-100 transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <button className="hover:text-zinc-100 transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
