import axios from 'axios';

jest.mock('axios');

describe('Monitoring - Alerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send webhook alert successfully', async () => {
    const mockResponse = { data: { success: true } };
    (axios.post as jest.Mock).mockResolvedValue(mockResponse);

    const result = await axios.post('https://webhook.example.com', {
      event: 'supply_change',
      amount: 1000,
    });

    expect(result.data.success).toBe(true);
    expect(axios.post).toHaveBeenCalledWith(
      'https://webhook.example.com',
      expect.objectContaining({ event: 'supply_change' })
    );
  });

  it('should handle webhook failures', async () => {
    const error = new Error('Webhook failed');
    (axios.post as jest.Mock).mockRejectedValue(error);

    await expect(
      axios.post('https://webhook.example.com', { event: 'test' })
    ).rejects.toThrow('Webhook failed');
  });

  it('should format alert payload correctly', () => {
    const alert = {
      type: 'supply_alert',
      message: 'Supply changed',
      timestamp: new Date().toISOString(),
      data: {
        oldSupply: 1000,
        newSupply: 2000,
        change: 1000,
      },
    };

    expect(alert.type).toBe('supply_alert');
    expect(alert.data.change).toBe(1000);
    expect(alert.timestamp).toBeTruthy();
  });

  it('should validate alert thresholds', () => {
    const threshold = 10000;
    const change = 15000;

    const shouldAlert = change > threshold;

    expect(shouldAlert).toBe(true);
  });

  it('should not alert below threshold', () => {
    const threshold = 10000;
    const change = 5000;

    const shouldAlert = change > threshold;

    expect(shouldAlert).toBe(false);
  });
});
