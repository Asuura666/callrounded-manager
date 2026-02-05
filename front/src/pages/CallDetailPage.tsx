import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

interface CallDetail {
  id: string;
  agent_external_id: string | null;
  caller_number: string | null;
  duration: number | null;
  status: string;
  transcription: string | null;
  recording_url: string | null;
  started_at: string | null;
  ended_at: string | null;
}

const statusColors: Record<string, string> = {
  completed: "bg-success/20 text-success",
  missed: "bg-error/20 text-error",
  failed: "bg-error/20 text-error",
  ongoing: "bg-warning/20 text-warning",
  unknown: "bg-zinc-500/20 text-zinc-400",
};

export function CallDetailPage() {
  const params = useParams<{ id: string }>();
  const [call, setCall] = useState<CallDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      api.get<CallDetail>(`/calls/${params.id}`).then(setCall).catch(() => {}).finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) return <div className="text-text-muted text-center py-12">Chargement...</div>;
  if (!call) return <div className="text-text-muted text-center py-12">Appel introuvable</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/calls">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">D&eacute;tail de l'appel</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">ID</span>
              <span className="font-mono text-sm">{call.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Appelant</span>
              <span>{call.caller_number || "\u2014"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Agent</span>
              <span>{call.agent_external_id || "\u2014"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Statut</span>
              <Badge className={statusColors[call.status] || statusColors.unknown}>{call.status}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Dur&eacute;e</span>
              <span>{call.duration ? `${Math.round(call.duration)}s` : "\u2014"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">D&eacute;but</span>
              <span className="text-sm">{call.started_at ? new Date(call.started_at).toLocaleString("fr-FR") : "\u2014"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Fin</span>
              <span className="text-sm">{call.ended_at ? new Date(call.ended_at).toLocaleString("fr-FR") : "\u2014"}</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {call.recording_url && (
            <Card className="bg-surface border-border">
              <CardHeader>
                <CardTitle>Enregistrement</CardTitle>
              </CardHeader>
              <CardContent>
                <audio controls className="w-full" src={call.recording_url}>
                  Votre navigateur ne supporte pas l'audio.
                </audio>
              </CardContent>
            </Card>
          )}

          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle>Transcription</CardTitle>
            </CardHeader>
            <CardContent>
              {call.transcription ? (
                <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {call.transcription}
                </p>
              ) : (
                <p className="text-text-muted text-center py-4">Aucune transcription disponible</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
