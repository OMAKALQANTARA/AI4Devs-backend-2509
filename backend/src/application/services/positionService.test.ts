jest.mock('@prisma/client', () => {
  const mPrisma = {
    position: { findUnique: jest.fn() },
    application: { findMany: jest.fn() },
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

import { PrismaClient } from '@prisma/client';
import { getCandidatesForPosition } from './positionService';

describe('positionService.getCandidatesForPosition', () => {
  const MockedPrisma = PrismaClient as unknown as jest.Mock;
  const mPrisma = MockedPrisma.mock.results[0].value as any;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when position is not found', async () => {
    mPrisma.position.findUnique.mockResolvedValue(null);

    const res = await getCandidatesForPosition(999);

    expect(res).toBeNull();
    expect(mPrisma.position.findUnique).toHaveBeenCalledWith({ where: { id: 999 } });
  });

  it('returns mapped applications when present', async () => {
    mPrisma.position.findUnique.mockResolvedValue({ id: 1 });
    mPrisma.application.findMany.mockResolvedValue([
      {
        id: 5,
        candidate: { id: 10, firstName: 'Alice', lastName: 'Example' },
        currentInterviewStep: 1,
        interviews: [
          { score: 4, interviewDate: new Date('2025-01-01').toISOString() },
          { score: 5, interviewDate: new Date('2025-02-01').toISOString() }
        ]
      }
    ]);

    const res = await getCandidatesForPosition(1);

    expect(Array.isArray(res)).toBe(true);
    expect(res![0]).toMatchObject({
      applicationId: 5,
      candidateId: 10,
      fullName: 'Alice Example',
      currentInterviewStep: 1,
      averageScore: 4.5
    });

    expect(mPrisma.application.findMany).toHaveBeenCalled();
  });
});
