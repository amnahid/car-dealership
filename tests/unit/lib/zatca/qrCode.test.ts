import { buildTLVBuffer, buildTLVBase64, generateZatcaQRCode, ZatcaQRData } from '@/lib/zatca/qrCode';

const sampleData: ZatcaQRData = {
  sellerName: 'Test Dealer',
  sellerTrn: '123456789012345',
  issueTimestamp: '2024-01-15T10:30:00Z',
  totalWithVat: '1150.00',
  vatTotal: '150.00',
};

describe('buildTLVBuffer', () => {
  it('produces Buffer', () => {
    const buf = buildTLVBuffer(sampleData);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
  });

  it('encodes tag 1 = seller name', () => {
    const buf = buildTLVBuffer(sampleData);
    expect(buf[0]).toBe(1);
    const len = buf[1];
    const name = buf.subarray(2, 2 + len).toString('utf8');
    expect(name).toBe(sampleData.sellerName);
  });

  it('encodes tag 2 = seller TRN after tag 1', () => {
    const buf = buildTLVBuffer(sampleData);
    const tag1Len = buf[1];
    const offset = 2 + tag1Len;
    expect(buf[offset]).toBe(2);
    const trnLen = buf[offset + 1];
    const trn = buf.subarray(offset + 2, offset + 2 + trnLen).toString('utf8');
    expect(trn).toBe(sampleData.sellerTrn);
  });

  it('Phase 1 = 5 TLV tags (no Phase 2 fields)', () => {
    const buf = buildTLVBuffer(sampleData);
    let i = 0;
    let tagCount = 0;
    while (i < buf.length) {
      tagCount++;
      const len = buf[i + 1];
      i += 2 + len;
    }
    expect(tagCount).toBe(5);
  });

  it('Phase 2 = 8 TLV tags when xmlHash + ecdsa + publicKey given', () => {
    const phase2Data: ZatcaQRData = {
      ...sampleData,
      xmlHash: Buffer.from('fakehash').toString('base64'),
      ecdsa: Buffer.from('fakesig').toString('base64'),
      publicKey: Buffer.from('fakepubkey').toString('base64'),
    };
    const buf = buildTLVBuffer(phase2Data);
    let i = 0;
    let tagCount = 0;
    while (i < buf.length) {
      tagCount++;
      const len = buf[i + 1];
      i += 2 + len;
    }
    expect(tagCount).toBe(8);
  });

  it('multi-byte length for value > 127 bytes', () => {
    const longName = 'A'.repeat(200);
    const buf = buildTLVBuffer({ ...sampleData, sellerName: longName });
    expect(buf[0]).toBe(1);
    // Multi-byte length: first byte should be 0x81 (one extra length byte)
    expect(buf[1]).toBe(0x81);
    expect(buf[2]).toBe(200);
  });
});

describe('buildTLVBase64', () => {
  it('returns valid base64 string', () => {
    const b64 = buildTLVBase64(sampleData);
    expect(typeof b64).toBe('string');
    expect(() => Buffer.from(b64, 'base64')).not.toThrow();
  });

  it('decodes back to same buffer as buildTLVBuffer', () => {
    const b64 = buildTLVBase64(sampleData);
    const decoded = Buffer.from(b64, 'base64');
    const direct = buildTLVBuffer(sampleData);
    expect(decoded.equals(direct)).toBe(true);
  });
});

describe('generateZatcaQRCode', () => {
  it('returns PNG data URL', async () => {
    const result = await generateZatcaQRCode(sampleData);
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('different data produces different QR codes', async () => {
    const qr1 = await generateZatcaQRCode(sampleData);
    const qr2 = await generateZatcaQRCode({ ...sampleData, totalWithVat: '2300.00' });
    expect(qr1).not.toBe(qr2);
  });
});
