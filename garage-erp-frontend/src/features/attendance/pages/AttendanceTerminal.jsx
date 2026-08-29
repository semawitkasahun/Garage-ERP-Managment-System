import { useState, useEffect } from 'react';
import { QrCode, Clock, RefreshCw, MapPin, CheckCircle, Printer } from 'lucide-react';
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
      const branchId = user?.branch_id || 1;
      try {
        const result = await generateToken.mutateAsync(branchId);
        setQrData(result);
        setCountdown(30);
      } catch (error) {
        console.error('Failed to generate QR token:', error);
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
    // Use relative URL so it works on any host/IP (PC, mobile, etc.)
    return '/api/attendance/qr?token=' + token;
  };

  const handlePrintQr = () => {
    const printContent = document.getElementById('qr-print-section');
    if (!printContent) return;

    const img = printContent.querySelector('img');
    if (!img) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance QR Code</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 20px;
              margin: 0;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .header h1 {
              color: #1a5f1a;
              margin: 0;
              font-size: 28px;
            }
            .header p {
              color: #666;
              margin: 5px 0 0 0;
              font-size: 16px;
            }
            .qr-container {
              border: 4px solid #e5e7eb;
              border-radius: 12px;
              padding: 20px;
              background: white;
            }
            .qr-image {
              width: 300px;
              height: 300px;
            }
            .info {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 14px;
            }
            .branch {
              font-weight: bold;
              color: #333;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>GARAGE ERP</h1>
            <p>Attendance Terminal</p>
          </div>
          <div class="qr-container">
            <img src="${img.src}" alt="Attendance QR Code" class="qr-image" />
          </div>
          <div class="info">
            <p>Scan this QR code to check in/out</p>
            <p class="branch">${user?.branch?.name || 'Main Garage'}</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = function() {
      printWindow.print();
    };
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
              <div id="qr-print-section" className="relative">
                <div className="bg-white border-4 border-gray-200 rounded-lg p-4 shadow-md">
                  <img
                    src={generateQrCodeUrl(qrData.token)}
                    alt="Attendance QR Code"
                    className="w-72 h-72"
                  />
                </div>
                <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-2 shadow-lg">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            ) : (
              <div className="w-72 h-72 bg-gray-100 rounded-lg flex items-center justify-center border-4 border-gray-200">
                <Skeleton className="w-72 h-72" />
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 text-center">
              <p className="text-lg font-medium mb-2">Scan to Check In / Check Out</p>
              <p className="text-sm text-muted-foreground">
                Use your phone camera to scan the QR code
              </p>
            </div>

            {/* Print Button */}
            {qrData && (
              <button
                onClick={handlePrintQr}
                className="mt-4 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
              >
                <Printer className="h-5 w-5" />
                Print QR Code
              </button>
            )}

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