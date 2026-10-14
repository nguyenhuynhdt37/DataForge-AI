"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronLeft, 
  Save, 
  MessageSquare, 
  Maximize2, 
  CheckCircle2, 
  X,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { useHitlStore } from '../store/hitlStore';
import { useStudioHotkeys } from '../hooks/useStudioHotkeys';
import { LabelToolbar } from './LabelToolbar';
import { ConsensusBadge } from './ConsensusBadge';
import { HotkeyLegend } from './HotkeyLegend';
import { BoxPropertySidebar } from './BoxPropertySidebar';
import { GuidelineChat } from './GuidelineChat';
import { CanvasEngine } from './CanvasEngine';
import { hitlApi } from '../services/hitlApi';
import { HitlFrameTask, BoundingBox } from '../types';
import { AppHeader } from '@/shared/components/layout';

const INITIAL_TASK: HitlFrameTask = {
  id: 'TASK-VF8-BATCH04-42',
  batchId: 'BATCH-04',
  frameIndex: 42,
  totalFrames: 50,
  imageUrl: '/samples/vf8-sample.jpg',
  iouScore: 0.88,
  isAutoVerified: true,
  boxes: [
    {
      id: 'box-01',
      label: 'car',
      x: 180,
      y: 120,
      width: 240,
      height: 180,
      confidence: 0.94,
      isAutoAnnotated: true,
    },
    {
      id: 'box-02',
      label: 'motorbike',
      x: 460,
      y: 200,
      width: 90,
      height: 140,
      confidence: 0.78,
      isAutoAnnotated: true,
    },
    {
      id: 'box-03',
      label: 'traffic_sign',
      x: 620,
      y: 80,
      width: 50,
      height: 60,
      confidence: 0.89,
      isAutoAnnotated: true,
    },
  ],
};

export const HitlStudioPageView: React.FC = () => {
  const {
    currentTask,
    setCurrentTask,
    boxes,
    addBox,
    deleteBox,
    updateBoxLabel,
    selectedBoxId,
    setSelectedBoxId,
    activeTool,
    setActiveTool,
    activeClass,
    setActiveClass,
    isChatOpen,
    toggleChat,
    historyIndex,
    history,
    undo,
    redo,
  } = useHitlStore();

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTask(INITIAL_TASK);
  }, [setCurrentTask]);

  const handleSaveAndNext = useCallback(async () => {
    setIsSaving(true);
    try {
      const taskId = currentTask?.id || 'TASK-42';
      await hitlApi.saveAnnotation({
        taskId,
        batchId: currentTask?.batchId || 'BATCH-04',
        boxes,
      });
      setToastMessage(`Đã lưu gán nhãn thành công cho khung hình ${currentTask?.frameIndex || 42}/${currentTask?.totalFrames || 50}!`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setToastMessage(`Đã lưu cục bộ khung hình ${currentTask?.frameIndex || 42}/${currentTask?.totalFrames || 50} (Offline mode).`);
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsSaving(false);
    }
  }, [boxes, currentTask]);

  // Kích hoạt lắng nghe Hotkeys
  useStudioHotkeys({
    onSaveAndNext: handleSaveAndNext,
  });

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col relative overflow-hidden font-sans select-none">
      
      {/* 3-Zone Compact Dark Minimalist AppHeader */}
      <AppHeader
        variant="dark"
        compact={true}
        breadcrumbs={
          <div className="flex items-center gap-3">
            <Link href="/projects" className="text-zinc-400 hover:text-white transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div className="h-4 w-px bg-zinc-800" />
            <span className="text-xs font-bold text-white font-editorial">
              {currentTask?.batchId || 'Batch #04'}
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              Khung {currentTask?.frameIndex || 42}/{currentTask?.totalFrames || 50}
            </span>
            <ConsensusBadge
              iouScore={currentTask?.iouScore}
              isAutoVerified={currentTask?.isAutoVerified ?? true}
            />
          </div>
        }
        customActions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleChat}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                isChatOpen
                  ? 'bg-zinc-800 border-zinc-700 text-white'
                  : 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Guideline SOP</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndNext}
              disabled={isSaving}
              className="flex items-center gap-1.5 bg-emerald-500 text-zinc-950 px-3 py-1 rounded-lg text-xs font-bold hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.25)] cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>Lưu & Tiếp (Space)</span>
            </button>
          </div>
        }
      />

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Toast Notifier */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 p-3 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-300 flex items-center gap-2 text-xs font-medium shadow-2xl animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Left RAG Guideline Chat */}
        {isChatOpen && <GuidelineChat />}

        {/* Center Canvas & Toolbar Area */}
        <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden relative">
          
          {/* Top Floating Toolbar */}
          <div className="p-3 bg-zinc-950/80 border-b border-zinc-800/80 shrink-0 z-10">
            <LabelToolbar
              activeTool={activeTool}
              onToolChange={setActiveTool}
              activeClass={activeClass}
              onClassChange={setActiveClass}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
            />
          </div>

          {/* Canvas Engine */}
          <div className="flex-1 relative overflow-hidden">
            <CanvasEngine
              boxes={boxes}
              selectedBoxId={selectedBoxId}
              activeTool={activeTool}
              activeClass={activeClass}
              onSelectBox={setSelectedBoxId}
              onAddBox={addBox}
            />
          </div>

          {/* Bottom Hotkey Legend Bar */}
          <div className="p-2.5 bg-zinc-950/90 border-t border-zinc-800/80 shrink-0">
            <HotkeyLegend />
          </div>
        </div>

        {/* Right Bounding Box Sidebar */}
        <BoxPropertySidebar
          boxes={boxes}
          selectedBoxId={selectedBoxId}
          onSelectBox={setSelectedBoxId}
          onDeleteBox={deleteBox}
          onChangeBoxLabel={updateBoxLabel}
        />
      </main>
    </div>
  );
};
