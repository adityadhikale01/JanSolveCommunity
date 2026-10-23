import Challenge from '../models/Challenge.js';
import Vote from '../models/Vote.js';
import Bookmark from '../models/Bookmark.js';
import { formatUploadedFile } from '../config/multer.js';

export const createChallenge = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      urgency,
      locationText,
      coordinates,
      affectedPeople,
      duration,
      evidence = [],
    } = req.body;

    // Process coordinates if provided [lng, lat]
    let geoCoordinates = undefined;
    if (
      coordinates &&
      Array.isArray(coordinates) &&
      coordinates.length === 2 &&
      !isNaN(coordinates[0]) &&
      !isNaN(coordinates[1])
    ) {
      geoCoordinates = {
        type: 'Point',
        coordinates: [Number(coordinates[0]), Number(coordinates[1])],
      };
    }

    // Combine existing evidence array with any multipart files uploaded in this request
    const combinedEvidence = [...evidence];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      req.files.forEach((file) => {
        combinedEvidence.push(formatUploadedFile(file));
      });
    }

    const challenge = await Challenge.create({
      title,
      description,
      category,
      urgency,
      locationText,
      coordinates: geoCoordinates,
      affectedPeople: affectedPeople || '',
      duration: duration || '',
      evidence: combinedEvidence,
      author: req.user._id,
      reviewStatus: 'submitted',
      publicationStatus: 'pending_review',
    });

    const populatedChallenge = await Challenge.findById(challenge._id).populate(
      'author',
      'name avatar location bio'
    );

    return res.status(201).json({
      success: true,
      message:
        'Challenge submitted successfully. It will appear on JanFeed once reviewed and approved by administrators.',
      data: {
        challenge: populatedChallenge,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicChallenges = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const { category, urgency, search, sort = 'hot' } = req.query;

    const query = { publicationStatus: 'published' };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (urgency && urgency !== 'All') {
      query.urgency = urgency;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { locationText: searchRegex },
      ];
    }

    let sortCriteria = {};
    if (sort === 'latest') {
      sortCriteria = { createdAt: -1 };
    } else if (sort === 'discussed') {
      sortCriteria = { commentCount: -1, createdAt: -1 };
    } else if (sort === 'top') {
      sortCriteria = { voteScore: -1, createdAt: -1 };
    } else {
      // Hot: combination of voteScore and recency
      sortCriteria = { voteScore: -1, createdAt: -1 };
    }

    const [challenges, total] = await Promise.all([
      Challenge.find(query)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .populate('author', 'name avatar location')
        .lean(),
      Challenge.countDocuments(query),
    ]);

    // Enhance with user vote & bookmark status if authenticated
    let userVotesMap = new Map();
    let userBookmarksSet = new Set();

    if (req.user && challenges.length > 0) {
      const challengeIds = challenges.map((c) => c._id);
      const [votes, bookmarks] = await Promise.all([
        Vote.find({ user: req.user._id, challenge: { $in: challengeIds } }).lean(),
        Bookmark.find({
          user: req.user._id,
          challenge: { $in: challengeIds },
        }).lean(),
      ]);

      votes.forEach((v) => userVotesMap.set(v.challenge.toString(), v.value));
      bookmarks.forEach((b) => userBookmarksSet.add(b.challenge.toString()));
    }

    const enrichedChallenges = challenges.map((c) => {
      const idStr = c._id.toString();
      return {
        ...c,
        userVote: userVotesMap.get(idStr) || 0,
        isSaved: userBookmarksSet.has(idStr),
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        challenges: enrichedChallenges,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + challenges.length < total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getChallengeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findById(id).populate(
      'author',
      'name avatar location bio createdAt'
    );

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
        code: 'CHALLENGE_NOT_FOUND',
      });
    }

    // Access control:
    // If not published, only the author or an admin may view it
    const isAuthor =
      req.user && challenge.author._id.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (challenge.publicationStatus !== 'published' && !isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message:
          'This challenge is currently under administrative review or private.',
        code: 'CHALLENGE_PRIVATE',
      });
    }

    // Increment view count asynchronously (safe, non-blocking)
    Challenge.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).exec();

    let userVote = 0;
    let isSaved = false;

    if (req.user) {
      const [vote, bookmark] = await Promise.all([
        Vote.findOne({ user: req.user._id, challenge: id }).lean(),
        Bookmark.findOne({ user: req.user._id, challenge: id }).lean(),
      ]);
      if (vote) userVote = vote.value;
      if (bookmark) isSaved = true;
    }

    return res.status(200).json({
      success: true,
      data: {
        challenge: {
          ...challenge.toObject(),
          userVote,
          isSaved,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
        code: 'CHALLENGE_NOT_FOUND',
      });
    }

    // Ownership check: only author can edit
    if (challenge.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this challenge',
        code: 'FORBIDDEN',
      });
    }

    const {
      title,
      description,
      category,
      urgency,
      locationText,
      coordinates,
      affectedPeople,
      duration,
      evidence,
    } = req.body;

    if (title) challenge.title = title.trim();
    if (description) challenge.description = description.trim();
    if (category) challenge.category = category;
    if (urgency) challenge.urgency = urgency;
    if (locationText) challenge.locationText = locationText.trim();
    if (affectedPeople !== undefined) challenge.affectedPeople = affectedPeople;
    if (duration !== undefined) challenge.duration = duration;

    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      challenge.coordinates = {
        type: 'Point',
        coordinates: [Number(coordinates[0]), Number(coordinates[1])],
      };
    }

    if (evidence && Array.isArray(evidence)) {
      challenge.evidence = evidence;
    }

    // If info was requested by admin, set back to 'under_review' for reinspection
    if (challenge.reviewStatus === 'information_requested') {
      challenge.reviewStatus = 'under_review';
    }

    await challenge.save();

    return res.status(200).json({
      success: true,
      message: 'Challenge updated successfully',
      data: {
        challenge,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
        code: 'CHALLENGE_NOT_FOUND',
      });
    }

    const isAuthor = challenge.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this challenge',
        code: 'FORBIDDEN',
      });
    }

    await Challenge.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Challenge deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMyChallenges = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { status } = req.query;
    const query = { author: req.user._id };

    if (status && status !== 'all') {
      query.reviewStatus = status;
    }

    const [challenges, total] = await Promise.all([
      Challenge.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
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

export const getNearbyChallenges = async (req, res, next) => {
  try {
    const { lat, lng, radiusKm = 100, category } = req.query;

    const query = {
      publicationStatus: 'published',
      'coordinates.coordinates': { $exists: true, $ne: [] },
    };

    if (category && category !== 'All') {
      query.category = category;
    }

    let challenges;

    // If valid coordinates are provided, perform geospatial query
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      const latitude = Number(lat);
      const longitude = Number(lng);
      const maxDistanceMeters = Number(radiusKm) * 1000;

      query.coordinates = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistanceMeters,
        },
      };

      challenges = await Challenge.find(query)
        .limit(60)
        .populate('author', 'name avatar location')
        .lean();
    } else {
      // Default to returning all published challenges with coordinates (for Jharkhand map overview)
      challenges = await Challenge.find(query)
        .sort({ createdAt: -1 })
        .limit(60)
        .populate('author', 'name avatar location')
        .lean();
    }

    return res.status(200).json({
      success: true,
      data: {
        challenges,
        count: challenges.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
