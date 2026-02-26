import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, CheckCircle2, AlertCircle, Loader2, Wand2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  action?: {
    type: "create_agent" | "update_agent" | "info";
    status: "pending" | "success" | "error";
    data?: Record<string, unknown>;
  };
}

interface AgentPreview {
  name?: string;
  description?: string;
  greeting?: string;
  voice?: string;
  language?: string;
}

export function AgentBuilderPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Bonjour ! 👋 Je suis votre assistant pour créer des agents vocaux CallRounded.

Je connais toute la documentation de l'API et je peux vous aider à :
- **Créer un nouvel agent** avec les bons paramètres
- **Configurer la voix** et le comportement
- **Définir les instructions** et le contexte

Dites-moi quel type d'agent vous souhaitez créer ! Par exemple :
> "Je veux créer un réceptionniste pour un salon de coiffure qui s'appelle Élégance"`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentPreview, setAgentPreview] = useState<AgentPreview | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);


    try {
      const response = await api.post<{
        message: string;
        action?: Message["action"];
        agent_preview?: AgentPreview;
      }>("/admin/llm/chat", {
        messages: [...messages, userMessage].map(m => ({
          role: m.role,
          content: m.content,
        })),
      });


      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
        action: response.action,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (response.agent_preview) {
        setAgentPreview(response.agent_preview);
      }

      // If agent was created successfully, show success state
      if (response.action?.type === "create_agent" && response.action.status === "success") {
      }
    } catch (error) {
      console.error("[AgentBuilder] Error:", error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date(),
        action: { type: "info", status: "error" },
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function renderActionBadge(action: Message["action"]) {
    if (!action) return null;

    const icons = {
      create_agent: <Wand2 className="w-3 h-3" />,
      update_agent: <Sparkles className="w-3 h-3" />,
      info: <AlertCircle className="w-3 h-3" />,
    };

    const labels = {
      create_agent: "Création agent",
      update_agent: "Mise à jour",
      info: "Information",
    };

    const statusColors = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      success: "bg-green-100 text-green-700 border-green-200",
      error: "bg-red-100 text-red-700 border-red-200",
    };

    const statusIcons = {
      pending: <Loader2 className="w-3 h-3 animate-spin" />,
      success: <CheckCircle2 className="w-3 h-3" />,
      error: <AlertCircle className="w-3 h-3" />,
    };

    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${statusColors[action.status]}`}>
        {icons[action.type]}
        <span>{labels[action.type]}</span>
        {statusIcons[action.status]}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-navy font-heading flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-gold" />
            Créateur d'agent
          </h1>
          <p className="text-text-muted mt-1">
            Discutez avec l'assistant pour créer votre agent vocal personnalisé
          </p>
        </div>

        {/* Messages */}
        <Card className="flex-1 flex flex-col overflow-hidden border-gold/20">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === "user"
                    ? "bg-navy text-white"
                    : "bg-gold/20 text-gold"
                }`}>
                  {message.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div className={`flex-1 ${message.role === "user" ? "text-right" : ""}`}>
                  <div
                    className={`inline-block p-3 rounded-2xl max-w-[85%] ${
                      message.role === "user"
                        ? "bg-navy text-white rounded-tr-sm"
                        : "bg-gray-100 text-navy rounded-tl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                  {message.action && (
                    <div className={`mt-2 ${message.role === "user" ? "text-right" : ""}`}>
                      {renderActionBadge(message.action)}
                    </div>
                  )}
                  <p className={`text-xs text-text-muted mt-1 ${message.role === "user" ? "text-right" : ""}`}>
                    {message.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-gold" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm p-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="border-t border-border p-4 bg-white">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Décrivez l'agent que vous souhaitez créer..."
                className="flex-1"
                disabled={loading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="bg-gold hover:bg-gold/90 text-navy"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-text-muted mt-2 text-center">
              Appuyez sur Entrée pour envoyer
            </p>
          </div>
        </Card>
      </div>

      {/* Agent Preview Sidebar */}
      <div className="w-80 hidden lg:block">
        <Card className="sticky top-0 border-gold/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-navy font-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              Aperçu de l'agent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {agentPreview ? (
              <>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Nom</p>
                  <p className="font-medium text-navy">{agentPreview.name || "Non défini"}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-gray-600">{agentPreview.description || "Non définie"}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Message d'accueil</p>
                  <p className="text-sm text-gray-600 italic">"{agentPreview.greeting || "..."}"</p>
                </div>
                <div className="flex gap-2">
                  {agentPreview.voice && (
                    <Badge variant="outline" className="text-xs">
                      🎙️ {agentPreview.voice}
                    </Badge>
                  )}
                  {agentPreview.language && (
                    <Badge variant="outline" className="text-xs">
                      🌍 {agentPreview.language}
                    </Badge>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bot className="w-8 h-8 text-gold/50" />
                </div>
                <p className="text-sm text-text-muted">
                  L'aperçu de votre agent apparaîtra ici au fur et à mesure de la conversation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-4 border-gold/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-navy font-heading text-sm">Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              "Créer un agent pour un salon de coiffure",
              "Agent réceptionniste pour cabinet médical",
              "Assistant pour restaurant",
            ].map((suggestion, i) => (
              <button
                key={i}
                onClick={() => setInput(suggestion)}
                className="w-full text-left text-sm p-2 rounded-lg border border-border hover:border-gold/50 hover:bg-gold/5 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
