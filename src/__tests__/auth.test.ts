import request from 'supertest';
import app from '../app';
import User from '../models/user.model';

describe('Auth Integrated Tests', () => {
    const testUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
    };

    it('1. should register a new user successfully', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toBe(testUser.email);
    });

    it('2. should not register a user with an existing email', async () => {
        await User.create({ ...testUser, password: 'hashedpassword' });

        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Email already exists');
    });

    it('3. should not register a user with invalid data (short password)', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...testUser, password: '123' });

        expect(res.status).toBe(400);
    });

    it('4. should login successfully with correct credentials', async () => {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(testUser.password, 10);
        await User.create({ ...testUser, password: hashedPassword });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: testUser.password });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('5. should not login with incorrect password', async () => {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(testUser.password, 10);
        await User.create({ ...testUser, password: hashedPassword });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: 'wrongpassword' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid email or password');
    });

    it('6. should not login a non-existent user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nonexistent@example.com', password: 'password' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid email or password');
    });

    it('7. should generate a reset token on forgot password request', async () => {
        await User.create({ ...testUser, password: 'hashedpassword' });

        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: testUser.email });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Password reset email sent');

        const user = await User.findOne({ email: testUser.email });
        expect(user?.resetPasswordToken).toBeDefined();
        expect(user?.resetPasswordExpires).toBeDefined();
    }, 15000);

    it('8. should fail forgot password if email is not found', async () => {
        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'unknown@example.com' });

        expect(res.status).toBe(400);
    });

    it('9. should reset password with a valid token', async () => {
        const token = 'valid-token';
        await User.create({
            ...testUser,
            password: 'oldpassword',
            resetPasswordToken: token,
            resetPasswordExpires: new Date(Date.now() + 3600000),
        });

        const res = await request(app)
            .post('/api/auth/reset-password')
            .send({ token, newPassword: 'NewPassword123!' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Password reset successfully');

        const user = await User.findOne({ email: testUser.email });
        expect(user?.resetPasswordToken).toBeUndefined();

        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare('NewPassword123!', user?.password);
        expect(isMatch).toBe(true);
    });

    it('10. should fail reset password with an expired token', async () => {
        const token = 'expired-token';
        await User.create({
            ...testUser,
            password: 'oldpassword',
            resetPasswordToken: token,
            resetPasswordExpires: new Date(Date.now() - 3600000),
        });

        const res = await request(app)
            .post('/api/auth/reset-password')
            .send({ token, newPassword: 'NewPassword123!' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Password reset token is invalid or has expired');
    });

    it('11. should update user profile when authenticated', async () => {
        const user = await User.create({ ...testUser, password: 'hashedpassword' });
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'supersecretkey');

        const res = await request(app)
            .put(`/api/auth/${user._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ username: 'updatedname' });

        expect(res.status).toBe(200);
        expect(res.body.user.username).toBe('updatedname');
    });

    it('12. should not update profile if not authenticated', async () => {
        const user = await User.create({ ...testUser, password: 'hashedpassword' });

        const res = await request(app)
            .put(`/api/auth/${user._id}`)
            .send({ username: 'updatedname' });

        expect(res.status).toBe(401);
    });
});
