import { Request, Response } from 'express';
import { moveCandidateStage } from '../../application/services/applicationService';

export const moveCandidateStageController = async (req: Request, res: Response) => {
  const candidateId = parseInt(req.params.id);
  if (isNaN(candidateId)) return res.status(400).json({ error: 'Invalid candidate ID format' });

  const { applicationId, newStepId, note, performedBy } = req.body;
  if (!applicationId || !newStepId) return res.status(400).json({ error: 'applicationId and newStepId are required' });

  try {
    const result = await moveCandidateStage(applicationId, candidateId, newStepId, performedBy, note);
    if (result === null) return res.status(404).json({ error: 'Application not found' });
    return res.json({ applicationId: result.id, candidateId: result.candidateId, previousStep: undefined, currentStep: result.currentInterviewStep, updatedAt: new Date().toISOString() });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message === 'Interview step not found' || error.message === 'Invalid interview step for this flow' || error.message === 'Application does not belong to the specified candidate' || error.message === 'Position not found') {
        return res.status(400).json({ error: error.message });
      }
    }
    console.error('Error moving candidate stage:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
