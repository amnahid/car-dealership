import {
  generateECKeyPair,
  signData,
  embedSignatureInXML,
  KeyPair,
} from '@/lib/zatca/cryptoSigning';

let keyPair: KeyPair;

// A real-ish DER self-signed cert for testing parsing
const TEST_CERT = `-----BEGIN CERTIFICATE-----
MIIBqDCCAU6gAwIBAgIUa0Te1czkAVb5jXKm4MZiwzQ+8+cwCgYIKoZIzj0EAwIw
KzELMAkGA1UEBhMCU0ExDTALBgNVBAoMBFRlc3QxDTALBgNVBAMMBFRlc3QwHhcN
MjYwNDI2MTIzNjExWhcNMjcwNDI2MTIzNjExWjArMQswCQYDVQQGEwJTQTENMAsG
A1UECgwEVGVzdDENMAsGA1UEAwwEVGVzdDBWMBAGByqGSM49AgEGBSuBBAAKA0IA
BLYeqn+zCKNC/8xNp2lIpBamrGC9gH9um4twOWDRElj4L4LRPE4L2eLxY/7UJpST
OHwApMFJZADoIetBU+IyHt2jUzBRMB0GA1UdDgQWBBQax8TIfcTo9G9jfsErjgD/
Dh70jDAfBgNVHSMEGDAWgBQax8TIfcTo9G9jfsErjgD/Dh70jDAPBgNVHRMBAf8E
BTADAQH/MAoGCCqGSM49BAMCA0gAMEUCIF+AsennKQ7tvZuedh/n/7Jp2d+aUYf6
G3TRdnm4saMzAiEAnRKXI1NxORZDckpoyto824OEtWl1ivvCXbbPhf2j02o=
-----END CERTIFICATE-----`;

beforeAll(() => {
  keyPair = generateECKeyPair();
});

describe('generateECKeyPair', () => {
  it('returns privateKey and publicKey strings', () => {
    expect(typeof keyPair.privateKey).toBe('string');
    expect(typeof keyPair.publicKey).toBe('string');
  });

  it('privateKey is PEM PKCS8 format', () => {
    expect(keyPair.privateKey).toContain('BEGIN PRIVATE KEY');
  });
});

describe('signData', () => {
  it('produces non-empty Buffer', () => {
    const sig = signData('test', keyPair.privateKey);
    expect(sig).toBeInstanceOf(Buffer);
    expect(sig.length).toBeGreaterThan(0);
  });
});

describe('embedSignatureInXML', () => {
  const xmlWithPlaceholder = `<Invoice xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent>
        <sac:SignatureInformation xmlns:sac="urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2">
          <cbc:ID xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">urn:oasis:names:specification:ubl:signature:1</cbc:ID>
          <sbc:ReferencedSignatureID xmlns:sbc="urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2">urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID>
        </sac:SignatureInformation>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:ID xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">INV-001</cbc:ID>
</Invoice>`;

  const fakeHash = Buffer.from('a'.repeat(32)).toString('base64');

  it('embeds ds:Signature block', () => {
    const { signedXml, signatureValue } = embedSignatureInXML(xmlWithPlaceholder, keyPair.privateKey, TEST_CERT, fakeHash);
    expect(signedXml).toContain('<ds:Signature');
    expect(signedXml).toContain(`<ds:SignatureValue>${signatureValue}</ds:SignatureValue>`);
    expect(signedXml).toContain('Id="signature"');
  });

  it('embeds certificate', () => {
    const { signedXml } = embedSignatureInXML(xmlWithPlaceholder, keyPair.privateKey, TEST_CERT, fakeHash);
    const certBase64 = TEST_CERT.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s/g, '');
    expect(signedXml).toContain(`<ds:X509Certificate>${certBase64}</ds:X509Certificate>`);
  });

  it('preserves non-signature XML content', () => {
    const { signedXml } = embedSignatureInXML(xmlWithPlaceholder, keyPair.privateKey, TEST_CERT, fakeHash);
    expect(signedXml).toContain('INV-001');
  });
});
