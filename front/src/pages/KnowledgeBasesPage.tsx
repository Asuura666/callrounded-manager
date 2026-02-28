import { useState, useEffect } from "react";
import { BookOpen, Brain, Clock, Scissors, MapPin, Phone, Users, FileText, Shield, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SalonKnowledge {
  agent_name: string;
  greeting: string;
  language: string;
  address: string | null;
  phone: string | null;
  team: string[];
  personality: string[];
  rules: string[];
  has_knowledge_base: boolean;
  kb_name: string;
  kb_sources: number;
  kb_source_name: string;
}

export function KnowledgeBasesPage() {
  const [data, setData] = useState<SalonKnowledge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<SalonKnowledge[]>("/knowledge-bases")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const salon = data[0];

  return (
    <div className="space-y-6">
      <div style={{ animation: "slide-up 0.5s ease-out forwards" }}>
        <h2 className="text-2xl font-bold text-navy font-heading flex items-center gap-2">
          <Brain className="w-6 h-6 text-gold" />
          Base de connaissances
        </h2>
        <p className="text-text-secondary mt-1">Ce que votre réceptionniste sait sur votre salon</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
        </div>
      ) : !salon ? (
        <Card className="border-gold/20">
          <CardContent className="p-8 text-center">
            <Brain className="w-12 h-12 text-navy/20 mx-auto mb-4" />
            <p className="text-text-muted">Aucune donnée disponible.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Agent Info */}
          <Card className="border-gold/20 overflow-hidden">
            <div className="bg-gradient-to-r from-navy to-navy/90 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center ring-2 ring-gold/30">
                  <Sparkles className="w-7 h-7 text-gold" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white font-heading">{salon.agent_name}</h3>
                  <p className="text-white/60 text-sm mt-0.5">Langue : {salon.language.toUpperCase()}</p>
                </div>
              </div>
              {salon.greeting && (
                <div className="mt-4 bg-white/10 rounded-lg p-3">
                  <p className="text-sm text-white/80 italic">"{salon.greeting}"</p>
                </div>
              )}
            </div>
          </Card>

          {/* Salon Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {salon.address && (
              <Card className="border-gold/20 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy">Adresse</p>
                      <p className="text-sm text-text-muted mt-1">{salon.address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {salon.phone && (
              <Card className="border-gold/20 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy">Téléphone</p>
                      <p className="text-sm text-text-muted mt-1">{salon.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {salon.team.length > 0 && (
              <Card className="border-gold/20 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy">Équipe</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {salon.team.map((member, i) => (
                          <Badge key={i} variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                            {member}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {salon.has_knowledge_base && (
              <Card className="border-gold/20 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy">{salon.kb_name}</p>
                      <p className="text-sm text-text-muted mt-1">{salon.kb_sources} source indexée</p>
                      <Badge className="mt-2 bg-blue-50 text-blue-700 border-blue-200" variant="outline">
                        {salon.kb_source_name}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Personality & Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {salon.personality.length > 0 && (
              <Card className="border-gold/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-navy font-heading text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold" />
                    Personnalité
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {salon.personality.map((trait, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-text-muted">
                        <span className="w-1.5 h-1.5 bg-gold rounded-full shrink-0" />
                        {trait}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {salon.rules.length > 0 && (
              <Card className="border-gold/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-navy font-heading text-base flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gold" />
                    Règles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {salon.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                        <span className="text-gold font-bold shrink-0">{i + 1}.</span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>


        </div>
      )}
    </div>
  );
}
