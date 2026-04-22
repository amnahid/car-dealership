import crypto from 'crypto';
import { generateECKeyPair } from './cryptoSigning';

/**
 * ZATCA CSR generation for Phase 2 onboarding.
 *
 * Required OID extensions:
 *  - 2.16.840.1.114569.1.1.1  : environment (Production/Sandbox)
 *  - 2.16.840.1.114569.1.1.2  : serialNumber (1-uniqueAntiReplay)
 *  - 2.16.840.1.114569.1.1.3  : organizationIdentifier (TRN)
 *  - 2.16.840.1.114569.1.1.4  : invoiceType (1100 = standard + simplified)
 *  - 2.16.840.1.114569.1.1.5  : address
 *  - 2.16.840.1.114569.1.1.6  : businessCategory
 *
 * Node.js built-in crypto does NOT support custom OID extensions in CSR.
 * Use getOpensslCsrCommand() to generate a proper CSR via openssl CLI.
 */

export interface ZatcaCsrOptions {
  commonName: string;          // Company name in English
  organizationName: string;    // Company legal name
  organizationUnit: string;    // Branch name
  countryCode: string;         // 'SA'
  trn: string;                 // 15-digit TRN
  invoiceType: string;         // '1100' = supports both standard + simplified
  address: string;             // Business address
  businessCategory: string;    // e.g. 'Motor Vehicle Dealers'
  environment: 'sandbox' | 'production';
}

export interface ZatcaOnboardingResult {
  privateKey: string;       // PEM
  publicKey: string;        // PEM
  opensslCommand: string;   // Command to generate ZATCA-compliant CSR
}

/**
 * Generate EC key pair for ZATCA onboarding and return the openssl
 * command needed to create a compliant CSR.
 */
export function generateZatcaKeyPair(options: ZatcaCsrOptions): ZatcaOnboardingResult {
  const { privateKey, publicKey } = generateECKeyPair();
  const opensslCommand = getOpensslCsrCommand(options);
  return { privateKey, publicKey, opensslCommand };
}

/**
 * Get openssl command for generating ZATCA-compliant CSR with OID extensions.
 * Returns shell commands + config to run manually.
 */
export function getOpensslCsrCommand(options: ZatcaCsrOptions): string {
  const serialId = `1-${options.organizationUnit}|2-${crypto.randomUUID()}`;

  const config = `[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = v3_req
distinguished_name = dn

[dn]
CN = ${options.commonName}
OU = ${options.organizationUnit}
O = ${options.organizationName}
C = ${options.countryCode}

[v3_req]
2.16.840.1.114569.1.1.1 = ASN1:PRINTABLESTRING:${options.environment === 'production' ? 'Production' : 'Sandbox'}
2.16.840.1.114569.1.1.2 = ASN1:PRINTABLESTRING:${serialId}
2.16.840.1.114569.1.1.3 = ASN1:PRINTABLESTRING:${options.trn}
2.16.840.1.114569.1.1.4 = ASN1:PRINTABLESTRING:${options.invoiceType}
2.16.840.1.114569.1.1.5 = ASN1:PRINTABLESTRING:${options.address}
2.16.840.1.114569.1.1.6 = ASN1:PRINTABLESTRING:${options.businessCategory}`;

  return `# Step 1: Generate EC key (secp256k1):
openssl ecparam -name secp256k1 -genkey -noout -out ec-private.pem

# Step 2: Save this config to zatca.conf:
${config}

# Step 3: Generate CSR:
openssl req -new -key ec-private.pem -out csr.pem -config zatca.conf

# Step 4: Base64 encode CSR (submit this to ZATCA portal):
base64 -w 0 csr.pem > csr.b64`;
}
