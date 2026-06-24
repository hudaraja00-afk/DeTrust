import { Router } from 'express';

import { skillController } from '../controllers';

const router: Router = Router();

router.get('/', skillController.listSkills);

export default router;
