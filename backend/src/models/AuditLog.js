import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'CHALLENGE_APPROVED',
        'CHALLENGE_VERIFIED',
        'CHALLENGE_REJECTED',
        'CHALLENGE_INFO_REQUESTED',
        'CHALLENGE_REMOVED',
        'CHALLENGE_RESTORED',
        'USER_SUSPENDED',
        'USER_RESTORED',
        'REPORT_DISMISSED',
        'REPORT_RESOLVED',
        'COMMENT_DELETED_BY_MOD',
      ],
    },
    targetType: {
      type: String,
      required: true,
      enum: ['Challenge', 'Comment', 'User', 'ContentReport'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
