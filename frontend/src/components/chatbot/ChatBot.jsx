// ─────────────────────────────────────────────────────────────────────────────
// FILE: frontend/src/components/chatbot/ChatBot.jsx
// PURPOSE: Floating AI chatbot widget for student dashboard
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MessageCircle, X, Send, Loader2, Bot, User,
  FileText, Briefcase, BookOpen, Building2, Mail,
  Mic, RotateCcw, ChevronDown, Sparkles, Copy, Check,
  ClipboardList
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Mode configuration ────────────────────────────────────────────────────────
const MODES = [
  { id: 'GENERAL', icon: Sparkles, label: 'Ask AI', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-700' },
  { id: 'RESUME_REVIEW', icon: FileText, label: 'Resume Review', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700' },
  { id: 'RESUME_BUILDER', icon: ClipboardList, label: 'Build Resume', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-700' },
  { id: 'INTERVIEW_PREP', icon: Briefcase, label: 'Interview Prep', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-700' },
  { id: 'COMPANY_RESEARCH', icon: Building2, label: 'Company Info', color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-700' },
  { id: 'SKILLS_COACH', icon: BookOpen, label: 'Skills Coach', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-700' },
  { id: 'COVER_LETTER', icon: Mail, label: 'Cover Letter', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-700' },
  { id: 'MOCK_INTERVIEW', icon: Mic, label: 'Mock Interview', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-700' },
];

const MODE_PLACEHOLDERS = {
  GENERAL: 'Ask me anything about placements...',
  RESUME_REVIEW: 'Paste your resume content here for review...',
  RESUME_BUILDER: 'Type "Build my resume" to generate one from your profile...',
  INTERVIEW_PREP: 'Which company or role do you want to prepare for?',
  COMPANY_RESEARCH: 'Which company do you want to research?',
  SKILLS_COACH: 'What skill or role do you want to learn?',
  COVER_LETTER: 'Which company and role is this cover letter for?',
  MOCK_INTERVIEW: 'Type "Start mock interview" for a practice session...',
};

// ── Fetch suggestions from backend ───────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || '/api';
const fetchSuggestions = () =>
  fetch(`${API_URL}/ai/suggestions`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
  }).then(r => r.json());

// ── Format markdown-like text to JSX ─────────────────────────────────────────
const formatMessage = (text) => {
  if (typeof text !== 'string') {
    text = String(text ?? '');
  }

  if (!text) return null;

  const lines = text.split('\n');

  return lines.map((line, i) => {
    if (line.startsWith('# ')) {
      return (
        <h3
          key={i}
          className="font-bold text-base mt-3 mb-1 text-gray-800 dark:text-gray-100"
        >
          {line.slice(2)}
        </h3>
      );
    }

    if (line.startsWith('## ')) {
      return (
        <h4
          key={i}
          className="font-semibold text-sm mt-2 mb-1 text-gray-700 dark:text-gray-200"
        >
          {line.slice(3)}
        </h4>
      );
    }

    if (line.startsWith('### ')) {
      return (
        <h5
          key={i}
          className="font-semibold text-sm mt-1 mb-0.5 text-gray-700 dark:text-gray-200"
        >
          {line.slice(4)}
        </h5>
      );
    }

    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <div key={i} className="flex gap-2 items-start my-0.5">
          <span className="text-primary-500 mt-0.5 flex-shrink-0">
            •
          </span>

          <span className="text-sm">
            {formatInline(line.slice(2))}
          </span>
        </div>
      );
    }

    if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\./);
      const num = match ? match[1] : '';

      return (
        <div key={i} className="flex gap-2 items-start my-0.5">
          <span className="text-primary-500 font-bold text-xs mt-0.5 flex-shrink-0 w-4">
            {num}.
          </span>

          <span className="text-sm">
            {formatInline(line.replace(/^\d+\.\s/, ''))}
          </span>
        </div>
      );
    }

    if (line.startsWith('```') || line.endsWith('```')) {
      return null;
    }

    if (line.trim() === '') {
      return <div key={i} className="h-1" />;
    }

    return (
      <p
        key={i}
        className="text-sm leading-relaxed my-0.5"
      >
        {formatInline(line)}
      </p>
    );
  });
};
const formatInline = (text) => {
  if (typeof text !== 'string') {
    text = String(text ?? '');
  }

  const parts = text.split(
    /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  );

  return parts.map((part, i) => {
    if (typeof part !== 'string') {
      return null;
    }

    if (
      part.startsWith('**') &&
      part.endsWith('**')
    ) {
      return (
        <strong
          key={i}
          className="font-semibold text-gray-800 dark:text-gray-100"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (
      part.startsWith('`') &&
      part.endsWith('`')
    ) {
      return (
        <code
          key={i}
          className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    const linkMatch = part.match(
      /^\[([^\]]+)\]\(([^)]+)\)$/
    );

    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="text-primary-600 hover:underline"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return part;
  });
};

// ── Main ChatBot Component ────────────────────────────────────────────────────
export default function ChatBot({ student }) { {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeMode, setActiveMode] = useState('GENERAL');
  const [showModes, setShowModes] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Fetch personalized suggestions
  const { data: suggestionsData } = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: fetchSuggestions,
    staleTime: 5 * 60 * 1000,
    enabled: isOpen
  });
  const suggestions = suggestionsData?.data || [];

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `👋 **Hi ${student?.firstName || 'there'}! I'm PlaceTrack AI** — your personal placement assistant!\n\nI already know your profile, skills, and application status. Here's what I can help you with:\n\n💼 **Resume Review** — get ATS score and improvement tips\n📄 **Build Resume** — generate a professional resume from your profile\n🎯 **Interview Prep** — practice for specific companies and roles\n🏢 **Company Research** — know what to expect before an interview\n📚 **Skills Coach** — get a personalized learning roadmap\n✉️ **Cover Letter** — write one for any specific job\n\nPick a mode above or just ask me anything!`,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, student?.firstName]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Show unread badge when chat is closed and AI responds
  useEffect(() => {
    if (!isOpen && messages.length > 1 && messages[messages.length - 1].role === 'assistant') {
      setHasUnread(true);
    }
  }, [messages, isOpen]);

  const currentMode = MODES.find(m => m.id === activeMode) || MODES[0];

  // ── Send message and stream response ───────────────────────────────────────
  const sendMessage = useCallback(async (messageText, modeOverride) => {
    const text = (messageText || input).trim();
    if (!text || isStreaming) return;

    const modeToUse = modeOverride || activeMode;
    setInput('');
    setShowModes(false);

    // Add user message
    const userMsg = { id: Date.now(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    // Prepare conversation history (exclude welcome message)
    const history = messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }));

    // Add placeholder for AI response
    const aiMsgId = Date.now() + 1;
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true }]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ message: text, mode: modeToUse, conversationHistory: history }),
        signal: controller.signal
      });

      if (!response.ok) {
  let errorMessage = `AI request failed (${response.status})`;

  try {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const err = await response.json();
      errorMessage = err.message || err.error || errorMessage;
    } else {
      const text = await response.text();
      if (text) {
        errorMessage = text;
      }
    }
  } catch (parseError) {
    console.error('Could not parse AI error response:', parseError);
  }

  throw new Error(errorMessage);
}

      // Read the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            if (!data) continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) {
                fullText += parsed.text;
                // Update the streaming message
                setMessages(prev => prev.map(m =>
                  m.id === aiMsgId ? { ...m, content: fullText } : m
                ));
              }
            } catch (e) {
              if (e.message !== 'Unexpected token') {
                console.error('Parse error:', e);
              }
            }
          }
        }
      }

      // Mark streaming as done
      setMessages(prev => prev.map(m =>
        m.id === aiMsgId ? { ...m, isStreaming: false } : m
      ));

    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId ? { ...m, content: m.content + '\n\n*[Response stopped]*', isStreaming: false } : m
        ));
      } else {
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId
            ? { ...m, content: `❌ **Error:** ${err.message}\n\nPlease check your API key is configured correctly.`, isStreaming: false }
            : m
        ));
        toast.error('AI error: ' + err.message);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, activeMode, messages, isStreaming]);

  // Stop streaming
  const stopStreaming = () => {
    if (abortRef.current) abortRef.current.abort();
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setTimeout(() => {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Chat cleared! What would you like help with?`,
        timestamp: new Date()
      }]);
    }, 100);
  };

  // Copy message content
  const copyMessage = (id, content) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Floating trigger button ─────────────────────────────────────── */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setHasUnread(false); }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 bg-gradient-to-br from-primary-600 to-purple-600"
          title="Open PlaceTrack AI Assistant"
        >
          <Bot size={24} className="text-white" />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
      )}

      {/* ── Chat window ─────────────────────────────────────────────────── */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ${isMinimized ? 'w-72 h-14' : 'w-[380px] h-[600px]'} max-w-[calc(100vw-24px)] max-h-[calc(100vh-24px)]`}>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary-600 to-purple-600 rounded-t-2xl flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">PlaceTrack AI</p>
              {!isMinimized && (
                <p className="text-white/70 text-xs truncate">
                  {isStreaming ? 'Thinking...' : 'Your placement assistant'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <ChevronDown size={15} className={`transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* ── Mode selector ──────────────────────────────────────── */}
              <div className="flex-shrink-0 px-3 pt-2 pb-1 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                  {MODES.map(mode => {
                    const Icon = mode.icon;
                    const isActive = activeMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setActiveMode(mode.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 border transition-all ${isActive
                            ? `${mode.bg} ${mode.border} ${mode.color}`
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                      >
                        <Icon size={11} />
                        <span className="whitespace-nowrap">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Messages area ──────────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">

                {/* Smart suggestions */}
                {messages.length <= 1 && suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 font-medium px-1">💡 Suggested for you</p>
                    {suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setActiveMode(sug.mode);
                          sendMessage(sug.message, sug.mode);
                        }}
                        className="w-full text-left px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors flex items-center gap-2"
                      >
                        <span className="text-base flex-shrink-0">{sug.icon}</span>
                        <span>{sug.text}</span>
                      </button>
                    ))}
                    <div className="border-t border-gray-100 dark:border-gray-800 my-2" />
                  </div>
                )}

                {/* Message list */}
                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                    {/* Avatar */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${msg.role === 'user'
                        ? 'bg-primary-600'
                        : 'bg-gradient-to-br from-primary-600 to-purple-600'
                      }`}>
                      {msg.role === 'user'
                        ? <User size={12} className="text-white" />
                        : <Bot size={12} className="text-white" />
                      }
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[82%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className={`px-3 py-2 rounded-2xl ${msg.role === 'user'
                          ? 'bg-primary-600 text-white rounded-tr-sm'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-tl-sm border border-gray-100 dark:border-gray-700'
                        }`}>
                        {msg.role === 'user'
                          ? <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          : <div className="text-gray-700 dark:text-gray-200">
                            {formatMessage(msg.content)}
                            {msg.isStreaming && (
                              <span className="inline-flex gap-0.5 ml-1">
                                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </span>
                            )}
                          </div>
                        }
                      </div>

                      {/* Copy button for AI messages */}
                      {msg.role === 'assistant' && !msg.isStreaming && msg.content && (
                        <button
                          onClick={() => copyMessage(msg.id, msg.content)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors self-start"
                          title="Copy"
                        >
                          {copiedId === msg.id
                            ? <Check size={11} className="text-green-500" />
                            : <Copy size={11} />
                          }
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>

              {/* ── Input area ─────────────────────────────────────────── */}
              <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                {/* Mode label */}
                <div className={`flex items-center gap-1.5 mb-2 px-2 py-1 rounded-lg ${currentMode.bg}`}>
                  {React.createElement(currentMode.icon, { size: 12, className: currentMode.color })}
                  <span className={`text-xs font-medium ${currentMode.color}`}>{currentMode.label} Mode</span>
                  {messages.length > 1 && (
                    <button onClick={clearChat} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Clear chat">
                      <RotateCcw size={11} />
                    </button>
                  )}
                </div>

                {/* Text input */}
                <div className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={MODE_PLACEHOLDERS[activeMode] || 'Type a message...'}
                    rows={1}
                    className="flex-1 resize-none text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all min-h-[38px] max-h-[80px]"
                    style={{ height: 'auto' }}
                    onInput={e => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
                    }}
                    disabled={isStreaming}
                  />
                  {isStreaming ? (
                    <button
                      onClick={stopStreaming}
                      className="w-9 h-9 rounded-xl bg-red-500 hover:bg-red-600 flex items-center justify-center flex-shrink-0 transition-colors self-end"
                      title="Stop"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  ) : (
                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim()}
                      className="w-9 h-9 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-colors self-end"
                      title="Send (Enter)"
                    >
                      <Send size={14} className="text-white" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 text-center mt-1.5">Enter to send · Shift+Enter for new line</p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
}
