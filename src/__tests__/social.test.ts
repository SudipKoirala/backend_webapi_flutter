import request from 'supertest';
import app from '../app';
import User from '../models/user.model';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

/** Helper – seed a user + token each test */
async function createUser(username: string, email: string) {
    const hashed = await bcrypt.hash('Password123!', 10);
    const user = await User.create({ username, email, password: hashed });
    const token = jwt.sign({ id: user._id.toString(), role: 'user' }, JWT_SECRET);
    return { user, token };
}

describe('Social & User API Integration Tests', () => {

    // ─── 21. GET /social/me ──────────────────────────────────────────────────
    it('21. should return the current authenticated user profile', async () => {
        const { user, token } = await createUser('alice21', 'alice21@example.com');

        const res = await request(app)
            .get('/api/social/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.email).toBe(user.email);
        expect(res.body).not.toHaveProperty('password');
    });

    // ─── 22. Search Users ────────────────────────────────────────────────────
    it('22. should search for users by username', async () => {
        const { token } = await createUser('alice22', 'alice22@example.com');
        await createUser('bobby22', 'bobby22@example.com');

        const res = await request(app)
            .get('/api/social/search?q=bobby22')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((u: any) => u.username === 'bobby22')).toBe(true);
    });

    // ─── 23. Get User Profile ────────────────────────────────────────────────
    it('23. should return a public profile of another user', async () => {
        const { token } = await createUser('alice23', 'alice23@example.com');
        const { user: bob } = await createUser('bob23', 'bob23@example.com');

        const res = await request(app)
            .get(`/api/social/users/${bob._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.username).toBe('bob23');
        expect(res.body).toHaveProperty('postCount');
        expect(res.body).toHaveProperty('friendsCount');
    });

    // ─── 24. Toggle Friend (Add) ─────────────────────────────────────────────
    it('24. should add/remove a friend (toggle)', async () => {
        const { token } = await createUser('alice24', 'alice24@example.com');
        const { user: bob } = await createUser('bob24', 'bob24@example.com');

        const res = await request(app)
            .post(`/api/social/friends/${bob._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('isFriend');
        expect(typeof res.body.isFriend).toBe('boolean');
    });

    // ─── 25. List Friends ────────────────────────────────────────────────────
    it('25. should list friends of the authenticated user', async () => {
        const { token } = await createUser('alice25', 'alice25@example.com');
        const { user: bob } = await createUser('bob25', 'bob25@example.com');

        // Add bob as friend first
        await request(app)
            .post(`/api/social/friends/${bob._id}`)
            .set('Authorization', `Bearer ${token}`);

        const res = await request(app)
            .get('/api/social/friends')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        expect(res.body[0].username).toBe('bob25');
    });

    // ─── 26. Toggle Notifications ────────────────────────────────────────────
    it('26. should toggle notification setting for the user', async () => {
        const { token } = await createUser('alice26', 'alice26@example.com');

        const res = await request(app)
            .post('/api/social/notifications/toggle')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('notificationsEnabled');
        expect(typeof res.body.notificationsEnabled).toBe('boolean');
    });

    // ─── 27. Auth guard blocks unauthenticated social requests ───────────────
    it('27. should block unauthenticated access to social search', async () => {
        const res = await request(app)
            .get('/api/social/search?q=bob');

        expect(res.status).toBe(401);
    });

    // ─── 28. Health Check ────────────────────────────────────────────────────
    it('28. should return 200 for /api/health', async () => {
        const res = await request(app).get('/api/health');

        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
        expect(res.body.service).toBe('vibement-backend');
    });
});
