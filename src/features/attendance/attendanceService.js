import { createAttendanceService } from './presentation/createAttendanceService';
import { gamificationService } from '../gamification';
import { pushNotificationGateway } from '../../shared/infrastructure/mobile';

export const attendanceService = createAttendanceService(undefined, {
  gamificationService,
  notificationService: pushNotificationGateway,
});
