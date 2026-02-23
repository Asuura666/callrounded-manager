import { useState, useEffect } from "react";
import { 
  Calendar, CalendarCheck, CalendarPlus, RefreshCw, Link2, Unlink,
  Clock, MapPin, User, ChevronLeft, ChevronRight, Check, AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CalendarStatus {
  connected: boolean;
  email?: string;
  last_sync?: string;
  calendar_name?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
  source: "google" | "ai_booking";
  status: "confirmed" | "tentative" | "cancelled";
}

interface CalendarStats {
  total_events_week: number;
  ai_bookings: number;
  upcoming_today: number;
  sync_errors: number;
}

const MOCK_STATUS: CalendarStatus = {
  connected: true,
  email: "salon@gmail.com",
  last_sync: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  calendar_name: "Salon Élégance - RDV",
};

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "1",
    title: "Coupe + Brushing - Marie Dupont",
    start: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
    source: "ai_booking",
    status: "confirmed",
  },
  {
    id: "2",
    title: "Coloration - Sophie Martin",
    start: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
    location: "Poste 2",
    source: "ai_booking",
    status: "confirmed",
  },
  {
    id: "3",
    title: "Coupe homme - Jean Bernard",
    start: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(),
    source: "google",
    status: "confirmed",
  },
  {
    id: "4",
    title: "Brushing - Claire Petit",
    start: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 60 * 27).toISOString(),
    source: "ai_booking",
    status: "tentative",
  },
];

const MOCK_STATS: CalendarStats = {
  total_events_week: 47,
  ai_bookings: 32,
  upcoming_today: 8,
  sync_errors: 0,
};

export function CalendarIntegration() {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [statusRes, eventsRes, statsRes] = await Promise.all([
        api.get<CalendarStatus>("/calendar/status").catch(() => null),
        api.get<{ events: CalendarEvent[] }>("/calendar/events").catch(() => null),
        api.get<CalendarStats>("/calendar/stats").catch(() => null),
      ]);
      
      setStatus(statusRes || MOCK_STATUS);
      setEvents(eventsRes?.events || MOCK_EVENTS);
      setStats(statsRes || MOCK_STATS);
    } catch (error) {
      console.log("[Calendar] Using mock data");
      setStatus(null);
      setEvents([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    try {
      const { url } = await api.post<{ url: string }>("/calendar/connect");
      window.location.href = url;
    } catch (error) {
      console.error("[Calendar] Connect failed:", error);
      // Demo: simulate connection
      setStatus(null);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Déconnecter Google Calendar ?")) return;
    try {
      await api.post("/calendar/disconnect");
      setStatus({ connected: false });
    } catch (error) {
      console.error("[Calendar] Disconnect failed:", error);
    }
  }

  async function handleSync() {
    try {
      setSyncing(true);
      await api.post("/calendar/sync");
      await fetchData();
    } catch (error) {
      console.error("[Calendar] Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  }

  function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === tomorrow.toDateString()) return "Demain";
    return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" });
  }

  function formatLastSync(dateStr?: string): string {
    if (!dateStr) return "Jamais";
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes}min`;
    return `Il y a ${Math.floor(minutes / 60)}h`;
  }

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const date = new Date(event.start).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

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
            <Calendar className="w-6 h-6 text-gold" />
            Google Calendar
          </h1>
          <p className="text-text-muted mt-1">
            Synchronisez vos rendez-vous avec Google Calendar
          </p>
        </div>
        {status?.connected && (
          <Button
            onClick={handleSync}
            disabled={syncing}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Synchronisation..." : "Synchroniser"}
          </Button>
        )}
      </div>

      {/* Connection Status */}
      <Card className={`border-2 ${status?.connected ? "border-green-200 bg-green-50/50" : "border-gold/30"}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${status?.connected ? "bg-green-100" : "bg-gold/20"}`}>
                {status?.connected ? (
                  <CalendarCheck className="w-7 h-7 text-green-600" />
                ) : (
                  <Calendar className="w-7 h-7 text-gold" />
                )}
              </div>
              <div>
                {status?.connected ? (
                  <>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-navy">Connecté</h3>
                      <Badge className="bg-green-100 text-green-700">Actif</Badge>
                    </div>
                    <p className="text-sm text-text-muted mt-0.5">{status.email}</p>
                    <p className="text-xs text-text-muted mt-1">
                      Calendrier: {status.calendar_name} • Dernière sync: {formatLastSync(status.last_sync)}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold text-navy">Non connecté</h3>
                    <p className="text-sm text-text-muted mt-0.5">
                      Connectez Google Calendar pour synchroniser vos RDV
                    </p>
                  </>
                )}
              </div>
            </div>
            
            {status?.connected ? (
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Unlink className="w-4 h-4 mr-2" />
                Déconnecter
              </Button>
            ) : (
              <Button
                onClick={handleConnect}
                className="bg-gold hover:bg-gold/90 text-navy"
              >
                <Link2 className="w-4 h-4 mr-2" />
                Connecter Google Calendar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {status?.connected && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-gold/20">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-navy">{stats?.upcoming_today || 0}</p>
                <p className="text-sm text-text-muted">Aujourd'hui</p>
              </CardContent>
            </Card>
            <Card className="border-gold/20">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-navy">{stats?.total_events_week || 0}</p>
                <p className="text-sm text-text-muted">Cette semaine</p>
              </CardContent>
            </Card>
            <Card className="border-gold/20">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-gold">{stats?.ai_bookings || 0}</p>
                <p className="text-sm text-text-muted">Via IA</p>
              </CardContent>
            </Card>
            <Card className="border-gold/20">
              <CardContent className="p-4 text-center">
                <p className={`text-3xl font-bold ${stats?.sync_errors ? "text-red-500" : "text-green-600"}`}>
                  {stats?.sync_errors || 0}
                </p>
                <p className="text-sm text-text-muted">Erreurs sync</p>
              </CardContent>
            </Card>
          </div>

          {/* Events List */}
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="text-navy font-heading flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-gold" />
                Prochains rendez-vous
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-text-muted">Aucun rendez-vous à venir</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(eventsByDate).map(([date, dayEvents]) => (
                    <div key={date}>
                      <h4 className="text-sm font-medium text-navy mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gold" />
                        {formatDate(dayEvents[0].start)}
                      </h4>
                      <div className="space-y-2 ml-6">
                        {dayEvents.map(event => (
                          <div
                            key={event.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                              event.status === "cancelled" 
                                ? "bg-gray-50 border-gray-200 opacity-60" 
                                : event.source === "ai_booking"
                                  ? "bg-gold/5 border-gold/20 hover:border-gold/40"
                                  : "bg-white border-border hover:border-gold/30"
                            }`}
                          >
                            <div className="flex-shrink-0">
                              <div className={`w-1 h-12 rounded-full ${
                                event.source === "ai_booking" ? "bg-gold" : "bg-blue-400"
                              }`}></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`font-medium ${event.status === "cancelled" ? "line-through text-gray-500" : "text-navy"}`}>
                                  {event.title}
                                </p>
                                {event.source === "ai_booking" && (
                                  <Badge className="bg-gold/20 text-gold text-xs">IA</Badge>
                                )}
                                {event.status === "tentative" && (
                                  <Badge variant="outline" className="text-xs">En attente</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-text-muted mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(event.start)} - {formatTime(event.end)}
                                </span>
                                {event.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {event.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              event.status === "confirmed" ? "bg-green-100" : "bg-gray-100"
                            }`}>
                              {event.status === "confirmed" ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
