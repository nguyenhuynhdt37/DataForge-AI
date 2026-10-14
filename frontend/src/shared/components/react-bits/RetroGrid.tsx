"use client";

import { cn } from "@/shared/lib/utils";

interface RetroGridProps extends React.HTMLAttributes<HTMLDivElement> {
  angle?: number;
}

export function RetroGrid({ className, angle = 65, ...props }: RetroGridProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute h-full w-full overflow-hidden opacity-50 [perspective:200px]",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div
          className={cn(
            "animate-grid",
            "[background-repeat:repeat] [background-size:60px_60px] [height:300vh] [inset:0%_0px] [margin-left:-50%] [transform-origin:100%_0_0] [width:600vw]",
            "[background-image:linear-gradient(to_right,rgba(16,185,129,0.15)_1px,transparent_0),linear-gradient(to_bottom,rgba(16,185,129,0.15)_1px,transparent_0)]"
          )}
          style={{ "--grid-angle": `${angle}deg` } as React.CSSProperties}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
    </div>
  );
}
