import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Scissors, Clock3, Euro } from "lucide-react";
import { api } from "@/lib/api";

interface KnowledgeBase {
  id: string;
  agent_external_id: string | null;
  name: string;
  description: string | null;
  source_count: number;
}

export function KnowledgeBasesPage() {
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<KnowledgeBase[]>("/knowledge-bases").then(setKbs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-text-muted text-center py-12">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Base de connaissances</h2>
        <p className="text-text-secondary mt-1">
          Ce que votre réceptionniste sait sur votre salon
        </p>
      </div>

      {kbs.length === 0 ? (
        <Card className="bg-surface border-border">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-40" />
            <h3 className="text-lg font-medium mb-2">Aucune base de connaissances</h3>
            <p className="text-text-muted max-w-lg mx-auto">
              La base de connaissances contient les informations que votre réceptionniste utilise pour répondre à vos clients : vos services, tarifs, horaires d'ouverture, etc.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Badge variant="outline" className="text-text-muted border-border py-1.5 px-3">
                <Scissors className="w-3.5 h-3.5 mr-1.5" /> Services & prestations
              </Badge>
              <Badge variant="outline" className="text-text-muted border-border py-1.5 px-3">
                <Euro className="w-3.5 h-3.5 mr-1.5" /> Tarifs
              </Badge>
              <Badge variant="outline" className="text-text-muted border-border py-1.5 px-3">
                <Clock3 className="w-3.5 h-3.5 mr-1.5" /> Horaires d'ouverture
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kbs.map((kb) => (
            <Card key={kb.id} className="bg-surface border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-accent" />
                  {kb.name || "Base de connaissances"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-text-secondary line-clamp-3">
                  {kb.description || "Informations sur votre salon utilisées par le réceptionniste pour répondre aux questions de vos clients."}
                </p>
                <Badge variant="outline" className="text-text-muted border-border">
                  {kb.source_count} source{kb.source_count !== 1 ? "s" : ""} d'information
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
