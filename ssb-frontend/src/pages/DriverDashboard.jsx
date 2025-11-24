import { useState, useEffect } from 'react'
import { Box, Card, CardContent, Typography, Button, Stepper, Step, StepLabel } from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import MapComponent from '../components/MapComponent'
import useRealTimeTracking from '../hooks/useRealTimeTracking'

// DỮ LIỆU GIẢ LẬP TUYẾN ĐƯỜNG (Q1 -> Q3 TP.HCM)
const ROUTE_PATH = [
  [10.7769, 106.6954], // Nhà thờ Đức Bà (Start)
  [10.7795, 106.6940], // Bưu điện
  [10.7820, 106.6900], 
  [10.7845, 106.6826], // Điểm dừng 1
  [10.7860, 106.6800],
  [10.7880, 106.6780], // Điểm dừng 2
  [10.7900, 106.6750]  // Kết thúc
];

const BUS_STOPS = [
  { id: 1, name: 'Trạm 1: Hồ Con Rùa', lat: 10.7845, lng: 106.6826, indexInRoute: 3 },
  { id: 2, name: 'Trạm 2: Công viên Lê Văn Tám', lat: 10.7880, lng: 106.6780, indexInRoute: 5 },
  { id: 3, name: 'Điểm cuối: Trường THPT', lat: 10.7900, lng: 106.6750, indexInRoute: 6 }
];

const DriverDashboard = () => {
  const { updateLocation } = useRealTimeTracking();
  
  const [tripStatus, setTripStatus] = useState('IDLE'); // IDLE, RUNNING, FINISHED
  const [currentStopIdx, setCurrentStopIdx] = useState(-1); // Chưa đến trạm nào
  const [busPosition, setBusPosition] = useState(ROUTE_PATH[0]); // Vị trí ban đầu
  
  // Hàm xử lý di chuyển xe (Simulation)
  useEffect(() => {
    if (tripStatus === 'RUNNING' && currentStopIdx < BUS_STOPS.length) {
      // Tìm tọa độ mục tiêu (trạm tiếp theo)
      const targetStop = BUS_STOPS[currentStopIdx];
      // Ở đây làm đơn giản: Nhảy thẳng đến trạm tiếp theo khi bấm nút
      // Thực tế bạn có thể dùng setInterval để nhích từng chút một trong ROUTE_PATH
    }
  }, [tripStatus, currentStopIdx]);

  const handleStartTrip = () => {
    setTripStatus('RUNNING');
    setCurrentStopIdx(0); // Bắt đầu đi tới trạm đầu tiên
    setBusPosition(ROUTE_PATH[0]);
    updateLocation(1, ROUTE_PATH[0][0], ROUTE_PATH[0][1], 40, 0); // Gửi socket
  };

  const handleNextStop = () => {
    const nextIdx = currentStopIdx + 1;
    
    if (nextIdx >= BUS_STOPS.length) {
      handleFinishTrip();
      return;
    }

    // Mô phỏng xe chạy đến trạm kế tiếp
    const nextStop = BUS_STOPS[currentStopIdx]; 
    setBusPosition([nextStop.lat, nextStop.lng]);
    updateLocation(1, nextStop.lat, nextStop.lng, 0, 0); // Gửi socket: Đã đến trạm
    
    setCurrentStopIdx(nextIdx);
  };

  const handleFinishTrip = () => {
    setTripStatus('FINISHED');
    alert("Chuyến đi đã hoàn thành!");
    updateLocation(1, busPosition[0], busPosition[1], 0, 0);
  };

  // Lấy thông tin trạm hiện tại để hiển thị nút
  const currentTargetStop = currentStopIdx >= 0 && currentStopIdx < BUS_STOPS.length 
    ? BUS_STOPS[currentStopIdx] 
    : null;

  return (
    <Box sx={{ p: 2, color: 'white' }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Bảng điều khiển tài xế</Typography>

      {/* BẢN ĐỒ */}
      <Card sx={{ mb: 2, height: 400 }}>
        <MapComponent 
          center={busPosition} 
          routePath={ROUTE_PATH} 
          stops={BUS_STOPS}
          buses={[{ idXeBus: 1, bienSo: '51B-12345', position: busPosition }]}
        />
      </Card>

      {/* THANH TRẠNG THÁI (STEPPER) */}
      <Card sx={{ mb: 2, p: 2 }}>
        <Stepper activeStep={currentStopIdx} alternativeLabel>
          {BUS_STOPS.map((stop) => (
            <Step key={stop.id}>
              <StepLabel>{stop.name}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Card>

      {/* CÁC NÚT ĐIỀU KHIỂN */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        {tripStatus === 'IDLE' && (
          <Button variant="contained" color="success" size="large" startIcon={<PlayArrowIcon />} onClick={handleStartTrip}>
            Bắt đầu chuyến đi
          </Button>
        )}

        {tripStatus === 'RUNNING' && (
          <Button variant="contained" color="primary" size="large" startIcon={<SkipNextIcon />} onClick={handleNextStop}>
            {currentStopIdx >= BUS_STOPS.length 
              ? 'Kết thúc hành trình' 
              : `Đi đến: ${BUS_STOPS[currentStopIdx]?.name}`}
          </Button>
        )}

        {tripStatus === 'FINISHED' && (
          <Button variant="outlined" color="secondary" onClick={() => setTripStatus('IDLE')}>
            Làm mới chuyến mới
          </Button>
        )}
      </Box>
    </Box>
  )
}

export default DriverDashboard