import { Prisma, Skill } from '@prisma/client';

import { prisma } from '../config/database';

interface SkillQuery {
	category?: string;
	search?: string;
	take?: number;
}

export class SkillService {
	async listSkills(params: SkillQuery = {}) {
		const { category, search, take = 50 } = params;

		const where: Prisma.SkillWhereInput = {
			isActive: true,
			...(category && { category }),
			...(search && {
				OR: [
					{ name: { contains: search, mode: 'insensitive' } },
					{ slug: { contains: search.toLowerCase(), mode: 'insensitive' } },
					{ category: { contains: search, mode: 'insensitive' } },
				],
			}),
		};

		const limit = Math.min(Math.max(take, 1), 100);

		const skills: Skill[] = await prisma.skill.findMany({
			where,
			orderBy: [{ category: 'asc' }, { name: 'asc' }],
			take: limit,
		});

		const categorySet = new Set<string>(
			skills.map((skill: Skill) => skill.category)
		);
		const categories = Array.from(categorySet).sort((a, b) => a.localeCompare(b));

		return {
			items: skills,
			total: skills.length,
			categories,
		};
	}
}

export const skillService = new SkillService();
export type { SkillQuery };
