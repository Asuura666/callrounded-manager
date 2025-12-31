import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BarChart3, Calendar, Loader2, AlertCircle, Phone } from "lucide-react";
import { Link } from "wouter";

interface Call {
  id: string;
  externalCallId: string;
  agentId: string;
  callerNumber?: string;
  status: "completed" | "failed" | "missed" | "ongoing";
  duration?: number;
  transcription?: string;
  recordingUrl?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

export default function Calls() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAgent, setFilterAgent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterAgent) params.append("agent_id", filterAgent);
      if (filterStatus) params.append("status_filter", filterStatus);
      
      const response = await fetch(`/api/calls?${params}`);
      if (!response.ok) throw new Error("Erreur lors du chargement des appels");
      const data = await response.json();
      setCalls(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: { className: "bg-green-100 text-green-800", label: "Complété" },
      failed: { className: "bg-red-100 text-red-800", label: "Échoué" },
      missed: { className: "bg-yellow-100 text-yellow-800", label: "Manqué" },
      ongoing: { className: "bg-blue-100 text-blue-800", label: "En cours" },
    };
    const variant = variants[status] || variants.completed;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("fr-FR");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des appels...</p>
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
              <BarChart3 className="w-6 h-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Historique des Appels</h1>
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

        <Card className="border-0 shadow-md mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent
                </label>
                <Input
                  placeholder="Filtrer par agent..."
                  value={filterAgent}
                  onChange={(e) => setFilterAgent(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Tous les statuts</option>
                  <option value="completed">Complété</option>
                  <option value="failed">Échoué</option>
                  <option value="missed">Manqué</option>
                  <option value="ongoing">En cours</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={fetchCalls} className="w-full bg-blue-600 hover:bg-blue-700">
                  Appliquer les filtres
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {calls.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="pt-12 pb-12 text-center">
              <Phone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucun appel trouvé</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {calls.map((call) => (
              <Link key={call.id} href={`/calls/${call.id}`}>
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {call.callerNumber || "Numéro inconnu"}
                          </span>
                          {getStatusBadge(call.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {formatDate(call.startedAt)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Durée: {formatDuration(call.duration)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(call.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
