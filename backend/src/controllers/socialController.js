import Comment from '../models/Comment.js';
import Challenge from '../models/Challenge.js';
import Vote from '../models/Vote.js';
import Bookmark from '../models/Bookmark.js';
import Notification from '../models/Notification.js';
import ContentReport from '../models/ContentReport.js';

// ==========================================
// COMMENTS
// ==========================================

export const getComments = async (req, res, next) => {
  try {
    const challengeId = req.params.challengeId || req.params.id;

    const comments = await Comment.find({ challenge: challengeId })
      .sort({ createdAt: 1 })
      .populate('author', 'name avatar location')
      .lean();

    // Map comments, masking soft-deleted comments appropriately
    const formatted = comments.map((c) => {
      if (c.deletedAt) {
        return {
          ...c,
          body: '[This comment was deleted]',
          isDeleted: true,
        };
      }
      return {
        ...c,
        isDeleted: false,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        comments: formatted,
        count: comments.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const { body, parentComment } = req.body;

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
        code: 'CHALLENGE_NOT_FOUND',
      });
    }

    let parent = null;
    if (parentComment) {
      parent = await Comment.findById(parentComment);
      if (!parent || parent.challenge.toString() !== challengeId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent comment reference',
          code: 'INVALID_PARENT_COMMENT',
        });
      }
    }

    const comment = await Comment.create({
      challenge: challengeId,
      author: req.user._id,
      body: body.trim(),
      parentComment: parent ? parent._id : null,
    });

    // Increment cached comment count
    await Challenge.findByIdAndUpdate(challengeId, {
      $inc: { commentCount: 1 },
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      'author',
      'name avatar location'
    );

    // Create persistent notifications
    if (parent && parent.author.toString() !== req.user._id.toString()) {
      // Notification for reply
      await Notification.create({
        recipient: parent.author,
        actor: req.user._id,
        type: 'reply',
        entityType: 'comment',
        entityId: comment._id,
        message: `${req.user.name} replied to your comment on "${challenge.title}"`,
      });
    } else if (
      !parent &&
      challenge.author.toString() !== req.user._id.toString()
    ) {
      // Notification for new top-level comment
      await Notification.create({
        recipient: challenge.author,
        actor: req.user._id,
        type: 'comment',
        entityType: 'challenge',
        entityId: challenge._id,
        message: `${req.user.name} commented on your challenge "${challenge.title}"`,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
      data: {
        comment: populatedComment,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { body } = req.body;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
        code: 'COMMENT_NOT_FOUND',
      });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments',
        code: 'FORBIDDEN',
      });
    }

    if (comment.deletedAt) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit a deleted comment',
        code: 'COMMENT_DELETED',
      });
    }

    comment.body = body.trim();
    await comment.save();

    const populated = await Comment.findById(comment._id).populate(
      'author',
      'name avatar location'
    );

    return res.status(200).json({
      success: true,
      message: 'Comment updated',
      data: {
        comment: populated,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
        code: 'COMMENT_NOT_FOUND',
      });
    }

    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment',
        code: 'FORBIDDEN',
      });
    }

    // Soft delete
    comment.deletedAt = new Date();
    await comment.save();

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// VOTING
// ==========================================

export const voteChallenge = async (req, res, next) => {
  try {
    const { id: challengeId } = req.params;
    const { value } = req.body; // 1 or -1

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
        code: 'CHALLENGE_NOT_FOUND',
      });
    }

    const existingVote = await Vote.findOne({
      user: req.user._id,
      challenge: challengeId,
    });

    let newVoteValue = value;
    let scoreDelta = 0;
    let upDelta = 0;
    let downDelta = 0;

    if (!existingVote) {
      // First time voting
      await Vote.create({
        user: req.user._id,
        challenge: challengeId,
        value,
      });

      scoreDelta = value;
      if (value === 1) upDelta = 1;
      else downDelta = 1;

      // Optional notification for author on upvote
      if (
        value === 1 &&
        challenge.author.toString() !== req.user._id.toString()
      ) {
        await Notification.create({
          recipient: challenge.author,
          actor: req.user._id,
          type: 'vote',
          entityType: 'challenge',
          entityId: challenge._id,
          message: `${req.user.name} upvoted your challenge "${challenge.title}"`,
        });
      }
    } else if (existingVote.value === value) {
      // Toggling same vote -> removes the vote
      await Vote.findByIdAndDelete(existingVote._id);
      newVoteValue = 0;
      scoreDelta = -value;
      if (value === 1) upDelta = -1;
      else downDelta = -1;
    } else {
      // Flipping vote from upvote to downvote or vice versa
      existingVote.value = value;
      await existingVote.save();
      scoreDelta = value * 2;
      if (value === 1) {
        upDelta = 1;
        downDelta = -1;
      } else {
        upDelta = -1;
        downDelta = 1;
      }
    }

    // Authoritative update on Challenge document
    const updatedChallenge = await Challenge.findByIdAndUpdate(
      challengeId,
      {
        $inc: {
          voteScore: scoreDelta,
          upvotesCount: upDelta,
          downvotesCount: downDelta,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      data: {
        voteScore: updatedChallenge.voteScore,
        upvotesCount: updatedChallenge.upvotesCount,
        downvotesCount: updatedChallenge.downvotesCount,
        userVote: newVoteValue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// BOOKMARKS
// ==========================================

export const toggleBookmark = async (req, res, next) => {
  try {
    const { id: challengeId } = req.params;

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
        code: 'CHALLENGE_NOT_FOUND',
      });
    }

    const existingBookmark = await Bookmark.findOne({
      user: req.user._id,
      challenge: challengeId,
    });

    let isSaved = false;
    if (existingBookmark) {
      await Bookmark.findByIdAndDelete(existingBookmark._id);
      isSaved = false;
    } else {
      await Bookmark.create({
        user: req.user._id,
        challenge: challengeId,
      });
      isSaved = true;
    }

    return res.status(200).json({
      success: true,
      message: isSaved ? 'Challenge saved to bookmarks' : 'Bookmark removed',
      data: {
        isSaved,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBookmarks = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      Bookmark.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'challenge',
          populate: { path: 'author', select: 'name avatar location' },
        })
        .lean(),
      Bookmark.countDocuments({ user: req.user._id }),
    ]);

    // Filter out any challenges that might have been deleted
    const validChallenges = bookmarks
      .filter((b) => b.challenge)
      .map((b) => ({
        ...b.challenge,
        isSaved: true,
      }));

    return res.status(200).json({
      success: true,
      data: {
        challenges: validChallenges,
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

// ==========================================
// CONTENT REPORTING
// ==========================================

export const reportContent = async (req, res, next) => {
  try {
    const { targetType, targetId } = req.params;
    const { reason, details } = req.body;

    if (!['challenge', 'comment', 'user'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type for report',
        code: 'INVALID_TARGET_TYPE',
      });
    }

    // Check if user already reported this exact item
    const existing = await ContentReport.findOne({
      reporter: req.user._id,
      targetType,
      targetId,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          'You have already submitted a report for this content. Our moderation team is reviewing it.',
        code: 'REPORT_EXISTS',
      });
    }

    const report = await ContentReport.create({
      reporter: req.user._id,
      targetType,
      targetId,
      reason,
      details: details || '',
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      message:
        'Report submitted successfully. Thank you for keeping our community safe.',
      data: {
        reportId: report._id,
      },
    });
  } catch (error) {
    next(error);
  }
};
