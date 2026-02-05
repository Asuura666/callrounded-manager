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
      iconBg: "bg-navy/10",
      iconColor: "text-navy",
    },
    {
      label: "Appels aujourd'hui",
      value: stats?.total_calls_today ?? "—",
      icon: Phone,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Durée moyenne",
      value: stats ? formatDuration(stats.avg_duration) : "—",
      icon: Clock,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      label: "Coût total",
      value: stats ? formatCost(stats.total_cost) : "—",
      icon: Euro,
      iconBg: "bg-gold/10",
      iconColor: "text-gold-dark",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-navy" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Bonjour, {user?.tenant_name || "votre salon"} 👋
        </h2>
        <p className="text-text-secondary mt-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Voici l'activité de votre réceptionniste
        </p>
      </div>

      {/* Date filter */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Du</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-white border border-[#D8DCE4] rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Au</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-white border border-[#D8DCE4] rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
          />
        </div>
        {(fromDate || toDate) && (
          <button
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            className="text-sm text-gold hover:text-gold-dark pb-2 font-medium"
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
            className="bg-white border border-[#E4E7ED] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-text-secondary font-medium">{s.label}</span>
              <div className={`w-9 h-9 ${s.iconBg} rounded-lg flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-navy">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Extra stats row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E4E7ED] rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm text-text-secondary font-medium">Taux de réponse</div>
              <div className="text-lg font-bold text-navy">{stats.response_rate}%</div>
            </div>
          </div>
          <div className="bg-white border border-[#E4E7ED] rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-navy/10 rounded-lg flex items-center justify-center">
              <PhoneCall className="w-5 h-5 text-navy" />
            </div>
            <div>
              <div className="text-sm text-text-secondary font-medium">Répondus</div>
              <div className="text-lg font-bold text-navy">{stats.completed_calls}</div>
            </div>
          </div>
          <div className="bg-white border border-[#E4E7ED] rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="text-sm text-text-secondary font-medium">Manqués</div>
              <div className="text-lg font-bold text-navy">{stats.missed_calls}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent calls */}
      <div className="bg-white border border-[#E4E7ED] rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E4E7ED]">
          <h3 className="text-lg font-semibold text-navy" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Derniers appels
          </h3>
        </div>
        <div>
          {calls.length === 0 ? (
            <p className="text-text-muted text-center py-8">
              Aucun appel pour le moment.
            </p>
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
                        {c.start_time ? formatDateParis(c.start_time) : "—"}
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
      </div>
    </div>
  );
}
