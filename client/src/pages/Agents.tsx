import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Plus, Power, Loader2, AlertCircle } from "lucide-react";
import { Link } from "wouter";

interface Agent {
  id: string;
  name: string;
  status: "active" | "inactive" | "paused";
  externalId: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/agents");
      if (!response.ok) throw new Error("Erreur lors du chargement des agents");
      const data = await response.json();
      setAgents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const toggleAgentStatus = async (agentId: string, currentStatus: string) => {
    try {
      setTogglingId(agentId);
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const response = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Erreur lors de la mise à jour");
      
      setAgents(agents.map(a => 
        a.id === agentId ? { ...a, status: newStatus as any } : a
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setTogglingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { className: "bg-green-100 text-green-800", label: "Actif" },
      inactive: { className: "bg-gray-100 text-gray-800", label: "Inactif" },
      paused: { className: "bg-yellow-100 text-yellow-800", label: "Suspendu" },
    };
    const variant = variants[status] || variants.inactive;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Agents Téléphoniques</h1>
            </div>
            <Link href="/">
              <Button variant="outline">Retour</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {agents.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="pt-12 pb-12 text-center">
              <Phone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Aucun agent disponible</p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Créer un agent
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        ID: {agent.externalId.slice(0, 8)}...
                      </CardDescription>
                    </div>
                    {getStatusBadge(agent.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {agent.description && (
                    <p className="text-sm text-gray-600 mb-4">{agent.description}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant={agent.status === "active" ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleAgentStatus(agent.id, agent.status)}
                      disabled={togglingId === agent.id}
                      className="flex-1"
                    >
                      {togglingId === agent.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Power className="w-4 h-4 mr-2" />
                      )}
                      {agent.status === "active" ? "Désactiver" : "Activer"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
