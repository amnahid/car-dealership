import QRCode from 'qrcode';

/**
 * TLV (Tag-Length-Value) encoding per ZATCA e-invoicing spec.
 * Each field is encoded as: [tag_byte][length_byte(s)][value_bytes]
 */

function encodeTLV(tag: number, value: string): Buffer {
  const valueBuffer = Buffer.from(value, 'utf8');
  const length = valueBuffer.length;

  if (length <= 127) {
    return Buffer.concat([
      Buffer.from([tag, length]),
      valueBuffer,
    ]);
  }

  // Multi-byte length encoding
  const lengthBytes = [];
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
  const tlvBuffer = buildTLVBuffer(data);
  const base64TLV = tlvBuffer.toString('base64');

  const qrDataUrl = await QRCode.toDataURL(base64TLV, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 200,
    margin: 1,
  });

  return qrDataUrl;
}

/**
 * Encode TLV buffer to base64 string (for embedding in XML).
 */
export function buildTLVBase64(data: ZatcaQRData): string {
  return buildTLVBuffer(data).toString('base64');
}
