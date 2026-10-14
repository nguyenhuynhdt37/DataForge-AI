import React from 'react';

interface MetadataTagBadgeProps {
  tag: string;
}

export const MetadataTagBadge: React.FC<MetadataTagBadgeProps> = ({ tag }) => {
  const getTagStyle = (t: string) => {
    const lower = t.toLowerCase();
    if (lower.includes('rain') || lower.includes('mưa')) {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
    if (lower.includes('night') || lower.includes('đêm')) {
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
    if (lower.includes('hard') || lower.includes('khó') || lower.includes('uncertain')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
    if (lower.includes('fog') || lower.includes('sương')) {
      return 'bg-zinc-700/30 text-zinc-300 border-zinc-600/30';
    }
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono border ${getTagStyle(tag)}`}>
      #{tag}
    </span>
  );
};
