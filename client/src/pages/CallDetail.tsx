import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Phone, ArrowLeft, Download } from "lucide-react";
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
  updatedAt: string;
}

export default function CallDetail() {
  const [, params] = useRoute("/calls/:id");
  const [call, setCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) {
      fetchCall(params.id);
    }
  }, [params?.id]);

  const fetchCall = async (callId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/calls/${callId}`);
      if (!response.ok) throw new Error("Erreur lors du chargement de l'appel");
      const data = await response.json();
      setCall(data);
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
          <p className="text-gray-600">Chargement de l'appel...</p>
        </div>
      </div>
    );
  }

  if (error || !call) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/calls">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
            </Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error || "Appel non trouvé"}</p>
            </CardContent>
          </Card>
        </main>
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
              <h1 className="text-2xl font-bold text-gray-900">Détail de l'Appel</h1>
            </div>
            <Link href="/calls">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Numéro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{call.callerNumber || "N/A"}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Durée</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{formatDuration(call.duration)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Statut</CardTitle>
            </CardHeader>
            <CardContent>
              {getStatusBadge(call.status)}\n            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-md mb-6">
          <CardHeader>
            <CardTitle>Informations de l'Appel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Date de début</p>
                <p className="text-gray-900">{formatDate(call.startedAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Date de fin</p>
                <p className="text-gray-900">{formatDate(call.endedAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">ID d'appel externe</p>
                <p className="text-gray-900 font-mono text-sm">{call.externalCallId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">ID d'agent</p>
                <p className="text-gray-900 font-mono text-sm">{call.agentId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {call.transcription && (
          <Card className="border-0 shadow-md mb-6">
            <CardHeader>
              <CardTitle>Transcription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">{call.transcription}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {call.recordingUrl && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Enregistrement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fichier audio disponible</p>
                  <p className="text-xs text-gray-500 mt-1">Cliquez pour télécharger</p>
                </div>
                <a href={call.recordingUrl} download>
                  <Button className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Télécharger
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
