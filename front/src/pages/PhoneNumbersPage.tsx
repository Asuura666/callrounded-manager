import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Phone } from "lucide-react";
import { api } from "@/lib/api";

interface PhoneNumber {
  id: string;
  agent_external_id: string | null;
  number: string;
  status: string;
}

const statusColors: Record<string, string> = {
  active: "bg-success/20 text-success",
  inactive: "bg-zinc-500/20 text-zinc-400",
};

export function PhoneNumbersPage() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<PhoneNumber[]>("/phone-numbers").then(setNumbers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (pn: PhoneNumber) => {
    const newStatus = pn.status === "active" ? "inactive" : "active";
    try {
      await api.patch(`/phone-numbers/${pn.id}`, { status: newStatus });
      setNumbers((prev) => prev.map((n) => (n.id === pn.id ? { ...n, status: newStatus } : n)));
    } catch {}
  };

  if (loading) return <div className="text-text-muted text-center py-12">Chargement...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Num&eacute;ros de t&eacute;l&eacute;phone</h2>

      {numbers.length === 0 ? (
        <Card className="bg-surface border-border">
          <CardContent className="py-12 text-center text-text-muted">
            <Phone className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>Aucun num&eacute;ro configur&eacute;</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-surface border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Num&eacute;ro</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {numbers.map((pn) => (
                  <TableRow key={pn.id} className="border-border">
                    <TableCell className="font-mono">{pn.number}</TableCell>
                    <TableCell className="text-text-secondary">{pn.agent_external_id || "\u2014"}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[pn.status] || statusColors.inactive}>{pn.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch checked={pn.status === "active"} onCheckedChange={() => toggleStatus(pn)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
