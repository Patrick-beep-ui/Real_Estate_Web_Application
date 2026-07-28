import { useState, useCallback, Component, type ReactNode } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Phone, X, Mic, MicOff } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useStickyCtaExpanded } from "@/hooks/widgets/useWidgetCoordination";

// Error boundary so the widget never crashes the page
class VoiceAgentErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.warn("VoiceAgentWidget failed to load:", error.message);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const VoiceAgentInner = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stickyExpanded = useStickyCtaExpanded();

  const conversation = useConversation({
    onConnect: () => {
      console.log("Voice agent connected");
      setIsOpen(true);
      setError(null);
    },
    onDisconnect: () => {
      console.log("Voice agent disconnected");
      setIsOpen(false);
    },
    onError: (err) => {
      console.error("Voice agent error:", err);
      setError("Connection lost. Tap to retry.");
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error: fnError } = await supabase.functions.invoke(
        "elevenlabs-conversation-token"
      );

      if (fnError || !data?.token) {
        throw new Error(fnError?.message || "No token received");
      }
      conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });
    } catch (err) {
      console.error("Failed to start voice agent:", err);
      setError("Couldn't connect. Check mic permissions.");
    } finally {
      setIsConnecting(false);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    setIsOpen(false);
  }, [conversation]);

  const isConnected = conversation.status === "connected";

  return (
    <>
      {/* Floating button */}
      <button
        onClick={isConnected ? stopConversation : startConversation}
        disabled={isConnecting}
        className={`fixed bottom-40 right-4 z-[45] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-60 md:bottom-24 ${stickyExpanded ? 'md:block hidden' : ''}`}
        style={{
          background: isConnected
            ? "linear-gradient(135deg, hsl(0 72% 51%), hsl(0 72% 40%))"
            : "linear-gradient(135deg, hsl(38 92% 50%), hsl(38 92% 40%))",
        }}
        aria-label={isConnected ? "End voice call" : "Talk to AI assistant"}
      >
        {isConnecting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isConnected ? (
          <Phone className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Active call overlay */}
      {isConnected && isOpen && (
        <div className="fixed bottom-40 right-4 z-[46] w-72 rounded-2xl overflow-hidden shadow-2xl border border-border"
          style={{ background: "hsl(var(--card))" }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">
                Talking with Tarek's AI
              </span>
              <button onClick={stopConversation} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Speaking indicator */}
            <div className="flex items-center justify-center py-6">
              <div className="relative">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    conversation.isSpeaking
                      ? "bg-primary/20 scale-110"
                      : "bg-secondary"
                  }`}
                >
                  {conversation.isSpeaking ? (
                    <Mic className="w-7 h-7 text-primary animate-pulse" />
                  ) : (
                    <MicOff className="w-7 h-7 text-muted-foreground" />
                  )}
                </div>
                {conversation.isSpeaking && (
                  <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" />
                )}
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              {conversation.isSpeaking ? "AI is speaking…" : "Listening…"}
            </p>

            <button
              onClick={stopConversation}
              className="w-full mt-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold hover:brightness-125 transition-all"
            >
              End Call
            </button>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && !isConnected && (
        <div className="fixed bottom-40 right-4 z-[46] bg-destructive text-destructive-foreground text-xs px-4 py-2 rounded-xl shadow-lg max-w-64">
          {error}
        </div>
      )}
    </>
  );
};

const VoiceAgentWidget = () => (
  <VoiceAgentErrorBoundary>
    <ConversationProvider>
      <VoiceAgentInner />
    </ConversationProvider>
  </VoiceAgentErrorBoundary>
);

export default VoiceAgentWidget;
