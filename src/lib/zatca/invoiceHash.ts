import crypto from 'crypto';
import { DOMParser } from '@xmldom/xmldom';
import type { Element as XmlElement, Node as XmlNode } from '@xmldom/xmldom';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { C14nCanonicalization } = require('xml-crypto') as { C14nCanonicalization: new () => { process(node: XmlElement, options?: object): string } };

/**
 * Compute ZATCA Phase 2 invoice hash per official spec.
 * 
 * To match ZATCA's C14N 1.1 requirement in Node.js:
 * 1. Parse XML
 * 2. Remove UBLExtensions, Signature, and QR AdditionalDocumentReference
 * 3. Remove xmlns:ext from root
 * 4. Use C14N 1.0 (approximates 1.1 for this schema)
 * 5. Ensure LF line endings and no XML declaration
 */
export function hashInvoiceXML(xml: string): string {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const root = doc.documentElement as XmlElement;

  removeElementsByTagName(root, 'ext:UBLExtensions');
  removeElementsByTagName(root, 'cac:Signature');
  removeQRDocumentReference(root);

  if (root.hasAttribute('xmlns:ext')) {
    root.removeAttribute('xmlns:ext');
  }

  // Canonicalize
  const canonicalizer = new C14nCanonicalization();
  let canonicalized = canonicalizer.process(root, {});
  
  // ZATCA specific: ensure LF and no leading/trailing whitespace
  canonicalized = canonicalized.replace(/\r\n/g, '\n').trim();
  
  return crypto.createHash('sha256').update(canonicalized, 'utf8').digest('base64');
}

function removeElementsByTagName(root: XmlElement, tagName: string): void {
  const elements = root.getElementsByTagName(tagName);
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i] as XmlNode;
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }
}

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
