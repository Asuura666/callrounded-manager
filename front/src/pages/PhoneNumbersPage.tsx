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
      <div>
        <h2 className="text-2xl font-bold">Numéros de téléphone</h2>
        <p className="text-text-secondary mt-1">
          Les numéros sur lesquels votre réceptionniste répond
        </p>
      </div>

      {numbers.length === 0 ? (
        <Card className="bg-surface border-border">
          <CardContent className="py-12 text-center">
            <Phone className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-40" />
            <h3 className="text-lg font-medium mb-2">Aucun numéro configuré</h3>
            <p className="text-text-muted max-w-md mx-auto">
              Vos numéros de téléphone apparaîtront ici une fois votre réceptionniste configuré.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-surface border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Numéro</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {numbers.map((pn) => (
                    <TableRow key={pn.id} className="border-border">
                      <TableCell className="font-mono text-base">{pn.number}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[pn.status] || statusColors.inactive}>
                          {pn.status === "active" ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch checked={pn.status === "active"} onCheckedChange={() => toggleStatus(pn)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
