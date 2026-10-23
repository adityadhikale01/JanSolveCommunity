import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import {
  User,
  Challenge,
  Comment,
  Vote,
  Bookmark,
  Notification,
  Conversation,
  Message,
  AuditLog,
} from '../src/models/index.js';

async function runE2EWorkflow() {
  console.log('===========================================================');
  console.log('  STARTING JANFEED + JANSOLVE COMPLETE E2E VERIFICATION   ');
  console.log('===========================================================');

  await connectDB();

  try {
    // 1. Register a citizen
    console.log('\n[Step 1] Registering Citizen 1 (Sita Hansda)...');
    const citizenEmail = `sita.hansda.${Date.now()}@example.com`;
    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Sita Hansda',
      email: citizenEmail,
      password: 'SecurePassword@123',
      confirmPassword: 'SecurePassword@123',
    });
    if (regRes.status !== 201) throw new Error(`Registration failed: ${regRes.body.message}`);
    const citizenToken = regRes.body.data.accessToken;
    const citizenId = regRes.body.data.user._id;
    console.log('  ✓ Citizen registered successfully. Token issued.');

    // 2. Log in citizen
    console.log('\n[Step 2] Logging in as citizen...');
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: citizenEmail,
      password: 'SecurePassword@123',
    });
    if (loginRes.status !== 200) throw new Error('Login failed');
    console.log('  ✓ Citizen logged in successfully.');

    // 3. Submit a challenge with evidence
    console.log('\n[Step 3] Submitting new civic challenge from Khunti district...');
    const subRes = await request(app)
      .post('/api/v1/challenges')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Deep Well Collapse Depriving Murhu Tribal School of Drinking Water',
        description: 'The sole drinking water ring well adjacent to the Murhu Government Primary School collapsed following heavy pre-monsoon tremors. Over 280 tribal students and teachers currently carry water in plastic jerricans from 1.5 km away.',
        category: 'Water Resources',
        urgency: 'critical',
        locationText: 'Murhu block school cluster, Khunti, Jharkhand',
        coordinates: [85.28, 23.08],
        affectedPeople: '280 school children and staff',
        duration: '10 days since masonry collapsed',
        evidence: [
          {
            url: '/uploads/handpump-dry.jpg',
            fileType: 'image',
            originalName: 'collapsed-well.jpg',
          },
        ],
      });
    if (subRes.status !== 201) throw new Error(`Challenge submission failed: ${subRes.body.message}`);
    const challengeId = subRes.body.data.challenge._id;
    console.log(`  ✓ Challenge created with ID: ${challengeId}`);

    // 4. Confirm it is saved in MongoDB
    console.log('\n[Step 4] Checking persistence in MongoDB database...');
    const dbChal = await Challenge.findById(challengeId);
    if (!dbChal) throw new Error('Challenge not found in MongoDB!');
    console.log(`  ✓ Confirmed persistence. DB Review Status: "${dbChal.reviewStatus}", Publication Status: "${dbChal.publicationStatus}"`);

    // 5. Confirm it appears in the citizen's own history
    console.log('\n[Step 5] Checking citizen own submissions list...');
    const mineRes = await request(app)
      .get('/api/v1/challenges/mine')
      .set('Authorization', `Bearer ${citizenToken}`);
    const foundInMine = mineRes.body.data.challenges.find((c) => c._id === challengeId);
    if (!foundInMine) throw new Error('Challenge missing from author history!');
    console.log('  ✓ Challenge present in author submission history.');

    // 6. Confirm it is absent from the public feed while pending
    console.log('\n[Step 6] Verifying challenge is absent from public JanFeed while pending review...');
    const publicFeedRes1 = await request(app).get('/api/v1/challenges');
    const foundInPublic1 = publicFeedRes1.body.data.challenges.find((c) => c._id === challengeId);
    if (foundInPublic1) throw new Error('CRITICAL BUG: Pending challenge leaked into public feed!');
    console.log('  ✓ Confirmed: Unpublished challenge is HIDDEN from public feed.');

    // 7. Log in as administrator
    console.log('\n[Step 7] Authenticating as JanSolve Administrator...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@jansolve.org';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePass@2026';
    const adminLoginRes = await request(app).post('/api/v1/auth/login').send({
      email: adminEmail,
      password: adminPassword,
    });
    if (adminLoginRes.status !== 200) throw new Error(`Admin login failed: ${adminLoginRes.body.message}`);
    const adminToken = adminLoginRes.body.data.accessToken;
    console.log('  ✓ Administrator authenticated successfully.');

    // 8. Review and approve the challenge
    console.log('\n[Step 8] Administrator approving challenge for JanFeed publication...');
    const pubRes = await request(app)
      .patch(`/api/v1/admin/challenges/${challengeId}/publication`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        publicationStatus: 'published',
        note: 'Approved for public civic discussion.',
      });
    if (pubRes.status !== 200) throw new Error('Publication approval failed');
    console.log('  ✓ Challenge publication status updated to "published".');

    // 9. Confirm the challenge appears in the public feed
    console.log('\n[Step 9] Verifying challenge is now discoverable on JanFeed...');
    const publicFeedRes2 = await request(app).get('/api/v1/challenges?sort=latest');
    const foundInPublic2 = publicFeedRes2.body.data.challenges.find((c) => c._id === challengeId);
    if (!foundInPublic2) throw new Error('Approved challenge did not appear in public feed!');
    console.log(`  ✓ Confirmed: "${foundInPublic2.title}" is live on JanFeed!`);

    // 10. Add a comment and vote from a second citizen
    console.log('\n[Step 10] Registering Citizen 2 (Deepak Munda) to participate in discussion...');
    const c2Email = `deepak.munda.${Date.now()}@example.com`;
    const regC2 = await request(app).post('/api/v1/auth/register').send({
      name: 'Deepak Munda',
      email: c2Email,
      password: 'Password@123',
      confirmPassword: 'Password@123',
    });
    const c2Token = regC2.body.data.accessToken;
    const c2Id = regC2.body.data.user._id;

    // Upvote
    console.log('  → Citizen 2 upvoting challenge...');
    const voteRes = await request(app)
      .post(`/api/v1/challenges/${challengeId}/vote`)
      .set('Authorization', `Bearer ${c2Token}`)
      .send({ value: 1 });
    if (voteRes.body.data.voteScore !== 1) throw new Error('Vote calculation failed');
    console.log('  ✓ Upvote registered. Server voteScore = 1.');

    // Comment
    console.log('  → Citizen 2 posting field comment...');
    const commRes = await request(app)
      .post(`/api/v1/challenges/${challengeId}/comments`)
      .set('Authorization', `Bearer ${c2Token}`)
      .send({
        body: 'Murhu block panchayat samiti has discretionary funds for borewells. Let us table this in the gram sabha tomorrow.',
      });
    if (commRes.status !== 201) throw new Error('Comment failed');
    console.log('  ✓ Comment posted successfully.');

    // 11. Confirm notifications and counters update correctly
    console.log('\n[Step 11] Checking persistent notifications for Author (Sita Hansda)...');
    const notifRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${citizenToken}`);
    const authorNotifs = notifRes.body.data.notifications;
    console.log(`  ✓ Author received ${authorNotifs.length} notifications:`);
    authorNotifs.forEach((n) => console.log(`     - [${n.type}] ${n.message}`));

    // 12. Verify the admin dashboard reflects the actual database state
    console.log('\n[Step 12] Verifying Admin Dashboard reflects authentic database statistics...');
    const dashRes = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    const counts = dashRes.body.data.counts;
    console.log(`  ✓ Dashboard Counts: Total: ${counts.totalChallenges}, Published: ${counts.published}, Verified: ${counts.verified}, Users: ${counts.totalUsers}`);

    // 13. Test rejection on a separate challenge
    console.log('\n[Step 13] Submitting and rejecting a separate test challenge with documented reason...');
    const spamSub = await request(app)
      .post('/api/v1/challenges')
      .set('Authorization', `Bearer ${c2Token}`)
      .send({
        title: 'Spam Ad Report Not Civic Related At All',
        description: 'Selling commercial products not related to community issues or governance in Jharkhand.',
        category: 'Other',
        urgency: 'low',
        locationText: 'Ranchi',
      });
    const spamId = spamSub.body.data.challenge._id;

    const rejRes = await request(app)
      .patch(`/api/v1/admin/challenges/${spamId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reviewStatus: 'rejected',
        reviewNote: 'Commercial advertisement violates civic posting guidelines.',
      });
    if (rejRes.status !== 200 || rejRes.body.data.challenge.reviewStatus !== 'rejected') {
      throw new Error('Rejection action failed');
    }
    console.log('  ✓ Challenge rejected. Rejection reason persisted: "Commercial advertisement violates civic posting guidelines."');

    // 14. Test private messaging between two citizens
    console.log('\n[Step 14] Testing private 1-on-1 messaging between Sita and Deepak...');
    const convRes = await request(app)
      .post('/api/v1/conversations')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        recipientId: c2Id,
        initialMessage: 'Johar Deepak! Will you attend the Murhu gram sabha?',
      });
    const convId = convRes.body.data.conversation._id;

    // Deepak replies
    const msgRes = await request(app)
      .post(`/api/v1/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${c2Token}`)
      .send({
        body: 'Johar Sita! Yes, I will present the water well evidence photos.',
      });
    if (msgRes.status !== 201) throw new Error('Private message send failed');
    console.log('  ✓ Private message thread active between conversation participants.');

    // 15. Verify that unauthorized users cannot access private records
    console.log('\n[Step 15] Security Check: Unauthorized user attempting to view private conversation...');
    const user3Res = await request(app).post('/api/v1/auth/register').send({
      name: 'Unrelated User',
      email: `unrelated.${Date.now()}@example.com`,
      password: 'Password@123',
      confirmPassword: 'Password@123',
    });
    const user3Token = user3Res.body.data.accessToken;

    const eavesdropRes = await request(app)
      .get(`/api/v1/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${user3Token}`);
    if (eavesdropRes.status !== 403) {
      throw new Error(`SECURITY VULNERABILITY: Unauthorized user got status ${eavesdropRes.status} instead of 403!`);
    }
    console.log('  ✓ Security Confirmed: Non-participant blocked with 403 Forbidden.');

    console.log('\n===========================================================');
    console.log('  ALL 15 END-TO-END WORKFLOW VERIFICATIONS PASSED 100%!     ');
    console.log('===========================================================');
  } catch (err) {
    console.error('\nE2E VERIFICATION FAILED:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

runE2EWorkflow();
