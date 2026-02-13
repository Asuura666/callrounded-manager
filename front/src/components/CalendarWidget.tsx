import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ChevronRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface Appointment {
  id: string;
  title: string;
  date: Date;
  time: string;
  duration: string;
  location?: string;
  type: 'meeting' | 'call' | 'event' | 'reminder';
}

interface CalendarWidgetProps {
  appointments?: Appointment[];
  onViewAll?: () => void;
  className?: string;
}

// Mock data (utilisé si aucune donnée API)
const mockAppointments: Appointment[] = [
  {
    id: '1',
    title: 'Call client Nexus',
    date: new Date(),
    time: '10:00',
    duration: '30min',
    type: 'call',
  },
  {
    id: '2',
    title: 'Review design system',
    date: new Date(),
    time: '14:30',
    duration: '1h',
    location: 'Salle A',
    type: 'meeting',
  },
  {
    id: '3',
    title: 'Standup équipe',
    date: new Date(Date.now() + 86400000),
    time: '09:00',
    duration: '15min',
    type: 'meeting',
  },
  {
    id: '4',
    title: 'Demo produit',
    date: new Date(Date.now() + 86400000 * 2),
    time: '16:00',
    duration: '45min',
    location: 'Zoom',
    type: 'event',
  },
  {
    id: '5',
    title: 'Deadline projet X',
    date: new Date(Date.now() + 86400000 * 3),
    time: '18:00',
    duration: '-',
    type: 'reminder',
  },
];

// Couleurs charte
const colors = {
  blueNight: '#0E2A47',
  gold: '#C9A24D',
  goldLight: '#C9A24D20',
  goldMedium: '#C9A24D40',
};

// Composant jour de la semaine
const WeekDay: React.FC<{
  day: Date;
  isToday: boolean;
  hasEvents: boolean;
}> = ({ day, isToday, hasEvents }) => {
  const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-slate-400 uppercase">
        {dayNames[day.getDay()]}
      </span>
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
          isToday
            ? 'text-white shadow-md'
            : 'text-slate-600 hover:bg-slate-100'
        )}
        style={{
          backgroundColor: isToday ? colors.blueNight : 'transparent',
        }}
      >
        {day.getDate()}
      </div>
      {hasEvents && (
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: colors.gold }}
        />
      )}
    </div>
  );
};

// Composant RDV
const AppointmentItem: React.FC<{ appointment: Appointment }> = ({
  appointment,
}) => {
  const isToday =
    appointment.date.toDateString() === new Date().toDateString();
  
  const typeColors = {
    meeting: colors.blueNight,
    call: '#059669',
    event: '#7C3AED',
    reminder: colors.gold,
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-2 rounded-lg transition-all hover:bg-slate-50 group',
        isToday && 'bg-slate-50/50'
      )}
    >
      <div
        className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0"
        style={{ backgroundColor: typeColors[appointment.type] }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {appointment.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            <span>{appointment.time}</span>
            <span className="text-slate-300">·</span>
            <span>{appointment.duration}</span>
          </div>
        </div>
        {appointment.location && (
          <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
            <MapPin className="w-3 h-3" />
            <span>{appointment.location}</span>
          </div>
        )}
      </div>
      {isToday && (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0"
          style={{
            borderColor: colors.gold,
            color: colors.gold,
            backgroundColor: colors.goldLight,
          }}
        >
          Aujourd'hui
        </Badge>
      )}
    </div>
  );
};

// Widget principal
export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  appointments = mockAppointments,
  onViewAll,
  className,
}) => {
  // Générer la semaine courante
  const weekDays = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi

    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
  }, []);

  // Compter les RDV d'aujourd'hui
  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return appointments.filter(
      (apt) => apt.date.toDateString() === today
    ).length;
  }, [appointments]);

  // Vérifier si un jour a des événements
  const hasEventsOnDay = (day: Date) => {
    return appointments.some(
      (apt) => apt.date.toDateString() === day.toDateString()
    );
  };

  // Prochains RDV (max 5)
  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter((apt) => apt.date >= new Date(new Date().setHours(0, 0, 0, 0)))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  }, [appointments]);

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      window.location.href = '/calendar';
    }
  };

  return (
    <Card className={cn('w-full max-w-[300px]', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar
              className="w-4 h-4"
              style={{ color: colors.gold }}
            />
            Calendrier
          </CardTitle>
          <Badge
            className="text-xs font-medium"
            style={{
              backgroundColor: colors.goldLight,
              color: colors.gold,
              border: `1px solid ${colors.goldMedium}`,
            }}
          >
            {todayCount} RDV
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mini calendrier semaine */}
        <div
          className="flex justify-between px-1 py-3 rounded-lg"
          style={{ backgroundColor: `${colors.blueNight}08` }}
        >
          {weekDays.map((day, idx) => (
            <WeekDay
              key={idx}
              day={day}
              isToday={day.toDateString() === new Date().toDateString()}
              hasEvents={hasEventsOnDay(day)}
            />
          ))}
        </div>

        {/* Liste des prochains RDV */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide px-2">
            Prochains rendez-vous
          </p>
          <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((apt) => (
                <AppointmentItem key={apt.id} appointment={apt} />
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                Aucun rendez-vous à venir
              </p>
            )}
          </div>
        </div>

        {/* Lien vers calendrier complet */}
        <Button
          variant="ghost"
          className="w-full justify-between text-sm font-medium hover:bg-slate-50 group"
          style={{ color: colors.blueNight }}
          onClick={handleViewAll}
        >
          Voir tout le calendrier
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default CalendarWidget;
