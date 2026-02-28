import { useState, useEffect } from "react";
import { Phone, Shield, Activity } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PhoneNumber {
  number: string;
  agent_id: string | null;
  agent_name: string | null;
  call_count: number;
  last_call: string | null;
  status: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PhoneNumbersPage() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<PhoneNumber[]>("/phone-numbers")
      .then(setNumbers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div style={{ animation: "slide-up 0.5s ease-out forwards" }}>
        <h2 className="text-2xl font-bold text-navy font-heading flex items-center gap-2">
          <Phone className="w-6 h-6 text-gold" />
          Numéros de téléphone
        </h2>
        <p className="text-text-secondary mt-1">Les numéros sur lesquels votre réceptionniste répond</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
        </div>
      ) : numbers.length === 0 ? (
        <Card className="border-gold/20">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-navy/40" />
            </div>
            <p className="text-text-muted">Aucun numéro détecté dans l'historique des appels.</p>

          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {numbers.map((num) => (
            <Card key={num.number} className="border-gold/20 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-gold" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-navy font-mono">{num.number}</span>
                      <Badge className="bg-green-100 text-green-700 border-0">
                        <Activity className="w-3 h-3 mr-1" />
                        Actif
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-text-muted">
                      {num.agent_name && (
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {num.agent_name}
                        </span>
                      )}
                      <span>{num.call_count} appel{num.call_count !== 1 ? "s" : ""} reçu{num.call_count !== 1 ? "s" : ""}</span>
                      {num.last_call && (
                        <span>Dernier : {formatDate(num.last_call)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          

        </div>
      )}
    </div>
  );
}
