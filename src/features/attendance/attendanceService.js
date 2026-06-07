import { createAttendanceService } from './presentation/createAttendanceService';
import { gamificationService } from '../gamification';

export const attendanceService = createAttendanceService(undefined, { gamificationService });
