import crypto from 'crypto';

export interface KeyPair {
  privateKey: string;   // PEM format
  publicKey: string;    // PEM format
}

export interface CertInfo {
  certDigest: string;     // base64 SHA256 of DER certificate bytes
  issuerName: string;     // comma-separated DN string
  serialDecimal: string;  // decimal representation of serial number
  publicKeyDer: Buffer;   // DER-encoded SubjectPublicKeyInfo
  certBase64: string;     // clean base64(DER) for use in ds:X509Certificate
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
 * Parse a certificate (binarySecurityToken) and extract fields needed for
 * XAdES IssuerSerial and CertDigest.
 *
 * Handles all storage formats observed in practice:
 *   (a) base64(DER)         — first decoded byte is 0x30 (DER SEQUENCE)
 *   (b) base64(base64(DER)) — ZATCA sandbox sometimes double-encodes
 *   (c) base64(PEM)         — decoded bytes start with "-----"
 *   (d) PEM string          — value starts with "-----BEGIN CERTIFICATE-----"
 */
export function parseCertificate(binarySecurityToken: string): CertInfo {
  let cert: crypto.X509Certificate;

  if (binarySecurityToken.trimStart().startsWith('-----')) {
    // (d) PEM string
    cert = new crypto.X509Certificate(binarySecurityToken);
  } else {
    const decoded = Buffer.from(binarySecurityToken, 'base64');
    if (decoded.toString('utf8', 0, 5) === '-----') {
      // (c) base64-encoded PEM
      cert = new crypto.X509Certificate(decoded.toString('utf8'));
    } else if (decoded[0] === 0x30) {
      // (a) base64-encoded DER — DER sequences always start with 0x30
      cert = new crypto.X509Certificate(decoded);
    } else {
      // (b) base64(base64(DER)) — ZATCA sandbox double-encoding
      // decoded is the inner base64 string, decode it again to get DER
      const innerBase64 = decoded.toString('utf8');
      const certDerInner = Buffer.from(innerBase64, 'base64');
      cert = new crypto.X509Certificate(certDerInner);
    }
  }

  // cert.raw always returns DER bytes regardless of input format
  const certDer = Buffer.from(cert.raw);
  const certDigest = crypto.createHash('sha256').update(certDer).digest('base64');
  const certBase64 = certDer.toString('base64');

  // cert.issuer returns "KEY=value\nKEY=value\n..." — join to comma-separated
  const issuerName = cert.issuer.split('\n').filter(Boolean).join(', ');

  // cert.serialNumber is a hex string — convert to decimal for ds:X509SerialNumber
  const serialDecimal = BigInt('0x' + cert.serialNumber).toString();

  const publicKeyDer = cert.publicKey.export({ type: 'spki', format: 'der' }) as Buffer;

  return { certDigest, certBase64, issuerName, serialDecimal, publicKeyDer };
}

/**
 * Sign invoice hash with ECDSA secp256k1 private key.
 * @param hash - base64-encoded SHA-256 hash of the invoice XML
 * @param privateKeyPem - PEM private key string
 * @returns base64-encoded ECDSA signature (DER)
 */
export function signInvoiceHash(hash: string, privateKeyPem: string): string {
  const sign = crypto.createSign('SHA256');
  sign.update(Buffer.from(hash, 'base64'));
  return sign.sign(privateKeyPem, 'base64');
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

/**
 * Embed ECDSA signature into the UBL XML UBLExtensions block.
 *
 * Fixes applied per ZATCA Phase 2 spec:
 *  - ds:Signature Id = urn:oasis:names:specification:ubl:signature:Invoice
 *  - sac:SignatureInformation cbc:ID = urn:oasis:names:specification:ubl:signature:1  (BR-KSA-28)
 *  - xades:CertDigest = SHA256 of the DER certificate  (was wrongly set to invoice hash)
 *  - xades:IssuerSerial added (required by XSD)
 */
export function embedSignatureInXML(
  xml: string,
  signature: string,
  certificate: string,
  hash: string
): string {
  const { certDigest, certBase64, issuerName, serialDecimal } = parseCertificate(certificate);

  const signedProperties = `<xades:SignedProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Id="xadesSignedProperties">
      <xades:SignedSignatureProperties>
        <xades:SigningCertificate>
          <xades:Cert>
            <xades:CertDigest>
              <ds:DigestMethod xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
              <ds:DigestValue xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${certDigest}</ds:DigestValue>
            </xades:CertDigest>
            <xades:IssuerSerial>
              <ds:X509IssuerName xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${issuerName}</ds:X509IssuerName>
              <ds:X509SerialNumber xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${serialDecimal}</ds:X509SerialNumber>
            </xades:IssuerSerial>
          </xades:Cert>
        </xades:SigningCertificate>
      </xades:SignedSignatureProperties>
    </xades:SignedProperties>`;

  const signatureBlock = `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="invoiceSignature">
      <ds:SignedInfo>
        <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
        <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"/>
        <ds:Reference Id="invoiceSignedData" URI="">
          <ds:Transforms>
            <ds:Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
          </ds:Transforms>
          <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
          <ds:DigestValue>${hash}</ds:DigestValue>
        </ds:Reference>
        <ds:Reference URI="#xadesSignedProperties" Type="http://uri.etsi.org/01903/v1.3.2#SignedProperties">
          <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
          <ds:DigestValue>${hash}</ds:DigestValue>
        </ds:Reference>
      </ds:SignedInfo>
      <ds:SignatureValue>${signature}</ds:SignatureValue>
      <ds:KeyInfo>
        <ds:X509Data>
          <ds:X509Certificate>${certBase64}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
      <ds:Object>
        <xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Target="#invoiceSignature">
          ${signedProperties}
        </xades:QualifyingProperties>
      </ds:Object>
    </ds:Signature>`;

  return xml.replace(
    /<sac:SignatureInformation[\s\S]*?<\/sac:SignatureInformation>/,
    `<sac:SignatureInformation>
      <cbc:ID>urn:oasis:names:specification:ubl:signature:1</cbc:ID>
      <sbc:ReferencedSignatureID>invoiceSignature</sbc:ReferencedSignatureID>
      ${signatureBlock}
    </sac:SignatureInformation>`
  );
}
