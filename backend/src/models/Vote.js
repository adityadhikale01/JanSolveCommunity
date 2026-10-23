import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
    },
    value: {
      type: Number,
      required: true,
      enum: [1, -1], // 1 = upvote, -1 = downvote
    },
  },
  {
    timestamps: true,
  }
);

// One active vote per user per challenge
voteSchema.index({ user: 1, challenge: 1 }, { unique: true });
voteSchema.index({ challenge: 1 });

const Vote = mongoose.model('Vote', voteSchema);
export default Vote;
