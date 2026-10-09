"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { LayoutDashboard, Database, Target, PenTool, LineChart } from "lucide-react";

const ROUTES = [
  { path: "/", label: "Overview", icon: LayoutDashboard },
  { path: "/data-lab", label: "Data Lab", icon: Database },
  { path: "/active-mining", label: "Active Mining", icon: Target },
  { path: "/hitl-studio", label: "HITL Studio", icon: PenTool },
  { path: "/benchmark", label: "Benchmark", icon: LineChart },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col h-full shrink-0">
      <div className="p-6">
        <div className="h-8 w-8 rounded bg-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <Target className="w-5 h-5 text-white" />
        </div>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {ROUTES.map((route) => {
          const Icon = route.icon;
          const isActive = pathname === route.path;
          return (
            <Link
              key={route.path}
              href={route.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive 
                  ? "bg-emerald-500/10 text-emerald-500" 
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-emerald-500" : "text-zinc-500")} />
              {route.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/5 text-xs text-zinc-600">
        <p>V3.0 Final • Enterprise</p>
      </div>
    </aside>
  );
}
