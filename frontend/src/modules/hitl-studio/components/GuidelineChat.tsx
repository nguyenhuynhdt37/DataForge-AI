"use client";

import React, { useState } from 'react';
import { MessageSquare, Send, Bot, User, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const GuidelineChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Xin chào! Tôi là trợ lý SOP Guideline. Bạn có thắc mắc gì về quy chuẩn gán nhãn xe máy tạt đầu, điểm mù gương hay vùng che khuất lúc mưa lớn không?',
      timestamp: '14:20',
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Phản hồi AI dựa trên SOP guideline
    setTimeout(() => {
      let replyText = 'Theo tài liệu SOP Autonomous Annotation: Bounding box phải bao trọn toàn bộ thân xe kể cả gương chiếu hậu và bánh xe tiếp đất.';
      const lower = userMsg.text.toLowerCase();
      if (lower.includes('mưa') || lower.includes('nước')) {
        replyText = 'Với khung hình mưa lớn bị nhòe: Nếu đối tượng bị che khuất trên 75% diện tích bởi bọt nước bắn lên, hãy đánh dấu thuộc tính "Occluded: Heavy" và không ngoại suy vượt quá đường viền mờ.';
      } else if (lower.includes('xe máy') || lower.includes('tạt đầu')) {
        replyText = 'Đối với xe máy chở hàng cồng kềnh hoặc tạt đầu sát đầu xe: Gộp toàn bộ người lái và hàng hóa vào chung 1 bounding box "Motorbike", không tách rời.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 600);
  };

  return (
    <div className="w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Quy Chuẩn Gán Nhãn RAG</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
          SOP v3.2
        </span>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col text-xs space-y-1 ${
              m.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`p-3 rounded-2xl max-w-[90%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-emerald-500 text-zinc-950 font-medium'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
              }`}
            >
              {m.text}
            </div>
            <span className="text-[9px] font-mono text-zinc-500 px-1">{m.timestamp}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900/40 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Hỏi tiêu chuẩn gán nhãn..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="button"
          onClick={handleSend}
          className="p-2 rounded-xl bg-emerald-500 text-zinc-950 hover:bg-emerald-400 cursor-pointer transition-colors"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
