import request from 'supertest';
import app from '../app';
import User from '../models/user.model';
import Post from '../models/post.model';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

/** Helper – create a fresh user + token every test (DB is wiped each beforeEach) */
async function createTestUserAndToken() {
    const hashed = await bcrypt.hash('Password123!', 10);
    const user = await User.create({ username: 'postuser', email: 'postuser@example.com', password: hashed });
    const token = jwt.sign({ id: user._id.toString(), role: 'user' }, JWT_SECRET);
    return { user, token };
}

/** Helper – seed a post */
async function seedPost(authorId: string, content = 'Seed post', visibility = 'public') {
    return Post.create({ author: new mongoose.Types.ObjectId(authorId), content, visibility });
}

describe('Posts API Integration Tests', () => {

    // ─── 13. Create Post ──────────────────────────────────────────────────────
    it('13. should create a new post successfully', async () => {
        const { token } = await createTestUserAndToken();

        const res = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'Hello world from test!', visibility: 'public' });

        expect(res.status).toBe(201);
        expect(res.body.content).toBe('Hello world from test!');
        expect(res.body.visibility).toBe('public');
    });

    // ─── 14. Reject Unauthenticated Post Create ───────────────────────────────
    it('14. should reject post creation without authentication', async () => {
        const res = await request(app)
            .post('/api/posts')
            .send({ content: 'Unauthenticated post' });

        expect(res.status).toBe(401);
    });

    // ─── 15. Get Feed ─────────────────────────────────────────────────────────
    it('15. should return the feed for an authenticated user', async () => {
        const { user, token } = await createTestUserAndToken();
        await seedPost(user._id.toString(), 'Public post', 'public');

        const res = await request(app)
            .get('/api/posts/feed')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    // ─── 16. Like / Unlike Post ───────────────────────────────────────────────
    it('16. should toggle a like on a post', async () => {
        const { user, token } = await createTestUserAndToken();
        const post = await seedPost(user._id.toString());

        const res = await request(app)
            .post(`/api/posts/${post._id}/like`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('liked');
        expect(typeof res.body.liked).toBe('boolean');
    });

    // ─── 17. Add Comment ──────────────────────────────────────────────────────
    it('17. should add a comment to a post', async () => {
        const { user, token } = await createTestUserAndToken();
        const post = await seedPost(user._id.toString());

        const res = await request(app)
            .post(`/api/posts/${post._id}/comments`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'Nice post!' });

        expect(res.status).toBe(201);
        expect(res.body.content).toBe('Nice post!');
    });

    // ─── 18. Get Comments ─────────────────────────────────────────────────────
    it('18. should retrieve comments list for a post', async () => {
        const { user, token } = await createTestUserAndToken();
        const post = await seedPost(user._id.toString());
        // add a comment first
        await request(app)
            .post(`/api/posts/${post._id}/comments`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'First comment' });

        const res = await request(app)
            .get(`/api/posts/${post._id}/comments`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    // ─── 19. Delete Post ──────────────────────────────────────────────────────
    it('19. should delete a post owned by the user', async () => {
        const { user, token } = await createTestUserAndToken();
        const post = await seedPost(user._id.toString());

        const res = await request(app)
            .delete(`/api/posts/${post._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Post deleted successfully');
    });

    // ─── 20. Delete Non-existent Post ─────────────────────────────────────────
    it('20. should return 404 when deleting a post that does not exist', async () => {
        const { token } = await createTestUserAndToken();
        const fakeId = new mongoose.Types.ObjectId().toString();

        const res = await request(app)
            .delete(`/api/posts/${fakeId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Post not found or unauthorized');
    });
});
