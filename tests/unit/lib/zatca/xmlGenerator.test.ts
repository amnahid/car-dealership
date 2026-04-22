import { generateZatcaXML } from '@/lib/zatca/xmlGenerator';
import { ZatcaInvoiceData } from '@/lib/zatca/types';

const baseInvoice: ZatcaInvoiceData = {
  uuid: '550e8400-e29b-41d4-a716-446655440000',
  invoiceType: 'Simplified',
  issueDate: new Date('2024-01-15T10:30:00Z'),
  seller: {
    name: 'Test Dealer',
    nameAr: 'تاجر اختبار',
    trn: '123456789012345',
    buildingNumber: '1234',
    streetName: 'King Fahd Road',
    district: 'Al Olaya',
    city: 'Riyadh',
    postalCode: '12345',
    countryCode: 'SA',
  },
  buyer: {
    name: 'Ahmed Al-Rashid',
  },
  lineItems: [{
    name: 'Toyota Camry 2024',
    quantity: 1,
    unitPrice: 100000,
    vatRate: 15,
    vatAmount: 15000,
    totalAmount: 115000,
  }],
  subtotal: 100000,
  vatTotal: 15000,
  totalWithVat: 115000,
  currency: 'SAR',
  pih: 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjOTljMmYxN2ZiNTVkMzRlYzYzMDMzNjE5YTM0ZGY4YjEwNw==',
};

describe('generateZatcaXML — Simplified invoice (B2C)', () => {
  let xml: string;

  beforeAll(() => {
    xml = generateZatcaXML(baseInvoice, 'FAKE_TLV_BASE64');
  });

  it('produces non-empty string', () => {
    expect(typeof xml).toBe('string');
    expect(xml.length).toBeGreaterThan(0);
  });

  it('starts with XML declaration', () => {
    expect(xml).toMatch(/^<\?xml version="1\.0"/);
  });

  it('contains Invoice root element with UBL namespace', () => {
    expect(xml).toContain('urn:oasis:names:specification:ubl:schema:xsd:Invoice-2');
  });

  it('contains invoice UUID', () => {
    expect(xml).toContain(baseInvoice.uuid);
  });

  it('Simplified subtype = 0200000', () => {
    expect(xml).toContain('0200000');
  });

  it('invoice type code = 388', () => {
    expect(xml).toContain('>388<');
  });

  it('contains SAR currency', () => {
    expect(xml).toContain('>SAR<');
  });

  it('contains issue date', () => {
    expect(xml).toContain('2024-01-15');
  });

  it('contains seller TRN', () => {
    expect(xml).toContain(baseInvoice.seller.trn);
  });

  it('contains seller Arabic name', () => {
    expect(xml).toContain('تاجر اختبار');
  });

  it('contains buyer name', () => {
    expect(xml).toContain('Ahmed Al-Rashid');
  });

  it('contains VAT amount (15000.00)', () => {
    expect(xml).toContain('15000.00');
  });

  it('contains total with VAT (115000.00)', () => {
    expect(xml).toContain('115000.00');
  });

  it('embeds PIH in AdditionalDocumentReference', () => {
    expect(xml).toContain(baseInvoice.pih);
  });

  it('embeds QR TLV for simplified invoice', () => {
    expect(xml).toContain('FAKE_TLV_BASE64');
  });

  it('contains UBLExtensions placeholder for Phase 2', () => {
    expect(xml).toContain('ext:UBLExtensions');
  });

  it('contains cac:Signature placeholder', () => {
    expect(xml).toContain('cac:Signature');
  });

  it('line item name present', () => {
    expect(xml).toContain('Toyota Camry 2024');
  });

  it('VAT rate 15.00 in TaxCategory', () => {
    expect(xml).toContain('15.00');
  });
});

describe('generateZatcaXML — Standard invoice (B2B)', () => {
  let xml: string;

  beforeAll(() => {
    const b2bInvoice: ZatcaInvoiceData = {
      ...baseInvoice,
      invoiceType: 'Standard',
      buyer: {
        name: 'Al-Rashid Motors',
        trn: '987654321098765',
        address: 'Industrial Area',
        city: 'Jeddah',
      },
    };
    xml = generateZatcaXML(b2bInvoice, '');
  });

  it('Standard subtype = 0100000', () => {
    expect(xml).toContain('0100000');
  });

  it('no QR reference for standard invoice', () => {
    expect(xml).not.toContain('>QR<');
  });

  it('contains buyer TRN', () => {
    expect(xml).toContain('987654321098765');
  });

  it('contains buyer address', () => {
    expect(xml).toContain('Industrial Area');
  });
});

describe('generateZatcaXML — multiple line items', () => {
  it('generates multiple InvoiceLine elements', () => {
    const multiLine: ZatcaInvoiceData = {
      ...baseInvoice,
      lineItems: [
        { name: 'Item A', quantity: 1, unitPrice: 500, vatRate: 15, vatAmount: 75, totalAmount: 575 },
        { name: 'Item B', quantity: 2, unitPrice: 200, vatRate: 15, vatAmount: 60, totalAmount: 460 },
      ],
      subtotal: 900,
      vatTotal: 135,
      totalWithVat: 1035,
    };
    const xml = generateZatcaXML(multiLine, '');
    const matches = xml.match(/<cac:InvoiceLine>/g);
    expect(matches).toHaveLength(2);
    expect(xml).toContain('Item A');
    expect(xml).toContain('Item B');
  });
});
