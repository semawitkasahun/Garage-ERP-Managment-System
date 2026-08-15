import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QrCode, Clock, LogIn, LogOut, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useQrAttendanceStatus, useQrCheckIn, useQrCheckOut, useValidateQrToken } from '@/features/attendance/hooks/useQrAttendance';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export function AttendanceScan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const token = searchParams.get('token');
  
  const [step, setStep] = useState('validate'); // validate, auth, action, success, error
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  
  const validateToken = useValidateQrToken();
  const checkIn = useQrCheckIn();
  const checkOut = useQrCheckOut();
  const { data: status, isLoading: statusLoading } = useQrAttendanceStatus();

  useEffect(() => {
    if (!token) {
      setError('No QR token provided. Please scan a valid QR code.');
      setStep('error');
      return;
    }

    // Validate token
    validateToken.mutateAsync(token)
      .then((result) => {
        if (result.valid) {
          if (user) {
            setStep('action');
          } else {
            setStep('auth');
          }
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Invalid QR code');
        setStep('error');
      });
  }, [token]);

  const handleCheckIn = async () => {
    try {
      const result = await checkIn.mutateAsync(token);
      setSuccessData({
        type: 'check-in',
        message: 'Check-in Successful',
        data: result.attendance
      });
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in failed');
      setStep('error');
    }
  };

  const handleCheckOut = async () => {
    try {
      const result = await checkOut.mutateAsync(token);
      setSuccessData({
        type: 'check-out',
        message: 'Check-out Successful',
        data: result.attendance
      });
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Check-out failed');
      setStep('error');
    }
  };

  const getInitials = (firstName, lastName) => {
    return [firstName, lastName]
      .filter(Boolean)
      .map(name => name[0].toUpperCase())
      .join('');
  };

  const formatTime = (time) => {
    if (!time) return '—';
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (hours) => {
    if (!hours) return '—';
    const h = Math.floor(hours);
    const m = Math.round((hours % 1) * 60);
    return `${h}h ${m}m`;
  };

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">QR Code Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/attendance')}
            className="w-full py-3 px-4 rounded-lg font-medium text-white"
            style={{ background: 'hsl(84 25% 30%)' }}
          >
            Return to Attendance
          </button>
        </div>
      </div>
    );
  }

  if (step === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to continue with attendance.</p>
          <button
            onClick={() => navigate('/login', { state: { returnTo: `/attendance/scan?token=${token}` } })}
            className="w-full py-3 px-4 rounded-lg font-medium text-white"
            style={{ background: 'hsl(84 25% 30%)' }}
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    const isCheckIn = successData?.type === 'check-in';
    const attendance = successData?.data;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isCheckIn ? '✓ Check-in Successful' : '✓ Check-out Successful'}
          </h2>
          
          {attendance && (
            <div className="mt-6 space-y-4 text-left">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Employee</p>
                <p className="font-medium">{attendance.employee?.first_name} {attendance.employee?.last_name}</p>
              </div>
              
              {isCheckIn ? (
                <>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Check-in time</p>
                    <p className="font-medium">{formatTime(attendance.clock_in)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Scheduled time</p>
                    <p className="font-medium">{formatTime(attendance.scheduled_start)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <p className="font-medium capitalize">{attendance.status}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Check-in</p>
                    <p className="font-medium">{formatTime(attendance.clock_in)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Check-out</p>
                    <p className="font-medium">{formatTime(attendance.clock_out)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Working hours</p>
                    <p className="font-medium">{formatDuration(attendance.total_worked_hours)}</p>
                  </div>
                  {attendance.overtime_hours > 0 && (
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-sm text-orange-600 mb-1">Overtime</p>
                      <p className="font-medium text-orange-800">{formatDuration(attendance.overtime_hours)}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          <button
            onClick={() => navigate('/attendance')}
            className="w-full mt-6 py-3 px-4 rounded-lg font-medium text-white"
            style={{ background: 'hsl(84 25% 30%)' }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (step === 'action') {
    if (statusLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      );
    }

    const isCheckIn = !status?.checked_in;
    const employee = user?.employee;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          {/* Employee Info */}
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg font-semibold" style={{ background: 'hsl(84 25% 30%)', color: 'white' }}>
                {getInitials(employee?.first_name, employee?.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {employee?.first_name} {employee?.last_name}
              </h2>
              <p className="text-gray-600">{employee?.job_title || 'Employee'}</p>
            </div>
          </div>

          {/* Shift Info */}
          {status?.shift && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Shift</span>
              </div>
              <p className="text-lg font-semibold">
                {formatTime(status.shift.start_time)} - {formatTime(status.shift.end_time)}
              </p>
            </div>
          )}

          {/* Action Button */}
          {isCheckIn ? (
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 mb-2">Ready to Check In</p>
              <p className="text-sm text-gray-600 mb-6">
                {status?.shift ? `Shift: ${formatTime(status.shift.start_time)} - ${formatTime(status.shift.end_time)}` : 'Tap below to record your check-in'}
              </p>
              <button
                onClick={handleCheckIn}
                disabled={checkIn.isPending}
                className="w-full py-4 px-6 rounded-lg font-semibold text-white text-lg flex items-center justify-center gap-2"
                style={{ background: 'hsl(84 25% 30%)' }}
              >
                <LogIn className="h-6 w-6" />
                {checkIn.isPending ? 'Processing...' : 'CHECK IN'}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 mb-2">Ready to Check Out</p>
              {status?.attendance && (
                <div className="space-y-2 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Check-in</p>
                    <p className="font-medium">{formatTime(status.attendance.clock_in)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Current time</p>
                    <p className="font-medium">{formatTime(new Date())}</p>
                  </div>
                </div>
              )}
              <button
                onClick={handleCheckOut}
                disabled={checkOut.isPending}
                className="w-full py-4 px-6 rounded-lg font-semibold text-white text-lg flex items-center justify-center gap-2"
                style={{ background: 'hsl(84 25% 30%)' }}
              >
                <LogOut className="h-6 w-6" />
                {checkOut.isPending ? 'Processing...' : 'CHECK OUT'}
              </button>
            </div>
          )}

          {/* Cancel Button */}
          <button
            onClick={() => navigate('/attendance')}
            className="w-full mt-4 py-3 px-4 rounded-lg font-medium text-gray-600 border border-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
        <Skeleton className="h-8 w-32 mb-4 mx-auto" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </div>
    </div>
  );
}