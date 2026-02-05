import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bot } from "lucide-react";
import { api } from "@/lib/api";

interface Agent {
  id: string;
  name: string;
  status: string;
  description: string | null;
}

const statusBadge: Record<string, string> = {
  active: "bg-success/20 text-success",
  inactive: "bg-zinc-500/20 text-zinc-400",
};

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = () => {
    api.get<Agent[]>("/agents").then(setAgents).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAgents(); }, []);

  const toggleStatus = async (agent: Agent) => {
    const newStatus = agent.status === "active" ? "inactive" : "active";
    try {
      await api.patch(`/agents/${agent.id}`, { status: newStatus });
      setAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, status: newStatus } : a)));
    } catch {}
  };

  if (loading) return <div className="text-text-muted text-center py-12">Chargement...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Agents</h2>
      {agents.length === 0 ? (
        <Card className="bg-surface border-border">
          <CardContent className="py-12 text-center text-text-muted">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>Aucun agent configur&eacute;</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Card key={agent.id} className="bg-surface border-border">
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{agent.name || agent.id}</CardTitle>
                  <Badge className={statusBadge[agent.status] || statusBadge.inactive}>
                    {agent.status}
                  </Badge>
                </div>
                <Switch
                  checked={agent.status === "active"}
                  onCheckedChange={() => toggleStatus(agent)}
                />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary line-clamp-3">
                  {agent.description || "Pas de description"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
