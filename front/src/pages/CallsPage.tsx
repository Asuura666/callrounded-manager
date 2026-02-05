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
  completed: "bg-green-500/20 text-green-400",
  active: "bg-blue-500/20 text-blue-400",
  missed: "bg-yellow-500/20 text-yellow-400",
  failed: "bg-red-500/20 text-red-400",
  ongoing: "bg-blue-500/20 text-blue-400",
  unknown: "bg-zinc-500/20 text-zinc-400",
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
        <h2 className="text-2xl font-bold">Historique des appels</h2>
        <p className="text-zinc-400 mt-1">
          Tous les appels gérés par votre réceptionniste
          {totalItems > 0 && (
            <span className="text-zinc-500"> · {totalItems} appels</span>
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
          className="bg-[#1a1a1e] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="">Tous les appels</option>
          <option value="completed">Répondus</option>
          <option value="missed">Manqués</option>
          <option value="failed">Échoués</option>
        </select>
      </div>

      <div className="bg-[#1a1a1e] border border-zinc-800 rounded-xl">
        {loading ? (
          <p className="text-zinc-500 text-center py-12">Chargement...</p>
        ) : calls.length === 0 ? (
          <div className="text-center py-12">
            <PhoneCall className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
            <p className="text-zinc-500">Aucun appel dans l'historique</p>
            <p className="text-sm text-zinc-600 mt-1">
              Les appels de vos clients apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-xs text-zinc-500 uppercase tracking-wider px-5 py-3">
                    Date
                  </th>
                  <th className="text-left text-xs text-zinc-500 uppercase tracking-wider px-5 py-3">
                    Appelant
                  </th>
                  <th className="text-left text-xs text-zinc-500 uppercase tracking-wider px-5 py-3">
                    Durée
                  </th>
                  <th className="text-left text-xs text-zinc-500 uppercase tracking-wider px-5 py-3">
                    Statut
                  </th>
                  <th className="text-left text-xs text-zinc-500 uppercase tracking-wider px-5 py-3">
                    Coût
                  </th>
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition-colors"
                    onClick={() => setLocation(`/calls/${c.id}`)}
                  >
                    <td className="px-5 py-3 text-sm text-zinc-300">
                      {c.start_time
                        ? formatDateParis(c.start_time)
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-sm font-mono">
                      {c.from_number || "Masqué"}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {c.duration_seconds
                        ? formatDuration(c.duration_seconds)
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status] || statusColor.unknown}`}
                      >
                        {statusLabel[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-zinc-400">
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
            className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Précédent
          </button>
          <span className="text-sm text-zinc-500">
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Suivant <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
