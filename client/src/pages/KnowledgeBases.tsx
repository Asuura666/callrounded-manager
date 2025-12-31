import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Loader2, AlertCircle, Trash2, Plus } from "lucide-react";
import { Link } from "wouter";

interface Source {
  id: string;
  externalSourceId: string;
  fileName?: string;
  fileUrl?: string;
  type: "file" | "url" | "text";
  status: "ingesting" | "ready" | "failed";
  createdAt: string;
}

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  sourceCount: number;
  externalKnowledgeBaseId: string;
  agentId?: string;
  sources: Source[];
  createdAt: string;
}

export default function KnowledgeBases() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedKb, setExpandedKb] = useState<string | null>(null);
  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null);

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  const fetchKnowledgeBases = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/knowledge-bases");
      if (!response.ok) throw new Error("Erreur lors du chargement des bases");
      const data = await response.json();
      setKnowledgeBases(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const deleteSource = async (kbId: string, sourceId: string) => {
    try {
      setDeletingSourceId(sourceId);
      const response = await fetch(`/api/knowledge-bases/${kbId}/sources`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_ids: [sourceId] }),
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");
      
      setKnowledgeBases(knowledgeBases.map(kb => 
        kb.id === kbId 
          ? {
              ...kb,
              sources: kb.sources.filter(s => s.id !== sourceId),
              sourceCount: kb.sourceCount - 1,
            }
          : kb
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setDeletingSourceId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      ingesting: { className: "bg-blue-100 text-blue-800", label: "En cours" },
      ready: { className: "bg-green-100 text-green-800", label: "Prêt" },
      failed: { className: "bg-red-100 text-red-800", label: "Erreur" },
    };
    const variant = variants[status] || variants.ingesting;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des bases de connaissances...</p>
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
              <Bell className="w-6 h-6 text-orange-600" />
              <h1 className="text-2xl font-bold text-gray-900">Bases de Connaissances</h1>
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

        {knowledgeBases.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="pt-12 pb-12 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Aucune base de connaissances disponible</p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Créer une base
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {knowledgeBases.map((kb) => (
              <Card key={kb.id} className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{kb.name}</CardTitle>
                      {kb.description && (
                        <CardDescription>{kb.description}</CardDescription>
                      )}
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      {kb.sourceCount} source{kb.sourceCount !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <button
                    onClick={() => setExpandedKb(expandedKb === kb.id ? null : kb.id)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 mb-4"
                  >
                    {expandedKb === kb.id ? "Masquer les sources" : "Afficher les sources"}
                  </button>

                  {expandedKb === kb.id && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      {kb.sources.length === 0 ? (
                        <p className="text-sm text-gray-600">Aucune source</p>
                      ) : (
                        kb.sources.map((source) => (
                          <div
                            key={source.id}
                            className="flex items-start justify-between bg-gray-50 p-3 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {source.fileName || "Source sans nom"}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className="text-xs" variant="outline">
                                  {source.type}
                                </Badge>
                                {getStatusBadge(source.status)}
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteSource(kb.id, source.id)}
                              disabled={deletingSourceId === source.id}
                            >
                              {deletingSourceId === source.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
