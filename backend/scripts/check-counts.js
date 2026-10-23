import { connectDB, disconnectDB } from '../src/config/db.js';
import { Challenge, User, Comment, Vote, Bookmark } from '../src/models/index.js';

async function check() {
  await connectDB();
  const count = await Challenge.countDocuments();
  console.log(`Total Challenges in Database: ${count}`);

  const byCategory = await Challenge.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  console.log('Breakdown by Domain / Category:');
  byCategory.forEach(c => console.log(`  - ${c._id}: ${c.count}`));

  const byStatus = await Challenge.aggregate([
    { $group: { _id: { pub: '$publicationStatus', rev: '$reviewStatus' }, count: { $sum: 1 } } }
  ]);
  console.log('Breakdown by Status:');
  byStatus.forEach(s => console.log(`  - Pub: ${s._id.pub}, Rev: ${s._id.rev} => ${s.count}`));

  const usersCount = await User.countDocuments();
  const commentsCount = await Comment.countDocuments();
  const votesCount = await Vote.countDocuments();
  console.log(`\nPlatform Totals: Users: ${usersCount} | Comments: ${commentsCount} | Votes: ${votesCount}`);
  await disconnectDB();
}

check().catch(console.error);
