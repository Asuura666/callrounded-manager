import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, PhoneCall } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateParis, formatDuration } from "@/lib/dates";

interface Call {
  id: string;
  agent_id: string | null;
  from_number: string | null;
  to_number: string | null;
  duration_seconds: number | null;
  status: string;
  cost: number | null;
  start_time: string | null;
  end_time: string | null;
}

interface CallsResponse {
  data: Call[];
  total_items: number;
  current_page: number;
  total_pages: number;
}

const statusLabel: Record<string, string> = {
  completed: "Répondu",
  active: "En cours",
  missed: "Manqué",
  failed: "Échoué",
  ongoing: "En cours",
  unknown: "Inconnu",
};

const statusColor: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  active: "bg-sky-100 text-sky-700",
  missed: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-600",
  ongoing: "bg-sky-100 text-sky-700",
  unknown: "bg-gray-100 text-gray-500",
};

function formatCost(cost: number | null): string {
  if (cost == null) return "—";
  return cost.toFixed(2) + " €";
}

export function CallsPage() {
  const [, setLocation] = useLocation();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const limit = 20;

  const fetchCalls = () => {
    setLoading(true);
    const params: Record<string, string> = {
      limit: String(limit),
      page: String(page),
    };
    if (filterStatus) params.status = filterStatus;
    api
      .get<CallsResponse>("/calls", params)
      .then((res) => {
        setCalls(res.data || []);
        setTotalPages(res.total_pages || 1);
        setTotalItems(res.total_items || 0);
      })
      .catch(() => {
        setCalls([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCalls();
  }, [page, filterStatus]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-navy" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Historique des appels
        </h2>
        <p className="text-text-secondary mt-1">
          Tous les appels gérés par votre réceptionniste
          {totalItems > 0 && (
            <span className="text-text-muted"> · {totalItems} appels</span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="bg-white border border-[#D8DCE4] rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
        >
          <option value="">Tous les appels</option>
          <option value="completed">Répondus</option>
          <option value="missed">Manqués</option>
          <option value="failed">Échoués</option>
        </select>
      </div>

      <div className="bg-white border border-[#E4E7ED] rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-text-muted text-center py-12">Chargement...</p>
        ) : calls.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <PhoneCall className="w-8 h-8 text-navy/40" />
            </div>
            <p className="text-text-secondary font-medium">Aucun appel dans l'historique</p>
            <p className="text-sm text-text-muted mt-1">
              Les appels de vos clients apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-navy">
                  <th className="text-left text-xs text-white/80 uppercase tracking-wider px-5 py-3 font-semibold">
                    Date
                  </th>
                  <th className="text-left text-xs text-white/80 uppercase tracking-wider px-5 py-3 font-semibold">
                    Appelant
                  </th>
                  <th className="text-left text-xs text-white/80 uppercase tracking-wider px-5 py-3 font-semibold">
                    Durée
                  </th>
                  <th className="text-left text-xs text-white/80 uppercase tracking-wider px-5 py-3 font-semibold">
                    Statut
                  </th>
                  <th className="text-left text-xs text-white/80 uppercase tracking-wider px-5 py-3 font-semibold">
                    Coût
                  </th>
                </tr>
              </thead>
              <tbody>
                {calls.map((c, idx) => (
                  <tr
                    key={c.id}
                    className={`border-b border-[#E4E7ED] hover:bg-gold/5 cursor-pointer transition-colors ${idx % 2 === 1 ? "bg-[#F9FAFB]" : ""}`}
                    onClick={() => setLocation(`/calls/${c.id}`)}
                  >
                    <td className="px-5 py-3 text-sm text-text-secondary">
                      {c.start_time
                        ? formatDateParis(c.start_time)
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-sm font-mono text-navy font-medium">
                      {c.from_number || "Masqué"}
                    </td>
                    <td className="px-5 py-3 text-sm text-text-secondary">
                      {c.duration_seconds
                        ? formatDuration(c.duration_seconds)
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor[c.status] || statusColor.unknown}`}
                      >
                        {statusLabel[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-text-secondary">
                      {formatCost(c.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg border border-[#D8DCE4] text-navy hover:bg-gold/10 hover:border-gold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Précédent
          </button>
          <span className="text-sm text-text-muted">
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg border border-[#D8DCE4] text-navy hover:bg-gold/10 hover:border-gold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Suivant <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
