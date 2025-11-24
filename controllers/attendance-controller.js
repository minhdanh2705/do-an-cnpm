import { sql, poolPromise } from '../config/database.js';

// API: Cập nhật điểm danh và gửi thông báo
export const markAttendance = async (req, res) => {
    try {
        const { idLichTrinh, idHocSinh, trangThai, lat, lng } = req.body;
        // trangThai: 'DA_DON' (Đã đón), 'DA_TRA' (Đã trả), 'VANG' (Vắng)

        if (!idLichTrinh || !idHocSinh || !trangThai) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }

        const pool = await poolPromise;
        
        // 1. Cập nhật bảng DIEMDANH
        let updateField = '';
        if (trangThai === 'DA_DON') updateField = ', thoiGianDon = GETDATE()';
        if (trangThai === 'DA_TRA') updateField = ', thoiGianTra = GETDATE()';

        await pool.request()
            .input('idLichTrinh', sql.Int, idLichTrinh)
            .input('idHocSinh', sql.Int, idHocSinh)
            .input('trangThai', sql.NVarChar, trangThai)
            .query(`
                UPDATE DIEMDANH 
                SET trangThai = @trangThai ${updateField}
                WHERE idLichTrinh = @idLichTrinh AND idHocSinh = @idHocSinh
            `);

        // 2. Lấy thông tin Phụ huynh & Học sinh để tạo thông báo
        const infoResult = await pool.request()
            .input('idHocSinh', sql.Int, idHocSinh)
            .query(`
                SELECT hs.hoTen as tenHocSinh, ph.idPhuHuynh, ph.hoTen as tenPhuHuynh
                FROM HOCSINH hs
                JOIN PHUHUYNH_HOCSINH phs ON hs.idHocSinh = phs.idHocSinh
                JOIN PHUHUYNH ph ON phs.idPhuHuynh = ph.idPhuHuynh
                WHERE hs.idHocSinh = @idHocSinh
            `);

        // 3. Tạo thông báo và bắn Socket cho từng phụ huynh liên quan
        const io = req.app.get('io');
        
        for (const record of infoResult.recordset) {
            let title = '';
            let message = '';

            if (trangThai === 'DA_DON') {
                title = 'Học sinh đã lên xe';
                message = `Em ${record.tenHocSinh} đã được đón lên xe an toàn.`;
            } else if (trangThai === 'DA_TRA') {
                title = 'Học sinh đã về nhà';
                message = `Em ${record.tenHocSinh} đã được trả tại điểm trả.`;
            } else if (trangThai === 'VANG') {
                title = 'Thông báo vắng mặt';
                message = `Em ${record.tenHocSinh} được đánh dấu vắng mặt chuyến này.`;
            }

            // Lưu vào bảng THONGBAO
            await pool.request()
                .input('idPhuHuynh', sql.Int, record.idPhuHuynh)
                .input('tieuDe', sql.NVarChar, title)
                .input('noiDung', sql.NVarChar, message)
                .input('loai', sql.NVarChar, 'DIEM_DANH')
                .query(`
                    INSERT INTO THONGBAO (idPhuHuynh, tieuDe, noiDung, loai)
                    VALUES (@idPhuHuynh, @tieuDe, @noiDung, @loai)
                `);

            // Gửi Socket Real-time
            if (io) {
                console.log(`[Socket] Gửi thông báo tới phụ huynh ID: ${record.idPhuHuynh}`);
                io.emit(`notification:parent:${record.idPhuHuynh}`, {
                    title,
                    message,
                    timestamp: new Date(),
                    type: 'DIEM_DANH',
                    studentId: idHocSinh
                });
            }
        }

        res.json({ success: true, message: 'Điểm danh thành công' });

    } catch (error) {
        console.error('Lỗi điểm danh:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export default { markAttendance };