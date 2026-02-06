import { BookOpen, ExternalLink, Brain, Clock, Scissors } from "lucide-react";

export function KnowledgeBasesPage() {
  return (
    <div className="space-y-6">
      <div style={{ animation: "slide-up 0.5s ease-out forwards" }}>
        <h2 className="text-2xl font-bold text-navy font-heading">Base de connaissances</h2>
        <p className="text-text-secondary mt-1">Ce que votre réceptionniste sait sur votre salon</p>
      </div>

      <div className="bg-white border border-[#E4E7ED] rounded-xl overflow-hidden shadow-sm" style={{ animation: "scale-in 0.3s ease-out forwards" }}>
        <div className="bg-gradient-to-r from-navy to-navy-light p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div style={{ animation: "float 3s ease-in-out infinite" }} className="absolute top-4 left-10"><Brain className="w-8 h-8 text-white" /></div>
            <div style={{ animation: "float 3s ease-in-out infinite", animationDelay: "1s" }} className="absolute bottom-4 right-12"><Scissors className="w-6 h-6 text-white" /></div>
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-gold/30">
              <BookOpen className="w-10 h-10 text-gold" />
            </div>
            <h3 className="text-xl font-semibold text-white font-heading">Intelligence de votre salon</h3>
          </div>
        </div>
        
        <div className="p-8 text-center">
          <div className="max-w-lg mx-auto">
            <p className="text-text-secondary mb-6 leading-relaxed">
              La base de connaissances contient toutes les informations sur votre salon : services, tarifs, horaires.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E4E7ED]">
                <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Scissors className="w-5 h-5 text-gold" />
                </div>
                <p className="text-sm font-medium text-navy">Services</p>
                <p className="text-xs text-text-muted mt-1">Coupes, soins, colorations...</p>
              </div>
              <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E4E7ED]">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg">💰</span>
                </div>
                <p className="text-sm font-medium text-navy">Tarifs</p>
                <p className="text-xs text-text-muted mt-1">Prix et forfaits</p>
              </div>
              <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E4E7ED]">
                <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-5 h-5 text-violet-600" />
                </div>
                <p className="text-sm font-medium text-navy">Horaires</p>
                <p className="text-xs text-text-muted mt-1">Ouverture & fermeture</p>
              </div>
            </div>
            
            <p className="text-sm text-text-muted mb-6">Pour modifier les informations, rendez-vous sur CallRounded.</p>
            
            <a href="https://app.callrounded.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 text-sm rounded-lg btn-gold">
              <ExternalLink className="w-4 h-4" />
              Gérer les connaissances
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
