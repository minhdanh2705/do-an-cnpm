import { sql, poolPromise } from '../config/database.js';

export const getAllStudents = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                h.idHocSinh, h.hoTen, h.lop, h.diaChi, h.trangThai,
                p.hoTen as tenPhuHuynh, p.soDienThoai as sdtPhuHuynh,
                t.tenTuyen,
                d.tenDiemDung as tenDiemDon
            FROM HOCSINH h
            LEFT JOIN PHUHUYNH p ON h.idPhuHuynh = p.idPhuHuynh
            LEFT JOIN TUYENDUONG t ON h.idTuyen = t.idTuyenDuong
            LEFT JOIN DIEMDUNG d ON h.idDiemDon = d.idDiemDung
            ORDER BY h.idHocSinh DESC
        `);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request().input('id', sql.Int, id).query('SELECT * FROM HOCSINH WHERE idHocSinh = @id');
        res.json({ success: true, data: result.recordset[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createStudent = async (req, res) => {
    try {
        const { hoTen, lop, idPhuHuynh, idTuyen, idDiemDon } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('hoTen', sql.NVarChar, hoTen)
            .input('lop', sql.NVarChar, lop)
            .input('idPhuHuynh', sql.Int, idPhuHuynh || null)
            .input('idTuyen', sql.Int, idTuyen || null)
            .input('idDiemDon', sql.Int, idDiemDon || null)
            .query(`
                INSERT INTO HOCSINH (hoTen, lop, idPhuHuynh, idTuyen, idDiemDon, trangThai)
                VALUES (@hoTen, @lop, @idPhuHuynh, @idTuyen, @idDiemDon, 1)
            `);
        res.json({ success: true, message: 'Thêm học sinh thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { hoTen, lop, idPhuHuynh, idTuyen, idDiemDon, trangThai } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('hoTen', sql.NVarChar, hoTen)
            .input('lop', sql.NVarChar, lop)
            .input('idPhuHuynh', sql.Int, idPhuHuynh || null)
            .input('idTuyen', sql.Int, idTuyen || null)
            .input('idDiemDon', sql.Int, idDiemDon || null)
            .input('trangThai', sql.Int, trangThai)
            .query(`
                UPDATE HOCSINH 
                SET hoTen=@hoTen, lop=@lop, idPhuHuynh=@idPhuHuynh, idTuyen=@idTuyen, idDiemDon=@idDiemDon, trangThai=@trangThai
                WHERE idHocSinh=@id
            `);
        res.json({ success: true, message: 'Cập nhật học sinh thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request().input('id', sql.Int, id).query('UPDATE HOCSINH SET trangThai = 0 WHERE idHocSinh = @id');
        res.json({ success: true, message: 'Xóa học sinh thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Hàm phụ trợ để tránh lỗi route nếu có gọi
export const getParentsForStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        // Lấy thông tin phụ huynh của học sinh này
        const result = await pool.request().input('id', sql.Int, id)
            .query('SELECT p.* FROM PHUHUYNH p JOIN HOCSINH h ON p.idPhuHuynh = h.idPhuHuynh WHERE h.idHocSinh = @id');
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};