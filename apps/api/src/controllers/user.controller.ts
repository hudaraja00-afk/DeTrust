import { Request, Response, NextFunction } from 'express';
import { userService, trustScoreService } from '../services';
import { AuthenticatedRequest } from '../middleware';

export class UserController {
  /**
   * Get current user profile
   * GET /users/me
   */
  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserById(req.userId!);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user
   * PATCH /users/me
   */
  async updateMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateUser(req.userId!, req.body);
      res.json({
        success: true,
        message: 'Profile updated',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get public profile by ID
   * GET /users/:id
   */
  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getPublicProfile(req.params.id);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get client public profile with work history
   * GET /users/clients/:id/profile
   */
  async getClientProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await userService.getClientPublicProfile(req.params.id);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update freelancer profile
   * PATCH /users/me/freelancer
   */
  async updateFreelancerProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const profile = await userService.updateFreelancerProfile(req.userId!, req.body);
      res.json({
        success: true,
        message: 'Freelancer profile updated',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update client profile
   * PATCH /users/me/client
   */
  async updateClientProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const profile = await userService.updateClientProfile(req.userId!, req.body);
      res.json({
        success: true,
        message: 'Client profile updated',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add skill to freelancer profile
   * POST /users/me/skills
   */
  async addSkill(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { skillId, yearsExperience, proficiencyLevel } = req.body;
      const skill = await userService.addSkill(
        req.userId!,
        skillId,
        yearsExperience,
        proficiencyLevel
      );
      res.status(201).json({
        success: true,
        message: 'Skill added',
        data: skill,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove skill from freelancer profile
   * DELETE /users/me/skills/:skillId
   */
  async removeSkill(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await userService.removeSkill(req.userId!, req.params.skillId);
      res.json({
        success: true,
        message: 'Skill removed',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add education to freelancer profile
   * POST /users/me/education
   */
  async addEducation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const entry = await userService.addEducation(req.userId!, req.body);
      res.status(201).json({
        success: true,
        message: 'Education entry added',
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove education entry
   * DELETE /users/me/education/:educationId
   */
  async removeEducation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await userService.removeEducation(req.userId!, req.params.educationId);
      res.json({
        success: true,
        message: 'Education entry removed',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove certification entry
   * DELETE /users/me/certifications/:certificationId
   */
  async removeCertification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await userService.removeCertification(req.userId!, req.params.certificationId);
      res.json({
        success: true,
        message: 'Certification removed',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add experience entry to freelancer profile
   * POST /users/me/experience
   */
  async addExperience(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const entry = await userService.addExperience(req.userId!, req.body);
      res.status(201).json({
        success: true,
        message: 'Experience entry added',
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove experience entry
   * DELETE /users/me/experience/:experienceId
   */
  async removeExperience(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await userService.removeExperience(req.userId!, req.params.experienceId);
      res.json({
        success: true,
        message: 'Experience entry removed',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add portfolio item to freelancer profile
   * POST /users/me/portfolio
   */
  async addPortfolioItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const item = await userService.addPortfolioItem(req.userId!, req.body);
      res.status(201).json({
        success: true,
        message: 'Portfolio item added',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove portfolio item
   * DELETE /users/me/portfolio/:itemId
   */
  async removePortfolioItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await userService.removePortfolioItem(req.userId!, req.params.itemId);
      res.json({
        success: true,
        message: 'Portfolio item removed',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Force recalculate AI capability score
   * POST /users/me/ai-capability/recalculate
   */
  async recalculateAiCapability(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const score = await userService.calculateAiCapabilityScore(req.userId!);
      res.json({
        success: true,
        message: 'AI capability score recalculated',
        data: { score },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Start a skill verification test
   * POST /users/me/skills/:skillId/verify/start
   */
  async startSkillVerification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await userService.startVerification(req.userId!, req.params.skillId);
      res.json({
        success: true,
        message: 'Skill verification test started',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit skill verification answers
   * POST /users/me/skills/:skillId/verify/submit
   */
  async submitSkillVerification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { testId, answers, timeTaken } = req.body;
      const result = await userService.submitVerification(
        req.userId!,
        req.params.skillId,
        testId,
        answers,
        timeTaken,
      );
      res.json({
        success: true,
        message: result.passed ? 'Congratulations! Skill verified.' : 'Test not passed. Try again in 30 days.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get skill test history
   * GET /users/me/skill-tests
   */
  async getSkillTests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const history = await userService.getSkillTestHistory(req.userId!);
      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search freelancers
   * GET /users/freelancers
   */
  async searchFreelancers(req: Request, res: Response, next: NextFunction) {
    try {
      const sortOptions = ['trustScore', 'avgRating', 'completedJobs', 'createdAt'] as const;
      const sortParam = req.query.sort as string || 'trustScore';
      const sort = sortOptions.includes(sortParam as typeof sortOptions[number])
        ? (sortParam as typeof sortOptions[number])
        : 'trustScore';
      
      const query = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sort,
        order: (req.query.order as 'asc' | 'desc') || 'desc',
        search: req.query.search as string,
        skills: req.query.skills as string,
        minTrustScore: req.query.minTrustScore ? parseFloat(req.query.minTrustScore as string) : undefined,
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      };
      const result = await userService.searchFreelancers(query);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set user role (during onboarding)
   * POST /users/me/role
   */
  async setRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.setRole(req.userId!, req.body.role);
      res.json({
        success: true,
        message: 'Role set successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update KYC data
   * PATCH /users/me/kyc
   */
  async updateKyc(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateKyc(req.userId!, req.body);
      res.json({
        success: true,
        message: 'KYC data updated',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get trust score breakdown for a user
   * GET /users/:id/trust-score
   */
  async getTrustScore(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const breakdown = await trustScoreService.getTrustScoreBreakdown(id);
      res.json({ success: true, data: breakdown });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get trust score history (trend data) for a user
   * GET /users/:id/trust-score/history
   */
  async getTrustScoreHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);

      const history = await trustScoreService.getHistory(id, limit);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
export default userController;
