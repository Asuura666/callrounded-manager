import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft,
  Phone,
  Clock,
  Euro,
  MessageSquareText,
  Tag,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDateParis, formatDuration } from "@/lib/dates";

interface TranscriptEntry {
  role: string;
  start_time?: string;
  content: string;
}

interface VariableValue {
  name: string;
  value: string | null;
}

interface CallDetail {
  id: string;
  agent_id: string | null;
  from_number: string | null;
  to_number: string | null;
  duration_seconds: number | null;
  status: string;
  cost: number | null;
  start_time: string | null;
  end_time: string | null;
  transcript: TranscriptEntry[] | null;
  transcript_string: string | null;
  variable_values: VariableValue[] | null;
  post_call_answers: unknown;
}

const statusLabel: Record<string, string> = {
  completed: "Répondu",
  missed: "Manqué",
  failed: "Échoué",
  ongoing: "En cours",
  unknown: "Inconnu",
};

const statusColor: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400",
  missed: "bg-yellow-500/20 text-yellow-400",
  failed: "bg-red-500/20 text-red-400",
  ongoing: "bg-blue-500/20 text-blue-400",
  unknown: "bg-zinc-500/20 text-zinc-400",
};

function formatCost(cost: number | null): string {
  if (cost == null) return "—";
  return cost.toFixed(2) + " €";
}

export function CallDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [call, setCall] = useState<CallDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      api
        .get<CallDetail>(`/calls/${params.id}`)
        .then(setCall)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading)
    return (
      <div className="text-zinc-500 text-center py-12">Chargement...</div>
    );

  if (!call)
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 mb-4">Appel introuvable</p>
        <button
          onClick={() => setLocation("/calls")}
          className="px-4 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Retour à l'historique
        </button>
      </div>
    );

  const transcript = call.transcript || [];
  const variables = call.variable_values || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button + title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setLocation("/calls")}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <h2 className="text-2xl font-bold">Détail de l'appel</h2>
      </div>

      {/* Call info summary */}
      <div className="bg-[#1a1a1e] border border-zinc-800 rounded-xl p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Phone className="w-3 h-3" /> Appelant
            </p>
            <p className="font-mono font-medium text-sm">
              {call.from_number || "Masqué"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">
              Destinataire
            </p>
            <p className="font-mono font-medium text-sm">
              {call.to_number || "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">
              Statut
            </p>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[call.status] || statusColor.unknown}`}
            >
              {statusLabel[call.status] || call.status}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3" /> Durée
            </p>
            <p className="font-medium text-sm">
              {call.duration_seconds
                ? formatDuration(call.duration_seconds)
                : "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Euro className="w-3 h-3" /> Coût
            </p>
            <p className="font-medium text-sm">{formatCost(call.cost)}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-500">
            {call.start_time ? formatDateParis(call.start_time) : "—"}
            {call.end_time && ` → ${formatDateParis(call.end_time)}`}
          </p>
        </div>
      </div>

      {/* Transcript as chat bubbles */}
      <div className="bg-[#1a1a1e] border border-zinc-800 rounded-xl">
        <div className="p-5 border-b border-zinc-800 flex items-center gap-2">
          <MessageSquareText className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold">Conversation</h3>
        </div>
        <div className="p-5">
          {transcript.length > 0 ? (
            <div className="space-y-3">
              {transcript.map((entry, idx) => {
                if (entry.role === "task_switch") {
                  return (
                    <div key={idx} className="text-center">
                      <span className="inline-block px-3 py-1 text-xs text-zinc-500 bg-zinc-800/50 rounded-full">
                        {entry.content}
                      </span>
                    </div>
                  );
                }

                const isAgent = entry.role === "agent";
                return (
                  <div
                    key={idx}
                    className={`flex ${isAgent ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        isAgent
                          ? "bg-blue-600/30 text-blue-100 rounded-br-md"
                          : "bg-zinc-700/50 text-zinc-200 rounded-bl-md"
                      }`}
                    >
                      <p className="text-xs font-medium mb-1 opacity-60">
                        {isAgent ? "🤖 Réceptionniste" : "👤 Client"}
                      </p>
                      <p className="text-sm leading-relaxed">{entry.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : call.transcript_string ? (
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {call.transcript_string}
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquareText className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
              <p className="text-zinc-500">
                Aucune transcription disponible pour cet appel
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Variable values */}
      {variables.length > 0 && (
        <div className="bg-[#1a1a1e] border border-zinc-800 rounded-xl">
          <div className="p-5 border-b border-zinc-800 flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold">Variables collectées</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {variables.map((v, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-800/50 rounded-lg p-3"
                >
                  <p className="text-xs text-zinc-500 mb-1">{v.name}</p>
                  <p className="text-sm font-medium">
                    {v.value || (
                      <span className="text-zinc-600 italic">Non renseigné</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
