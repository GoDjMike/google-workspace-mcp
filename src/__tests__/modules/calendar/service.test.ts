import { CalendarService } from '../../../modules/calendar/service.js';
import { calendar_v3 } from 'googleapis';
import { getAccountManager } from '../../../modules/accounts/index.js';
import { AccountManager } from '../../../modules/accounts/manager.js';
import { CreateEventParams } from '../../../modules/calendar/types.js';

jest.mock('../../../modules/accounts/index.js');
jest.mock('../../../modules/accounts/manager.js');

describe('CalendarService', () => {
  let calendarService: CalendarService;
  let mockCalendarClient: jest.Mocked<calendar_v3.Calendar>;
  let mockAccountManager: jest.Mocked<AccountManager>;

  const mockEmail = 'test@example.com';

  beforeEach(() => {
    mockCalendarClient = {
      events: {
        list: jest.fn(() => Promise.resolve({ data: {} })),
        get: jest.fn(() => Promise.resolve({ data: {} })),
        insert: jest.fn(() => Promise.resolve({ data: {} })),
      },
      calendarList: {
        list: jest.fn(() => Promise.resolve({ data: {} })),
      },
    } as any;

    mockAccountManager = {
      validateToken: jest.fn().mockResolvedValue({ valid: true, token: {} }),
      getAuthClient: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AccountManager>;

    (getAccountManager as jest.Mock).mockReturnValue(mockAccountManager);

    calendarService = new CalendarService();
    (calendarService as any).getCalendarClient = jest.fn().mockResolvedValue(mockCalendarClient);
  });

  describe('getEvents', () => {
    const mockEventList = {
      data: {
        items: [
          {
            id: 'event1',
            summary: 'Test Event 1',
            start: { dateTime: '2024-01-01T10:00:00Z' },
            end: { dateTime: '2024-01-01T11:00:00Z' },
          },
          {
            id: 'event2',
            summary: 'Test Event 2',
            start: { dateTime: '2024-01-02T14:00:00Z' },
            end: { dateTime: '2024-01-02T15:00:00Z' },
          },
        ],
      },
    };

    it('should get calendar events', async () => {
      (mockCalendarClient.events.list as any).mockResolvedValue(mockEventList);

      const result = await calendarService.getEvents({
        email: mockEmail,
        timeMin: '2024-01-01T00:00:00Z',
        timeMax: '2024-01-31T23:59:59Z',
      });

      expect(mockCalendarClient.events.list).toHaveBeenCalledWith(
        expect.objectContaining({
          calendarId: 'primary',
          singleEvents: true,
          orderBy: 'startTime',
          timeMin: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          timeMax: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          maxResults: 10
        })
      );

      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('id', 'event1');
      expect(result[1]).toHaveProperty('id', 'event2');
    });

    it('should handle empty results', async () => {
      (mockCalendarClient.events.list as any).mockResolvedValue({ data: {} });

      const result = await calendarService.getEvents({
        email: mockEmail,
        timeMin: '2024-01-01T00:00:00Z',
        timeMax: '2024-01-31T23:59:59Z',
      });

      expect(result).toEqual([]);
    });

    it('should properly format date parameters', async () => {
      (mockCalendarClient.events.list as any).mockResolvedValue({ data: {} });

      await calendarService.getEvents({
        email: mockEmail,
        timeMin: '2024-01-01',  // Date without time
        timeMax: '2024-01-31',  // Date without time
      });

      expect(mockCalendarClient.events.list).toHaveBeenCalledWith(
        expect.objectContaining({
          timeMin: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          timeMax: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          maxResults: 10
        })
      );
    });

    it('should handle optional parameters', async () => {
      (mockCalendarClient.events.list as any).mockResolvedValue({ data: {} });

      await calendarService.getEvents({
        email: mockEmail,
        query: 'test meeting',
        maxResults: 5,
      });

      expect(mockCalendarClient.events.list).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'test meeting',
          maxResults: 5,
        })
      );
    });

    it('should use default maxResults if not provided', async () => {
      (mockCalendarClient.events.list as any).mockResolvedValue({ data: {} });

      await calendarService.getEvents({
        email: mockEmail,
      });

      expect(mockCalendarClient.events.list).toHaveBeenCalledWith(
        expect.objectContaining({
          maxResults: 10,  // Default value from GetEventsParams
        })
      );
    });

    it('should handle invalid date formats gracefully', async () => {
      (mockCalendarClient.events.list as any).mockResolvedValue({ data: {} });

      const invalidDate = 'not-a-date';
      
      await expect(calendarService.getEvents({
        email: mockEmail,
        timeMin: invalidDate,
      })).rejects.toThrow('Invalid date format');
    });
  });

  describe('createEvent', () => {
    const mockEventParams: CreateEventParams = {
      email: mockEmail,
      summary: 'New Meeting',
      description: 'Team sync',
      start: {
        dateTime: '2024-01-15T10:00:00Z',
        timeZone: 'UTC',
      },
      end: {
        dateTime: '2024-01-15T11:00:00Z',
        timeZone: 'UTC',
      },
      attendees: [{ email: 'attendee@example.com' }],
    };

    it('should create calendar event successfully', async () => {
      const mockCreateResponse = {
        data: {
          id: 'new-event-1',
          summary: 'New Meeting',
          htmlLink: 'https://calendar.google.com/event?id=123',
        },
      };

      (mockCalendarClient.events.insert as any).mockResolvedValue(mockCreateResponse);

      const result = await calendarService.createEvent(mockEventParams);

      // Verify the response matches CreateEventResponse type
      expect(result).toEqual({
        id: 'new-event-1',
        summary: 'New Meeting',
        htmlLink: 'https://calendar.google.com/event?id=123',
      });

      // Verify the request was properly formatted
      expect(mockCalendarClient.events.insert).toHaveBeenCalledWith({
        calendarId: 'primary',
        sendUpdates: 'all',
        requestBody: {
          summary: mockEventParams.summary,
          description: mockEventParams.description,
          start: mockEventParams.start,
          end: mockEventParams.end,
          attendees: mockEventParams.attendees?.map(({ email }) => ({ email })),
        },
      });
    });

    it('should handle creation failure', async () => {
      const error = new Error('Creation failed');
      (mockCalendarClient.events.insert as any).mockRejectedValue(error);

      await expect(calendarService.createEvent(mockEventParams))
        .rejects
        .toThrow('Creation failed');
    });

    it('should throw error if response is incomplete', async () => {
      const mockIncompleteResponse = {
        data: {
          // Missing required id or summary
          htmlLink: 'https://calendar.google.com/event?id=123',
        },
      };

      (mockCalendarClient.events.insert as any).mockResolvedValue(mockIncompleteResponse);

      await expect(calendarService.createEvent(mockEventParams))
        .rejects
        .toThrow('Failed to create event');
    });
  });

  describe('getEvent', () => {
    const mockEvent = {
      data: {
        id: 'event1',
        summary: 'Test Event',
        start: { dateTime: '2024-01-01T10:00:00Z', timeZone: 'UTC' },
        end: { dateTime: '2024-01-01T11:00:00Z', timeZone: 'UTC' },
      },
    };

    it('should get a single event by ID', async () => {
      (mockCalendarClient.events.get as any).mockResolvedValue(mockEvent);

      const result = await calendarService.getEvent(mockEmail, 'event1');

      expect(result).toHaveProperty('id', 'event1');
      expect(result).toHaveProperty('summary', 'Test Event');
      expect(mockCalendarClient.events.get).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'event1',
      });
    });

    it('should handle event not found', async () => {
      (mockCalendarClient.events.get as any).mockRejectedValue(new Error('Not found'));

      await expect(calendarService.getEvent(mockEmail, 'nonexistent')).rejects.toThrow();
    });
  });
});
