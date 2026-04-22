import {
  generateECKeyPair,
  signInvoiceHash,
  verifyInvoiceSignature,
  embedSignatureInXML,
  KeyPair,
} from '@/lib/zatca/cryptoSigning';

let keyPair: KeyPair;

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
    expect(keyPair.privateKey).toContain('END PRIVATE KEY');
  });

  it('publicKey is PEM SPKI format', () => {
    expect(keyPair.publicKey).toContain('BEGIN PUBLIC KEY');
    expect(keyPair.publicKey).toContain('END PUBLIC KEY');
  });

  it('each call generates unique keys', () => {
    const kp2 = generateECKeyPair();
    expect(kp2.privateKey).not.toBe(keyPair.privateKey);
    expect(kp2.publicKey).not.toBe(keyPair.publicKey);
  });
});

describe('signInvoiceHash + verifyInvoiceSignature', () => {
  const fakeHash = Buffer.from('a'.repeat(32)).toString('base64'); // 32-byte fake hash

  it('sign produces non-empty base64 string', () => {
    const sig = signInvoiceHash(fakeHash, keyPair.privateKey);
    expect(typeof sig).toBe('string');
    expect(sig.length).toBeGreaterThan(0);
    expect(() => Buffer.from(sig, 'base64')).not.toThrow();
  });

  it('verify returns true for valid signature', () => {
    const sig = signInvoiceHash(fakeHash, keyPair.privateKey);
    expect(verifyInvoiceSignature(fakeHash, sig, keyPair.publicKey)).toBe(true);
  });

  it('verify returns false for wrong signature', () => {
    const badSig = Buffer.from('invalidsignature').toString('base64');
    expect(verifyInvoiceSignature(fakeHash, badSig, keyPair.publicKey)).toBe(false);
  });

  it('verify returns false for tampered hash', () => {
    const sig = signInvoiceHash(fakeHash, keyPair.privateKey);
    const tampered = Buffer.from('b'.repeat(32)).toString('base64');
    expect(verifyInvoiceSignature(tampered, sig, keyPair.publicKey)).toBe(false);
  });

  it('verify returns false for wrong key pair', () => {
    const otherPair = generateECKeyPair();
    const sig = signInvoiceHash(fakeHash, keyPair.privateKey);
    expect(verifyInvoiceSignature(fakeHash, sig, otherPair.publicKey)).toBe(false);
  });

  it('different data → different signatures', () => {
    const hash2 = Buffer.from('b'.repeat(32)).toString('base64');
    const sig1 = signInvoiceHash(fakeHash, keyPair.privateKey);
    const sig2 = signInvoiceHash(hash2, keyPair.privateKey);
    expect(sig1).not.toBe(sig2);
  });
});

describe('embedSignatureInXML', () => {
  const xmlWithPlaceholder = `<Invoice>
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent>
        <sig:UBLDocumentSignatures>
          <sac:SignatureInformation>
            <cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID>
            <sbc:ReferencedSignatureID>urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID>
          </sac:SignatureInformation>
        </sig:UBLDocumentSignatures>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:ID>INV-001</cbc:ID>
</Invoice>`;

  it('embeds ds:Signature block', () => {
    const result = embedSignatureInXML(xmlWithPlaceholder, 'FAKESIG', 'FAKECERT', 'FAKEHASH');
    expect(result).toContain('<ds:Signature');
    expect(result).toContain('<ds:SignatureValue>FAKESIG</ds:SignatureValue>');
  });

  it('embeds certificate', () => {
    const result = embedSignatureInXML(xmlWithPlaceholder, 'SIG', 'MYCERT', 'HASH');
    expect(result).toContain('<ds:X509Certificate>MYCERT</ds:X509Certificate>');
  });

  it('preserves non-signature XML content', () => {
    const result = embedSignatureInXML(xmlWithPlaceholder, 'SIG', 'CERT', 'HASH');
    expect(result).toContain('INV-001');
  });
});
