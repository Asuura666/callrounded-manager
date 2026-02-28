import { BellRing, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function AlertsConfig() {
  return (
    <div className="space-y-6">
      <div style={{ animation: "slide-up 0.5s ease-out forwards" }}>
        <h1 className="text-2xl font-bold text-navy font-heading flex items-center gap-2">
          <BellRing className="w-6 h-6 text-gold" />
          Alertes intelligentes
        </h1>
        <p className="text-text-muted mt-1">Configurez des alertes automatiques pour rester informé</p>
      </div>

      <Card className="border-gold/20">
        <CardContent className="py-16 text-center">
          <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6" style={{ animation: "float 3s ease-in-out infinite" }}>
            <Construction className="w-10 h-10 text-gold" />
          </div>
          <h2 className="text-xl font-semibold text-navy font-heading mb-3">Coming Soon</h2>
          <p className="text-text-muted max-w-md mx-auto">
            Les alertes intelligentes arrivent bientôt ! Vous pourrez configurer des notifications
            automatiques pour les appels manqués, les temps d'attente élevés et plus encore.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gold/10 text-gold">
              Appels manqués
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gold/10 text-gold">
              Temps d'attente
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gold/10 text-gold">
              Taux de complétion
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
