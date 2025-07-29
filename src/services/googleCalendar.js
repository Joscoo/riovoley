import { gapi } from 'gapi-script';
import { GOOGLE_CALENDAR_CONFIG } from '../config/googleCalendar';

// Inicializar Google API
export const initializeGapi = async () => {
  try {
    await gapi.load('client', async () => {
      await gapi.client.init({
        apiKey: GOOGLE_CALENDAR_CONFIG.API_KEY,
        discoveryDocs: [GOOGLE_CALENDAR_CONFIG.DISCOVERY_DOC],
      });
    });
    console.log('Google API initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Google API:', error);
    return false;
  }
};

// Obtener eventos del calendario
export const getCalendarEvents = async () => {
  try {
    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(now.getMonth() + 1);

    const request = gapi.client.calendar.events.list({
      calendarId: GOOGLE_CALENDAR_CONFIG.CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: oneMonthLater.toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 20,
      orderBy: 'startTime',
    });

    const response = await request;
    return response.result.items || [];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
};