import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
import fileUpload from 'express-fileupload';
app.use(fileUpload());

app.get('/', (req, res) => {
    res.send('Campus Assistant API is running');
});

import chatRoutes from './routes/chatRoutes';
import timetableRoutes from './routes/timetableRoutes';
import remindersRoutes from './routes/remindersRoutes';
import kbRoutes from './routes/kbRoutes';
import eventsRoutes from './routes/eventsRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import profileRoutes from './routes/profileRoutes';
import authRoutes from './routes/authRoutes';

app.use('/api/chat', chatRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/auth', authRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
