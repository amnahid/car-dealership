import crypto from 'crypto';
import { DOMParser } from '@xmldom/xmldom';
import type { Element as XmlElement } from '@xmldom/xmldom';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { C14nCanonicalization } = require('xml-crypto') as { C14nCanonicalization: new () => { process(node: XmlElement, options?: object): string } };

export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

export interface CertInfo {
  certDigest: string;      // base64(sha256(DER))
  issuerName: string;
  serialDecimal: string;
  publicKeyDer: Buffer;    // DER-encoded SPKI
  certBase64: string;      // clean base64(DER) for ds:X509Certificate
  publicKeyRaw: Buffer;    // Raw 64-byte (X|Y) for QR tag 8
  certSignatureRaw: Buffer;// Raw 64-byte (R|S) cert signature for QR tag 9
}

export interface SignedXMLResult {
  signedXml: string;
  signatureValue: string;   // base64 DER
  signatureValueRaw: Buffer;// Raw 64-byte (R|S) for QR tag 7
}

export function generateECKeyPair(): KeyPair {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { privateKey, publicKey };
}

/**
 * Convert DER-encoded ECDSA signature to raw 64-byte (R|S) format.
 */
export function getRawSignature(derSignature: Buffer): Buffer {
  if (!derSignature || derSignature.length === 0) return Buffer.alloc(64, 0);
  try {
    let offset = 0;
    if (derSignature[offset++] !== 0x30) return Buffer.alloc(64, 0);
    
    // skip total length (could be 1 or 2 bytes)
    const lenByte = derSignature[offset++];
    if (lenByte & 0x80) {
      offset += (lenByte & 0x7f);
    }

    const extractComponent = () => {
      if (derSignature[offset++] !== 0x02) throw new Error('not DER INTEGER');
      const len = derSignature[offset++];
      let component = derSignature.slice(offset, offset + len);
      offset += len;
      if (component.length > 32) component = component.slice(component.length - 32);
      if (component.length < 32) component = Buffer.concat([Buffer.alloc(32 - component.length, 0), component]);
      return component;
    };

    const r = extractComponent();
    const s = extractComponent();
    return Buffer.concat([r, s]);
  } catch {
    return Buffer.alloc(64, 0);
  }
}

/**
 * Export raw 64-byte (X|Y) public key from a KeyObject.
 */
export function getRawPublicKey(publicKey: crypto.KeyObject): Buffer {
  try {
    const jwk = publicKey.export({ format: 'jwk' });
    const pad = (b64url: string) => {
      const buf = Buffer.from(b64url, 'base64url');
      return buf.length < 32 ? Buffer.concat([Buffer.alloc(32 - buf.length, 0), buf]) : buf.slice(-32);
    };
    if (!jwk.x || !jwk.y) throw new Error('no x/y in JWK');
    return Buffer.concat([pad(jwk.x), pad(jwk.y)]);
  } catch {
    return Buffer.alloc(64, 0);
  }
}

export function parseCertificate(binarySecurityToken: string): CertInfo {
  let cert: crypto.X509Certificate;

  if (binarySecurityToken.trimStart().startsWith('-----')) {
    cert = new crypto.X509Certificate(binarySecurityToken);
  } else {
    const decoded = Buffer.from(binarySecurityToken, 'base64');
    if (decoded.toString('utf8', 0, 5) === '-----') {
      cert = new crypto.X509Certificate(decoded.toString('utf8'));
    } else if (decoded[0] === 0x30) {
      cert = new crypto.X509Certificate(decoded);
    } else {
      cert = new crypto.X509Certificate(Buffer.from(decoded.toString('utf8'), 'base64'));
    }
  }

  const certDer = Buffer.from(cert.raw);
  // ZATCA: certDigest = base64(sha256(DER))
  const certDigest = crypto.createHash('sha256').update(certDer).digest('base64');
  const certBase64 = certDer.toString('base64');
  
  // Format issuer name for ZATCA: CN=..., DC=..., etc.
  const issuerName = cert.issuer.split('\n').filter(Boolean).join(', ');
  const serialDecimal = BigInt('0x' + cert.serialNumber).toString();
  const publicKeyDer = cert.publicKey.export({ type: 'spki', format: 'der' }) as Buffer;
  const publicKeyRaw = getRawPublicKey(cert.publicKey);
  const sig = 'signature' in cert ? (cert as { signature: Buffer }).signature : Buffer.alloc(0);
  const certSignatureRaw = getRawSignature(sig);

  return { certDigest, certBase64, issuerName, serialDecimal, publicKeyDer, publicKeyRaw, certSignatureRaw };
}

/**
 * Build the xades:SignedProperties XML fragment.
 */
function buildSignedProperties(
  certDigest: string,
  issuerName: string,
  serialDecimal: string,
  signingTime: string
): string {
  return `<xades:SignedProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Id="xadesSignedProperties"><xades:SignedSignatureProperties><xades:SigningTime>${signingTime}</xades:SigningTime><xades:SigningCertificate><xades:Cert><xades:CertDigest><ds:DigestMethod xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${certDigest}</ds:DigestValue></xades:CertDigest><xades:IssuerSerial><ds:X509IssuerName xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${issuerName}</ds:X509IssuerName><ds:X509SerialNumber xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${serialDecimal}</ds:X509SerialNumber></xades:IssuerSerial></xades:Cert></xades:SigningCertificate></xades:SignedSignatureProperties></xades:SignedProperties>`;
}

/**
 * Build the ds:SignedInfo XML fragment.
 */
function buildSignedInfo(invoiceHash: string, signedPropertiesHash: string): string {
  return `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/><ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"/><ds:Reference Id="invoiceSignedData" URI=""><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116"><ds:XPath>not(//ancestor-or-self::ext:UBLExtensions)</ds:XPath></ds:Transform><ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116"><ds:XPath>not(//ancestor-or-self::cac:Signature)</ds:XPath></ds:Transform><ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116"><ds:XPath>not(//ancestor-or-self::cac:AdditionalDocumentReference[cbc:ID='QR'])</ds:XPath></ds:Transform><ds:Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>${invoiceHash}</ds:DigestValue></ds:Reference><ds:Reference Type="http://www.w3.org/2000/09/xmldsig#SignatureProperties" URI="#xadesSignedProperties"><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>${signedPropertiesHash}</ds:DigestValue></ds:Reference></ds:SignedInfo>`;
}

export function signData(data: string | Buffer, privateKeyPem: string): Buffer {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  return sign.sign(privateKeyPem);
}

export function signInvoiceHash(hash: string, privateKeyPem: string): string {
  const sign = crypto.createSign('SHA256');
  sign.update(Buffer.from(hash, 'base64'));
  return sign.sign(privateKeyPem, 'base64');
}

export function embedSignatureInXML(
  xml: string,
  privateKey: string,
  certificate: string,
  invoiceHash: string
): SignedXMLResult {
  const { certDigest, certBase64, issuerName, serialDecimal } = parseCertificate(certificate);

  const signingTime = new Date().toISOString().replace(/\.\d{3}Z$/, '');
  const signedProperties = buildSignedProperties(certDigest, issuerName, serialDecimal, signingTime);

  // ZATCA: signedPropertiesHash = base64(sha256(signedProperties))
  const signedPropertiesHash = crypto.createHash('sha256').update(signedProperties, 'utf8').digest('base64');

  const signedInfo = buildSignedInfo(invoiceHash, signedPropertiesHash);

  // Canonicalize SignedInfo for signing
  const doc = new DOMParser().parseFromString(signedInfo, 'text/xml');
  const canonicalizedSignedInfo = new C14nCanonicalization().process(doc.documentElement as XmlElement, {});

  const derSignature = signData(canonicalizedSignedInfo, privateKey);
  const signatureValue = derSignature.toString('base64');
  const signatureValueRaw = getRawSignature(derSignature);

  const signatureBlock = `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="signature">${signedInfo.replace(' xmlns:ds="http://www.w3.org/2000/09/xmldsig#"', '')}<ds:SignatureValue>${signatureValue}</ds:SignatureValue><ds:KeyInfo><ds:X509Data><ds:X509Certificate>${certBase64}</ds:X509Certificate></ds:X509Data></ds:KeyInfo><ds:Object><xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Target="signature">${signedProperties}</xades:QualifyingProperties></ds:Object></ds:Signature>`;

  const signedXml = xml.replace(
    /<sac:SignatureInformation[\s\S]*?<\/sac:SignatureInformation>/,
    `<sac:SignatureInformation><cbc:ID>urn:oasis:names:specification:ubl:signature:1</cbc:ID><sbc:ReferencedSignatureID>urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID>${signatureBlock}</sac:SignatureInformation>`
  );

  return { signedXml, signatureValue, signatureValueRaw };
}

export function verifyInvoiceSignature(
  hash: string,
  signature: string,
  publicKeyPem: string
): boolean {
  try {
    const verify = crypto.createVerify('SHA256');
    verify.update(Buffer.from(hash, 'base64'));
    return verify.verify(publicKeyPem, signature, 'base64');
  } catch {
    return false;
  }
}
