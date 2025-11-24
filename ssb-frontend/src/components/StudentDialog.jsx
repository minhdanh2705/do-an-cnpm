import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material'

const StudentDialog = ({ open, student, routes, parents, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    hoTen: '',
    lop: '',
    idTuyen: '',
    diemDon: '',
    trangThai: 'Hoat dong',
    idPhuHuynh: '', // SỬA: Dùng id đơn thay vì mảng
  })

  useEffect(() => {
    if (student) {
      setFormData({
        hoTen: student.hoTen || '',
        lop: student.lop || '',
        idTuyen: student.idTuyen || '',
        diemDon: student.diemDon || '',
        trangThai: student.trangThai === 1 ? 'Hoat dong' : 'Nghi hoc',
        // Lấy id phụ huynh (nếu backend trả về object phụ huynh thì lấy .id, nếu trả về số thì lấy trực tiếp)
        idPhuHuynh: student.idPhuHuynh || '', 
      })
    } else {
      setFormData({
        hoTen: '',
        lop: '',
        idTuyen: '',
        diemDon: '',
        trangThai: 'Hoat dong',
        idPhuHuynh: '', // Reset về rỗng khi thêm mới
      })
    }
  }, [student, open])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = () => {
    const submitData = {
      ...formData,
      idTuyen: formData.idTuyen ? parseInt(formData.idTuyen) : null,
      diemDon: formData.diemDon ? parseInt(formData.diemDon) : null,
      trangThai: formData.trangThai === 'Hoat dong' ? 1 : 0,
      // SỬA: Gửi idPhuHuynh dạng số
      idPhuHuynh: formData.idPhuHuynh ? parseInt(formData.idPhuHuynh) : null, 
    };
    
    // Xóa các trường thừa nếu có
    delete submitData.parentIds; 

    onSave(submitData);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{student ? 'Chỉnh sửa học sinh' : 'Thêm học sinh mới'}</DialogTitle>
      <DialogContent>
        <TextField
          name="hoTen"
          label="Họ tên"
          fullWidth
          margin="normal"
          value={formData.hoTen}
          onChange={handleChange}
          required
        />
        <TextField
          name="lop"
          label="Lớp"
          fullWidth
          margin="normal"
          value={formData.lop}
          onChange={handleChange}
          required
        />
        
        {/* Chọn Tuyến */}
        <TextField
          name="idTuyen"
          label="Tuyến xe"
          select
          fullWidth
          margin="normal"
          value={formData.idTuyen}
          onChange={handleChange}
        >
          <MenuItem value="">-- Chọn tuyến xe --</MenuItem>
          {routes && routes.map((route) => (
            <MenuItem key={route.idTuyen || route.idTuyenDuong} value={route.idTuyen || route.idTuyenDuong}>
              {route.tenTuyen}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          name="diemDon"
          label="ID Điểm đón (Nhập số)"
          type="number"
          fullWidth
          margin="normal"
          value={formData.diemDon}
          onChange={handleChange}
        />
        
        {/* SỬA: Chọn Phụ Huynh (Single Select) */}
        <FormControl fullWidth margin="normal">
          <InputLabel id="phuhuynh-label">Phụ huynh</InputLabel>
          <Select
            labelId="phuhuynh-label"
            name="idPhuHuynh"
            value={formData.idPhuHuynh}
            onChange={handleChange}
            label="Phụ huynh"
          >
            <MenuItem value="">
              <em>-- Chưa chọn phụ huynh --</em>
            </MenuItem>
            {parents && parents.map((parent) => (
              <MenuItem key={parent.idPhuHuynh} value={parent.idPhuHuynh}>
                {parent.hoTen} - {parent.soDienThoai}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          name="trangThai"
          label="Trạng thái"
          select
          fullWidth
          margin="normal"
          value={formData.trangThai}
          onChange={handleChange}
        >
          <MenuItem value="Hoat dong">Hoạt động</MenuItem>
          <MenuItem value="Nghi hoc">Nghỉ học</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button onClick={handleSubmit} variant="contained">
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default StudentDialog