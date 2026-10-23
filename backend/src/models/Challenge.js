import mongoose from 'mongoose';

export const CATEGORIES = [
  'Education',
  'Healthcare',
  'Agriculture',
  'Water Resources',
  'Environment',
  'Energy',
  'Infrastructure',
  'Sanitation',
  'Accessibility',
  'Rural Livelihoods',
  'Public Services',
  'Other',
];

export const URGENCIES = ['low', 'medium', 'high', 'critical'];

export const REVIEW_STATUSES = [
  'submitted',
  'under_review',
  'information_requested',
  'verified',
  'rejected',
];

export const PUBLICATION_STATUSES = ['pending_review', 'published', 'removed'];

const evidenceSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    publicId: {
      type: String,
      default: '',
    },
    originalName: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    // GeoJSON standard: [longitude, latitude]
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function (val) {
          return (
            Array.isArray(val) &&
            val.length === 2 &&
            val[0] >= -180 &&
            val[0] <= 180 && // longitude
            val[1] >= -90 &&
            val[1] <= 90 // latitude
          );
        },
        message: 'Coordinates must be valid [longitude, latitude]',
      },
    },
  },
  { _id: false }
);

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Challenge title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Detailed description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [4000, 'Description cannot exceed 4000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: CATEGORIES,
    },
    urgency: {
      type: String,
      required: [true, 'Urgency level is required'],
      enum: URGENCIES,
      default: 'medium',
    },
    locationText: {
      type: String,
      required: [true, 'Location description is required'],
      trim: true,
      maxlength: [250, 'Location text cannot exceed 250 characters'],
    },
    coordinates: {
      type: pointSchema,
      required: false,
    },
    affectedPeople: {
      type: String,
      trim: true,
      default: '',
    },
    duration: {
      type: String,
      trim: true,
      default: '',
    },
    evidence: {
      type: [evidenceSchema],
      default: [],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
      index: true,
    },
    reviewStatus: {
      type: String,
      enum: REVIEW_STATUSES,
      default: 'submitted',
      index: true,
    },
    publicationStatus: {
      type: String,
      enum: PUBLICATION_STATUSES,
      default: 'pending_review',
      index: true,
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
    reviewNote: {
      type: String,
      default: '',
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    voteScore: {
      type: Number,
      default: 0,
    },
    upvotesCount: {
      type: Number,
      default: 0,
    },
    downvotesCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
challengeSchema.index({ coordinates: '2dsphere' });
challengeSchema.index({ publicationStatus: 1, createdAt: -1 });
challengeSchema.index({ publicationStatus: 1, voteScore: -1 });
challengeSchema.index({ publicationStatus: 1, category: 1 });
challengeSchema.index({ publicationStatus: 1, urgency: 1 });
challengeSchema.index({ reviewStatus: 1, createdAt: -1 });
challengeSchema.index({
  title: 'text',
  description: 'text',
  locationText: 'text',
});

const Challenge = mongoose.model('Challenge', challengeSchema);
export default Challenge;
