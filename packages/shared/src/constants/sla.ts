import { GrievanceSeverity } from '../types/grievance';

export interface SLAConfig {
  responseTimeHours: number;
  resolutionTimeHours: number;
}

export const SLA_TIMELINES: Record<GrievanceSeverity, SLAConfig> = {
  [GrievanceSeverity.CRITICAL]: { responseTimeHours: 4, resolutionTimeHours: 24 },
  [GrievanceSeverity.HIGH]: { responseTimeHours: 12, resolutionTimeHours: 72 },
  [GrievanceSeverity.MEDIUM]: { responseTimeHours: 24, resolutionTimeHours: 120 },
  [GrievanceSeverity.LOW]: { responseTimeHours: 48, resolutionTimeHours: 240 },
};
