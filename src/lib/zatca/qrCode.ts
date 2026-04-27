import QRCode from 'qrcode';

/**
 * TLV (Tag-Length-Value) encoding per ZATCA e-invoicing spec.
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
  issueTimestamp: string;
  totalWithVat: string;
  vatTotal: string;
  xmlHash?: string;   // For Phase 2 (string input version)
  ecdsa?: string;     // For Phase 2 (string input version)
  publicKey?: string; // For Phase 2 (string input version)
}

/**
 * Build ZATCA-compliant TLV buffer.
 * Maintained for backward compatibility and internal use.
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
 */
export async function generateZatcaQRCode(data: ZatcaQRData): Promise<string> {
  const base64TLV = buildTLVBase64(data);
  return generateZatcaQRCodeFromTLV(base64TLV);
}

/**
 * Build base64 QR code image from TLV string.
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
 * Encode TLV buffer to base64 string.
 */
export function buildTLVBase64(data: ZatcaQRData): string {
  return buildTLVBuffer(data).toString('base64');
}

export interface ZatcaQRDataPhase2 extends ZatcaQRData {
  xmlHashBytes: Buffer;       // Tag 6: raw 32-byte digest
  ecdsaSigBytes: Buffer;      // Tag 7: raw 64-byte signature (R|S)
  publicKeyBytes: Buffer;     // Tag 8: raw 64-byte public key (X|Y)
  certSignatureBytes: Buffer; // Tag 9: raw 64-byte cert signature (R|S)
}

/**
 * Build Phase 2 TLV with tags 1–9.
 * Tags 6–9 are raw binary per ZATCA Phase 2 QR spec.
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
    encodeTLVBytes(9, data.certSignatureBytes),
  ];
  return Buffer.concat(parts).toString('base64');
}
