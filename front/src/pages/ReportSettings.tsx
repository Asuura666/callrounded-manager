import { Mail, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ReportSettings() {
  return (
    <div className="space-y-6">
      <div style={{ animation: "slide-up 0.5s ease-out forwards" }}>
        <h1 className="text-2xl font-bold text-navy font-heading flex items-center gap-2">
          <Mail className="w-6 h-6 text-gold" />
          Rapport hebdomadaire
        </h1>
        <p className="text-text-muted mt-1">Recevez un résumé de performance chaque semaine</p>
      </div>

      <Card className="border-gold/20">
        <CardContent className="py-16 text-center">
          <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6" style={{ animation: "float 3s ease-in-out infinite" }}>
            <Construction className="w-10 h-10 text-gold" />
          </div>
          <h2 className="text-xl font-semibold text-navy font-heading mb-3">Coming Soon</h2>
          <p className="text-text-muted max-w-md mx-auto">
            Les rapports hebdomadaires automatiques arrivent bientôt ! Recevez un email chaque semaine
            avec un résumé complet de la performance de votre réceptionniste.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gold/10 text-gold">
              Résumé appels
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gold/10 text-gold">
              Analytics
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gold/10 text-gold">
              Recommandations IA
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
