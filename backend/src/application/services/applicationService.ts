import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const moveCandidateStage = async (
  applicationId: number,
  candidateId: number,
  newStepId: number,
  performedBy?: number,
  note?: string
) => {
  // Fetch application
  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application) return null; // Controller will map to 404

  // Verify candidate matches
  if (application.candidateId !== candidateId) {
    throw new Error('Application does not belong to the specified candidate');
  }

  // Verify interview step exists
  const interviewStep = await prisma.interviewStep.findUnique({ where: { id: newStepId } });
  if (!interviewStep) {
    throw new Error('Interview step not found');
  }

  // Verify position and flow consistency
  const position = await prisma.position.findUnique({ where: { id: application.positionId } });
  if (!position) {
    throw new Error('Position not found');
  }

  if (position.interviewFlowId !== interviewStep.interviewFlowId) {
    throw new Error('Invalid interview step for this flow');
  }

  // Transaction: update application and optionally create an interview record as audit
  const result = await prisma.$transaction(async (tx) => {
    const updatedApp = await tx.application.update({
      where: { id: applicationId },
      data: { currentInterviewStep: newStepId }
    });

    if (note || performedBy) {
      // create an interview-like audit record using scalar FK fields and cast to unchecked input
      await tx.interview.create({
        data: {
          applicationId: applicationId,
          interviewStepId: newStepId,
          employeeId: performedBy ?? null,
          interviewDate: new Date(),
          notes: note
        } as Prisma.InterviewUncheckedCreateInput
      });
    }

    return updatedApp;
  });

  return result;
};
