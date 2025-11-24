import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import { sql, pool } from './config/database.js';

// Import các router
import busRouter from './router/bus-router.js';
import routeRouter from './router/route-router.js';
import studentRouter from './router/student-router.js';
import authRouter from './router/auth-router.js';
import stopRouter from './router/stop-router.js';
import driverRouter from './router/driver-router.js';
import parentRouter from './router/parent-router.js';
import scheduleRouter from './router/schedule-router.js';
import trackingRouter from './router/tracking-router.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const port = 5000;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

app.use(session({
    secret: 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Gán router
app.use('/api/auth', authRouter);
app.use('/api/buses', busRouter);
app.use('/api/routes', routeRouter);
app.use('/api/students', studentRouter);
app.use('/api/stops', stopRouter);
app.use('/api/drivers', driverRouter);
app.use('/api/parents', parentRouter);
app.use('/api/schedules', scheduleRouter);
app.use('/api/tracking', trackingRouter);

app.get('/', (req, res) => {
    res.json({ 
        message: 'SSB Backend API is running',
        version: '1.0.0',
        endpoints: [
            '/api/auth', '/api/buses', '/api/routes', 
            '/api/students', '/api/stops', '/api/drivers', 
            '/api/parents', '/api/schedules', '/api/tracking'
        ]
    });
});

app.use((err, req, res, next) => {
    console.error('[v0] Error:', err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

io.on('connection', (socket) => {
    console.log(`[v0] Socket connected: ${socket.id}`);

    socket.on('driver:updateLocation', (data) => {
        console.log(`[v0] Location update from driver:`, data);
        io.emit('bus:locationUpdate', data);
    });

    socket.on('disconnect', () => {
        console.log(`[v0] Socket disconnected: ${socket.id}`);
    });
});

server.listen(port, () => {
    console.log(`Server đang chạy ở http://localhost:${port}`);
    console.log(`Kiểm tra API: http://localhost:${port}/`);
    console.log(`Socket.IO ready for real-time tracking`);
});