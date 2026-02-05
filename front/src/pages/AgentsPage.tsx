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
      <div className="text-zinc-500 text-center py-12">Chargement...</div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Votre Réceptionniste</h2>
        <p className="text-zinc-400 mt-1">
          Votre assistant téléphonique IA
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="bg-[#1a1a1e] border border-zinc-800 rounded-xl p-12 text-center">
          <Headset className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
          <h3 className="text-lg font-medium mb-2">
            Aucun réceptionniste configuré
          </h3>
          <p className="text-zinc-500 max-w-md mx-auto">
            Votre réceptionniste IA apparaîtra ici une fois configuré.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {agents.map((agent, idx) => (
            <div
              key={idx}
              className="bg-[#1a1a1e] border border-zinc-800 rounded-xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Headset className="w-7 h-7 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{agent.name}</h3>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        Actif
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-700/50 text-zinc-300">
                        <Globe className="w-3 h-3" />
                        {agent.language === "fr"
                          ? "Français"
                          : agent.language === "en"
                            ? "English"
                            : agent.language}
                      </span>
                      {agent.voice && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">
                          <Mic className="w-3 h-3" />
                          {agent.voice.name} ({agent.voice.provider})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Initial message */}
              <div className="p-6 border-b border-zinc-800">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-zinc-400 mb-2">
                      Message d'accueil
                    </h4>
                    <p className="text-sm text-zinc-200 leading-relaxed bg-zinc-800/50 rounded-lg p-3">
                      {agent.initial_message || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Base prompt summary */}
              {agent.base_prompt && (
                <div className="p-6">
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">
                    Instructions (résumé)
                  </h4>
                  <p className="text-sm text-zinc-300 leading-relaxed">
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
