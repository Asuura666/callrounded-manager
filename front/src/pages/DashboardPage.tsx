import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PhoneCall, PhoneOff, CalendarCheck, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatDateParis } from "@/lib/dates";

interface DashboardStats {
  total_agents: number;
  active_agents: number;
  total_calls_today: number;
  completed_calls: number;
  missed_calls: number;
  avg_duration: number;
  response_rate: number;
}

interface Call {
  id: string;
  agent_external_id: string | null;
  caller_number: string | null;
  duration: number | null;
  status: string;
  started_at: string | null;
}

const statusLabel: Record<string, string> = {
  completed: "Répondu",
  active: "En cours",
  missed: "Manqué",
  failed: "Échoué",
  ongoing: "En cours",
  unknown: "Inconnu",
};

const statusColors: Record<string, string> = {
  completed: "bg-success/20 text-success",
  active: "bg-success/20 text-success",
  missed: "bg-error/20 text-error",
  failed: "bg-error/20 text-error",
  ongoing: "bg-warning/20 text-warning",
  unknown: "bg-zinc-500/20 text-zinc-400",
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}min ${s}s`;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);

  useEffect(() => {
    api.get<DashboardStats>("/dashboard/stats").then(setStats).catch(() => {});
    api.get<Call[]>("/calls", { limit: "10" }).then(setCalls).catch(() => {});
  }, []);

  const statCards = [
    {
      label: "Appels répondus aujourd'hui",
      value: stats?.completed_calls ?? "—",
      icon: PhoneCall,
      color: "text-success",
    },
    {
      label: "Rendez-vous pris",
      value: "—",
      icon: CalendarCheck,
      color: "text-accent",
      subtitle: "Bientôt disponible",
    },
    {
      label: "Appels manqués",
      value: stats?.missed_calls ?? "—",
      icon: PhoneOff,
      color: "text-error",
    },
    {
      label: "Durée moyenne",
      value: stats ? formatDuration(stats.avg_duration) : "—",
      icon: Clock,
      color: "text-text-secondary",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          Bonjour, {user?.tenant_name || "votre salon"} 👋
        </h2>
        <p className="text-text-secondary mt-1">
          Voici l'activité de votre réceptionniste
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="bg-surface border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">{s.label}</CardTitle>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
              {s.subtitle && (
                <p className="text-xs text-text-muted mt-1">{s.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Derniers appels</CardTitle>
        </CardHeader>
        <CardContent>
          {calls.length === 0 ? (
            <p className="text-text-muted text-center py-8">
              Aucun appel pour le moment. Les appels apparaîtront ici dès que votre réceptionniste sera actif.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Appelant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((c) => (
                    <TableRow key={c.id} className="border-border">
                      <TableCell className="font-mono text-sm">{c.caller_number || "Numéro masqué"}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[c.status] || statusColors.unknown}>
                          {statusLabel[c.status] || c.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.duration ? formatDuration(c.duration) : "—"}</TableCell>
                      <TableCell className="text-text-muted text-sm">
                        {c.started_at ? formatDateParis(c.started_at) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
