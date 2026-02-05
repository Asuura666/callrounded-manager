import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Headset, Pause, Play } from "lucide-react";
import { api } from "@/lib/api";

interface Agent {
  id: string;
  name: string;
  status: string;
  description: string | null;
}

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchAgents = () => {
    api.get<Agent[]>("/agents").then(setAgents).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAgents(); }, []);

  const toggleStatus = async (agent: Agent) => {
    const newStatus = agent.status === "active" ? "inactive" : "active";
    setToggling(agent.id);
    try {
      await api.patch(`/agents/${agent.id}`, { status: newStatus });
      setAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, status: newStatus } : a)));
    } catch {} finally {
      setToggling(null);
    }
  };

  if (loading) return <div className="text-text-muted text-center py-12">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mon réceptionniste</h2>
        <p className="text-text-secondary mt-1">
          Gérez votre assistant téléphonique IA
        </p>
      </div>

      {agents.length === 0 ? (
        <Card className="bg-surface border-border">
          <CardContent className="py-12 text-center">
            <Headset className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-40" />
            <h3 className="text-lg font-medium mb-2">Aucun réceptionniste configuré</h3>
            <p className="text-text-muted max-w-md mx-auto">
              Votre réceptionniste IA apparaîtra ici une fois configuré. Il répondra aux appels de vos clients et prendra les rendez-vous automatiquement.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {agents.map((agent) => {
            const isActive = agent.status === "active";
            return (
              <Card key={agent.id} className="bg-surface border-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? "bg-success/20" : "bg-zinc-500/20"}`}>
                        <Headset className={`w-6 h-6 ${isActive ? "text-success" : "text-zinc-400"}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{agent.name || "Réceptionniste"}</CardTitle>
                        <Badge className={`mt-1 ${isActive ? "bg-success/20 text-success" : "bg-zinc-500/20 text-zinc-400"}`}>
                          {isActive ? (
                            <><Play className="w-3 h-3 mr-1" /> Réceptionniste actif</>
                          ) : (
                            <><Pause className="w-3 h-3 mr-1" /> Réceptionniste en pause</>
                          )}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-muted">{isActive ? "Actif" : "Pause"}</span>
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => toggleStatus(agent)}
                        disabled={toggling === agent.id}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-text-secondary">
                    {agent.description || "Votre assistant téléphonique IA répond aux appels de vos clients, donne les informations sur votre salon et prend les rendez-vous."}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
