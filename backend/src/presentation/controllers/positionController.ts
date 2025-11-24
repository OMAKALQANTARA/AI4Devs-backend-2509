import { Request, Response } from 'express';
import { getCandidatesForPosition } from '../../application/services/positionService';

export const getCandidatesForPositionController = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const result = await getCandidatesForPosition(id);
        if (result === null) {
            return res.status(404).json({ error: 'Position not found' });
        }
        return res.json(result);
    } catch (error) {
        console.error('Error fetching candidates for position:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
