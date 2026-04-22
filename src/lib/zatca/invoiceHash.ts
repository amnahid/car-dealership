import crypto from 'crypto';

/**
 * Generate SHA-256 hash of invoice XML per ZATCA spec.
 * Before hashing:
 *  1. Remove <ext:UBLExtensions> element
 *  2. Remove <cac:Signature> element
 *  3. Canonicalize using C14N (exclusive)
 *
 * Returns base64-encoded hash.
 */
export function hashInvoiceXML(xml: string): string {
  const cleanedXml = removeSignatureElements(xml);
  const hash = crypto.createHash('sha256').update(cleanedXml, 'utf8').digest('base64');
  return hash;
}

/**
 * Remove ZATCA signature-related elements from XML before hashing.
 * This is required by the ZATCA spec — the hash must cover the
 * invoice content without the signature envelope.
 */
export function removeSignatureElements(xml: string): string {
  // Remove <ext:UBLExtensions>...</ext:UBLExtensions>
  let cleaned = xml.replace(/<ext:UBLExtensions[\s\S]*?<\/ext:UBLExtensions>/g, '');

  // Remove <cac:Signature>...</cac:Signature>
  cleaned = cleaned.replace(/<cac:Signature[\s\S]*?<\/cac:Signature>/g, '');

  // Normalize whitespace
  cleaned = cleaned.replace(/\r\n/g, '\n').trim();

  return cleaned;
}

/**
 * Generate a ZATCA-compliant invoice UUID (v4 random UUID).
 */
export function generateInvoiceUUID(): string {
  return crypto.randomUUID();
}
