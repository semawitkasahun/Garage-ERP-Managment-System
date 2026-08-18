import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, UserCheck, UserX, Clock, CalendarOff, ArrowRight, TrendingUp, AlertCircle, Search, Filter, X, ChevronDown, Coffee, Timer, CalendarClock, CheckCircle, QrCode } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { getNavSections } from '@/layouts/navSections';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useAttendance, useAttendanceStats, useAttendanceToday } from '@/features/attendance/hooks/useAttendance';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_META = {
  present: { bg: 'hsl(84 20% 89%)', text: 'hsl(84 25% 25%)' },
  absent: { bg: 'hsl(0 0% 92%)', text: 'hsl(0 0% 40%)' },
  late: { bg: 'hsl(42 55% 90%)', text: 'hsl(42 55% 32%)' },
  on_leave: { bg: 'hsl(200 50% 90%)', text: 'hsl(200 50% 32%)' },
};

export function AttendancePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const searchParams = new URLSearchParams(location.search);
  const initialSearch = location.state?.search || searchParams.get('search') || '';

  const [filters, setFilters] = useState({
    search: initialSearch,
    status: '',
    from_date: '',
    to_date: '',
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: stats, isLoading: statsLoading } = useAttendanceStats(user?.branch_id);
  const { data: todayAttendance, isLoading: todayLoading } = useAttendanceToday();
  const { data: attendanceData, isLoading, error } = useAttendance({ 
    ...filters, 
    page 
  });

  const attendance = attendanceData?.data ?? [];
  
  const totalEmployees = stats?.total_employees ?? 0;
  const presentToday = stats?.present_today ?? 0;
  const absentToday = stats?.absent_today ?? 0;
  const lateToday = stats?.late_today ?? 0;
  const onLeaveToday = stats?.on_leave_today ?? 0;
  const earlyDepartures = stats?.early_departures ?? 0;
  const overtimeToday = stats?.overtime_today ?? 0;
  const checkedOutToday = stats?.checked_out_today ?? 0;
  const currentlyWorking = stats?.currently_working ?? 0;
  const totalOvertimeHours = stats?.total_overtime_hours ?? 0;
  const attendanceRate = stats?.attendance_rate ?? 0;

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      from_date: '',
      to_date: '',
    });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== null && v !== undefined);

  const navSections = getNavSections(user?.role);

  return (
    <DashboardLayout navSections={navSections} pageTitle="Attendance & Shifts" roleLabel={user?.username ?? 'Staff'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Attendance & Shifts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage employee attendance and shift scheduling</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/shifts')}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <CalendarClock className="h-4 w-4" /> Manage Shifts
          </button>
          <button
            onClick={() => navigate('/attendance/terminal')}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <QrCode className="h-4 w-4" /> Attendance Terminal
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 mb-6">
        {statsLoading ? (
          // Loading Skeletons
          [...Array(8)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-4" />
              </div>
              <Skeleton className="h-8 w-12" />
            </div>
          ))
        ) : (
          <>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Total Employees</span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight">{totalEmployees}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Present</span>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight" style={{ color: 'hsl(84 25% 25%)' }}>{presentToday}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Absent</span>
                <UserX className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight" style={{ color: 'hsl(0 40% 40%)' }}>{absentToday}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Late</span>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight" style={{ color: 'hsl(42 55% 32%)' }}>{lateToday}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">On Leave</span>
                <CalendarOff className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight" style={{ color: 'hsl(200 50% 32%)' }}>{onLeaveToday}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Early Dept</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight">{earlyDepartures}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Overtime</span>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight">{overtimeToday}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Checked Out</span>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight">{checkedOutToday}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Working</span>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight">{currentlyWorking}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">OT Hours</span>
                <Coffee className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight">{totalOvertimeHours.toFixed(1)}h</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Rate</span>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight">{attendanceRate}%</p>
            </div>
          </>
        )}
      </div>

      {/* Filter Bar */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by employee name..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="">All Statuses</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>

              {/* From Date Filter */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">From Date</label>
                <input
                  type="date"
                  value={filters.from_date || ''}
                  onChange={(e) => handleFilterChange('from_date', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              {/* To Date Filter */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">To Date</label>
                <input
                  type="date"
                  value={filters.to_date || ''}
                  onChange={(e) => handleFilterChange('to_date', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Today's Attendance Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-accent/30">
          <h2 className="font-display text-sm font-semibold tracking-tight">Today's Attendance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/30 text-left">
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Employee</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Date</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Scheduled</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Clock In</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Clock Out</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Break</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Status</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Worked</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Late/Early</th>
              </tr>
            </thead>
            <tbody>
              {todayLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-32" /></div></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                  </tr>
                ))
              ) : todayAttendance && todayAttendance.length > 0 ? (
                todayAttendance.map((record) => {
                  const statusMeta = STATUS_META[record.status] ?? STATUS_META.present;
                  
                  const formatTime = (time) => time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                  const formatDuration = (hours) => hours ? `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m` : '—';

                  return (
                    <tr key={record.attendance_id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs font-semibold" style={{ background: 'hsl(84 25% 30%)', color: 'white' }}>
                              {getInitials(record.employee?.first_name, record.employee?.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium text-foreground">{record.employee?.first_name} {record.employee?.last_name}</span>
                            <p className="text-xs text-muted-foreground">{record.employee?.job_title || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{record.attendance_date || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {record.scheduled_start && record.scheduled_end 
                          ? `${formatTime(record.scheduled_start)} - ${formatTime(record.scheduled_end)}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatTime(record.clock_in)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatTime(record.clock_out)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {record.break_start && record.break_end 
                          ? `${formatTime(record.break_start)} - ${formatTime(record.break_end)}`
                          : record.break_start 
                            ? `${formatTime(record.break_start)} - ...`
                            : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: statusMeta.bg, color: statusMeta.text }}>
                          {record.status?.replace('_', ' ') || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDuration(record.total_worked_hours)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {record.late_minutes > 0 && (
                          <span className="text-orange-600 mr-2">+{record.late_minutes}m late</span>
                        )}
                        {record.early_departure_minutes > 0 && (
                          <span className="text-red-600">-{record.early_departure_minutes}m early</span>
                        )}
                        {record.late_minutes === 0 && record.early_departure_minutes === 0 && '—'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Clock className="h-12 w-12 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No attendance records for today</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="mt-6 rounded-lg border border-border bg-card overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-accent/30">
          <h2 className="font-display text-sm font-semibold tracking-tight">Attendance History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/30 text-left">
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Employee</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Date</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Scheduled</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Clock In</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Clock Out</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Break</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Status</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Worked</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Late/Early</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-32" /></div></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="h-8 w-8 text-destructive" />
                      <p className="text-muted-foreground">Failed to load attendance records. Please try again.</p>
                    </div>
                  </td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Clock className="h-12 w-12 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No attendance records found</p>
                      <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                attendance.map((record) => {
                  const statusMeta = STATUS_META[record.status] ?? STATUS_META.present;
                  
                  const formatTime = (time) => time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                  const formatDuration = (hours) => hours ? `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m` : '—';

                  return (
                    <tr key={record.attendance_id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs font-semibold" style={{ background: 'hsl(84 25% 30%)', color: 'white' }}>
                              {getInitials(record.employee?.first_name, record.employee?.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium text-foreground">{record.employee?.first_name} {record.employee?.last_name}</span>
                            <p className="text-xs text-muted-foreground">{record.employee?.job_title || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{record.attendance_date || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {record.scheduled_start && record.scheduled_end 
                          ? `${formatTime(record.scheduled_start)} - ${formatTime(record.scheduled_end)}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatTime(record.clock_in)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatTime(record.clock_out)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {record.break_start && record.break_end 
                          ? `${formatTime(record.break_start)} - ${formatTime(record.break_end)}`
                          : record.break_start 
                            ? `${formatTime(record.break_start)} - ...`
                            : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: statusMeta.bg, color: statusMeta.text }}>
                          {record.status?.replace('_', ' ') || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDuration(record.total_worked_hours)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {record.late_minutes > 0 && (
                          <span className="text-orange-600 mr-2">+{record.late_minutes}m late</span>
                        )}
                        {record.early_departure_minutes > 0 && (
                          <span className="text-red-600">-{record.early_departure_minutes}m early</span>
                        )}
                        {record.late_minutes === 0 && record.early_departure_minutes === 0 && '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {attendanceData && attendanceData.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button 
            disabled={page <= 1} 
            onClick={() => setPage((p) => p - 1)} 
            className="rounded-md border border-border px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-accent transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground">
            Page {attendanceData.current_page} of {attendanceData.last_page}
          </span>
          <button 
            disabled={page >= attendanceData.last_page} 
            onClick={() => setPage((p) => p + 1)} 
            className="rounded-md border border-border px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-accent transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}