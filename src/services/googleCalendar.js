import { gapi } from 'gapi-script';
import { GOOGLE_CALENDAR_CONFIG } from '../config/googleCalendar';

// Inicializar Google API
export const initializeGapi = async () => {
  try {
    return new Promise((resolve) => {
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            apiKey: GOOGLE_CALENDAR_CONFIG.API_KEY,
            discoveryDocs: [GOOGLE_CALENDAR_CONFIG.DISCOVERY_DOC],
          });
          console.log('✅ Google API initialized successfully');
          resolve(true);
        } catch (error) {
          console.error('❌ Error initializing Google API:', error);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error('❌ Error loading Google API:', error);
    return false;
  }
};

// Obtener eventos del calendario
export const getCalendarEvents = async () => {
  try {
    console.log('🔍 Fetching calendar events...');
    console.log('📅 Calendar ID:', GOOGLE_CALENDAR_CONFIG.CALENDAR_ID);
    
    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(now.getMonth() + 1);

    console.log('📆 Date range:', now.toISOString(), 'to', oneMonthLater.toISOString());

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
    console.log('📋 API Response:', response);
    console.log('🎯 Events found:', response.result.items?.length || 0);
    
    if (response.result.items) {
      response.result.items.forEach((event, index) => {
        console.log(`📌 Event ${index + 1}:`, event.summary, event.start);
      });
    }
    
    return response.result.items || [];
  } catch (error) {
    console.error('❌ Error fetching calendar events:', error);
    console.error('🔍 Error details:', error.result?.error);
    return [];
  }
};