import { Phone, ExternalLink } from "lucide-react";

export function PhoneNumbersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-navy" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Numéros de téléphone
        </h2>
        <p className="text-text-secondary mt-1">
          Les numéros sur lesquels votre réceptionniste répond
        </p>
      </div>

      <div className="bg-white border border-[#E4E7ED] rounded-xl p-12 text-center shadow-sm">
        <div className="w-20 h-20 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-10 h-10 text-navy/40" />
        </div>
        <h3 className="text-lg font-semibold text-navy mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Aucun numéro configuré
        </h3>
        <p className="text-text-secondary max-w-md mx-auto mb-6">
          Les numéros de téléphone sont gérés depuis le dashboard CallRounded.
          Connectez-vous à votre espace CallRounded pour configurer vos numéros.
        </p>
        <a
          href="https://app.callrounded.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg bg-gold text-navy font-semibold hover:bg-gold-light shadow-md hover:shadow-lg transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          Ouvrir CallRounded
        </a>
      </div>
    </div>
  );
}
