import { useState, useEffect } from "react";
import { 
  Bell, BellRing, Plus, Trash2, Mail, MessageSquare, Smartphone,
  AlertTriangle, Clock, TrendingDown, PhoneMissed, Save, ToggleLeft, ToggleRight
} from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface AlertRule {
  id: string;
  name: string;
  type: "missed_calls" | "long_wait" | "negative_sentiment" | "low_completion" | "custom";
  condition: {
    metric: string;
    operator: "gt" | "lt" | "eq" | "gte" | "lte";
    value: number;
    timeframe_minutes: number;
  };
  channels: ("email" | "sms" | "push")[];
  recipients: string[];
  is_active: boolean;
  created_at: string;
  last_triggered?: string;
  trigger_count: number;
}

const ALERT_TYPES = [
  {
    id: "missed_calls",
    name: "Appels manqués",
    description: "Alerte quand trop d'appels sont manqués",
    icon: PhoneMissed,
    color: "text-red-500",
    bgColor: "bg-red-100",
    defaultCondition: { metric: "missed_calls_count", operator: "gte" as const, value: 3, timeframe_minutes: 60 },
  },
  {
    id: "long_wait",
    name: "Attente longue",
    description: "Alerte si le temps d'attente dépasse un seuil",
    icon: Clock,
    color: "text-orange-500",
    bgColor: "bg-orange-100",
    defaultCondition: { metric: "avg_wait_seconds", operator: "gte" as const, value: 120, timeframe_minutes: 30 },
  },
  {
    id: "negative_sentiment",
    name: "Sentiment négatif",
    description: "Alerte sur les appels avec sentiment négatif",
    icon: AlertTriangle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100",
    defaultCondition: { metric: "negative_sentiment_rate", operator: "gte" as const, value: 20, timeframe_minutes: 60 },
  },
  {
    id: "low_completion",
    name: "Taux de complétion bas",
    description: "Alerte si le taux de complétion chute",
    icon: TrendingDown,
    color: "text-purple-500",
    bgColor: "bg-purple-100",
    defaultCondition: { metric: "completion_rate", operator: "lte" as const, value: 70, timeframe_minutes: 120 },
  },
];

const MOCK_RULES: AlertRule[] = [
  {
    id: "1",
    name: "Appels manqués critique",
    type: "missed_calls",
    condition: { metric: "missed_calls_count", operator: "gte", value: 5, timeframe_minutes: 60 },
    channels: ["email", "sms"],
    recipients: ["admin@salon.com", "+33612345678"],
    is_active: true,
    created_at: "2026-02-01T10:00:00Z",
    last_triggered: "2026-02-12T15:30:00Z",
    trigger_count: 3,
  },
  {
    id: "2",
    name: "Sentiment client dégradé",
    type: "negative_sentiment",
    condition: { metric: "negative_sentiment_rate", operator: "gte", value: 25, timeframe_minutes: 120 },
    channels: ["email"],
    recipients: ["manager@salon.com"],
    is_active: true,
    created_at: "2026-02-05T14:00:00Z",
    trigger_count: 1,
  },
  {
    id: "3",
    name: "Temps d'attente élevé",
    type: "long_wait",
    condition: { metric: "avg_wait_seconds", operator: "gte", value: 90, timeframe_minutes: 30 },
    channels: ["push"],
    recipients: [],
    is_active: false,
    created_at: "2026-02-10T09:00:00Z",
    trigger_count: 0,
  },
];

export function AlertsConfig() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<typeof ALERT_TYPES[0] | null>(null);
  const [newRule, setNewRule] = useState({
    name: "",
    threshold: 5,
    timeframe: 60,
    channels: [] as string[],
    recipients: "",
  });

  useEffect(() => {
    fetchRules();
  }, []);

  async function fetchRules() {
    try {
      setLoading(true);
      const data = await api.get<{ rules: AlertRule[] }>("/alerts/rules");
      setRules(data.rules || []);
    } catch (error) {
      console.log("[Alerts] Using mock data");
      setRules([]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleRule(ruleId: string) {
    setRules(prev => prev.map(r => 
      r.id === ruleId ? { ...r, is_active: !r.is_active } : r
    ));
    // TODO: API call
  }

  async function deleteRule(ruleId: string) {
    if (!confirm("Supprimer cette alerte ?")) return;
    setRules(prev => prev.filter(r => r.id !== ruleId));
    // TODO: API call
  }

  function openCreateDialog(type: typeof ALERT_TYPES[0]) {
    setSelectedType(type);
    setNewRule({
      name: type.name,
      threshold: type.defaultCondition.value,
      timeframe: type.defaultCondition.timeframe_minutes,
      channels: ["email"],
      recipients: "",
    });
    setCreateOpen(true);
  }

  async function handleCreate() {
    if (!selectedType) return;
    
    const rule: AlertRule = {
      id: crypto.randomUUID(),
      name: newRule.name,
      type: selectedType.id as AlertRule["type"],
      condition: {
        ...selectedType.defaultCondition,
        value: newRule.threshold,
        timeframe_minutes: newRule.timeframe,
      },
      channels: newRule.channels as AlertRule["channels"],
      recipients: newRule.recipients.split(",").map(r => r.trim()).filter(Boolean),
      is_active: true,
      created_at: new Date().toISOString(),
      trigger_count: 0,
    };
    
    setRules(prev => [...prev, rule]);
    setCreateOpen(false);
    // TODO: API call
  }

  function toggleChannel(channel: string) {
    setNewRule(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel],
    }));
  }

  const getTypeInfo = (type: string) => ALERT_TYPES.find(t => t.id === type);

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
            <BellRing className="w-6 h-6 text-gold" />
            Alertes intelligentes
          </h1>
          <p className="text-text-muted mt-1">
            Configurez des alertes automatiques pour rester informé
          </p>
        </div>
      </div>

      {/* Alert Type Cards */}
      <div>
        <h2 className="text-lg font-semibold text-navy mb-3">Créer une alerte</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ALERT_TYPES.map(type => {
            const Icon = type.icon;
            return (
              <Card 
                key={type.id}
                className="border-gold/20 hover:shadow-lg hover:border-gold/40 transition-all cursor-pointer group"
                onClick={() => openCreateDialog(type)}
              >
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-lg ${type.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${type.color}`} />
                  </div>
                  <h3 className="font-medium text-navy group-hover:text-gold transition-colors">
                    {type.name}
                  </h3>
                  <p className="text-sm text-text-muted mt-1">
                    {type.description}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-3 w-full text-gold hover:bg-gold/10"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Active Rules */}
      <div>
        <h2 className="text-lg font-semibold text-navy mb-3">Alertes configurées</h2>
        {rules.length === 0 ? (
          <Card className="border-gold/20">
            <CardContent className="py-12 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-text-muted">Aucune alerte configurée</p>
              <p className="text-sm text-text-muted mt-1">
                Cliquez sur un type d'alerte ci-dessus pour commencer
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => {
              const typeInfo = getTypeInfo(rule.type);
              const Icon = typeInfo?.icon || Bell;
              
              return (
                <Card key={rule.id} className={`border-gold/20 ${!rule.is_active ? "opacity-60" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg ${typeInfo?.bgColor || "bg-gray-100"} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${typeInfo?.color || "text-gray-500"}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-navy">{rule.name}</span>
                          {!rule.is_active && (
                            <Badge variant="outline" className="text-xs">Désactivé</Badge>
                          )}
                        </div>
                        <p className="text-sm text-text-muted mt-0.5">
                          Seuil: {rule.condition.value} • Période: {rule.condition.timeframe_minutes}min
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {rule.channels.map(channel => (
                            <Badge key={channel} variant="outline" className="text-xs">
                              {channel === "email" && <Mail className="w-3 h-3 mr-1" />}
                              {channel === "sms" && <Smartphone className="w-3 h-3 mr-1" />}
                              {channel === "push" && <Bell className="w-3 h-3 mr-1" />}
                              {channel}
                            </Badge>
                          ))}
                          {rule.trigger_count > 0 && (
                            <span className="text-xs text-text-muted">
                              • Déclenchée {rule.trigger_count}x
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRule(rule.id)}
                          className={rule.is_active ? "text-green-600" : "text-gray-400"}
                        >
                          {rule.is_active ? (
                            <ToggleRight className="w-6 h-6" />
                          ) : (
                            <ToggleLeft className="w-6 h-6" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRule(rule.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-navy flex items-center gap-2">
              {selectedType && (
                <>
                  <selectedType.icon className={`w-5 h-5 ${selectedType.color}`} />
                  Nouvelle alerte: {selectedType.name}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'alerte</Label>
              <Input
                id="name"
                value={newRule.name}
                onChange={e => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Appels manqués critique"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="threshold">Seuil</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={newRule.threshold}
                  onChange={e => setNewRule(prev => ({ ...prev, threshold: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeframe">Période (min)</Label>
                <Input
                  id="timeframe"
                  type="number"
                  value={newRule.timeframe}
                  onChange={e => setNewRule(prev => ({ ...prev, timeframe: parseInt(e.target.value) || 60 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Canaux de notification</Label>
              <div className="flex gap-2">
                {[
                  { id: "email", icon: Mail, label: "Email" },
                  { id: "sms", icon: Smartphone, label: "SMS" },
                  { id: "push", icon: Bell, label: "Push" },
                ].map(channel => (
                  <Button
                    key={channel.id}
                    type="button"
                    variant={newRule.channels.includes(channel.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleChannel(channel.id)}
                    className={newRule.channels.includes(channel.id) ? "bg-gold text-navy" : ""}
                  >
                    <channel.icon className="w-4 h-4 mr-1" />
                    {channel.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipients">Destinataires (séparés par virgule)</Label>
              <Input
                id="recipients"
                value={newRule.recipients}
                onChange={e => setNewRule(prev => ({ ...prev, recipients: e.target.value }))}
                placeholder="email@example.com, +33612345678"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreate}
              className="bg-gold hover:bg-gold/90 text-navy"
            >
              <Save className="w-4 h-4 mr-2" />
              Créer l'alerte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
