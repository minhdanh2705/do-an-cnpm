import { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, List, ListItem, ListItemText,
  Chip, Button, Alert, Switch, FormControlLabel, Snackbar
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import HailIcon from '@mui/icons-material/Hail' // Icon đón
import HomeIcon from '@mui/icons-material/Home' // Icon trả
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import WarningIcon from '@mui/icons-material/Warning'

// Import API mới thêm
import { studentService, attendanceService } from '../services/api' 
import { useAuth } from '../context/AuthContext'
import useRealTimeTracking from '../hooks/useRealTimeTracking'
import MapComponent from '../components/MapComponent'

const DriverDashboard = () => {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({}) // Lưu trạng thái: 'DA_DON', 'DA_TRA', 'VANG'
  const [tripStarted, setTripStarted] = useState(false)
  const [gpsSimulation, setGpsSimulation] = useState(false)
  const [currentLocation, setCurrentLocation] = useState({ lat: 10.762622, lng: 106.660172 })
  const { updateLocation } = useRealTimeTracking()
  
  // State thông báo (Toast)
  const [toast, setToast] = useState({ open: false, message: '' });

  useEffect(() => {
    loadData()
  }, [])

  // Giả lập GPS chạy
  useEffect(() => {
    if (gpsSimulation && tripStarted) {
      const interval = setInterval(() => {
        setCurrentLocation(prev => {
          const newLat = prev.lat + (Math.random() - 0.5) * 0.0005
          const newLng = prev.lng + (Math.random() - 0.5) * 0.0005
          
          // Gửi vị trí lên Server (Socket)
          // Hardcode idXeBus = 1 cho demo
          updateLocation(1, newLat, newLng, 40, 0)
          
          return { lat: newLat, lng: newLng }
        })
      }, 2000) // 2 giây cập nhật 1 lần (nhanh hơn để demo mượt)

      return () => clearInterval(interval)
    }
  }, [gpsSimulation, tripStarted, updateLocation])

  const loadData = async () => {
    try {
      const res = await studentService.getAll()
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      // Lấy 5 học sinh làm mẫu
      setStudents(data.slice(0, 5))
    } catch (error) {
      console.error('Lỗi tải học sinh:', error)
    }
  }

  // --- HÀM XỬ LÝ ĐIỂM DANH QUAN TRỌNG ---
  const handleMarkAttendance = async (studentId, status) => {
    try {
      // 1. Gọi API lưu xuống DB & Bắn thông báo
      await attendanceService.mark({
        idLichTrinh: 1, // Hardcode cho demo (thực tế lấy từ lịch trình)
        idHocSinh: studentId,
        trangThai: status,
        lat: currentLocation.lat,
        lng: currentLocation.lng
      });

      // 2. Cập nhật UI nếu thành công
      setAttendance(prev => ({
        ...prev,
        [studentId]: status
      }));

      setToast({ open: true, message: `Đã cập nhật trạng thái: ${status}` });

    } catch (error) {
      console.error(error);
      alert('Lỗi cập nhật điểm danh: ' + error.message);
    }
  }

  const handleStartTrip = () => {
    setTripStarted(true)
    setGpsSimulation(true)
  }

  return (
    <Box sx={{ color: '#ffffff', pb: 10 }}>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
        Dashboard Tài Xế
      </Typography>

      {tripStarted && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Đang trong lộ trình. GPS đang phát tín hiệu...
        </Alert>
      )}

      {/* --- PHẦN BẢN ĐỒ --- */}
      <Card sx={{ bgcolor: '#111111', mb: 2, border: '1px solid #333' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>Bản đồ lộ trình</Typography>
          <MapComponent 
            center={[currentLocation.lat, currentLocation.lng]}
            buses={[{ idXeBus: 1, bienSo: '51B-12345', position: [currentLocation.lat, currentLocation.lng] }]}
          />
          <FormControlLabel
            sx={{ mt: 2, color: '#fff' }}
            control={<Switch checked={gpsSimulation} onChange={(e) => setGpsSimulation(e.target.checked)} disabled={!tripStarted} />}
            label="Mô phỏng di chuyển (GPS)"
          />
        </CardContent>
      </Card>

      {/* --- DANH SÁCH HỌC SINH ĐỂ ĐIỂM DANH --- */}
      <Card sx={{ bgcolor: '#111111', mb: 2, border: '1px solid #333' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>Điểm danh học sinh</Typography>
          <List>
            {students.map((hs) => {
              const status = attendance[hs.idHocSinh];
              return (
                <ListItem 
                  key={hs.idHocSinh}
                  sx={{ 
                    bgcolor: '#1e1e1e', mb: 1, borderRadius: 1, 
                    flexDirection: 'column', alignItems: 'stretch' 
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{hs.hoTen}</Typography>
                    <Typography sx={{ color: '#aaa' }}>Lớp {hs.lop}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* Nút ĐÓN */}
                    <Button
                      variant={status === 'DA_DON' ? 'contained' : 'outlined'}
                      color="success"
                      size="small"
                      startIcon={<HailIcon />}
                      onClick={() => handleMarkAttendance(hs.idHocSinh, 'DA_DON')}
                      disabled={!tripStarted}
                      fullWidth
                    >
                      Đón
                    </Button>

                    {/* Nút TRẢ */}
                    <Button
                      variant={status === 'DA_TRA' ? 'contained' : 'outlined'}
                      color="info"
                      size="small"
                      startIcon={<HomeIcon />}
                      onClick={() => handleMarkAttendance(hs.idHocSinh, 'DA_TRA')}
                      disabled={!tripStarted || status !== 'DA_DON'} // Chỉ trả khi đã đón
                      fullWidth
                    >
                      Trả
                    </Button>

                    {/* Nút VẮNG */}
                    <Button
                      variant={status === 'VANG' ? 'contained' : 'outlined'}
                      color="error"
                      size="small"
                      startIcon={<CancelIcon />}
                      onClick={() => handleMarkAttendance(hs.idHocSinh, 'VANG')}
                      disabled={!tripStarted}
                      fullWidth
                    >
                      Vắng
                    </Button>
                  </Box>
                </ListItem>
              )
            })}
          </List>
        </CardContent>
      </Card>

      {/* Nút bắt đầu hành trình */}
      {!tripStarted && (
        <Button 
          variant="contained" 
          size="large" 
          fullWidth 
          startIcon={<GpsFixedIcon />}
          onClick={handleStartTrip}
          sx={{ bgcolor: '#00e676', color: '#000', fontWeight: 'bold', py: 2 }}
        >
          BẮT ĐẦU CHUYẾN ĐI
        </Button>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        message={toast.message}
      />
    </Box>
  )
}

export default DriverDashboard