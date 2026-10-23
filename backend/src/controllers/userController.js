import User from '../models/User.js';
import Challenge from '../models/Challenge.js';

export const getPublicProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select(
      'name avatar bio location role accountStatus createdAt'
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Citizen profile not found',
        code: 'USER_NOT_FOUND',
      });
    }

    const [publishedCount, challenges] = await Promise.all([
      Challenge.countDocuments({
        author: id,
        publicationStatus: 'published',
      }),
      Challenge.find({
        author: id,
        publicationStatus: 'published',
      })
        .select('voteScore')
        .lean(),
    ]);

    const totalUpvotes = challenges.reduce(
      (acc, curr) => acc + (curr.voteScore > 0 ? curr.voteScore : 0),
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
          bio: user.bio,
          location: user.location,
          role: user.role,
          accountStatus: user.accountStatus,
          createdAt: user.createdAt,
          stats: {
            publishedChallengesCount: publishedCount,
            totalKarma: totalUpvotes,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserChallenges = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const query = {
      author: id,
      publicationStatus: 'published',
    };

    const [challenges, total] = await Promise.all([
      Challenge.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name avatar location')
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

export const searchUsers = async (req, res, next) => {
  try {
    const { search = '', limit = 20 } = req.query;
    const query = {
      accountStatus: 'active',
    };

    if (req.user) {
      query._id = { $ne: req.user._id };
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { location: regex }, { bio: regex }];
    }

    const users = await User.find(query)
      .select('name avatar location bio role createdAt')
      .limit(Math.min(50, parseInt(limit, 10) || 20))
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};
