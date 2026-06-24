import { Router } from 'express';

import { userController } from '../controllers';
import { authenticate, optionalAuth, validateBody, requireFreelancer, requireClient } from '../middleware';
import {
  updateUserSchema,
  updateFreelancerProfileSchema,
  updateClientProfileSchema,
  addSkillSchema,
  addEducationSchema,
  addExperienceSchema,
  addPortfolioItemSchema,
  setRoleSchema,
  updateKycSchema,
} from '../validators';

const router: Router = Router();

// =============================================================================
// CURRENT USER
// =============================================================================

/**
 * @route   GET /users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, userController.getMe);

/**
 * @route   PATCH /users/me
 * @desc    Update current user
 * @access  Private
 */
router.patch(
  '/me',
  authenticate,
  validateBody(updateUserSchema),
  userController.updateMe
);

/**
 * @route   POST /users/me/role
 * @desc    Set user role (during onboarding)
 * @access  Private
 */
router.post(
  '/me/role',
  authenticate,
  validateBody(setRoleSchema),
  userController.setRole
);

/**
 * @route   PATCH /users/me/kyc
 * @desc    Submit or update KYC data
 * @access  Private
 */
router.patch(
  '/me/kyc',
  authenticate,
  validateBody(updateKycSchema),
  userController.updateKyc
);

// =============================================================================
// FREELANCER PROFILE
// =============================================================================

/**
 * @route   PATCH /users/me/freelancer
 * @desc    Update freelancer profile
 * @access  Private (Freelancer)
 */
router.patch(
  '/me/freelancer',
  authenticate,
  requireFreelancer,
  validateBody(updateFreelancerProfileSchema),
  userController.updateFreelancerProfile
);

/**
 * @route   POST /users/me/skills
 * @desc    Add skill to freelancer profile
 * @access  Private (Freelancer)
 */
router.post(
  '/me/skills',
  authenticate,
  requireFreelancer,
  validateBody(addSkillSchema),
  userController.addSkill
);

/**
 * @route   DELETE /users/me/skills/:skillId
 * @desc    Remove skill from freelancer profile
 * @access  Private (Freelancer)
 */
router.delete(
  '/me/skills/:skillId',
  authenticate,
  requireFreelancer,
  userController.removeSkill
);

/**
 * @route   POST /users/me/education
 * @desc    Add education entry
 * @access  Private (Freelancer)
 */
router.post(
  '/me/education',
  authenticate,
  requireFreelancer,
  validateBody(addEducationSchema),
  userController.addEducation
);

/**
 * @route   DELETE /users/me/education/:educationId
 * @desc    Remove education entry
 * @access  Private (Freelancer)
 */
router.delete(
  '/me/education/:educationId',
  authenticate,
  requireFreelancer,
  userController.removeEducation
);

/**
 * @route   DELETE /users/me/certifications/:certificationId
 * @desc    Remove certification entry
 * @access  Private (Freelancer)
 */
router.delete(
  '/me/certifications/:certificationId',
  authenticate,
  requireFreelancer,
  userController.removeCertification
);

/**
 * @route   POST /users/me/experience
 * @desc    Add experience entry
 * @access  Private (Freelancer)
 */
router.post(
  '/me/experience',
  authenticate,
  requireFreelancer,
  validateBody(addExperienceSchema),
  userController.addExperience
);

/**
 * @route   DELETE /users/me/experience/:experienceId
 * @desc    Remove experience entry
 * @access  Private (Freelancer)
 */
router.delete(
  '/me/experience/:experienceId',
  authenticate,
  requireFreelancer,
  userController.removeExperience
);

/**
 * @route   POST /users/me/portfolio
 * @desc    Add portfolio item
 * @access  Private (Freelancer)
 */
router.post(
  '/me/portfolio',
  authenticate,
  requireFreelancer,
  validateBody(addPortfolioItemSchema),
  userController.addPortfolioItem
);

/**
 * @route   DELETE /users/me/portfolio/:itemId
 * @desc    Remove portfolio item
 * @access  Private (Freelancer)
 */
router.delete(
  '/me/portfolio/:itemId',
  authenticate,
  requireFreelancer,
  userController.removePortfolioItem
);

/**
 * @route   POST /users/me/ai-capability/recalculate
 * @desc    Force recalculate AI capability score
 * @access  Private (Freelancer)
 */
router.post(
  '/me/ai-capability/recalculate',
  authenticate,
  requireFreelancer,
  userController.recalculateAiCapability
);

/**
 * @route   POST /users/me/skills/:skillId/verify/start
 * @desc    Start a skill verification test (generates AI quiz)
 * @access  Private (Freelancer)
 */
router.post(
  '/me/skills/:skillId/verify/start',
  authenticate,
  requireFreelancer,
  userController.startSkillVerification
);

/**
 * @route   POST /users/me/skills/:skillId/verify/submit
 * @desc    Submit skill verification answers
 * @access  Private (Freelancer)
 */
router.post(
  '/me/skills/:skillId/verify/submit',
  authenticate,
  requireFreelancer,
  userController.submitSkillVerification
);

/**
 * @route   GET /users/me/skill-tests
 * @desc    Get skill test history
 * @access  Private (Freelancer)
 */
router.get(
  '/me/skill-tests',
  authenticate,
  requireFreelancer,
  userController.getSkillTests
);

// =============================================================================
// CLIENT PROFILE
// =============================================================================

/**
 * @route   PATCH /users/me/client
 * @desc    Update client profile
 * @access  Private (Client)
 */
router.patch(
  '/me/client',
  authenticate,
  requireClient,
  validateBody(updateClientProfileSchema),
  userController.updateClientProfile
);

// =============================================================================
// PUBLIC PROFILES
// =============================================================================

/**
 * @route   GET /users/freelancers
 * @desc    Search freelancers
 * @access  Public
 */
router.get('/freelancers', optionalAuth, userController.searchFreelancers);

/**
 * @route   GET /users/clients/:id/profile
 * @desc    Get client public profile with work history
 * @access  Public
 */
router.get('/clients/:id/profile', optionalAuth, userController.getClientProfile);

/**
 * @route   GET /users/:id/trust-score
 * @desc    Get trust score breakdown for a user
 * @access  Public
 */
router.get('/:id/trust-score', optionalAuth, userController.getTrustScore);

/**
 * @route   GET /users/:id/trust-score/history
 * @desc    Get trust score history (trend data) for a user
 * @access  Public
 */
router.get('/:id/trust-score/history', optionalAuth, userController.getTrustScoreHistory);

/**
 * @route   GET /users/:id
 * @desc    Get public profile
 * @access  Public
 */
router.get('/:id', optionalAuth, userController.getUser);

export default router;
