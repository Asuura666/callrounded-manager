import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, PhoneCall } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateParis, formatDuration } from "@/lib/dates";

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

export function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const limit = 20;

  const fetchCalls = () => {
    setLoading(true);
    const params: Record<string, string> = { limit: String(limit), offset: String(offset) };
    if (filterStatus) params.status = filterStatus;
    api.get<Call[]>("/calls", params).then(setCalls).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCalls(); }, [offset, filterStatus]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Historique des appels</h2>
        <p className="text-text-secondary mt-1">
          Tous les appels gérés par votre réceptionniste
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setOffset(0); }}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          <option value="">Tous les appels</option>
          <option value="completed">Répondus</option>
          <option value="missed">Manqués</option>
          <option value="ongoing">En cours</option>
        </select>
      </div>

      <Card className="bg-surface border-border">
        <CardContent className="p-0">
          {loading ? (
            <p className="text-text-muted text-center py-12">Chargement...</p>
          ) : calls.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <PhoneCall className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>Aucun appel dans l'historique</p>
              <p className="text-sm mt-1">Les appels de vos clients apparaîtront ici</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Appelant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
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
                      <TableCell>
                        <Link href={`/calls/${c.id}`}>
                          <Button variant="ghost" size="sm" className="text-accent">
                            Voir détail
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {calls.length > 0 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
          </Button>
          <span className="text-sm text-text-muted">Page {Math.floor(offset / limit) + 1}</span>
          <Button variant="outline" size="sm" disabled={calls.length < limit} onClick={() => setOffset(offset + limit)}>
            Suivant <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
