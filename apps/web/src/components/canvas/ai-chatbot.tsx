'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Plus,
  Loader2,
  X,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  isValidAIWorkflowResponse,
  aiResponseToWorkflow,
  type AIResponse,
} from '@/lib/ai-workflow-converter';
import type { BlueprintNode, BlueprintEdge } from '@dapp-forge/blueprint-schema';
import { AuthGuard } from '@/components/auth/auth-guard';
import { SimpleTooltip } from '@/components/ui/tooltip';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  aiResponse?: AIResponse;
}

interface AIChatbotProps {
  onApplyWorkflow?: (
    blueprintNodes: BlueprintNode[],
    blueprintEdges: BlueprintEdge[]
  ) => void;
}

export function AIChatbot({ onApplyWorkflow }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! Describe the Web3 app you want to build and I'll suggest a component architecture for you.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus textarea when chatbot opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 400);
    }
  }, [isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userQuery = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/blueprints/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_query: userQuery,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.type === 'message' && data.content) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
      else if (isValidAIWorkflowResponse(data)) {
        const toolNames = data.tools.map((t) => t.name || t.type).join(', ');
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `${data.description || 'Here\'s a suggested architecture:'}\n\nComponents: ${toolNames}`,
          timestamp: new Date(),
          aiResponse: data,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message || data.content || "I couldn't generate a workflow. Could you provide more details?",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error calling AI workflow API:', error);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Something went wrong: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyWorkflow = (aiResponse: AIResponse) => {
    if (!aiResponse || !onApplyWorkflow) return;

    try {
      const { blueprintNodes } = aiResponseToWorkflow(aiResponse);

      const blueprintEdges: BlueprintEdge[] = [];
      const toolIdToNodeId = new Map<string, string>();

      aiResponse.tools.forEach((tool, index) => {
        if (blueprintNodes[index]) {
          toolIdToNodeId.set(tool.id, blueprintNodes[index].id);
        }
      });

      aiResponse.tools.forEach((tool) => {
        const sourceNodeId = toolIdToNodeId.get(tool.id);
        if (!sourceNodeId) return;

        tool.next_tools.forEach((nextToolId) => {
          const targetNodeId = toolIdToNodeId.get(nextToolId);
          if (targetNodeId) {
            blueprintEdges.push({
              id: crypto.randomUUID(),
              source: sourceNodeId,
              target: targetNodeId,
              type: 'dependency',
            });
          }
        });
      });

      onApplyWorkflow(blueprintNodes, blueprintEdges);
      setIsOpen(false);
    } catch (error: unknown) {
      console.error('Error applying workflow:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const examplePrompts = [
    "NFT marketplace",
    "DeFi dashboard",
    "Trading bot",
    "Telegram alerts",
  ];

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Fluid animation variants - elastic "bloom" effect
  const fluidVariants = {
    hidden: {
      opacity: 0,
      scale: 0.4,
      y: 60,
      x: 30,
      filter: 'blur(10px)',
      rotate: -5,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      filter: 'blur(0px)',
      rotate: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 120,
        damping: 12,
        mass: 0.8,
        duration: 0.5,
        filter: { duration: 0.3 },
      },
    },
    exit: {
      opacity: 0,
      scale: 0.5,
      y: 40,
      x: 20,
      filter: 'blur(8px)',
      transition: {
        type: 'spring' as const,
        stiffness: 150,
        damping: 20,
        duration: 0.3,
      },
    },
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="absolute bottom-7 right-4 z-30">
        <AuthGuard onClick={toggleChat} requireGitHub={true}>
          <SimpleTooltip content={isOpen ? "Close AI Assistant" : "AI Assistant"}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "relative w-14 h-14 rounded-full",
                "bg-accent-cyan",
                "shadow-lg shadow-accent-cyan/20",
                "hover:shadow-xl hover:shadow-accent-cyan/30",
                "transition-shadow duration-200",
                "flex items-center justify-center",
                "overflow-hidden"
              )}
            >
              {/* Icon transition */}
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-8 h-8 text-black" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="bot"
                    initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Bot className="w-8 h-8 text-black" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </SimpleTooltip>
        </AuthGuard>
      </div>

      {/* Chatbot Panel with Fluid Animation */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Main chat panel */}
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={fluidVariants}
              className="absolute bottom-24 right-4 z-30 w-[360px] h-[480px] flex flex-col overflow-hidden border border-forge-border bg-[hsl(var(--color-bg-subtle))] shadow-2xl shadow-black/50 rounded-2xl"
              style={{
                transformOrigin: 'bottom right',
              }}
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative border-b border-forge-border/50 px-4 py-3 bg-[hsl(var(--color-bg-muted))]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-accent-cyan flex items-center justify-center shadow-md">
                    <Bot className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-medium">AI Assistant</h3>
                    <p className="text-forge-muted text-[10px]">Describe your app to generate a blueprint</p>
                  </div>
                </div>
              </motion.div>

              {/* Messages area */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 custom-scrollbar"
              >
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2, delay: index === 0 ? 0.4 : 0 }}
                      className={cn(
                        'flex gap-2',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-forge-elevated">
                          <Bot className="h-3 w-3 text-accent-cyan" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[85%] rounded-xl px-3 py-2',
                          message.role === 'user'
                            ? 'bg-accent-cyan text-black'
                            : 'bg-forge-elevated text-forge-text'
                        )}
                      >
                        <p className="whitespace-pre-wrap text-xs leading-relaxed">
                          {message.content}
                        </p>
                        {message.aiResponse && (
                          <div className="mt-2 pt-2 border-t border-forge-border/30">
                            <Button
                              onClick={() => handleApplyWorkflow(message.aiResponse!)}
                              size="sm"
                              className="w-full h-7 bg-accent-cyan hover:bg-accent-cyan/90 text-black text-[10px] font-medium"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add to Canvas
                            </Button>
                          </div>
                        )}
                      </div>
                      {message.role === 'user' && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-forge-elevated">
                          <User className="h-3 w-3 text-forge-muted" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isLoading && (
                  <motion.div
                    className="flex gap-2 justify-start"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-forge-elevated">
                      <Bot className="h-3 w-3 text-accent-cyan" />
                    </div>
                    <div className="bg-forge-elevated rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 text-accent-cyan animate-spin" />
                        <span className="text-xs text-forge-muted">Thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </motion.div>

              {/* Example prompts */}
              {messages.length <= 2 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="px-4 pb-2"
                >
                  <div className="flex flex-wrap gap-1">
                    {examplePrompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => setInput(prompt)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-forge-elevated/60 text-forge-muted hover:text-white hover:bg-forge-elevated transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Input area */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="relative border-t border-forge-border/50 p-3 bg-[hsl(var(--color-bg-base)/0.5)]"
              >
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Describe your app..."
                      className="w-full min-h-[36px] max-h-[80px] px-3 py-2 text-xs bg-forge-elevated border border-forge-border/50 rounded-lg text-white placeholder:text-forge-muted focus:outline-none focus:border-accent-cyan/40 transition-colors resize-none"
                      disabled={isLoading}
                      rows={1}
                    />
                    {input && (
                      <button
                        onClick={() => setInput('')}
                        className="absolute right-2 top-2 text-forge-muted hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    size="sm"
                    className="h-[36px] w-[36px] p-0 bg-accent-cyan hover:bg-accent-cyan/90 text-black disabled:opacity-40"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <p className="mt-1.5 text-[9px] text-forge-muted text-center opacity-60">
                  Enter to send · Shift+Enter for new line
                </p>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
