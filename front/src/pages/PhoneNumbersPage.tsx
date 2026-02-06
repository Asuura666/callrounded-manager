import { Phone, ExternalLink, Shield } from "lucide-react";

export function PhoneNumbersPage() {
  return (
    <div className="space-y-6">
      <div style={{ animation: "slide-up 0.5s ease-out forwards" }}>
        <h2 className="text-2xl font-bold text-navy font-heading">Numéros de téléphone</h2>
        <p className="text-text-secondary mt-1">Les numéros sur lesquels votre réceptionniste répond</p>
      </div>

      <div className="bg-white border border-[#E4E7ED] rounded-xl overflow-hidden shadow-sm" style={{ animation: "scale-in 0.3s ease-out forwards" }}>
        <div className="bg-gradient-to-r from-navy to-navy-light p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div style={{ animation: "float 3s ease-in-out infinite" }} className="absolute top-4 left-10"><Phone className="w-8 h-8 text-white" /></div>
            <div style={{ animation: "float 3s ease-in-out infinite", animationDelay: "1s" }} className="absolute bottom-4 right-12"><Shield className="w-6 h-6 text-white" /></div>
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-gold/30">
              <Phone className="w-10 h-10 text-gold" />
            </div>
            <h3 className="text-xl font-semibold text-white font-heading">Gestion des numéros</h3>
          </div>
        </div>
        
        <div className="p-8 text-center">
          <div className="max-w-lg mx-auto">
            <p className="text-text-secondary mb-6 leading-relaxed">
              Les numéros de téléphone sont gérés depuis le dashboard CallRounded. Connectez-vous pour configurer vos numéros.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F7F8FA]">
                <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-sm font-medium text-navy">Numéros dédiés</p>
                  <p className="text-xs text-text-muted">Numéros français professionnels</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F7F8FA]">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-navy">Sécurisé</p>
                  <p className="text-xs text-text-muted">Transfert d'appel sécurisé</p>
                </div>
              </div>
            </div>
            
            <a href="https://app.callrounded.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 text-sm rounded-lg btn-gold">
              <ExternalLink className="w-4 h-4" />
              Ouvrir CallRounded
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
