import { useState, useEffect, useCallback } from "react";
import { 
  Bell, BellRing, X, Phone, PhoneMissed, AlertTriangle, 
  TrendingUp, Check, ChevronRight, Volume2, VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: "call_incoming" | "call_missed" | "alert" | "info";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, unknown>;
}

const NOTIFICATION_ICONS = {
  call_incoming: { icon: Phone, color: "text-green-500", bg: "bg-green-100" },
  call_missed: { icon: PhoneMissed, color: "text-red-500", bg: "bg-red-100" },
  alert: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-100" },
  info: { icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-100" },
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // WebSocket connection
  useEffect(() => {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/notifications`;
    
    console.log("[NotificationCenter] Connecting to WebSocket:", wsUrl);
    
    // For now, simulate with mock data since WS might not be ready
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "call_incoming",
        title: "Appel entrant",
        message: "+33 6 12 34 56 78 - Marie Dupont",
        timestamp: new Date(),
        read: false,
      },
      {
        id: "2",
        type: "alert",
        title: "Alerte: Appels manqués",
        message: "3 appels manqués dans la dernière heure",
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        read: false,
      },
      {
        id: "3",
        type: "info",
        title: "Rapport généré",
        message: "Votre rapport hebdomadaire est prêt",
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        read: true,
      },
    ];
    
    setNotifications(mockNotifications);

    // Try to connect to real WebSocket
    try {
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log("[NotificationCenter] WebSocket connected");
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[NotificationCenter] Received:", data);
          
          const notification: Notification = {
            id: crypto.randomUUID(),
            type: data.type || "info",
            title: data.title || "Notification",
            message: data.message || "",
            timestamp: new Date(),
            read: false,
            data: data.data,
          };
          
          setNotifications(prev => [notification, ...prev]);
          
          // Play sound
          if (soundEnabled && data.type !== "info") {
            playNotificationSound();
          }
        } catch (e) {
          console.error("[NotificationCenter] Parse error:", e);
        }
      };
      
      socket.onerror = (error) => {
        console.log("[NotificationCenter] WebSocket error (using mock data)");
      };
      
      socket.onclose = () => {
        console.log("[NotificationCenter] WebSocket closed");
      };
      
      setWs(socket);
      
      return () => {
        socket.close();
      };
    } catch (error) {
      console.log("[NotificationCenter] WebSocket not available, using mock data");
    }
  }, [soundEnabled]);

  function playNotificationSound() {
    try {
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Autoplay blocked, ignore
      });
    } catch (e) {
      // Audio not supported
    }
  }

  function markAsRead(id: string) {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  function markAllAsRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function clearAll() {
    setNotifications([]);
    setIsOpen(false);
  }

  function formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-white/70 hover:text-white hover:bg-white/10"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 animate-wiggle" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-border z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-gray-50">
              <div>
                <h3 className="font-semibold text-navy">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-text-muted">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="h-8 w-8"
                  title={soundEnabled ? "Désactiver le son" : "Activer le son"}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-text-muted" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-text-muted" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-text-muted text-sm">Aucune notification</p>
                </div>
              ) : (
                <div>
                  {notifications.map(notification => {
                    const config = NOTIFICATION_ICONS[notification.type];
                    const Icon = config.icon;
                    
                    return (
                      <div
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`flex items-start gap-3 p-4 border-b border-border cursor-pointer transition-colors hover:bg-gray-50 ${
                          !notification.read ? "bg-gold/5" : ""
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium text-sm ${!notification.read ? "text-navy" : "text-gray-600"}`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-gold rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-text-muted truncate mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-text-muted mt-1">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between p-3 border-t border-border bg-gray-50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Tout marquer lu
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  Effacer tout
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* CSS for wiggle animation */}
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
