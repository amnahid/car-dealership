describe('tafweed helpers', () => {
  it('returns Expired when tafweed date is in past', async () => {
    const { getTafweedStatus } = await import('../../../src/lib/tafweed');
    const status = getTafweedStatus('2020-01-01');
    expect(status).toBe('Expired');
  });

  it('validates and normalizes tafweed authorization payload', async () => {
    const { validateTafweedAuthorization } = await import('../../../src/lib/tafweed');
    const result = validateTafweedAuthorization({
      startDate: '2026-01-01',
      customerName: 'John Doe',
      tafweedAuthorizedTo: '',
      tafweedDriverIqama: '1234567890',
      tafweedExpiryDate: '2027-01-10',
      tafweedDurationMonths: '12',
    });

    expect(result.authorizedTo).toBe('John Doe');
    expect(result.driverIqama).toBe('1234567890');
    expect(result.durationMonths).toBe(12);
    expect(result.status).toBe('Active');
  });

  it('throws when required tafweed iqama is missing', async () => {
    const { validateTafweedAuthorization } = await import('../../../src/lib/tafweed');
    expect(() =>
      validateTafweedAuthorization({
        startDate: '2026-01-01',
        customerName: 'John Doe',
        tafweedExpiryDate: '2027-01-10',
      })
    ).toThrow("Driver's Iqama number is required for Tafweed");
  });
});

