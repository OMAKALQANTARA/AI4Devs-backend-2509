jest.mock('@prisma/client', () => {
  const mPrisma = {
    application: { findUnique: jest.fn() },
    interviewStep: { findUnique: jest.fn() },
    position: { findUnique: jest.fn() },
    interview: { create: jest.fn() },
    $transaction: jest.fn()
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

import { PrismaClient } from '@prisma/client';
import { moveCandidateStage } from './applicationService';

describe('applicationService.moveCandidateStage', () => {
  const MockedPrisma = PrismaClient as unknown as jest.Mock;
  const mPrisma = MockedPrisma.mock.results[0].value as any;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when application not found', async () => {
    mPrisma.application.findUnique.mockResolvedValue(null);

    const res = await moveCandidateStage(999, 1, 2);
    expect(res).toBeNull();
    expect(mPrisma.application.findUnique).toHaveBeenCalledWith({ where: { id: 999 } });
  });

  it('throws when interview step not found', async () => {
    mPrisma.application.findUnique.mockResolvedValue({ id: 5, candidateId: 1, positionId: 10 });
    mPrisma.interviewStep.findUnique.mockResolvedValue(null);

    await expect(moveCandidateStage(5, 1, 123)).rejects.toThrow('Interview step not found');
  });

  it('throws when step does not belong to flow', async () => {
    mPrisma.application.findUnique.mockResolvedValue({ id: 5, candidateId: 1, positionId: 10 });
    mPrisma.interviewStep.findUnique.mockResolvedValue({ id: 123, interviewFlowId: 20 });
    mPrisma.position.findUnique.mockResolvedValue({ id: 10, interviewFlowId: 99 });

    await expect(moveCandidateStage(5, 1, 123)).rejects.toThrow('Invalid interview step for this flow');
  });

  it('updates application and creates audit interview on success', async () => {
    mPrisma.application.findUnique.mockResolvedValue({ id: 5, candidateId: 1, positionId: 10 });
    mPrisma.interviewStep.findUnique.mockResolvedValue({ id: 123, interviewFlowId: 50 });
    mPrisma.position.findUnique.mockResolvedValue({ id: 10, interviewFlowId: 50 });

    const updatedApp = { id: 5, candidateId: 1, currentInterviewStep: 123 };

    // Simulate transaction executing the callback and returning updatedApp
    mPrisma.$transaction.mockImplementation(async (cb: any) => {
      // create a tx object with application.update and interview.create
      const tx = {
        application: { update: jest.fn().mockResolvedValue(updatedApp) },
        interview: { create: jest.fn().mockResolvedValue({ id: 99 }) }
      };
      return cb(tx);
    });

    const res = await moveCandidateStage(5, 1, 123, 42, 'Moved to next');
    expect(res).toEqual(updatedApp);
    expect(mPrisma.$transaction).toHaveBeenCalled();
  });
});
