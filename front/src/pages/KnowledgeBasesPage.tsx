import { BookOpen, ExternalLink } from "lucide-react";

export function KnowledgeBasesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Base de connaissances</h2>
        <p className="text-zinc-400 mt-1">
          Ce que votre réceptionniste sait sur votre salon
        </p>
      </div>

      <div className="bg-[#1a1a1e] border border-zinc-800 rounded-xl p-12 text-center">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
        <h3 className="text-lg font-medium mb-2">
          Base de connaissances intégrée
        </h3>
        <p className="text-zinc-500 max-w-lg mx-auto mb-6">
          La base de connaissances de votre réceptionniste est directement
          intégrée dans sa configuration. Elle contient les informations sur
          votre salon : services, tarifs, horaires d'ouverture, etc.
        </p>
        <p className="text-zinc-600 text-sm">
          Pour modifier les connaissances de votre réceptionniste, rendez-vous
          sur le dashboard CallRounded.
        </p>
        <a
          href="https://app.callrounded.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Ouvrir CallRounded
        </a>
      </div>
    </div>
  );
}
