import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError, ConflictError } from '../middleware';
import { aiService } from './ai.service';
import { 
  UpdateUserInput, 
  UpdateFreelancerProfileInput, 
  UpdateClientProfileInput,
  GetUsersQuery,
  AddEducationInput,
  AddExperienceInput,
  AddPortfolioItemInput,
} from '../validators';

export class UserService {
  /**
   * Get user by ID with profile
   */
  async getUserById(id: string, includeProfile = true) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: includeProfile ? {
        freelancerProfile: {
          include: {
            skills: {
              include: { skill: true },
            },
            certifications: true,
            education: true,
            experience: true,
            portfolioItems: true,
          },
        },
        clientProfile: true,
      } : undefined,
    });
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Remove sensitive fields
    const { passwordHash, twoFactorSecret, nonce, ...safeUser } = user;
    
    return safeUser;
  }
  
  /**
   * Get public profile (for viewing other users)
   */
  async getPublicProfile(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        freelancerProfile: {
          select: {
            title: true,
            bio: true,
            hourlyRate: true,
            location: true,
            trustScore: true,
            aiCapabilityScore: true,
            completedJobs: true,
            avgRating: true,
            totalReviews: true,
            availability: true,
            timezone: true,
            languages: true,
            portfolioLinks: true,
            resumeUrl: true,
            profileComplete: true,
            skills: {
              include: { skill: true },
            },
            certifications: true,
            education: true,
            experience: true,
            portfolioItems: true,
          },
        },
        clientProfile: {
          select: {
            companyName: true,
            industry: true,
            location: true,
            trustScore: true,
            jobsPosted: true,
            hireRate: true,
            avgRating: true,
            totalReviews: true,
            paymentVerified: true,
            profileComplete: true,
            completenessScore: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Get client public profile with recent work history
   */
  async getClientPublicProfile(clientId: string) {
    const user = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        clientProfile: {
          select: {
            companyName: true,
            companySize: true,
            companyWebsite: true,
            description: true,
            industry: true,
            location: true,
            trustScore: true,
            jobsPosted: true,
            hireRate: true,
            avgRating: true,
            totalReviews: true,
            totalSpent: true,
            paymentVerified: true,
            profileComplete: true,
            completenessScore: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const recentContracts = await prisma.contract.findMany({
      where: {
        clientId,
        status: 'COMPLETED',
      },
      select: {
        id: true,
        title: true,
        totalAmount: true,
        completedAt: true,
        freelancer: {
          select: { name: true },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
    });

    return { user, recentContracts };
  }

  /**
   * Update user basic info
   */
  async updateUser(userId: string, data: UpdateUserInput) {
    // Guard: if a new walletAddress is being set, make sure no OTHER user already owns it
    if (data.walletAddress) {
      const existing = await prisma.user.findUnique({
        where: { walletAddress: data.walletAddress },
        select: { id: true },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictError('This wallet address is already linked to another account');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      include: {
        freelancerProfile: true,
        clientProfile: true,
      },
    });

    // Auto-verify payment when wallet is linked for clients
    if (data.walletAddress && user.role === 'CLIENT' && user.clientProfile && !user.clientProfile.paymentVerified) {
      await prisma.clientProfile.update({
        where: { userId },
        data: { paymentVerified: true },
      });
      user.clientProfile.paymentVerified = true;
    }

    const { passwordHash, twoFactorSecret, nonce, ...safeUser } = user;
    return safeUser;
  }
  
  /**
   * Update freelancer profile
   */
  async updateFreelancerProfile(userId: string, data: UpdateFreelancerProfileInput) {
    // Verify user is a freelancer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { freelancerProfile: true },
    });
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    if (user.role !== 'FREELANCER') {
      throw new ForbiddenError('Only freelancers can update freelancer profile');
    }
    
    // Create profile if doesn't exist
    if (!user.freelancerProfile) {
      await prisma.freelancerProfile.create({
        data: { userId },
      });
    }
    
    // Update profile
    const profile = await prisma.freelancerProfile.update({
      where: { userId },
      data: {
        ...data,
        hourlyRate: data.hourlyRate ?? undefined,
      },
      include: {
        skills: { include: { skill: true } },
        certifications: true,
        education: true,
        experience: true,
        portfolioItems: true,
      },
    });
    
    // Calculate profile completeness and AI capability score
    await this.updateProfileCompleteness(userId);
    await this.calculateAiCapabilityScore(userId);

    return profile;
  }
  
  /**
   * Update client profile
   */
  async updateClientProfile(userId: string, data: UpdateClientProfileInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { clientProfile: true },
    });
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    if (user.role !== 'CLIENT') {
      throw new ForbiddenError('Only clients can update client profile');
    }
    
    // Create profile if doesn't exist
    if (!user.clientProfile) {
      await prisma.clientProfile.create({
        data: { userId },
      });
    }
    
    const profile = await prisma.clientProfile.update({
      where: { userId },
      data,
    });

    // Calculate client profile completeness
    await this.updateClientProfileCompleteness(userId);

    return profile;
  }

  /**
   * Add skill to freelancer profile
   */
  async addSkill(userId: string, skillId: string, yearsExperience?: number, proficiencyLevel?: number) {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
    });
    
    if (!profile) {
      throw new NotFoundError('Freelancer profile not found');
    }
    
    // Check if skill exists
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    });
    
    if (!skill) {
      throw new NotFoundError('Skill not found');
    }
    
    // Add skill
    const freelancerSkill = await prisma.freelancerSkill.upsert({
      where: {
        freelancerProfileId_skillId: {
          freelancerProfileId: profile.id,
          skillId,
        },
      },
      update: {
        yearsExperience,
        proficiencyLevel,
      },
      create: {
        freelancerProfileId: profile.id,
        skillId,
        yearsExperience,
        proficiencyLevel,
      },
      include: { skill: true },
    });
    
    await this.updateProfileCompleteness(userId);
    await this.calculateAiCapabilityScore(userId);

    return freelancerSkill;
  }
  
  /**
   * Remove skill from freelancer profile
   */
  async removeSkill(userId: string, skillId: string) {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
    });
    
    if (!profile) {
      throw new NotFoundError('Freelancer profile not found');
    }
    
    await prisma.freelancerSkill.delete({
      where: {
        freelancerProfileId_skillId: {
          freelancerProfileId: profile.id,
          skillId,
        },
      },
    });
    
    await this.updateProfileCompleteness(userId);
    await this.calculateAiCapabilityScore(userId);

    return { success: true };
  }

  /**
   * Add education entry to freelancer profile
   */
  async addEducation(userId: string, data: AddEducationInput) {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundError('Freelancer profile not found');
    }

    const education = await prisma.education.create({
      data: {
        freelancerProfileId: profile.id,
        institution: data.institution,
        degree: data.degree,
        fieldOfStudy: data.fieldOfStudy,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        description: data.description,
      },
    });

    await this.updateProfileCompleteness(userId);
    await this.calculateAiCapabilityScore(userId);
    return education;
  }

  /**
   * Add experience entry to freelancer profile
   */
  async addExperience(userId: string, data: AddExperienceInput) {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundError('Freelancer profile not found');
    }

    const experience = await prisma.experience.create({
      data: {
        freelancerProfileId: profile.id,
        title: data.title,
        company: data.company,
        location: data.location,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        isCurrent: data.isCurrent ?? false,
        description: data.description,
      },
    });

    await this.updateProfileCompleteness(userId);
    await this.calculateAiCapabilityScore(userId);
    return experience;
  }

  /**
   * Remove experience entry
   */
  async removeExperience(userId: string, experienceId: string) {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundError('Freelancer profile not found');
    }

    const deleted = await prisma.experience.deleteMany({
      where: {
        id: experienceId,
        freelancerProfileId: profile.id,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundError('Experience entry not found');
    }

    await this.updateProfileCompleteness(userId);
    await this.calculateAiCapabilityScore(userId);
    return { success: true };
  }

  /**
   * Add portfolio item to freelancer profile
   */
  async addPortfolioItem(userId: string, data: AddPortfolioItemInput) {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundError('Freelancer profile not found');
    }

    const item = await prisma.portfolioItem.create({
      data: {
        freelancerProfileId: profile.id,
        title: data.title,
        description: data.description,
        projectUrl: data.projectUrl,
        repoUrl: data.repoUrl,
        imageUrl: data.imageUrl,
        techStack: data.techStack ?? [],
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        isFeatured: data.isFeatured ?? false,
      },
    });

    await this.updateProfileCompleteness(userId);
    await this.calculateAiCapabilityScore(userId);
    return item;
  }

  /**
   * Remove portfolio item
   */
  async removePortfolioItem(userId: string, itemId: string) {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundError('Freelancer profile not found');
    }

    const deleted = await prisma.portfolioItem.deleteMany({
      where: {
        id: itemId,
        freelancerProfileId: profile.id,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundError('Portfolio item not found');
    }

    await this.updateProfileCompleteness(userId);
    return { success: true };
  }

  /**
   * Remove education entry
   */
  async removeEducation(userId: string, educationId: string) {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundError('Freelancer profile not found');
    }

    const deleted = await prisma.education.deleteMany({
      where: {
        id: educationId,
        freelancerProfileId: profile.id,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundError('Education entry not found');
    }

    await this.updateProfileCompleteness(userId);
    await this.calculateAiCapabilityScore(userId);
    return { success: true };
  }

  /**
   * Remove certification entry and associated secure file if present
   */
  async removeCertification(userId: string, certificationId: string) {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundError('Freelancer profile not found');
    }

    const certification = await prisma.certification.findFirst({
      where: {
        id: certificationId,
        freelancerProfileId: profile.id,
      },
    });

    if (!certification) {
      throw new NotFoundError('Certification not found');
    }

    await prisma.certification.delete({ where: { id: certification.id } });

    const fileId = this.extractSecureFileId(certification.credentialUrl);
    if (fileId) {
      await prisma.secureFile.deleteMany({
        where: {
          id: fileId,
          userId,
        },
      });
    }

    await this.updateProfileCompleteness(userId);
    await this.calculateAiCapabilityScore(userId);
    return { success: true };
  }

  /**
   * Search freelancers
   */
  async searchFreelancers(query: GetUsersQuery) {
    const { page, limit, sort, order, search, skills, minTrustScore, minRating } = query;
    
    const profileFilter = {
      ...(minTrustScore && { trustScore: { gte: minTrustScore } }),
      ...(minRating && { avgRating: { gte: minRating } }),
      ...(skills && {
        skills: {
          some: {
            skillId: { in: skills.split(',') },
          },
        },
      }),
    };
    
    const where = {
      role: 'FREELANCER' as const,
      status: 'ACTIVE' as const,
      freelancerProfile: {
        is: profileFilter,
      },
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { freelancerProfile: { title: { contains: search, mode: 'insensitive' as const } } },
          { freelancerProfile: { bio: { contains: search, mode: 'insensitive' as const } } },
        ],
      }),
    };
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          freelancerProfile: {
            include: {
              skills: { include: { skill: true } },
            },
          },
        },
        orderBy: sort === 'createdAt' 
          ? { createdAt: order }
          : { freelancerProfile: { [sort]: order } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    type UserResult = Awaited<ReturnType<typeof prisma.user.findMany>>[number];
    const sanitizedUsers = users.map((user: UserResult) => {
      const { passwordHash, twoFactorSecret, nonce, ...safeUser } = user;
      return safeUser;
    });
    
    return {
      items: sanitizedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }
  
  /**
   * Set user role (for onboarding)
   */
  async setRole(userId: string, role: 'CLIENT' | 'FREELANCER') {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    
    // Create appropriate profile
    if (role === 'FREELANCER') {
      await prisma.freelancerProfile.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });
    } else if (role === 'CLIENT') {
      await prisma.clientProfile.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });
    }
    
    return user;
  }

  /**
   * Update KYC data for a user
   */
  async updateKyc(userId: string, data: { documentType: string; idNumber: string; country: string }) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        kycDocumentType: data.documentType,
        kycIdNumber: data.idNumber,
        kycCountry: data.country,
        kycStatus: 'PENDING',
      },
      select: {
        id: true,
        kycStatus: true,
        kycDocumentType: true,
        kycCountry: true,
      },
    });
  }

  /**
   * Calculate and update profile completeness
   */
  private async updateProfileCompleteness(userId: string) {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      include: {
        skills: true,
        certifications: true,
        education: true,
        experience: true,
        portfolioItems: true,
      },
    });
    
    if (!profile) return;
    
    let score = 0;
    const weights = {
      title: 10,
      bio: 12,
      hourlyRate: 8,
      skills: 20, // At least 3 skills
      portfolio: 12, // portfolio items OR legacy portfolio links
      location: 5,
      languages: 5,
      timezone: 3,
      education: 10,
      experience: 15,
    };

    if (profile.title) score += weights.title;
    if (profile.bio && profile.bio.length >= 120) score += weights.bio;
    if (profile.hourlyRate) score += weights.hourlyRate;
    if (profile.skills.length >= 3) score += weights.skills;
    if (profile.portfolioItems.length > 0 || profile.portfolioLinks.length > 0) score += weights.portfolio;
    if (profile.location) score += weights.location;
    if (profile.languages.length > 0) score += weights.languages;
    if (profile.timezone) score += weights.timezone;
    if (profile.education.length > 0) score += weights.education;
    if (profile.experience.length > 0) score += weights.experience;
    
    await prisma.freelancerProfile.update({
      where: { userId },
      data: {
        completenessScore: score,
        profileComplete: score >= 70,
      },
    });
  }

  /**
   * Calculate and update client profile completeness
   */
  private async updateClientProfileCompleteness(userId: string) {
    const profile = await prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (!profile) return;

    let score = 0;
    const weights = {
      companyName: 25,
      description: 25,
      industry: 15,
      companySize: 10,
      companyWebsite: 15,
      location: 10,
    };

    if (profile.companyName) score += weights.companyName;
    if (profile.description && profile.description.length >= 50) score += weights.description;
    if (profile.industry) score += weights.industry;
    if (profile.companySize) score += weights.companySize;
    if (profile.companyWebsite) score += weights.companyWebsite;
    if (profile.location) score += weights.location;

    await prisma.clientProfile.update({
      where: { userId },
      data: {
        completenessScore: score,
        profileComplete: score >= 70,
      },
    });
  }

  /**
   * Calculate and update AI capability score (0-100) for a freelancer.
   * Attempts to call the Python AI service first; falls back to heuristic scoring.
   */
  async calculateAiCapabilityScore(userId: string): Promise<number> {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      include: {
        skills: true,
        certifications: true,
      },
    });

    if (!profile) return 0;

    // Try AI service first
    const aiScore = await aiService.predictCapabilityScore(userId);

    let finalScore: number;

    if (aiScore > 0) {
      finalScore = Math.min(100, Math.max(0, Math.round(aiScore)));
    } else {
      // Heuristic fallback when AI service is unavailable
      // Only count terminal contracts for success rate — ACTIVE/PENDING are
      // still in progress and shouldn't penalise the freelancer.
      const [terminalContracts, completedContracts] = await Promise.all([
        prisma.contract.count({
          where: {
            freelancerId: userId,
            status: { in: ['COMPLETED', 'CANCELLED', 'DISPUTED'] },
          },
        }),
        prisma.contract.count({ where: { freelancerId: userId, status: 'COMPLETED' } }),
      ]);

      const reviewAgg = await prisma.review.aggregate({
        where: { subjectId: userId },
        _avg: { overallRating: true },
      });

      const skillPoints       = Math.min(25, profile.skills.length * 5);
      const completedJobPts   = Math.min(25, completedContracts * 5);
      const successRatePts    = terminalContracts > 0 ? (completedContracts / terminalContracts) * 20 : 0;
      const avgRating         = reviewAgg._avg.overallRating ? Number(reviewAgg._avg.overallRating) : 0;
      const ratingPts         = avgRating > 0 ? (avgRating / 5) * 15 : 0;
      const certPts           = Math.min(10, profile.certifications.length * 5);
      const completenessPts   = (profile.completenessScore / 100) * 5;

      finalScore = Math.min(100, Math.max(0, Math.round(
        skillPoints + completedJobPts + successRatePts + ratingPts + certPts + completenessPts
      )));
    }

    await prisma.freelancerProfile.update({
      where: { userId },
      data: { aiCapabilityScore: finalScore },
    });

    return finalScore;
  }

  // ─── Skill Verification ──────────────────────────────────────────────────

  /**
   * Start a skill verification test.
   * Checks 30-day cooldown, generates quiz via AI service, saves SkillTest to DB.
   */
  async startVerification(userId: string, skillId: string) {
    // 1. Validate user has this skill
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundError('Freelancer profile not found');

    const freelancerSkill = await prisma.freelancerSkill.findUnique({
      where: {
        freelancerProfileId_skillId: {
          freelancerProfileId: profile.id,
          skillId,
        },
      },
      include: { skill: true },
    });
    if (!freelancerSkill) throw new NotFoundError('Skill not found on your profile');

    // 2. Check 30-day cooldown
    const lastAttempt = await prisma.skillTestAttempt.findFirst({
      where: {
        userId,
        test: { skillId },
      },
      orderBy: { completedAt: 'desc' },
    });

    if (lastAttempt) {
      const daysSince = (Date.now() - lastAttempt.completedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) {
        const nextDate = new Date(lastAttempt.completedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
        throw new ForbiddenError(
          `Cooldown active. You can retake this test on ${nextDate.toLocaleDateString()}.`
        );
      }
    }

    // 3. Set status to PENDING
    await prisma.freelancerSkill.update({
      where: { id: freelancerSkill.id },
      data: { verificationStatus: 'PENDING' },
    });

    // 4. Generate quiz via AI service
    const quizResult = await aiService.generateQuiz(
      freelancerSkill.skill.name,
      freelancerSkill.skill.category,
    );

    // 5. Save SkillTest to DB (with correct answers in questions JSON)
    const skillTest = await prisma.skillTest.create({
      data: {
        skillId,
        name: `${freelancerSkill.skill.name} Verification`,
        description: `AI-generated verification test for ${freelancerSkill.skill.name}`,
        questions: quizResult.questions_full as any, // JSON column stores full questions with answers
        timeLimit: quizResult.time_limit_minutes,
        passingScore: quizResult.passing_score,
      },
    });

    // 6. Return test info + public questions (no answers)
    return {
      testId: skillTest.id,
      skillName: freelancerSkill.skill.name,
      skillCategory: freelancerSkill.skill.category,
      questions: quizResult.questions, // public - no correct_answer
      timeLimit: quizResult.time_limit_minutes,
      passingScore: quizResult.passing_score,
    };
  }

  /**
   * Submit answers for a skill verification test.
   * Grades answers, creates SkillTestAttempt, updates verification status.
   */
  async submitVerification(
    userId: string,
    skillId: string,
    testId: string,
    answers: { question_id: string; selected_answer: string }[],
    timeTaken: number, // in seconds
  ) {
    // 1. Load the test (with correct answers)
    const skillTest = await prisma.skillTest.findUnique({
      where: { id: testId },
    });
    if (!skillTest) throw new NotFoundError('Test not found');
    if (skillTest.skillId !== skillId) throw new ForbiddenError('Test does not match skill');

    // 2. Check not already submitted
    const existing = await prisma.skillTestAttempt.findFirst({
      where: { testId, userId },
    });
    if (existing) throw new ConflictError('Test already submitted');

    // 3. Grade locally
    const questionsJson = skillTest.questions as any[];
    const result = aiService.gradeQuiz(questionsJson, answers);

    // 4. Save attempt
    const attempt = await prisma.skillTestAttempt.create({
      data: {
        testId,
        userId,
        answers: answers as any,
        score: result.score,
        passed: result.passed,
        timeTaken,
      },
    });

    // 5. Update FreelancerSkill verification status
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (profile) {
      await prisma.freelancerSkill.updateMany({
        where: {
          freelancerProfileId: profile.id,
          skillId,
        },
        data: {
          verificationStatus: result.passed ? 'VERIFIED' : 'UNVERIFIED',
          verificationScore: result.score,
          verifiedAt: result.passed ? new Date() : null,
        },
      });

      // 6. Recalculate AI capability score
      await this.calculateAiCapabilityScore(userId);
    }

    return {
      attemptId: attempt.id,
      score: result.score,
      correctCount: result.correct_count,
      totalQuestions: result.total_questions,
      passed: result.passed,
      timeTaken,
    };
  }

  /**
   * Get skill test history for a user.
   */
  async getSkillTestHistory(userId: string) {
    const attempts = await prisma.skillTestAttempt.findMany({
      where: { userId },
      include: {
        test: {
          select: {
            skillId: true,
            name: true,
            passingScore: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 20,
    });

    return attempts;
  }

  private extractSecureFileId(url?: string | null) {
    if (!url) return null;
    const match = url.match(/\/uploads\/([^/?#]+)/i);
    return match ? match[1] : null;
  }
}

export const userService = new UserService();
export default userService;
