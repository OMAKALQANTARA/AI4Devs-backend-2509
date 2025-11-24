import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCandidatesForPosition = async (positionId: number) => {
    // Verify position exists
    const position = await prisma.position.findUnique({ where: { id: positionId } });
    if (!position) return null;

    // Fetch applications with candidate and interviews
    const applications = await prisma.application.findMany({
        where: { positionId },
        select: {
            id: true,
            candidate: { select: { id: true, firstName: true, lastName: true } },
            currentInterviewStep: true,
            interviews: { select: { score: true, interviewDate: true } }
        }
    });

    const mapped = applications.map(app => {
        const scores = app.interviews
            .map(i => i.score)
            .filter((s): s is number => s !== null && s !== undefined);

        const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

        let lastInterviewDate: Date | null = null;
        for (const iv of app.interviews) {
            const d = new Date(iv.interviewDate as any);
            if (!lastInterviewDate || d > lastInterviewDate) lastInterviewDate = d;
        }

        return {
            applicationId: app.id,
            candidateId: app.candidate.id,
            fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
            currentInterviewStep: app.currentInterviewStep,
            averageScore,
            lastInterviewDate: lastInterviewDate ? lastInterviewDate.toISOString() : null
        };
    });

    // Sort by currentInterviewStep asc, then averageScore desc (nulls last)
    mapped.sort((a, b) => {
        if (a.currentInterviewStep !== b.currentInterviewStep) return a.currentInterviewStep - b.currentInterviewStep;
        const aScore = a.averageScore ?? -Infinity;
        const bScore = b.averageScore ?? -Infinity;
        return bScore - aScore;
    });

    return mapped;
};
