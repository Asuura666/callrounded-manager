import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bot, PhoneCall, TrendingUp, Clock } from "lucide-react";
import { api } from "@/lib/api";

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

const statusColors: Record<string, string> = {
  completed: "bg-success/20 text-success",
  active: "bg-success/20 text-success",
  missed: "bg-error/20 text-error",
  failed: "bg-error/20 text-error",
  ongoing: "bg-warning/20 text-warning",
  unknown: "bg-zinc-500/20 text-zinc-400",
};

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);

  useEffect(() => {
    api.get<DashboardStats>("/dashboard/stats").then(setStats).catch(() => {});
    api.get<Call[]>("/calls", { limit: "10" }).then(setCalls).catch(() => {});
  }, []);

  const statCards = [
    { label: "Agents actifs", value: stats ? `${stats.active_agents}/${stats.total_agents}` : "\u2014", icon: Bot },
    { label: "Appels aujourd'hui", value: stats?.total_calls_today ?? "\u2014", icon: PhoneCall },
    { label: "Taux de r\u00e9ponse", value: stats ? `${stats.response_rate}%` : "\u2014", icon: TrendingUp },
    { label: "Dur\u00e9e moyenne", value: stats ? `${stats.avg_duration}s` : "\u2014", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="bg-surface border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">{s.label}</CardTitle>
              <s.icon className="w-4 h-4 text-text-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
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
            <p className="text-text-muted text-center py-8">Aucun appel r&eacute;cent</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Appelant</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dur&eacute;e</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((c) => (
                  <TableRow key={c.id} className="border-border">
                    <TableCell className="font-mono text-sm">{c.caller_number || "\u2014"}</TableCell>
                    <TableCell className="text-text-secondary">{c.agent_external_id || "\u2014"}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[c.status] || statusColors.unknown}>{c.status}</Badge>
                    </TableCell>
                    <TableCell>{c.duration ? `${Math.round(c.duration)}s` : "\u2014"}</TableCell>
                    <TableCell className="text-text-muted text-sm">
                      {c.started_at ? new Date(c.started_at).toLocaleString("fr-FR") : "\u2014"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
