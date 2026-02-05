import { BookOpen, ExternalLink } from "lucide-react";

export function KnowledgeBasesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-navy" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Base de connaissances
        </h2>
        <p className="text-text-secondary mt-1">
          Ce que votre réceptionniste sait sur votre salon
        </p>
      </div>

      <div className="bg-white border border-[#E4E7ED] rounded-xl p-12 text-center shadow-sm">
        <div className="w-20 h-20 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-10 h-10 text-navy/40" />
        </div>
        <h3 className="text-lg font-semibold text-navy mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Base de connaissances intégrée
        </h3>
        <p className="text-text-secondary max-w-lg mx-auto mb-6">
          La base de connaissances de votre réceptionniste est directement
          intégrée dans sa configuration. Elle contient les informations sur
          votre salon : services, tarifs, horaires d'ouverture, etc.
        </p>
        <p className="text-text-muted text-sm">
          Pour modifier les connaissances de votre réceptionniste, rendez-vous
          sur le dashboard CallRounded.
        </p>
        <a
          href="https://app.callrounded.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 mt-4 text-sm rounded-lg bg-gold text-navy font-semibold hover:bg-gold-light shadow-md hover:shadow-lg transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          Ouvrir CallRounded
        </a>
      </div>
    </div>
  );
}
