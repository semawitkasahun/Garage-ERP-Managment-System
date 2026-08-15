import { useState, useEffect } from 'react';
import { QrCode, Clock, RefreshCw, MapPin, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useGenerateQrToken } from '@/features/attendance/hooks/useQrAttendance';
import { Skeleton } from '@/components/ui/skeleton';

export function AttendanceTerminal() {
  const { user } = useAuthStore();
  const [qrData, setQrData] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const generateToken = useGenerateQrToken();

  // Update time every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Update date every minute
  useEffect(() => {
    const dateInterval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(dateInterval);
  }, []);

  // Generate QR token and refresh every 30 seconds
  useEffect(() => {
    const generateAndSchedule = async () => {
      if (user?.branch_id) {
        try {
          const result = await generateToken.mutateAsync(user.branch_id);
          setQrData(result);
          setCountdown(30);
        } catch (error) {
          console.error('Failed to generate QR token:', error);
        }
      }
    };

    generateAndSchedule();

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          generateAndSchedule();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.branch_id]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const generateQrCodeUrl = (token) => {
    return `${window.location.origin}/attendance/scan?token=${token}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold tracking-tight" style={{ color: 'hsl(84 25% 30%)' }}>
            GARAGE ERP
          </h1>
          <p className="text-xl text-muted-foreground mt-2">Attendance Terminal</p>
        </div>

        {/* Date and Time */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Date</p>
              <p className="font-display text-2xl font-semibold">{formatDate(currentDate)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Time</p>
              <p className="font-display text-2xl font-semibold">{formatTime(currentTime)}</p>
            </div>
          </div>
        </div>

        {/* Branch Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-center gap-2">
            <MapPin className="h-5 w-5" style={{ color: 'hsl(84 25% 30%)' }} />
            <span className="font-medium text-lg">{user?.branch?.name || 'Main Garage'}</span>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex flex-col items-center">
            {/* QR Code */}
            {qrData ? (
              <div className="relative">
                <div className="bg-white border-4 border-gray-200 rounded-lg p-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generateQrCodeUrl(qrData.token))}`}
                    alt="Attendance QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-2">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            ) : (
              <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <Skeleton className="w-64 h-64" />
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 text-center">
              <p className="text-lg font-medium mb-2">Scan to Check In / Check Out</p>
              <p className="text-sm text-muted-foreground">
                Use your phone camera to scan the QR code
              </p>
            </div>

            {/* Countdown Timer */}
            <div className="mt-6 flex items-center gap-2">
              <RefreshCw className={`h-5 w-5 ${countdown <= 10 ? 'text-orange-500 animate-spin' : 'text-muted-foreground'}`} />
              <span className={`font-medium ${countdown <= 10 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                QR expires in: {countdown} seconds
              </span>
            </div>

            {/* Status */}
            <div className="mt-4 px-4 py-2 rounded-full bg-green-100 text-green-800 font-medium">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                QR Code Active
              </span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-800">
            <strong>Security Notice:</strong> This QR code changes every 30 seconds for your security.
            Always scan the current QR code displayed at the garage.
          </p>
        </div>
      </div>
    </div>
  );
}