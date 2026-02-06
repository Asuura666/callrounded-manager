import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PhoneCall, Clock, Phone, Euro, TrendingUp, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { formatDateParis, formatDuration } from "@/lib/dates";
import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";

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

// Circular Progress Component for Response Rate
function CircularProgress({ value, size = 80 }: { value: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E4E7ED"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#C9A24D"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-navy">{value}%</span>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
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
      .catch(() => {})
      .finally(() => setLoading(false));
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div style={{ animation: "fade-in 0.4s ease-out forwards" }}>
          <div className="h-8 w-64 bg-[#E4E7ED] rounded skeleton-shimmer mb-2" />
          <div className="h-5 w-48 bg-[#E4E7ED] rounded skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{ animation: "slide-up 0.5s ease-out forwards" }}>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-navy font-heading">
            Bonjour, {user?.tenant_name || "votre salon"}
          </h2>
          <Sparkles className="w-6 h-6 text-gold animate-pulse" />
        </div>
        <p className="text-text-secondary mt-1 font-body">
          Voici l'activité de votre réceptionniste IA
        </p>
      </div>

      {/* Date filter */}
      <div 
        className="flex flex-wrap gap-3 items-end"
        style={{ animation: "slide-up 0.5s ease-out forwards", animationDelay: "100ms", opacity: 0, animationFillMode: "forwards" }}
      >
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Du</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-white border border-[#D8DCE4] rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase tracking-wider">Au</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-white border border-[#D8DCE4] rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
          />
        </div>
        {(fromDate || toDate) && (
          <button
            onClick={() => { setFromDate(""); setToDate(""); }}
            className="text-sm text-gold hover:text-gold-dark pb-2 font-medium transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div
            key={s.label}
            className="bg-white border border-[#E4E7ED] rounded-xl p-5 card-hover"
            style={{ animation: "slide-up 0.5s ease-out forwards", animationDelay: `${(i + 2) * 100}ms`, opacity: 0, animationFillMode: "forwards" }}
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
        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          style={{ animation: "slide-up 0.5s ease-out forwards", animationDelay: "400ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="bg-white border border-[#E4E7ED] rounded-xl p-5 card-hover flex items-center gap-4">
            <CircularProgress value={stats.response_rate} />
            <div>
              <div className="text-sm text-text-secondary font-medium">Taux de réponse</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">Performance</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-[#E4E7ED] rounded-xl p-5 card-hover flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm text-text-secondary font-medium">Répondus</div>
              <div className="text-2xl font-bold text-navy">{stats.completed_calls}</div>
            </div>
          </div>
          
          <div className="bg-white border border-[#E4E7ED] rounded-xl p-5 card-hover flex items-center gap-4">
            <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center">
              <XCircle className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <div className="text-sm text-text-secondary font-medium">Manqués</div>
              <div className="text-2xl font-bold text-navy">{stats.missed_calls}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent calls */}
      <div 
        className="bg-white border border-[#E4E7ED] rounded-xl shadow-sm overflow-hidden"
        style={{ animation: "slide-up 0.5s ease-out forwards", animationDelay: "500ms", opacity: 0, animationFillMode: "forwards" }}
      >
        <div className="p-5 border-b border-[#E4E7ED] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-navy font-heading">
            Derniers appels
          </h3>
          <button 
            onClick={() => setLocation("/calls")}
            className="text-sm text-gold hover:text-gold-dark font-medium transition-colors"
          >
            Voir tout →
          </button>
        </div>
        <div>
          {calls.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4" style={{ animation: "float 3s ease-in-out infinite" }}>
                <Phone className="w-8 h-8 text-navy/40" />
              </div>
              <p className="text-text-secondary font-medium">Aucun appel pour le moment</p>
              <p className="text-sm text-text-muted mt-1">Les appels de vos clients apparaîtront ici</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-navy">
                    <th className="text-left text-xs text-white/80 uppercase tracking-wider px-5 py-3 font-semibold">Date</th>
                    <th className="text-left text-xs text-white/80 uppercase tracking-wider px-5 py-3 font-semibold">Appelant</th>
                    <th className="text-left text-xs text-white/80 uppercase tracking-wider px-5 py-3 font-semibold">Durée</th>
                    <th className="text-left text-xs text-white/80 uppercase tracking-wider px-5 py-3 font-semibold">Statut</th>
                    <th className="text-left text-xs text-white/80 uppercase tracking-wider px-5 py-3 font-semibold">Coût</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((c, idx) => (
                    <tr
                      key={c.id}
                      className={`border-b border-[#E4E7ED] table-row-hover cursor-pointer ${idx % 2 === 1 ? "bg-[#F9FAFB]" : ""}`}
                      onClick={() => setLocation(`/calls/${c.id}`)}
                    >
                      <td className="px-5 py-3 text-sm text-text-secondary">{c.start_time ? formatDateParis(c.start_time) : "—"}</td>
                      <td className="px-5 py-3 text-sm font-mono text-navy font-medium">{c.from_number || "Masqué"}</td>
                      <td className="px-5 py-3 text-sm text-text-secondary">{c.duration_seconds ? formatDuration(c.duration_seconds) : "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor[c.status] || statusColor.unknown}`}>
                          {statusLabel[c.status] || c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-text-secondary">{formatCost(c.cost)}</td>
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
