import { Router } from 'express';
import { getCandidatesForPositionController } from '../presentation/controllers/positionController';

const router = Router();

// GET /positions/:id/candidates
router.get('/:id/candidates', getCandidatesForPositionController);

export default router;
