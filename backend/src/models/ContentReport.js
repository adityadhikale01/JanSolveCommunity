import mongoose from 'mongoose';

export const REPORT_REASONS = [
  'Spam or Scam',
  'False or Misleading Information',
  'Hate Speech or Harassment',
  'Inappropriate or Explicit Media',
  'Duplicate Submission',
  'Safety Hazard or Violence',
  'Other',
];

const contentReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ['challenge', 'comment', 'user'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Report reason is required'],
      enum: REPORT_REASONS,
    },
    details: {
      type: String,
      trim: true,
      maxlength: [1000, 'Details cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed', 'action_taken'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    moderationNote: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent same user from spamming multiple pending reports on identical target
contentReportSchema.index(
  { reporter: 1, targetType: 1, targetId: 1 },
  { unique: true }
);
contentReportSchema.index({ status: 1, createdAt: -1 });

const ContentReport = mongoose.model('ContentReport', contentReportSchema);
export default ContentReport;
