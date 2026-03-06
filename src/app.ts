import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import postRoutes from './routes/post.routes';
import chatRoutes from './routes/chat.routes';
import socialRoutes from './routes/social.routes';
import storyRoutes from './routes/story.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();

// 1. Middlewares
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.get('/api/health', (_req, res) => {
    res.status(200).json({ ok: true, service: 'vibement-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500).json({ message: err.message });
});

export default app;
