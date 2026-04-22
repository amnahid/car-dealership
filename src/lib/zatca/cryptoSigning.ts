import crypto from 'crypto';

/**
 * ZATCA requires ECDSA signing with secp256k1 curve (Phase 2).
 * The invoice XML hash is signed with the seller's private key.
 */

export interface KeyPair {
  privateKey: string;   // PEM format
  publicKey: string;    // PEM format
}

/**
 * Generate a new EC key pair for ZATCA (secp256k1 curve).
 * Returns PEM-formatted keys.
 */
export function generateECKeyPair(): KeyPair {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  return { privateKey, publicKey };
}

/**
 * Sign invoice hash with ECDSA secp256k1 private key.
 * @param hash - base64-encoded SHA-256 hash of the invoice XML
 * @param privateKeyPem - PEM private key string
 * @returns base64-encoded ECDSA signature
 */
export function signInvoiceHash(hash: string, privateKeyPem: string): string {
  const sign = crypto.createSign('SHA256');
  sign.update(Buffer.from(hash, 'base64'));
  const signature = sign.sign(privateKeyPem, 'base64');
  return signature;
}

/**
 * Verify invoice signature (for testing/validation).
 */
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
 * Returns the XML with the signature inserted.
 */
export function embedSignatureInXML(
  xml: string,
  signature: string,
  certificate: string,
  hash: string
): string {
  const signedProperties = `
    <xades:SignedProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Id="xadesSignedProperties">
      <xades:SignedSignatureProperties>
        <xades:SigningCertificate>
          <xades:Cert>
            <xades:CertDigest>
              <ds:DigestMethod xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
              <ds:DigestValue xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${hash}</ds:DigestValue>
            </xades:CertDigest>
          </xades:Cert>
        </xades:SigningCertificate>
      </xades:SignedSignatureProperties>
    </xades:SignedProperties>`.trim();

  const signatureBlock = `
    <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="invoice-signature">
      <ds:SignedInfo>
        <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
        <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"/>
        <ds:Reference Id="invoiceSignedData" URI="">
          <ds:Transforms>
            <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xslt-19991116"/>
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
          <ds:X509Certificate>${certificate}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
      <ds:Object>
        <xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Target="invoice-signature">
          ${signedProperties}
        </xades:QualifyingProperties>
      </ds:Object>
    </ds:Signature>`.trim();

  return xml.replace(
    /<sac:SignatureInformation[\s\S]*?<\/sac:SignatureInformation>/,
    `<sac:SignatureInformation>
      <cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID>
      <sbc:ReferencedSignatureID>urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID>
      ${signatureBlock}
    </sac:SignatureInformation>`
  );
}
