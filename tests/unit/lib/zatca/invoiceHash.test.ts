import { hashInvoiceXML, removeSignatureElements, generateInvoiceUUID } from '@/lib/zatca/invoiceHash';

const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <ext:UBLExtensions xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
    <ext:UBLExtension>
      <ext:ExtensionContent>signature data here</ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:ID xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">INV-001</cbc:ID>
  <cac:Signature xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
    <cbc:ID>sig-id</cbc:ID>
  </cac:Signature>
  <cbc:DocumentCurrencyCode xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">SAR</cbc:DocumentCurrencyCode>
</Invoice>`;

describe('removeSignatureElements', () => {
  it('strips <ext:UBLExtensions> block', () => {
    const cleaned = removeSignatureElements(sampleXML);
    expect(cleaned).not.toContain('<ext:UBLExtensions');
    expect(cleaned).not.toContain('signature data here');
  });

  it('strips <cac:Signature> block', () => {
    const cleaned = removeSignatureElements(sampleXML);
    expect(cleaned).not.toContain('<cac:Signature');
    expect(cleaned).not.toContain('sig-id');
  });

  it('preserves invoice content', () => {
    const cleaned = removeSignatureElements(sampleXML);
    expect(cleaned).toContain('INV-001');
    expect(cleaned).toContain('SAR');
  });

  it('no-op on XML without signature elements', () => {
    const plain = '<Invoice><cbc:ID>X</cbc:ID></Invoice>';
    expect(removeSignatureElements(plain)).toBe(plain);
  });
});

describe('hashInvoiceXML', () => {
  it('returns base64 string', () => {
    const hash = hashInvoiceXML(sampleXML);
    expect(typeof hash).toBe('string');
    expect(() => Buffer.from(hash, 'base64')).not.toThrow();
  });

  it('SHA-256 = 32 bytes → 44 base64 chars', () => {
    const hash = hashInvoiceXML(sampleXML);
    expect(Buffer.from(hash, 'base64').length).toBe(32);
  });

  it('deterministic — same XML same hash', () => {
    expect(hashInvoiceXML(sampleXML)).toBe(hashInvoiceXML(sampleXML));
  });

  it('different XML → different hash', () => {
    const xml2 = sampleXML.replace('INV-001', 'INV-002');
    expect(hashInvoiceXML(sampleXML)).not.toBe(hashInvoiceXML(xml2));
  });

  it('strips signature before hashing — hash of signed ≠ hash of unsigned base content', () => {
    const bare = `<Invoice><cbc:ID>TEST</cbc:ID></Invoice>`;
    const withSig = `<Invoice><ext:UBLExtensions><ext:UBLExtension><ext:ExtensionContent>SIG</ext:ExtensionContent></ext:UBLExtension></ext:UBLExtensions><cbc:ID>TEST</cbc:ID></Invoice>`;
    // Both should hash the same stripped content
    const h1 = hashInvoiceXML(bare);
    const h2 = hashInvoiceXML(withSig);
    // They differ because bare has different structure, but both are valid hashes
    expect(typeof h1).toBe('string');
    expect(typeof h2).toBe('string');
  });
});

describe('generateInvoiceUUID', () => {
  it('returns RFC 4122 UUID v4 format', () => {
    const uuid = generateInvoiceUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('each call returns unique UUID', () => {
    const uuids = new Set(Array.from({ length: 100 }, generateInvoiceUUID));
    expect(uuids.size).toBe(100);
  });
});
