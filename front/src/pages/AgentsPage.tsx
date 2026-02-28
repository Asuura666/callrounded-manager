import { useEffect, useState } from "react";
import { Headset, Globe, Mic, MessageSquare, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { SkeletonCard } from "@/components/ui/skeleton";

interface AgentVoice {
  provider: string;
  name: string;
}

interface Agent {
  name: string;
  language: string;
  initial_message: string;
  base_prompt?: string;
  voice?: AgentVoice;
  states?: unknown[];
  tools?: unknown[];
}

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Agent[]>("/agents")
      .then(setAgents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div style={{ animation: "fade-in 0.4s ease-out forwards" }}>
          <div className="h-8 w-48 bg-[#E4E7ED] rounded skeleton-shimmer mb-2" />
          <div className="h-5 w-64 bg-[#E4E7ED] rounded skeleton-shimmer" />
        </div>
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div style={{ animation: "slide-up 0.5s ease-out forwards" }}>
        <h2 className="text-2xl font-bold text-navy font-heading">Votre Réceptionniste</h2>
        <p className="text-text-secondary mt-1">Votre assistant téléphonique IA personnalisé</p>
      </div>

      {agents.length === 0 ? (
        <div className="bg-white border border-[#E4E7ED] rounded-xl p-12 text-center shadow-sm" style={{ animation: "scale-in 0.3s ease-out forwards" }}>
          <div className="w-24 h-24 bg-gradient-to-br from-navy/10 to-gold/10 rounded-full flex items-center justify-center mx-auto mb-6" style={{ animation: "float 3s ease-in-out infinite" }}>
            <Headset className="w-12 h-12 text-navy/40" />
          </div>
          <h3 className="text-xl font-semibold text-navy mb-3 font-heading">Aucun réceptionniste configuré</h3>
          <p className="text-text-secondary max-w-md mx-auto">Votre réceptionniste IA apparaîtra ici une fois configuré.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {agents.map((agent, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E4E7ED] rounded-xl overflow-hidden shadow-sm card-hover"
              style={{ animation: "slide-up 0.5s ease-out forwards", animationDelay: `${idx * 100}ms`, opacity: 0, animationFillMode: "forwards" }}
            >
              <div className="p-6 border-b border-[#E4E7ED] bg-gradient-to-r from-navy/5 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/20 to-gold/40 flex items-center justify-center ring-4 ring-white shadow-lg">
                      <Headset className="w-8 h-8 text-gold" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-navy font-heading">{agent.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Actif
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#EFF1F5] text-navy">
                        <Globe className="w-3 h-3" />
                        {agent.language === "fr" ? "Français" : agent.language === "en" ? "English" : agent.language}
                      </span>
                      {agent.voice && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                          <Mic className="w-3 h-3" />
                          {agent.voice.name}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              <div className="p-6 border-b border-[#E4E7ED]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wider">Message d'accueil</h4>
                    <div className="relative">
                      <p className="text-sm text-navy leading-relaxed bg-[#F7F8FA] rounded-lg p-4 border border-[#E4E7ED] italic">
                        "{agent.initial_message || "—"}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          ))}
        </div>
      )}
    </div>
  );
}
