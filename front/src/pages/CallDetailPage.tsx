import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Clock, User, MessageSquareText } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateParis, formatDuration } from "@/lib/dates";

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

const statusLabel: Record<string, string> = {
  completed: "Répondu",
  missed: "Manqué",
  failed: "Échoué",
  ongoing: "En cours",
  unknown: "Inconnu",
};

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
  if (!call) return (
    <div className="text-center py-12">
      <p className="text-text-muted mb-4">Appel introuvable</p>
      <Link href="/calls"><Button variant="outline">Retour à l'historique</Button></Link>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/calls">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">Détail de l'appel</h2>
      </div>

      {/* Call info summary */}
      <Card className="bg-surface border-border">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-text-muted uppercase tracking-wider flex items-center gap-1">
                <Phone className="w-3 h-3" /> Appelant
              </p>
              <p className="font-mono font-medium">{call.caller_number || "Numéro masqué"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-text-muted uppercase tracking-wider">Statut</p>
              <Badge className={statusColors[call.status] || statusColors.unknown}>
                {statusLabel[call.status] || call.status}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-text-muted uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> Durée
              </p>
              <p className="font-medium">{call.duration ? formatDuration(call.duration) : "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-text-muted uppercase tracking-wider">Date</p>
              <p className="text-sm">{call.started_at ? formatDateParis(call.started_at) : "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcription — the main feature for salon owners */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-accent" />
            Conversation
          </CardTitle>
          <p className="text-sm text-text-muted">
            Ce qu'a dit votre réceptionniste à votre client
          </p>
        </CardHeader>
        <CardContent>
          {call.transcription ? (
            <div className="bg-background rounded-lg p-4 border border-border">
              <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                {call.transcription}
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquareText className="w-10 h-10 mx-auto mb-3 text-text-muted opacity-40" />
              <p className="text-text-muted">Aucune transcription disponible pour cet appel</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recording */}
      {call.recording_url && (
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle>Enregistrement audio</CardTitle>
          </CardHeader>
          <CardContent>
            <audio controls className="w-full" src={call.recording_url}>
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
