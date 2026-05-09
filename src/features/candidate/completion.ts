export type CandidateCompletionInput = {
  accountCreated: boolean;
  hasCv: boolean;
  hasDesiredRole: boolean;
  hasAlert: boolean;
};

export type CandidateCompletion = {
  percent: number;
  completedSteps: number;
  totalSteps: number;
};

export function calculateCandidateCompletion(input: CandidateCompletionInput): CandidateCompletion {
  const steps = [input.accountCreated, input.hasCv, input.hasDesiredRole, input.hasAlert];
  const completedSteps = steps.filter(Boolean).length;
  const totalSteps = steps.length;

  return {
    percent: Math.round((completedSteps / totalSteps) * 100),
    completedSteps,
    totalSteps
  };
}
