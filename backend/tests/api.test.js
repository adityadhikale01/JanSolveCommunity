import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User, Challenge, Conversation, Message, Notification } from '../src/models/index.js';

describe('JanSolve API Integration Tests', () => {
  let citizenToken = '';
  let citizenUser = null;
  let adminToken = '';
  let adminUser = null;
  let testChallengeId = '';
  let secondCitizenToken = '';
  let secondCitizenUser = null;
  let conversationId = '';

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('Health Check returns 200', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Registers Citizen 1 successfully', async () => {
    const email = `test.citizen.${Date.now()}@example.com`;
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Rani Kumari',
      email,
      password: 'Password@123',
      confirmPassword: 'Password@123',
      location: 'Ranchi, Jharkhand',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    citizenToken = res.body.data.accessToken;
    citizenUser = res.body.data.user;
  });

  it('Logs in Citizen 1 successfully', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: citizenUser.email,
      password: 'Password@123',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('Registers Citizen 2 successfully', async () => {
    const email = `test.citizen2.${Date.now()}@example.com`;
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Manoj Tirkey',
      email,
      password: 'Password@123',
      confirmPassword: 'Password@123',
      location: 'Khunti, Jharkhand',
    });
    expect(res.status).toBe(201);
    secondCitizenToken = res.body.data.accessToken;
    secondCitizenUser = res.body.data.user;
  });

  it('Logs in Administrator', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@jansolve.org',
      password: 'AdminSecurePass@2026',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('admin');
    adminToken = res.body.data.accessToken;
    adminUser = res.body.data.user;
  });

  it('Citizen submits a new civic challenge', async () => {
    const res = await request(app)
      .post('/api/v1/challenges')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Broken Solar Inverter in Tamar Primary School',
        description: 'The solar battery inverter installed 8 months ago has burned fuses, leaving 120 tribal students without classroom lighting or fans in extreme summer temperatures.',
        category: 'Energy',
        urgency: 'high',
        locationText: 'Tamar Block, Ranchi, Jharkhand',
        coordinates: [85.65, 23.05],
        affectedPeople: '120 students and teachers',
        duration: '3 weeks',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.challenge.publicationStatus).toBe('pending_review');
    expect(res.body.data.challenge.reviewStatus).toBe('submitted');
    testChallengeId = res.body.data.challenge._id;
  });

  it('Unpublished challenge is hidden from public feed', async () => {
    const res = await request(app).get('/api/v1/challenges?sort=latest');
    expect(res.status).toBe(200);
    const found = res.body.data.challenges.find((c) => c._id === testChallengeId);
    expect(found).toBeUndefined();
  });

  it('Author can view unpublished challenge in their submissions', async () => {
    const res = await request(app)
      .get('/api/v1/challenges/mine')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(200);
    const found = res.body.data.challenges.find((c) => c._id === testChallengeId);
    expect(found).toBeDefined();
  });

  it('Administrator approves challenge for JanFeed publication', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/challenges/${testChallengeId}/publication`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        publicationStatus: 'published',
        note: 'Verified valid infrastructure issue.',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.challenge.publicationStatus).toBe('published');
  });

  it('Approved challenge appears on public JanFeed', async () => {
    const res = await request(app).get('/api/v1/challenges?sort=latest');
    expect(res.status).toBe(200);
    const found = res.body.data.challenges.find((c) => c._id === testChallengeId);
    expect(found).toBeDefined();
  });

  it('Citizen 2 upvotes the challenge', async () => {
    const res = await request(app)
      .post(`/api/v1/challenges/${testChallengeId}/vote`)
      .set('Authorization', `Bearer ${secondCitizenToken}`)
      .send({ value: 1 });
    expect(res.status).toBe(200);
    expect(res.body.data.voteScore).toBe(1);
    expect(res.body.data.userVote).toBe(1);
  });

  it('Citizen 2 comments on the challenge', async () => {
    const res = await request(app)
      .post(`/api/v1/challenges/${testChallengeId}/comments`)
      .set('Authorization', `Bearer ${secondCitizenToken}`)
      .send({ body: 'We experienced the same fuse blowout at our local PHC. The grid surges during monsoon storms.' });
    expect(res.status).toBe(201);
    expect(res.body.data.comment.body).toContain('fuse blowout');
  });

  it('Author receives notifications for approval, vote, and comment', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.notifications.length).toBeGreaterThanOrEqual(2);
  });

  it('Starts a private conversation between Citizen 1 and Citizen 2', async () => {
    const res = await request(app)
      .post('/api/v1/conversations')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        recipientId: secondCitizenUser._id,
        initialMessage: 'Hi Manoj! Can you share the contact of the solar technician in Tamar?',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.conversation).toBeDefined();
    conversationId = res.body.data.conversation._id;
  });

  it('Citizen 2 fetches messages in conversation', async () => {
    const res = await request(app)
      .get(`/api/v1/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${secondCitizenToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.messages.length).toBeGreaterThanOrEqual(1);
  });

  it('Citizen 2 replies to conversation', async () => {
    const res = await request(app)
      .post(`/api/v1/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${secondCitizenToken}`)
      .send({ body: 'Sure Rani! His name is Anand, phone 9835100000. He is accredited by JREDA.' });
    expect(res.status).toBe(201);
    expect(res.body.data.message.body).toContain('accredited by JREDA');
  });

  it('Unauthorized user is forbidden from conversation messages', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Third Citizen',
      email: `third.${Date.now()}@example.com`,
      password: 'Password@123',
      confirmPassword: 'Password@123',
    });
    const unauthorizedToken = regRes.body.data.accessToken;

    const res = await request(app)
      .get(`/api/v1/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${unauthorizedToken}`);
    expect(res.status).toBe(403);
  });

  it('Change Password rejects incorrect current password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        currentPassword: 'WrongPassword123',
        newPassword: 'NewSecurePassword@99',
        confirmNewPassword: 'NewSecurePassword@99',
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Current password is incorrect');
  });

  it('Change Password rejects mismatched confirmation password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        currentPassword: 'Password@123',
        newPassword: 'NewSecurePassword@99',
        confirmNewPassword: 'DifferentPassword@99',
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('Change Password rejects identical new password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        currentPassword: 'Password@123',
        newPassword: 'Password@123',
        confirmNewPassword: 'Password@123',
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('cannot be identical');
  });

  it('Change Password updates password successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        currentPassword: 'Password@123',
        newPassword: 'NewSecurePassword@99',
        confirmNewPassword: 'NewSecurePassword@99',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify old password fails
    const oldLogin = await request(app).post('/api/v1/auth/login').send({
      email: citizenUser.email,
      password: 'Password@123',
    });
    expect(oldLogin.status).toBe(401);

    // Verify new password succeeds
    const newLogin = await request(app).post('/api/v1/auth/login').send({
      email: citizenUser.email,
      password: 'NewSecurePassword@99',
    });
    expect(newLogin.status).toBe(200);
    expect(newLogin.body.data.accessToken).toBeDefined();
  });
});
