import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, PhoneCall } from "lucide-react";
import { api } from "@/lib/api";

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

export function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAgent, setFilterAgent] = useState("");
  const limit = 20;

  const fetchCalls = () => {
    setLoading(true);
    const params: Record<string, string> = { limit: String(limit), offset: String(offset) };
    if (filterStatus) params.status = filterStatus;
    if (filterAgent) params.agent_id = filterAgent;
    api.get<Call[]>("/calls", params).then(setCalls).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCalls(); }, [offset, filterStatus, filterAgent]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Appels</h2>

      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setOffset(0); }}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary"
        >
          <option value="">Tous les statuts</option>
          <option value="completed">Termin&eacute;</option>
          <option value="missed">Manqu&eacute;</option>
          <option value="ongoing">En cours</option>
          <option value="failed">&Eacute;chou&eacute;</option>
        </select>
        <Input
          placeholder="Filtrer par agent ID"
          value={filterAgent}
          onChange={(e) => { setFilterAgent(e.target.value); setOffset(0); }}
          className="bg-surface border-border w-48"
        />
      </div>

      <Card className="bg-surface border-border">
        <CardContent className="p-0">
          {loading ? (
            <p className="text-text-muted text-center py-12">Chargement...</p>
          ) : calls.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <PhoneCall className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>Aucun appel</p>
            </div>
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
                  <TableRow key={c.id} className="border-border cursor-pointer hover:bg-surface-hover">
                    <TableCell>
                      <Link href={`/calls/${c.id}`}>
                        <span className="font-mono text-sm text-accent hover:underline">{c.caller_number || c.id.slice(0, 8)}</span>
                      </Link>
                    </TableCell>
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

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Pr&eacute;c&eacute;dent
        </Button>
        <span className="text-sm text-text-muted">Page {Math.floor(offset / limit) + 1}</span>
        <Button variant="outline" size="sm" disabled={calls.length < limit} onClick={() => setOffset(offset + limit)}>
          Suivant <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
