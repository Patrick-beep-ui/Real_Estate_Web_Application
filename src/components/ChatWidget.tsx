import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { useStickyCtaExpanded } from "@/hooks/useWidgetCoordination";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`;

const normalizeText = (text: string) => {
  return text
    .replace(/\n{3,}/g, "\n\n") // max 2 line breaks
    //.replace(/\n{2,}/g, "\n") // max 1 line break
    .replace(/[ \t]+/g, " ")    // remove excessive spaces
    .trim();
};

async function chat({
  messages,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDone: (text: string) => void;
  onError: (msg: string) => void;
}) {
  let resp: Response;

  try {
    resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ messages }),
    });
  } catch {
    onError("Network error. Please check your connection.");
    return;
  }

  if (!resp.ok) {
    try {
      const body = await resp.json();
      onError(body.error || "Something went wrong.");
    } catch {
      onError("Something went wrong. Please try again.");
    }
    return;
  }

  try {
    const data = await resp.json();
    onDone(data.text || "");
  } catch {
    onError("Invalid response from server.");
  }
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const stickyExpanded = useStickyCtaExpanded();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Auto-minimize after 60s of inactivity
  const resetInactivity = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    if (isOpen) {
      inactivityTimer.current = setTimeout(() => setIsOpen(false), 60_000);
    }
  }, [isOpen]);

  useEffect(() => {
    resetInactivity();
    return () => clearTimeout(inactivityTimer.current);
  }, [isOpen, messages, resetInactivity]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    resetInactivity();

    const userMsg: Msg = { role: "user", content: text };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      const content = assistantSoFar;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
        }
        return [...prev, { role: "assistant", content }];
      });
    };

    await chat({
      messages: allMsgs,
      onDone: (text) => {
        setMessages((prev) => [...prev, { role: "assistant", content: text }]);
        setIsLoading(false);
      },
      onError: (msg) => {
        setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
        setIsLoading(false);
      },
    });
  };

  return (
    <>
      {/* Floating button — positioned above voice widget */}
      {!isOpen && !stickyExpanded && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-40 right-4 z-[44] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 md:bottom-40"
          style={{ background: "linear-gradient(135deg, hsl(38 92% 50%), hsl(38 92% 40%))" }}
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-[60px] md:bottom-4 right-4 z-[48] w-[calc(100vw-2rem)] max-w-[400px] h-[min(500px,80vh)] rounded-2xl overflow-hidden shadow-2xl border border-border flex flex-col bg-background">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border" style={{ background: "linear-gradient(135deg, hsl(38 92% 50% / 0.15), transparent)" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(38 92% 50%), hsl(38 92% 40%))" }}>
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Tarek's AI Assistant</p>
                <p className="text-xs text-muted-foreground">Ask about selling your house</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Ask anything about selling your house fast for cash!</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0">{children}</p>
                      //<p className="mb-1 last:mb-0 leading-snug">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold">{children}</strong>
                    ),
                  }}
                >
                 {m.content}
                </ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-3.5 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about selling your house…"
                className="flex-1 bg-muted rounded-xl px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, hsl(38 92% 50%), hsl(38 92% 40%))" }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
