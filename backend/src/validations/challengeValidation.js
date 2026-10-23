import Joi from 'joi';
import { CATEGORIES, URGENCIES } from '../models/Challenge.js';

export const createChallengeSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200).required().messages({
    'string.empty': 'Title is required',
    'string.min': 'Title must be at least 5 characters long',
    'string.max': 'Title cannot exceed 200 characters',
  }),
  description: Joi.string().trim().min(20).max(4000).required().messages({
    'string.empty': 'Detailed description is required',
    'string.min': 'Description must be at least 20 characters long',
  }),
  category: Joi.string()
    .valid(...CATEGORIES)
    .required()
    .messages({
      'any.only': `Category must be one of: ${CATEGORIES.join(', ')}`,
      'string.empty': 'Category is required',
    }),
  urgency: Joi.string()
    .valid(...URGENCIES)
    .required()
    .messages({
      'any.only': 'Urgency must be low, medium, high, or critical',
      'string.empty': 'Urgency is required',
    }),
  locationText: Joi.string().trim().min(3).max(250).required().messages({
    'string.empty': 'Location description is required',
    'string.min': 'Location description must be at least 3 characters',
  }),
  coordinates: Joi.array()
    .items(Joi.number())
    .length(2)
    .optional()
    .messages({
      'array.length': 'Coordinates must be [longitude, latitude]',
    }),
  affectedPeople: Joi.string().trim().max(100).allow('').optional(),
  duration: Joi.string().trim().max(100).allow('').optional(),
  evidence: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().required(),
        fileType: Joi.string().valid('image', 'video').default('image'),
        publicId: Joi.string().allow('').optional(),
        originalName: Joi.string().allow('').optional(),
      })
    )
    .optional(),
});

export const updateChallengeSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200).optional(),
  description: Joi.string().trim().min(20).max(4000).optional(),
  category: Joi.string().valid(...CATEGORIES).optional(),
  urgency: Joi.string().valid(...URGENCIES).optional(),
  locationText: Joi.string().trim().min(3).max(250).optional(),
  coordinates: Joi.array().items(Joi.number()).length(2).optional(),
  affectedPeople: Joi.string().trim().max(100).allow('').optional(),
  duration: Joi.string().trim().max(100).allow('').optional(),
  evidence: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().required(),
        fileType: Joi.string().valid('image', 'video').default('image'),
        publicId: Joi.string().allow('').optional(),
        originalName: Joi.string().allow('').optional(),
      })
    )
    .optional(),
});

export const adminReviewSchema = Joi.object({
  reviewStatus: Joi.string()
    .valid(
      'submitted',
      'under_review',
      'information_requested',
      'verified',
      'rejected'
    )
    .required(),
  reviewNote: Joi.string().trim().allow('').optional(),
});

export const adminPublicationSchema = Joi.object({
  publicationStatus: Joi.string()
    .valid('pending_review', 'published', 'removed')
    .required(),
  note: Joi.string().trim().allow('').optional(),
});
