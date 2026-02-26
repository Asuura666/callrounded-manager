import { useState, useEffect } from "react";
import { 
  Mail, Calendar, Clock, Send, Settings, Eye, Save, Check,
  FileText, BarChart3, TrendingUp, Users
} from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ReportConfig {
  enabled: boolean;
  recipients: string[];
  schedule: {
    day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
    time: string; // HH:MM
  };
  include: {
    call_summary: boolean;
    analytics: boolean;
    alerts: boolean;
    recommendations: boolean;
  };
  last_sent?: string;
  next_scheduled?: string;
}

const DAYS = [
  { value: "monday", label: "Lundi" },
  { value: "tuesday", label: "Mardi" },
  { value: "wednesday", label: "Mercredi" },
  { value: "thursday", label: "Jeudi" },
  { value: "friday", label: "Vendredi" },
  { value: "saturday", label: "Samedi" },
  { value: "sunday", label: "Dimanche" },
];

const SECTIONS = [
  { key: "call_summary", label: "Résumé des appels", icon: FileText, description: "Nombre d'appels, durée totale, taux de réponse" },
  { key: "analytics", label: "Analytics", icon: BarChart3, description: "Graphiques de tendances et comparaisons" },
  { key: "alerts", label: "Alertes déclenchées", icon: TrendingUp, description: "Liste des alertes de la semaine" },
  { key: "recommendations", label: "Recommandations IA", icon: Users, description: "Suggestions d'amélioration personnalisées" },
];

export function ReportSettings() {
  const [config, setConfig] = useState<ReportConfig>({
    enabled: true,
    recipients: ["admin@example.com"],
    schedule: { day: "monday", time: "08:00" },
    include: {
      call_summary: true,
      analytics: true,
      alerts: true,
      recommendations: true,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipientInput, setRecipientInput] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      setLoading(true);
      const data = await api.get<ReportConfig>("/reports/weekly/config");
      setConfig(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await api.patch("/reports/weekly/config", config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("[ReportSettings] Save failed:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendNow() {
    try {
      setSending(true);
      await api.post("/reports/weekly/send-now");
      alert("Rapport envoyé !");
    } catch (error) {
      console.error("[ReportSettings] Send failed:", error);
      alert("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  }

  function addRecipient() {
    if (recipientInput && !config.recipients.includes(recipientInput)) {
      setConfig(prev => ({
        ...prev,
        recipients: [...prev.recipients, recipientInput],
      }));
      setRecipientInput("");
    }
  }

  function removeRecipient(email: string) {
    setConfig(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email),
    }));
  }

  function toggleSection(key: keyof ReportConfig["include"]) {
    setConfig(prev => ({
      ...prev,
      include: { ...prev.include, [key]: !prev.include[key] },
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading flex items-center gap-2">
            <Mail className="w-6 h-6 text-gold" />
            Rapport hebdomadaire
          </h1>
          <p className="text-text-muted mt-1">
            Configurez l'envoi automatique de votre rapport de performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Aperçu
          </Button>
          <Button
            variant="outline"
            onClick={handleSendNow}
            disabled={sending}
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? "Envoi..." : "Envoyer maintenant"}
          </Button>
        </div>
      </div>

      {/* Enable/Disable */}
      <Card className="border-gold/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.enabled ? "bg-green-100" : "bg-gray-100"}`}>
                <Mail className={`w-6 h-6 ${config.enabled ? "text-green-600" : "text-gray-400"}`} />
              </div>
              <div>
                <h3 className="font-medium text-navy">Rapport automatique</h3>
                <p className="text-sm text-text-muted">
                  {config.enabled ? "Activé" : "Désactivé"} • {config.next_scheduled ? `Prochain: ${new Date(config.next_scheduled).toLocaleDateString("fr-FR")}` : ""}
                </p>
              </div>
            </div>
            <Button
              variant={config.enabled ? "default" : "outline"}
              onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={config.enabled ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {config.enabled ? "Activé" : "Désactivé"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedule */}
        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="text-navy font-heading flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold" />
              Planification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Jour d'envoi</Label>
              <select
                value={config.schedule.day}
                onChange={e => setConfig(prev => ({ ...prev, schedule: { ...prev.schedule, day: e.target.value as ReportConfig["schedule"]["day"] } }))}
                className="w-full h-10 px-3 rounded-md border border-border bg-white text-sm"
              >
                {DAYS.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Heure d'envoi</Label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-text-muted" />
                <Input
                  type="time"
                  value={config.schedule.time}
                  onChange={e => setConfig(prev => ({ ...prev, schedule: { ...prev.schedule, time: e.target.value } }))}
                  className="w-32"
                />
              </div>
            </div>
            {config.last_sent && (
              <p className="text-sm text-text-muted">
                Dernier envoi: {new Date(config.last_sent).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recipients */}
        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="text-navy font-heading flex items-center gap-2">
              <Users className="w-5 h-5 text-gold" />
              Destinataires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@exemple.com"
                value={recipientInput}
                onChange={e => setRecipientInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addRecipient()}
              />
              <Button onClick={addRecipient} variant="outline">
                Ajouter
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {config.recipients.map(email => (
                <Badge 
                  key={email} 
                  variant="outline" 
                  className="px-3 py-1 cursor-pointer hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                  onClick={() => removeRecipient(email)}
                >
                  {email} ×
                </Badge>
              ))}
              {config.recipients.length === 0 && (
                <p className="text-sm text-text-muted">Aucun destinataire configuré</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Sections */}
      <Card className="border-gold/20">
        <CardHeader>
          <CardTitle className="text-navy font-heading flex items-center gap-2">
            <Settings className="w-5 h-5 text-gold" />
            Contenu du rapport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SECTIONS.map(section => {
              const Icon = section.icon;
              const isEnabled = config.include[section.key as keyof ReportConfig["include"]];
              
              return (
                <div
                  key={section.key}
                  onClick={() => toggleSection(section.key as keyof ReportConfig["include"])}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    isEnabled 
                      ? "border-gold bg-gold/5" 
                      : "border-border hover:border-gold/50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isEnabled ? "bg-gold/20 text-gold" : "bg-gray-100 text-gray-400"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-navy">{section.label}</h4>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isEnabled ? "border-gold bg-gold" : "border-gray-300"
                      }`}>
                        {isEnabled && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <p className="text-sm text-text-muted mt-1">{section.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gold hover:bg-gold/90 text-navy"
        >
          {saving ? (
            <>Enregistrement...</>
          ) : saved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Enregistré !
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-navy">Aperçu du rapport</DialogTitle>
          </DialogHeader>
          
          <div className="bg-gray-50 rounded-lg p-6 space-y-6">
            {/* Email Header */}
            <div className="text-center border-b border-gray-200 pb-4">
              <h2 className="text-2xl font-bold text-navy font-heading">W&I</h2>
              <p className="text-gold font-medium mt-1">Rapport Hebdomadaire</p>
              <p className="text-sm text-text-muted mt-2">Semaine du 6 au 12 février 2026</p>
            </div>

            {/* Call Summary */}
            {config.include.call_summary && (
              <div>
                <h3 className="font-semibold text-navy mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gold" />
                  Résumé des appels
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-navy">127</p>
                    <p className="text-xs text-text-muted">Appels total</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">93%</p>
                    <p className="text-xs text-text-muted">Taux réponse</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-navy">2m 24s</p>
                    <p className="text-xs text-text-muted">Durée moyenne</p>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics */}
            {config.include.analytics && (
              <div>
                <h3 className="font-semibold text-navy mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gold" />
                  Tendances
                </h3>
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">vs semaine précédente</span>
                    <span className="text-green-600 font-medium">+12%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: "62%" }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Alerts */}
            {config.include.alerts && (
              <div>
                <h3 className="font-semibold text-navy mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gold" />
                  Alertes
                </h3>
                <div className="bg-white rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Appels manqués élevés</span>
                    <Badge className="bg-yellow-100 text-yellow-700">2 fois</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sentiment négatif détecté</span>
                    <Badge className="bg-red-100 text-red-700">1 fois</Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {config.include.recommendations && (
              <div>
                <h3 className="font-semibold text-navy mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gold" />
                  Recommandations
                </h3>
                <div className="bg-white rounded-lg p-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-gold">💡</span>
                      <span>Pic d'appels détecté mardi 10h-12h. Envisagez d'augmenter la capacité.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold">💡</span>
                      <span>3 clients ont demandé des services non proposés. Opportunité d'expansion ?</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
