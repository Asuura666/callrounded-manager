import { useState } from "react";
import { 
  Scissors, UtensilsCrossed, Stethoscope, Building2, Car, Dumbbell,
  Sparkles, Check, Copy, Wand2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface AgentTemplate {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  description: string;
  greeting: string;
  system_prompt: string;
  voice: string;
  language: string;
  features: string[];
  color: string;
}

const TEMPLATES: AgentTemplate[] = [
  {
    id: "salon-coiffure",
    name: "Salon de Coiffure",
    category: "Beauté",
    icon: <Scissors className="w-6 h-6" />,
    description: "Réceptionniste pour salon de coiffure, gère les RDV et renseigne sur les services.",
    greeting: "Bonjour et bienvenue chez [Nom du salon] ! Je suis votre assistante virtuelle. Comment puis-je vous aider aujourd'hui ?",
    system_prompt: `Tu es la réceptionniste virtuelle d'un salon de coiffure haut de gamme.

Tes missions :
- Prendre les rendez-vous (coupe, coloration, brushing, etc.)
- Renseigner sur les tarifs et services
- Gérer les annulations et modifications
- Recommander des créneaux selon la disponibilité

Ton ton : Professionnel, chaleureux, et attentionné. Utilise un vocabulaire élégant.

Informations importantes :
- Demande toujours le nom et numéro de téléphone du client
- Confirme le type de prestation souhaité
- Propose des créneaux alternatifs si indisponible`,
    voice: "emma",
    language: "fr-FR",
    features: ["Prise de RDV", "Tarifs", "Horaires", "Annulations"],
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "restaurant",
    name: "Restaurant",
    category: "Restauration",
    icon: <UtensilsCrossed className="w-6 h-6" />,
    description: "Gère les réservations de tables et répond aux questions sur le menu.",
    greeting: "Bienvenue au [Nom du restaurant] ! Je suis votre hôtesse virtuelle. Souhaitez-vous réserver une table ou avez-vous des questions sur notre carte ?",
    system_prompt: `Tu es l'hôtesse virtuelle d'un restaurant gastronomique.

Tes missions :
- Prendre les réservations de tables
- Renseigner sur le menu et les plats du jour
- Informer sur les allergènes et options végétariennes
- Gérer les événements privés et groupes

Ton ton : Élégant, accueillant, gourmand. Mets l'eau à la bouche !

Informations importantes :
- Demande le nombre de convives et l'heure souhaitée
- Note les allergies ou régimes spéciaux
- Propose les spécialités de la maison`,
    voice: "marie",
    language: "fr-FR",
    features: ["Réservations", "Menu", "Allergènes", "Événements"],
    color: "from-orange-500 to-amber-500",
  },
  {
    id: "cabinet-medical",
    name: "Cabinet Médical",
    category: "Santé",
    icon: <Stethoscope className="w-6 h-6" />,
    description: "Assistant pour cabinet médical, gère les RDV et urgences.",
    greeting: "Cabinet médical du Docteur [Nom], bonjour. Je suis l'assistante virtuelle. Comment puis-je vous aider ?",
    system_prompt: `Tu es l'assistante virtuelle d'un cabinet médical.

Tes missions :
- Prendre les rendez-vous de consultation
- Trier les urgences (rediriger vers le 15 si nécessaire)
- Renseigner sur les horaires et praticiens
- Gérer les renouvellements d'ordonnance

Ton ton : Professionnel, rassurant, empathique.

IMPORTANT :
- En cas d'urgence vitale, orienter vers le 15 (SAMU)
- Ne jamais donner de conseil médical
- Demander si c'est une première consultation
- Noter le motif de consultation`,
    voice: "emma",
    language: "fr-FR",
    features: ["RDV médicaux", "Urgences", "Ordonnances", "Praticiens"],
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "agence-immobiliere",
    name: "Agence Immobilière",
    category: "Immobilier",
    icon: <Building2 className="w-6 h-6" />,
    description: "Qualifie les prospects et planifie les visites de biens.",
    greeting: "Agence [Nom], bonjour ! Je suis votre conseillère virtuelle. Vous recherchez un bien à l'achat ou à la location ?",
    system_prompt: `Tu es la conseillère virtuelle d'une agence immobilière.

Tes missions :
- Qualifier les prospects (achat/location, budget, critères)
- Planifier des visites de biens
- Renseigner sur les biens disponibles
- Prendre les coordonnées pour rappel

Ton ton : Dynamique, professionnel, à l'écoute.

Questions clés à poser :
- Type de bien recherché (appartement, maison)
- Localisation souhaitée
- Budget maximum
- Nombre de pièces / surface`,
    voice: "marie",
    language: "fr-FR",
    features: ["Qualification", "Visites", "Estimations", "Suivi"],
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "garage-auto",
    name: "Garage Automobile",
    category: "Auto",
    icon: <Car className="w-6 h-6" />,
    description: "Gère les RDV d'entretien et réparations véhicules.",
    greeting: "Garage [Nom], bonjour ! Je suis votre assistant. Souhaitez-vous prendre rendez-vous pour un entretien ou une réparation ?",
    system_prompt: `Tu es l'assistant virtuel d'un garage automobile.

Tes missions :
- Prendre les RDV d'entretien (vidange, révision, contrôle technique)
- Qualifier les demandes de réparation
- Renseigner sur les tarifs
- Organiser les véhicules de prêt

Ton ton : Technique mais accessible, serviable.

Informations à collecter :
- Marque et modèle du véhicule
- Kilométrage
- Nature du problème ou intervention
- Disponibilité du client`,
    voice: "pierre",
    language: "fr-FR",
    features: ["Entretien", "Réparations", "Devis", "Véhicule prêt"],
    color: "from-gray-600 to-slate-600",
  },
  {
    id: "salle-sport",
    name: "Salle de Sport",
    category: "Fitness",
    icon: <Dumbbell className="w-6 h-6" />,
    description: "Accueille les prospects et gère les inscriptions.",
    greeting: "Bienvenue chez [Nom du club] ! Je suis votre coach virtuel. Vous souhaitez découvrir nos installations ou vous inscrire ?",
    system_prompt: `Tu es le coach virtuel d'une salle de sport.

Tes missions :
- Renseigner sur les formules d'abonnement
- Planifier des visites découverte
- Informer sur les cours collectifs
- Gérer les questions sur les équipements

Ton ton : Motivant, dynamique, encourageant !

À proposer :
- Séance d'essai gratuite
- Visite des installations
- Bilan forme avec un coach`,
    voice: "pierre",
    language: "fr-FR",
    features: ["Abonnements", "Essai gratuit", "Cours", "Coaching"],
    color: "from-violet-500 to-purple-500",
  },
];

export function AgentTemplates({ onSelectTemplate }: { onSelectTemplate?: (template: AgentTemplate) => void }) {
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleSelect(template: AgentTemplate) {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  }

  function handleUseTemplate() {
    if (selectedTemplate && onSelectTemplate) {
      onSelectTemplate(selectedTemplate);
    }
    setPreviewOpen(false);
  }

  function handleCopyPrompt() {
    if (selectedTemplate) {
      navigator.clipboard.writeText(selectedTemplate.system_prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-navy font-heading flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-gold" />
          Templates d'agents
        </h2>
        <p className="text-text-muted mt-1">
          Démarrez rapidement avec un agent pré-configuré pour votre secteur
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((template) => (
          <Card 
            key={template.id}
            className="border-gold/20 hover:shadow-lg hover:border-gold/40 transition-all cursor-pointer group"
            onClick={() => handleSelect(template)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${template.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  {template.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-navy group-hover:text-gold transition-colors">
                    {template.name}
                  </h3>
                  <Badge variant="outline" className="text-xs mt-1">
                    {template.category}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-text-muted mt-3 line-clamp-2">
                {template.description}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {template.features.slice(0, 3).map((feature, i) => (
                  <span 
                    key={i}
                    className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full"
                  >
                    {feature}
                  </span>
                ))}
                {template.features.length > 3 && (
                  <span className="text-xs text-text-muted">
                    +{template.features.length - 3}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${selectedTemplate.color} text-white`}>
                    {selectedTemplate.icon}
                  </div>
                  <div>
                    <DialogTitle className="font-heading text-navy">
                      {selectedTemplate.name}
                    </DialogTitle>
                    <Badge variant="outline" className="mt-1">
                      {selectedTemplate.category}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <p className="text-sm font-medium text-navy mb-2">Description</p>
                  <p className="text-sm text-text-muted">{selectedTemplate.description}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-navy mb-2">Message d'accueil</p>
                  <div className="bg-gold/10 rounded-lg p-3 text-sm italic text-navy">
                    "{selectedTemplate.greeting}"
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-navy">Instructions système</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyPrompt}
                      className="text-xs"
                    >
                      {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      {copied ? "Copié !" : "Copier"}
                    </Button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {selectedTemplate.system_prompt}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div>
                    <p className="text-sm font-medium text-navy mb-1">Voix</p>
                    <Badge variant="outline">🎙️ {selectedTemplate.voice}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy mb-1">Langue</p>
                    <Badge variant="outline">🌍 {selectedTemplate.language}</Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-navy mb-2">Fonctionnalités</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.features.map((feature, i) => (
                      <Badge key={i} className="bg-gold/20 text-gold border-gold/30">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleUseTemplate}
                  className="bg-gold hover:bg-gold/90 text-navy"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Utiliser ce template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
