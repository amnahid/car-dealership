import QRCode from 'qrcode';

/**
 * TLV (Tag-Length-Value) encoding per ZATCA e-invoicing spec.
 * Each field is encoded as: [tag_byte][length_byte(s)][value_bytes]
 */

function encodeTLVBytes(tag: number, valueBuffer: Buffer): Buffer {
  const length = valueBuffer.length;
  if (length <= 127) {
    return Buffer.concat([Buffer.from([tag, length]), valueBuffer]);
  }
  const lengthBytes: number[] = [];
  let len = length;
  while (len > 0) {
    lengthBytes.unshift(len & 0xff);
    len >>= 8;
  }
  return Buffer.concat([
    Buffer.from([tag, 0x80 | lengthBytes.length, ...lengthBytes]),
    valueBuffer,
  ]);
}

function encodeTLV(tag: number, value: string): Buffer {
  return encodeTLVBytes(tag, Buffer.from(value, 'utf8'));
}

export interface ZatcaQRData {
  sellerName: string;
  sellerTrn: string;
  issueTimestamp: string;   // ISO 8601 format
  totalWithVat: string;     // String representation of number
  vatTotal: string;
  xmlHash?: string;         // Phase 2 only (base64)
  ecdsa?: string;           // Phase 2 only (base64 signature)
  publicKey?: string;       // Phase 2 only (base64)
}

/**
 * Build ZATCA-compliant TLV buffer.
 * Phase 1: tags 1-5
 * Phase 2: tags 1-8
 */
export function buildTLVBuffer(data: ZatcaQRData): Buffer {
  const parts: Buffer[] = [
    encodeTLV(1, data.sellerName),
    encodeTLV(2, data.sellerTrn),
    encodeTLV(3, data.issueTimestamp),
    encodeTLV(4, data.totalWithVat),
    encodeTLV(5, data.vatTotal),
  ];

  if (data.xmlHash) {
    parts.push(encodeTLV(6, data.xmlHash));
  }
  if (data.ecdsa) {
    parts.push(encodeTLV(7, data.ecdsa));
  }
  if (data.publicKey) {
    parts.push(encodeTLV(8, data.publicKey));
  }

  return Buffer.concat(parts);
}

/**
 * Generate base64 QR code image from ZATCA TLV data.
 * Returns a data URL string (data:image/png;base64,...)
 */
export async function generateZatcaQRCode(data: ZatcaQRData): Promise<string> {
  const base64TLV = buildTLVBase64(data);
  return generateZatcaQRCodeFromTLV(base64TLV);
}

/**
 * Generate QR code image from a pre-built base64 TLV string.
 */
export async function generateZatcaQRCodeFromTLV(tlvBase64: string): Promise<string> {
  return QRCode.toDataURL(tlvBase64, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 200,
    margin: 1,
  });
}

/**
 * Encode TLV buffer to base64 string (for embedding in XML).
 */
export function buildTLVBase64(data: ZatcaQRData): string {
  return buildTLVBuffer(data).toString('base64');
}

export interface ZatcaQRDataPhase2 extends ZatcaQRData {
  xmlHashBytes: Buffer;   // raw 32-byte SHA256 digest
  ecdsaSigBytes: Buffer;  // raw DER ECDSA signature bytes
  publicKeyBytes: Buffer; // raw DER SubjectPublicKeyInfo bytes
}

/**
 * Build Phase 2 TLV with tags 1–8.
 * Tags 6–8 are raw binary (not UTF-8) per ZATCA Phase 2 QR spec.
 */
export function buildTLVBase64Phase2(data: ZatcaQRDataPhase2): string {
  const parts: Buffer[] = [
    encodeTLV(1, data.sellerName),
    encodeTLV(2, data.sellerTrn),
    encodeTLV(3, data.issueTimestamp),
    encodeTLV(4, data.totalWithVat),
    encodeTLV(5, data.vatTotal),
    encodeTLVBytes(6, data.xmlHashBytes),
    encodeTLVBytes(7, data.ecdsaSigBytes),
    encodeTLVBytes(8, data.publicKeyBytes),
  ];
  return Buffer.concat(parts).toString('base64');
}
