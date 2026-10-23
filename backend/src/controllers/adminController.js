import Challenge from '../models/Challenge.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import ContentReport from '../models/ContentReport.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';

// ==========================================
// DASHBOARD & ANALYTICS
// ==========================================

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalChallenges,
      pendingReview,
      published,
      verified,
      rejected,
      infoRequested,
      totalUsers,
      pendingReports,
      categoryStats,
      urgencyStats,
      recentSubmissions,
    ] = await Promise.all([
      Challenge.countDocuments(),
      Challenge.countDocuments({ publicationStatus: 'pending_review' }),
      Challenge.countDocuments({ publicationStatus: 'published' }),
      Challenge.countDocuments({ reviewStatus: 'verified' }),
      Challenge.countDocuments({ reviewStatus: 'rejected' }),
      Challenge.countDocuments({ reviewStatus: 'information_requested' }),
      User.countDocuments(),
      ContentReport.countDocuments({ status: 'pending' }),
      Challenge.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Challenge.aggregate([
        { $group: { _id: '$urgency', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Challenge.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('author', 'name email avatar')
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        counts: {
          totalChallenges,
          pendingReview,
          published,
          verified,
          rejected,
          infoRequested,
          totalUsers,
          pendingReports,
        },
        categoryStats,
        urgencyStats,
        recentSubmissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const [
      categoryBreakdown,
      urgencyBreakdown,
      reviewStatusBreakdown,
      publicationBreakdown,
      recentAuditLogs,
    ] = await Promise.all([
      Challenge.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Challenge.aggregate([
        { $group: { _id: '$urgency', count: { $sum: 1 } } },
      ]),
      Challenge.aggregate([
        { $group: { _id: '$reviewStatus', count: { $sum: 1 } } },
      ]),
      Challenge.aggregate([
        { $group: { _id: '$publicationStatus', count: { $sum: 1 } } },
      ]),
      AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('actor', 'name email')
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        categoryBreakdown,
        urgencyBreakdown,
        reviewStatusBreakdown,
        publicationBreakdown,
        recentAuditLogs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CHALLENGE MANAGEMENT & REVIEWS
// ==========================================

export const getAdminChallenges = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const {
      category,
      urgency,
      reviewStatus,
      publicationStatus,
      search,
    } = req.query;

    const query = {};

    if (category && category !== 'All') query.category = category;
    if (urgency && urgency !== 'All') query.urgency = urgency;
    if (reviewStatus && reviewStatus !== 'All') query.reviewStatus = reviewStatus;
    if (publicationStatus && publicationStatus !== 'All') {
      query.publicationStatus = publicationStatus;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { locationText: searchRegex },
      ];
    }

    const [challenges, total] = await Promise.all([
      Challenge.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email avatar')
        .populate('reviewedBy', 'name')
        .lean(),
      Challenge.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        challenges,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminChallengeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findById(id)
      .populate('author', 'name email avatar location bio createdAt')
      .populate('reviewedBy', 'name email');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
        code: 'CHALLENGE_NOT_FOUND',
      });
    }

    // Get audit trail for this challenge
    const auditHistory = await AuditLog.find({ targetId: id })
      .sort({ createdAt: -1 })
      .populate('actor', 'name email')
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        challenge,
        auditHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const reviewChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewStatus, reviewNote = '' } = req.body;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
        code: 'CHALLENGE_NOT_FOUND',
      });
    }

    if (
      (reviewStatus === 'rejected' ||
        reviewStatus === 'information_requested') &&
      !reviewNote.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'A review note explaining the decision is required',
        code: 'NOTE_REQUIRED',
      });
    }

    const oldStatus = challenge.reviewStatus;
    challenge.reviewStatus = reviewStatus;
    challenge.reviewedBy = req.user._id;
    challenge.reviewedAt = new Date();
    challenge.reviewNote = reviewNote.trim();

    // Workflow consequences
    if (reviewStatus === 'verified') {
      // If verifying, automatically publish to community feed if not yet published
      if (challenge.publicationStatus === 'pending_review') {
        challenge.publicationStatus = 'published';
        challenge.publishedAt = challenge.publishedAt || new Date();
      }
    } else if (reviewStatus === 'rejected') {
      // Rejected submissions do not appear on public feed
      challenge.publicationStatus = 'pending_review';
    }

    await challenge.save();

    // Map action name for audit log
    let auditAction = 'CHALLENGE_APPROVED';
    let notifType = 'status_updated';
    let notifMessage = `Your challenge "${challenge.title}" status was updated to ${reviewStatus}.`;

    if (reviewStatus === 'verified') {
      auditAction = 'CHALLENGE_VERIFIED';
      notifType = 'challenge_verified';
      notifMessage = `Congratulations! Your challenge "${challenge.title}" has been verified by the administration.`;
    } else if (reviewStatus === 'rejected') {
      auditAction = 'CHALLENGE_REJECTED';
      notifType = 'challenge_rejected';
      notifMessage = `Your challenge "${challenge.title}" was not approved. Reason: "${reviewNote.trim()}".`;
    } else if (reviewStatus === 'information_requested') {
      auditAction = 'CHALLENGE_INFO_REQUESTED';
      notifType = 'info_requested';
      notifMessage = `Administrator requested additional information for "${challenge.title}": "${reviewNote.trim()}".`;
    }

    await AuditLog.create({
      actor: req.user._id,
      action: auditAction,
      targetType: 'Challenge',
      targetId: challenge._id,
      metadata: {
        from: oldStatus,
        to: reviewStatus,
        note: reviewNote.trim(),
      },
    });

    // Notify author
    await Notification.create({
      recipient: challenge.author,
      actor: req.user._id,
      type: notifType,
      entityType: 'challenge',
      entityId: challenge._id,
      message: notifMessage,
    });

    const populated = await Challenge.findById(id)
      .populate('author', 'name email avatar')
      .populate('reviewedBy', 'name');

    return res.status(200).json({
      success: true,
      message: `Challenge review status updated to ${reviewStatus}`,
      data: {
        challenge: populated,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePublicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { publicationStatus, note = '' } = req.body;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
        code: 'CHALLENGE_NOT_FOUND',
      });
    }

    const oldStatus = challenge.publicationStatus;
    challenge.publicationStatus = publicationStatus;

    if (publicationStatus === 'published') {
      challenge.publishedAt = challenge.publishedAt || new Date();
    }

    await challenge.save();

    const actionName =
      publicationStatus === 'published'
        ? 'CHALLENGE_APPROVED'
        : publicationStatus === 'removed'
        ? 'CHALLENGE_REMOVED'
        : 'CHALLENGE_RESTORED';

    await AuditLog.create({
      actor: req.user._id,
      action: actionName,
      targetType: 'Challenge',
      targetId: challenge._id,
      metadata: {
        from: oldStatus,
        to: publicationStatus,
        note: note.trim(),
      },
    });

    // Notify author
    await Notification.create({
      recipient: challenge.author,
      actor: req.user._id,
      type:
        publicationStatus === 'published'
          ? 'challenge_approved'
          : 'status_updated',
      entityType: 'challenge',
      entityId: challenge._id,
      message:
        publicationStatus === 'published'
          ? `Your challenge "${challenge.title}" has been approved and published to JanFeed!`
          : `Your challenge "${challenge.title}" publication status changed to ${publicationStatus}.`,
    });

    return res.status(200).json({
      success: true,
      message: `Challenge publication status updated to ${publicationStatus}`,
      data: {
        challenge,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// USER MANAGEMENT
// ==========================================

export const getAdminUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { role, status, search } = req.query;
    const query = {};

    if (role && role !== 'All') query.role = role;
    if (status && status !== 'All') query.accountStatus = status;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    // Enhance users with their challenge counts
    const usersWithCounts = await Promise.all(
      users.map(async (u) => {
        const challengeCount = await Challenge.countDocuments({
          author: u._id,
        });
        return {
          ...u,
          challengeCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        users: usersWithCounts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' | 'suspended'

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be active or suspended',
        code: 'INVALID_STATUS',
      });
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot suspend their own account',
        code: 'SELF_ACTION_NOT_ALLOWED',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    user.accountStatus = status;
    await user.save();

    await AuditLog.create({
      actor: req.user._id,
      action: status === 'suspended' ? 'USER_SUSPENDED' : 'USER_RESTORED',
      targetType: 'User',
      targetId: user._id,
      metadata: { newStatus: status },
    });

    return res.status(200).json({
      success: true,
      message: `User account status updated to ${status}`,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CONTENT MODERATION QUEUE
// ==========================================

export const getContentReports = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { status = 'pending' } = req.query;
    const query = {};
    if (status && status !== 'All') {
      query.status = status;
    }

    const [reports, total] = await Promise.all([
      ContentReport.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reporter', 'name email avatar')
        .populate('reviewedBy', 'name')
        .lean(),
      ContentReport.countDocuments(query),
    ]);

    // Fetch target entities for context
    const enrichedReports = await Promise.all(
      reports.map(async (rep) => {
        let targetData = null;
        if (rep.targetType === 'challenge') {
          targetData = await Challenge.findById(rep.targetId)
            .select('title author publicationStatus')
            .populate('author', 'name email')
            .lean();
        } else if (rep.targetType === 'comment') {
          targetData = await Comment.findById(rep.targetId)
            .select('body author challenge')
            .populate('author', 'name email')
            .lean();
        } else if (rep.targetType === 'user') {
          targetData = await User.findById(rep.targetId)
            .select('name email accountStatus')
            .lean();
        }

        return {
          ...rep,
          targetData,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        reports: enrichedReports,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateContentReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, action, moderationNote = '' } = req.body;

    const report = await ContentReport.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
        code: 'REPORT_NOT_FOUND',
      });
    }

    report.status = status || 'reviewed';
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    report.moderationNote = moderationNote.trim();
    await report.save();

    // If moderator chose an explicit destructive action (e.g. remove content)
    if (action === 'remove_content') {
      if (report.targetType === 'challenge') {
        await Challenge.findByIdAndUpdate(report.targetId, {
          publicationStatus: 'removed',
        });
        await AuditLog.create({
          actor: req.user._id,
          action: 'CHALLENGE_REMOVED',
          targetType: 'Challenge',
          targetId: report.targetId,
          metadata: { reason: 'Moderation Report Resolution', reportId: id },
        });
      } else if (report.targetType === 'comment') {
        await Comment.findByIdAndUpdate(report.targetId, {
          deletedAt: new Date(),
          body: '[This comment was removed by moderators for violating community guidelines]',
        });
        await AuditLog.create({
          actor: req.user._id,
          action: 'COMMENT_DELETED_BY_MOD',
          targetType: 'Comment',
          targetId: report.targetId,
          metadata: { reportId: id },
        });
      }
    } else if (action === 'suspend_user' && report.targetType === 'user') {
      await User.findByIdAndUpdate(report.targetId, {
        accountStatus: 'suspended',
      });
      await AuditLog.create({
        actor: req.user._id,
        action: 'USER_SUSPENDED',
        targetType: 'User',
        targetId: report.targetId,
        metadata: { reportId: id },
      });
    }

    await AuditLog.create({
      actor: req.user._id,
      action: status === 'dismissed' ? 'REPORT_DISMISSED' : 'REPORT_RESOLVED',
      targetType: 'ContentReport',
      targetId: report._id,
      metadata: { actionTaken: action || 'none', moderationNote },
    });

    return res.status(200).json({
      success: true,
      message: 'Report resolved successfully',
      data: {
        report,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actor', 'name email role')
        .lean(),
      AuditLog.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
