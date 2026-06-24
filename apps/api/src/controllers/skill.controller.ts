import { Request, Response, NextFunction } from 'express';

import { skillService } from '../services/skill.service';

export class SkillController {
	async listSkills(req: Request, res: Response, next: NextFunction) {
		try {
			const { category, search, limit } = req.query;
			const parsedLimit = typeof limit === 'string' ? Number(limit) : undefined;
			const data = await skillService.listSkills({
				category: typeof category === 'string' ? category : undefined,
				search: typeof search === 'string' ? search : undefined,
				take: Number.isNaN(parsedLimit) ? undefined : parsedLimit,
			});

			return res.json({ success: true, data });
		} catch (error) {
			return next(error);
		}
	}
}

export const skillController = new SkillController();
