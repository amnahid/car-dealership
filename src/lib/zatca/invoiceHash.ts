import crypto from 'crypto';
import { DOMParser } from '@xmldom/xmldom';
import type { Element as XmlElement, Node as XmlNode } from '@xmldom/xmldom';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { C14nCanonicalization } = require('xml-crypto') as { C14nCanonicalization: new () => { process(node: XmlElement, options?: object): string } };

/**
 * Compute ZATCA Phase 2 invoice hash per official spec (section 5.2):
 *  1. Remove <ext:UBLExtensions> element
 *  2. Remove entire QR <cac:AdditionalDocumentReference> element
 *  3. Remove <cac:Signature> element
 *  4. Remove XML declaration (implicit in C14N)
 *  5. Canonicalize with C14N11 (approximated via C14N 1.0 — identical for this XML)
 *  6. SHA-256 → base64
 */
export function hashInvoiceXML(xml: string): string {
  const canonicalized = canonicalizeForHash(xml);
  return crypto.createHash('sha256').update(canonicalized, 'utf8').digest('base64');
}

/** Returns the raw canonical string used for hashing (for debugging). */
export function getCanonicalForm(xml: string): string {
  return canonicalizeForHash(xml);
}

/**
 * String-based hash — spec approach: no declaration, no xmlns:ext, empty QR only.
 */
export function hashInvoiceXMLString(xml: string): string {
  return crypto.createHash('sha256').update(stripForHash(xml), 'utf8').digest('base64');
}

/**
 * Variant hash: keep XML declaration + xmlns:ext, clear ALL EmbeddedDocumentBinaryObject.
 * Matches common working ZATCA library implementations (zatca-phase2-api etc.).
 */
export function hashInvoiceXMLVariant(xml: string): string {
  return crypto.createHash('sha256').update(stripForHashVariant(xml), 'utf8').digest('base64');
}

/**
 * Strip invoice XML for hashing per ZATCA spec:
 * - Remove XML declaration
 * - Remove ext:UBLExtensions + xmlns:ext
 * - Remove entire QR AdditionalDocumentReference element
 * - Remove cac:Signature
 */
export function stripForHash(xml: string): string {
  return xml
    .replace(/^\s*<\?xml[^?]*\?>\s*/, '')
    .replace(/<ext:UBLExtensions>[\s\S]*?<\/ext:UBLExtensions>/, '')
    .replace(/\s+xmlns:ext="[^"]*"/, '')
    .replace(/<cac:AdditionalDocumentReference>[^<]*<cbc:ID>\s*QR\s*<\/cbc:ID>[\s\S]*?<\/cac:AdditionalDocumentReference>/, '')
    .replace(/<cac:Signature>[\s\S]*?<\/cac:Signature>/, '');
}

/** Variant: keep XML declaration, keep xmlns:ext, remove entire QR AdditionalDocumentReference. */
export function stripForHashVariant(xml: string): string {
  return xml
    .replace(/<ext:UBLExtensions>[\s\S]*?<\/ext:UBLExtensions>/, '')
    .replace(/<cac:AdditionalDocumentReference>[^<]*<cbc:ID>\s*QR\s*<\/cbc:ID>[\s\S]*?<\/cac:AdditionalDocumentReference>/, '')
    .replace(/<cac:Signature>[\s\S]*?<\/cac:Signature>/, '');
}

/** Remove UBLExtensions and Signature elements (preserves everything else including XML declaration). */
export function removeSignatureElements(xml: string): string {
  return xml
    .replace(/<ext:UBLExtensions>[\s\S]*?<\/ext:UBLExtensions>/, '')
    .replace(/<cac:Signature>[\s\S]*?<\/cac:Signature>/, '');
}

function canonicalizeForHash(xml: string): string {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const root = doc.documentElement as XmlElement;

  removeElementsByTagName(root, 'ext:UBLExtensions');
  // xmlns:ext is unused after removal — strip so canonical form matches ZATCA's C14N11
  root.removeAttribute('xmlns:ext');
  // Per ZATCA spec: remove entire QR AdditionalDocumentReference (not just clear value)
  removeQRDocumentReference(root);
  removeElementsByTagName(root, 'cac:Signature');

  return new C14nCanonicalization().process(root, {});
}

function removeElementsByTagName(root: XmlElement, tagName: string): void {
  const els = root.getElementsByTagName(tagName);
  for (let i = els.length - 1; i >= 0; i--) {
    const el = els[i] as XmlNode;
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }
}

// Per ZATCA spec XPath: //*[local-name()='AdditionalDocumentReference'][cbc:ID[normalize-space(text())='QR']]
// The entire AdditionalDocumentReference for QR is removed, not just its value.
function removeQRDocumentReference(root: XmlElement): void {
  const refs = root.getElementsByTagName('cac:AdditionalDocumentReference');
  for (let i = refs.length - 1; i >= 0; i--) {
    const ref = refs[i] as XmlElement;
    const ids = ref.getElementsByTagName('cbc:ID');
    if (ids.length > 0 && (ids[0].textContent || '').trim() === 'QR') {
      if (ref.parentNode) {
        ref.parentNode.removeChild(ref as XmlNode);
      }
    }
  }
}

/**
 * Generate a ZATCA-compliant invoice UUID (v4 random UUID).
 */
export function generateInvoiceUUID(): string {
  return crypto.randomUUID();
}
