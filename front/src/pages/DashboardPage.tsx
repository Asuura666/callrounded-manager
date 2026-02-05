import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PhoneCall, Clock, Phone, Euro, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { formatDateParis, formatDuration } from "@/lib/dates";

interface DashboardStats {
  total_agents: number;
  active_agents: number;
  total_calls: number;
  total_calls_today: number;
  completed_calls: number;
  missed_calls: number;
  failed_calls: number;
  avg_duration: number;
  total_cost: number;
  response_rate: number;
}

interface Call {
  id: string;
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

export function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchStats = () => {
    const params: Record<string, string> = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    api.get<DashboardStats>("/dashboard/stats", params).then(setStats).catch(() => {});
  };

  const fetchCalls = () => {
    api
      .get<CallsResponse>("/calls", { limit: "5" })
      .then((res) => setCalls(res.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchStats();
    fetchCalls();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fromDate, toDate]);

  const statCards = [
    {
      label: "Appels total",
      value: stats?.total_calls ?? "—",
      icon: PhoneCall,
      color: "text-blue-400",
    },
    {
      label: "Appels aujourd'hui",
      value: stats?.total_calls_today ?? "—",
      icon: Phone,
      color: "text-green-400",
    },
    {
      label: "Durée moyenne",
      value: stats ? formatDuration(stats.avg_duration) : "—",
      icon: Clock,
      color: "text-purple-400",
    },
    {
      label: "Coût total",
      value: stats ? formatCost(stats.total_cost) : "—",
      icon: Euro,
      color: "text-yellow-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          Bonjour, {user?.tenant_name || "votre salon"} 👋
        </h2>
        <p className="text-zinc-400 mt-1">
          Voici l'activité de votre réceptionniste
        </p>
      </div>

      {/* Date filter */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Du</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-[#1a1a1e] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Au</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-[#1a1a1e] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        {(fromDate || toDate) && (
          <button
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            className="text-sm text-blue-400 hover:text-blue-300 pb-2"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="bg-[#1a1a1e] border border-zinc-800 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">{s.label}</span>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Extra stats row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#1a1a1e] border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-sm text-zinc-400">Taux de réponse</div>
              <div className="text-lg font-bold">{stats.response_rate}%</div>
            </div>
          </div>
          <div className="bg-[#1a1a1e] border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
            <PhoneCall className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-sm text-zinc-400">Répondus</div>
              <div className="text-lg font-bold">{stats.completed_calls}</div>
            </div>
          </div>
          <div className="bg-[#1a1a1e] border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
            <Phone className="w-5 h-5 text-red-400" />
            <div>
              <div className="text-sm text-zinc-400">Manqués</div>
              <div className="text-lg font-bold">{stats.missed_calls}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent calls */}
      <div className="bg-[#1a1a1e] border border-zinc-800 rounded-xl">
        <div className="p-5 border-b border-zinc-800">
          <h3 className="text-lg font-semibold">Derniers appels</h3>
        </div>
        <div>
          {calls.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">
              Aucun appel pour le moment.
            </p>
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
                        {c.start_time ? formatDateParis(c.start_time) : "—"}
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
      </div>
    </div>
  );
}
