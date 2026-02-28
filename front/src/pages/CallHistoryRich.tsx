import { useState, useEffect } from "react";
import { 
  Phone, Clock, Calendar, User, MessageSquare, Download, Filter,
  ChevronDown, ChevronUp, Play, Pause, Search, X, TrendingUp,
  FileText, ExternalLink
} from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CallRecord {
  id: string;
  external_id: string;
  agent_name: string;
  caller_number: string;
  caller_name?: string;
  direction: "inbound" | "outbound";
  status: "completed" | "missed" | "voicemail" | "transferred";
  duration_seconds: number;
  started_at: string;
  ended_at: string;
  outcome?: string;
  sentiment?: "positive" | "neutral" | "negative";
  transcript?: TranscriptEntry[];
  summary?: string;
  recording_url?: string;
  tags?: string[];
}

interface TranscriptEntry {
  speaker: "agent" | "caller";
  text: string;
  timestamp: number;
}

interface Filters {
  search: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  agent: string;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    completed: { color: "bg-green-100 text-green-700", label: "Terminé" },
    missed: { color: "bg-red-100 text-red-700", label: "Manqué" },
    voicemail: { color: "bg-yellow-100 text-yellow-700", label: "Messagerie" },
    transferred: { color: "bg-blue-100 text-blue-700", label: "Transféré" },
  };
  
  const { color, label } = config[status] || { color: "bg-gray-100", label: status };
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

export function CallHistoryRich() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCall, setExpandedCall] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 20;
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    agent: "",
  });

  useEffect(() => {
    fetchCalls(currentPage);
  }, [currentPage]);

  async function fetchCalls(page = 1) {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(perPage) });
      if (filters.status) params.set("status", filters.status);
      if (filters.dateFrom) params.set("from_date", filters.dateFrom);
      if (filters.dateTo) params.set("to_date", filters.dateTo);
      const data = await api.get<{ calls: CallRecord[]; total_items: number; total_pages: number; current_page: number }>(`/calls/rich?${params}`);
      setCalls(data.calls || []);
      setTotalPages(data.total_pages || 1);
      setTotalItems(data.total_items || 0);
      setCurrentPage(data.current_page || page);
    } catch (error) {
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(callId: string) {
    setExpandedCall(expandedCall === callId ? null : callId);
  }

  async function openTranscript(call: CallRecord) {
    try {
      const details = await api.get<CallRecord>(`/calls/${call.id}`);
      setSelectedCall(details);
    } catch (e) {
      setSelectedCall(call);
    }
    setTranscriptOpen(true);
  }

  function exportCalls() {
    const csv = [
      ["Date", "Numéro", "Nom", "Durée", "Statut", "Résultat", "Résumé"].join(","),
      ...calls.map(c => [
        formatDate(c.started_at),
        c.caller_number,
        c.caller_name || "",
        formatDuration(c.duration_seconds),
        c.status,
        c.outcome || "",
        c.sentiment || "",
        `"${c.summary || ""}"`,
      ].join(",")),
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historique-appels-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  const filteredCalls = calls.filter(call => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!call.caller_number.includes(search) && 
          !call.caller_name?.toLowerCase().includes(search) &&
          !call.summary?.toLowerCase().includes(search)) {
        return false;
      }
    }
    if (filters.status && call.status !== filters.status) return false;
    return true;
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading flex items-center gap-2">
            <Phone className="w-6 h-6 text-gold" />
            Historique des appels
          </h1>
          <p className="text-text-muted mt-1">
            {filteredCalls.length} appel{filteredCalls.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={filtersOpen ? "border-gold text-gold" : ""}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
          <Button
            variant="outline"
            onClick={exportCalls}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {filtersOpen && (
        <Card className="border-gold/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-navy mb-1 block">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <Input
                    placeholder="Numéro, nom, résumé..."
                    value={filters.search}
                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-navy mb-1 block">Statut</label>
                <select
                  value={filters.status}
                  onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-border bg-white text-sm"
                >
                  <option value="">Tous</option>
                  <option value="completed">Terminé</option>
                  <option value="missed">Manqué</option>
                  <option value="voicemail">Messagerie</option>
                </select>
              </div>
              <div>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  variant="default"
                  onClick={() => { setCurrentPage(1); fetchCalls(1); }}
                  className="bg-gold hover:bg-gold/90 text-navy"
                >
                  Appliquer
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setFilters({ search: "", status: "", dateFrom: "", dateTo: "", agent: "" }); setCurrentPage(1); setTimeout(() => fetchCalls(1), 0); }}
                  className="text-text-muted"
                >
                  <X className="w-4 h-4 mr-1" />
                  Réinitialiser
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calls List */}
      <div className="space-y-3">
        {filteredCalls.map(call => (
          <Card 
            key={call.id} 
            className={`border-gold/20 transition-all ${expandedCall === call.id ? "ring-2 ring-gold/30" : "hover:shadow-md"}`}
          >
            <CardContent className="p-4">
              {/* Main Row */}
              <div className="flex items-center gap-4">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    call.status === "completed" ? "bg-green-100" :
                    call.status === "missed" ? "bg-red-100" : "bg-gray-100"
                  }`}
                >
                  <Phone className={`w-5 h-5 ${
                    call.status === "completed" ? "text-green-600" :
                    call.status === "missed" ? "text-red-600" : "text-gray-500"
                  }`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-navy">
                      {call.caller_name || call.caller_number}
                    </span>
                    <StatusBadge status={call.status} />
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-muted mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(call.started_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(call.duration_seconds)}
                    </span>
                    {call.outcome && (
                      <Badge variant="outline" className="text-xs">
                        {call.outcome}
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(call.id)}
                >
                  {expandedCall === call.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Expanded Content */}
              {expandedCall === call.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  {call.summary && (
                    <div>
                      <p className="text-sm font-medium text-navy mb-1">Résumé</p>
                      <p className="text-sm text-text-muted bg-gray-50 p-3 rounded-lg">
                        {call.summary}
                      </p>
                    </div>
                  )}
                  
                  {call.tags && call.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-navy">Tags:</span>
                      {call.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-gold/10 text-gold border-gold/30">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {call.transcript && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openTranscript(call)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Transcription
                      </Button>
                    )}
                    {call.recording_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(call.recording_url, "_blank")}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Écouter
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredCalls.length === 0 && (
          <div className="text-center py-12">
            <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-text-muted">Aucun appel trouvé</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-text-muted">
            Page {currentPage} sur {totalPages} ({totalItems} appel{totalItems !== 1 ? "s" : ""})
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              ← Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Suivant →
            </Button>
          </div>
        </div>
      )}

      {/* Transcript Dialog */}
      <Dialog open={transcriptOpen} onOpenChange={setTranscriptOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-heading text-navy flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gold" />
              Transcription
            </DialogTitle>
          </DialogHeader>
          
          {selectedCall && (
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {selectedCall.transcript?.map((entry, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${entry.speaker === "agent" ? "" : "flex-row-reverse"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    entry.speaker === "agent" ? "bg-gold/20 text-gold" : "bg-navy/10 text-navy"
                  }`}>
                    {entry.speaker === "agent" ? "🤖" : "👤"}
                  </div>
                  <div className={`flex-1 ${entry.speaker === "agent" ? "" : "text-right"}`}>
                    <div className={`inline-block p-3 rounded-2xl max-w-[85%] ${
                      entry.speaker === "agent"
                        ? "bg-gold/10 text-navy rounded-tl-sm"
                        : "bg-navy text-white rounded-tr-sm"
                    }`}>
                      <p className="text-sm">{entry.text}</p>
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      {Math.floor(entry.timestamp / 60)}:{(entry.timestamp % 60).toString().padStart(2, "0")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
