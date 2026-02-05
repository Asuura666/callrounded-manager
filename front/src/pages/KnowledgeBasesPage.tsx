import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Database } from "lucide-react";
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
      <h2 className="text-2xl font-bold">Bases de connaissances</h2>

      {kbs.length === 0 ? (
        <Card className="bg-surface border-border">
          <CardContent className="py-12 text-center text-text-muted">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>Aucune base de connaissances</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kbs.map((kb) => (
            <Card key={kb.id} className="bg-surface border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="w-4 h-4 text-accent" />
                  {kb.name || kb.id}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-text-secondary line-clamp-2">
                  {kb.description || "Pas de description"}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-text-muted border-border">
                    {kb.source_count} source{kb.source_count !== 1 ? "s" : ""}
                  </Badge>
                  {kb.agent_external_id && (
                    <span className="text-xs text-text-muted">Agent: {kb.agent_external_id}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
