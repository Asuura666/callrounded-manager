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
  completed: "bg-emerald-100 text-emerald-700",
  missed: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-600",
  ongoing: "bg-sky-100 text-sky-700",
  unknown: "bg-gray-100 text-gray-500",
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
      <div className="text-text-muted text-center py-12">Chargement...</div>
    );

  if (!call)
    return (
      <div className="text-center py-12">
        <p className="text-text-muted mb-4">Appel introuvable</p>
        <button
          onClick={() => setLocation("/calls")}
          className="px-4 py-2 text-sm rounded-lg bg-gold text-navy font-semibold hover:bg-gold-light transition-colors"
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
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg text-text-secondary hover:text-navy hover:bg-gold/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <h2 className="text-2xl font-bold text-navy" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Détail de l'appel
        </h2>
      </div>

      {/* Call info summary */}
      <div className="bg-white border border-[#E4E7ED] rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider flex items-center gap-1 font-semibold">
              <Phone className="w-3 h-3" /> Appelant
            </p>
            <p className="font-mono font-medium text-sm text-navy">
              {call.from_number || "Masqué"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
              Destinataire
            </p>
            <p className="font-mono font-medium text-sm text-navy">
              {call.to_number || "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
              Statut
            </p>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor[call.status] || statusColor.unknown}`}
            >
              {statusLabel[call.status] || call.status}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider flex items-center gap-1 font-semibold">
              <Clock className="w-3 h-3" /> Durée
            </p>
            <p className="font-medium text-sm text-navy">
              {call.duration_seconds
                ? formatDuration(call.duration_seconds)
                : "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider flex items-center gap-1 font-semibold">
              <Euro className="w-3 h-3" /> Coût
            </p>
            <p className="font-medium text-sm text-navy">{formatCost(call.cost)}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#E4E7ED]">
          <p className="text-xs text-text-muted">
            {call.start_time ? formatDateParis(call.start_time) : "—"}
            {call.end_time && ` → ${formatDateParis(call.end_time)}`}
          </p>
        </div>
      </div>

      {/* Transcript as chat bubbles */}
      <div className="bg-white border border-[#E4E7ED] rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E4E7ED] flex items-center gap-2">
          <MessageSquareText className="w-5 h-5 text-gold" />
          <h3 className="text-lg font-semibold text-navy" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Conversation
          </h3>
        </div>
        <div className="p-5 bg-[#F7F8FA]">
          {transcript.length > 0 ? (
            <div className="space-y-3">
              {transcript.map((entry, idx) => {
                // Filter out system/KB messages
                if (["system", "tool", "function"].includes(entry.role.toLowerCase())) return null;
                if (entry.content?.startsWith("[Knowledge Base") || entry.content?.startsWith("[KB]") || entry.content?.startsWith("[System]")) return null;
                if (!entry.content?.trim()) return null;

                if (entry.role === "task_switch") {
                  return (
                    <div key={idx} className="text-center">
                      <span className="inline-block px-3 py-1 text-xs text-text-muted bg-white rounded-full border border-[#E4E7ED]">
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
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                        isAgent
                          ? "bg-navy text-white rounded-br-md"
                          : "bg-white text-navy rounded-bl-md border border-[#E4E7ED]"
                      }`}
                    >
                      <p className={`text-xs font-semibold mb-1 ${isAgent ? "text-gold" : "text-text-muted"}`}>
                        {isAgent ? "🤖 Réceptionniste" : "👤 Client"}
                      </p>
                      <p className="text-sm leading-relaxed">{entry.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : call.transcript_string ? (
            <div className="bg-white rounded-lg p-4 border border-[#E4E7ED]">
              <p className="text-sm text-navy whitespace-pre-wrap leading-relaxed">
                {call.transcript_string}
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquareText className="w-10 h-10 mx-auto mb-3 text-text-muted/40" />
              <p className="text-text-muted">
                Aucune transcription disponible pour cet appel
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Variable values */}
      {variables.length > 0 && (
        <div className="bg-white border border-[#E4E7ED] rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#E4E7ED] flex items-center gap-2">
            <Tag className="w-5 h-5 text-gold" />
            <h3 className="text-lg font-semibold text-navy" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Variables collectées
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {variables.map((v, idx) => (
                <div
                  key={idx}
                  className="bg-[#F7F8FA] rounded-lg p-3 border border-[#E4E7ED]"
                >
                  <p className="text-xs text-text-muted mb-1 font-semibold uppercase tracking-wider">{v.name}</p>
                  <p className="text-sm font-medium text-navy">
                    {v.value || (
                      <span className="text-text-muted italic">Non renseigné</span>
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
