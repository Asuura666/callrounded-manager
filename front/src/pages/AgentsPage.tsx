import { useEffect, useState } from "react";
import { Headset, Globe, Mic, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";

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

  if (loading)
    return (
      <div className="text-text-muted text-center py-12">Chargement...</div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-navy" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Votre Réceptionniste
        </h2>
        <p className="text-text-secondary mt-1">
          Votre assistant téléphonique IA
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="bg-white border border-[#E4E7ED] rounded-xl p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Headset className="w-10 h-10 text-navy/40" />
          </div>
          <h3 className="text-lg font-semibold text-navy mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Aucun réceptionniste configuré
          </h3>
          <p className="text-text-secondary max-w-md mx-auto">
            Votre réceptionniste IA apparaîtra ici une fois configuré.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {agents.map((agent, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E4E7ED] rounded-xl overflow-hidden shadow-sm"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#E4E7ED]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gold/15 flex items-center justify-center">
                    <Headset className="w-7 h-7 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-navy" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      {agent.name}
                    </h3>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Actif
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EFF1F5] text-navy">
                        <Globe className="w-3 h-3" />
                        {agent.language === "fr"
                          ? "Français"
                          : agent.language === "en"
                            ? "English"
                            : agent.language}
                      </span>
                      {agent.voice && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                          <Mic className="w-3 h-3" />
                          {agent.voice.name} ({agent.voice.provider})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Initial message */}
              <div className="p-6 border-b border-[#E4E7ED]">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-gold mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wider">
                      Message d'accueil
                    </h4>
                    <p className="text-sm text-navy leading-relaxed bg-[#F7F8FA] rounded-lg p-3 border border-[#E4E7ED]">
                      {agent.initial_message || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Base prompt summary */}
              {agent.base_prompt && (
                <div className="p-6">
                  <h4 className="text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wider">
                    Instructions (résumé)
                  </h4>
                  <p className="text-sm text-text-primary leading-relaxed">
                    {agent.base_prompt.length > 200
                      ? agent.base_prompt.substring(0, 200) + "..."
                      : agent.base_prompt}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
