import { Phone, ExternalLink } from "lucide-react";

export function PhoneNumbersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Numéros de téléphone</h2>
        <p className="text-zinc-400 mt-1">
          Les numéros sur lesquels votre réceptionniste répond
        </p>
      </div>

      <div className="bg-[#1a1a1e] border border-zinc-800 rounded-xl p-12 text-center">
        <Phone className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
        <h3 className="text-lg font-medium mb-2">Aucun numéro configuré</h3>
        <p className="text-zinc-500 max-w-md mx-auto mb-6">
          Les numéros de téléphone sont gérés depuis le dashboard CallRounded.
          Connectez-vous à votre espace CallRounded pour configurer vos numéros.
        </p>
        <a
          href="https://app.callrounded.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Ouvrir CallRounded
        </a>
      </div>
    </div>
  );
}
