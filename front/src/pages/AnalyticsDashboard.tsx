import { useState, useEffect } from "react";
import { 
  Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, TrendingUp, 
  TrendingDown, Calendar, Users, BarChart3, Activity, AlertCircle 
} from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CallStats {
  total_calls: number;
  answered_calls: number;
  missed_calls: number;
  avg_duration_seconds: number;
  total_duration_seconds: number;
  calls_by_day: { date: string; count: number }[];
  calls_by_hour: { hour: number; count: number }[];
  top_outcomes: { outcome: string; count: number }[];
  trend_vs_last_week: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  color?: "gold" | "green" | "red" | "navy";
}

function StatCard({ title, value, subtitle, icon, trend, color = "navy" }: StatCardProps) {
  const colorClasses = {
    gold: "bg-gold/10 text-gold",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    navy: "bg-navy/10 text-navy",
  };

  return (
    <Card className="border-gold/20 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-muted font-medium">{title}</p>
            <p className="text-2xl font-bold text-navy mt-1">{value}</p>
            {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
            {trend !== undefined && trend !== 0 && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
                {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{trend >= 0 ? "+" : ""}{trend}% vs semaine dernière</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SimpleBarChart({ data, label }: { data: { label: string; value: number }[]; label: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  
  if (data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <div className="flex items-center justify-center h-32 text-text-muted">
        <p>Aucune donnée disponible</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-text-muted">{label}</p>}
      <div className="space-y-1.5">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-text-muted w-8 text-right">{item.label}</span>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-gold to-gold/70 rounded-full transition-all duration-500"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-navy w-8">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HourlyHeatmap({ data }: { data: { hour: number; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  
  return (
    <div>
      <p className="text-sm font-medium text-text-muted mb-3">Répartition horaire</p>
      <div className="flex gap-0.5">
        {Array.from({ length: 24 }, (_, hour) => {
          const hourData = data.find(d => d.hour === hour);
          const count = hourData?.count || 0;
          const intensity = count / max;
          
          return (
            <div
              key={hour}
              className="flex-1 h-8 rounded-sm cursor-pointer transition-transform hover:scale-110 group relative"
              style={{
                backgroundColor: count === 0 
                  ? "#f3f4f6" 
                  : `rgba(201, 162, 77, ${0.2 + intensity * 0.8})`,
              }}
              title={`${hour}h: ${count} appels`}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-navy text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {hour}h: {count}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-text-muted mt-1">
        <span>0h</span>
        <span>12h</span>
        <span>23h</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mb-4">
        <BarChart3 className="w-8 h-8 text-gold" />
      </div>
      <h3 className="text-lg font-semibold text-navy mb-2">Aucune donnée disponible</h3>
      <p className="text-text-muted max-w-md">
        Les statistiques apparaîtront ici une fois que votre réceptionniste IA aura traité des appels.
      </p>
    </div>
  );
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<CallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"week" | "month">("week");

  useEffect(() => {
    fetchStats();
  }, [period]);

  async function fetchStats() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<CallStats>(`/analytics/calls?period=${period}`);
      setStats(data);
      console.log("[Analytics] Stats loaded:", data);
    } catch (error) {
      console.error("[Analytics] Failed to fetch stats:", error);
      // Show empty state instead of mock data
      setStats({
        total_calls: 0,
        answered_calls: 0,
        missed_calls: 0,
        avg_duration_seconds: 0,
        total_duration_seconds: 0,
        calls_by_day: [],
        calls_by_hour: [],
        top_outcomes: [],
        trend_vs_last_week: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(seconds: number): string {
    if (seconds === 0) return "0m 0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  function formatTotalDuration(seconds: number): string {
    if (seconds === 0) return "0m";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (!stats || stats.total_calls === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-gold" />
            Analytics
          </h1>
          <p className="text-text-muted mt-1">Performance de votre réceptionniste IA</p>
        </div>
        <Card className="border-gold/20">
          <CardContent>
            <EmptyState />
          </CardContent>
        </Card>
      </div>
    );
  }

  const answerRate = stats.total_calls > 0 ? Math.round((stats.answered_calls / stats.total_calls) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-gold" />
            Analytics
          </h1>
          <p className="text-text-muted mt-1">Performance de votre réceptionniste IA</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod("week")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === "week" 
                ? "bg-gold text-navy" 
                : "bg-gray-100 text-text-muted hover:bg-gray-200"
            }`}
          >
            Cette semaine
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === "month" 
                ? "bg-gold text-navy" 
                : "bg-gray-100 text-text-muted hover:bg-gray-200"
            }`}
          >
            Ce mois
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total appels"
          value={stats.total_calls}
          icon={<Phone className="w-5 h-5" />}
          trend={stats.trend_vs_last_week}
          color="navy"
        />
        <StatCard
          title="Appels répondus"
          value={stats.answered_calls}
          subtitle={`${answerRate}% de taux de réponse`}
          icon={<PhoneIncoming className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Appels manqués"
          value={stats.missed_calls}
          icon={<PhoneMissed className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          title="Durée moyenne"
          value={formatDuration(stats.avg_duration_seconds)}
          subtitle={`Total: ${formatTotalDuration(stats.total_duration_seconds)}`}
          icon={<Clock className="w-5 h-5" />}
          color="gold"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calls by Day */}
        <Card className="border-gold/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-navy font-heading flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold" />
              Appels par jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={stats.calls_by_day.map(d => ({ label: d.date, value: d.count }))}
              label=""
            />
          </CardContent>
        </Card>

        {/* Call Outcomes */}
        <Card className="border-gold/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-navy font-heading flex items-center gap-2">
              <Activity className="w-5 h-5 text-gold" />
              Résultats des appels
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.top_outcomes.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-text-muted">
                <p>Aucune donnée disponible</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.top_outcomes.map((outcome, i) => {
                  const total = stats.top_outcomes.reduce((sum, o) => sum + o.count, 0);
                  const percentage = total > 0 ? Math.round((outcome.count / total) * 100) : 0;
                  
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-navy">{outcome.outcome}</span>
                          <span className="text-sm text-text-muted">{outcome.count} ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gold rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hourly Heatmap */}
      <Card className="border-gold/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-navy font-heading flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold" />
            Activité par heure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HourlyHeatmap data={stats.calls_by_hour} />
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-text-muted">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-gray-100"></div>
              <span>Aucun appel</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-gold/30"></div>
              <span>Faible</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-gold/60"></div>
              <span>Moyen</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-gold"></div>
              <span>Élevé</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Value Metrics */}
      <Card className="border-gold/20 bg-gradient-to-r from-navy to-navy/90">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-heading text-gold mb-1">💡 Valeur générée</h3>
              <p className="text-white/70 text-sm">Estimation basée sur vos appels traités</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-3xl font-bold text-white">{formatTotalDuration(stats.total_duration_seconds)}</p>
                  <p className="text-gold text-sm">Temps économisé</p>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div>
                  <p className="text-3xl font-bold text-white">{stats.top_outcomes.find(o => o.outcome === "RDV pris")?.count || 0}</p>
                  <p className="text-gold text-sm">RDV pris</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
