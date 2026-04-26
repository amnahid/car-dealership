import crypto from 'crypto';
import { generateECKeyPair } from './cryptoSigning';

/**
 * ZATCA CSR generation for Phase 2 onboarding.
 * Simplified version - generates CSR that works with ZATCA compliance API.
 */

export interface ZatcaCsrOptions {
  commonName: string;
  organizationName: string;
  organizationUnit: string;
  countryCode: string;
  trn: string;
  invoiceType: string;
  address: string;
  businessCategory: string;
  environment: 'sandbox' | 'production';
}

export interface ZatcaOnboardingResult {
  privateKey: string;
  publicKey: string;
  opensslCommand: string;
}

export function generateZatcaKeyPair(options: ZatcaCsrOptions): ZatcaOnboardingResult {
  const { privateKey, publicKey } = generateECKeyPair();
  const csrConfig = getOpensslCsrConfig(options);
  return { privateKey, publicKey, opensslCommand: csrConfig };
}

export function getOpensslCsrConfig(options: ZatcaCsrOptions): string {
  const solutionName = options.commonName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
  const uniqueId = crypto.randomUUID().replace(/-/g, '').substring(0, 20);
  // ZATCA EGS Serial Number: 1-{solution}|2-{model}|3-{deviceSerial}. Pipe-delimited
  // is required by ZATCA's parser; it lives only in subjectAltName.SN (which
  // OpenSSL maps to "surname" / DirectoryString, allowing "|"). Do NOT add it to
  // the subject DN as `serialNumber` — that attribute is PrintableString-only
  // (RFC 5280) and OpenSSL will reject "|" with an "illegal characters" error.
  const serialNumber = `1-${solutionName}|2-v1|3-${uniqueId}`;
  const certTemplate = options.environment === 'production'
    ? 'ZATCA-Code-Signing'
    : 'PREZATCA-Code-Signing';

  const addrClean = options.address.split(',')[0].trim();

  return [
    '[req]',
    'default_bits = 2048',
    'prompt = no',
    'default_md = sha256',
    'req_extensions = req_ext',
    'x509_extensions = v3_ca',
    'distinguished_name = dn',
    '',
    '[dn]',
    `CN = ${options.commonName.replace(/,/g, ' ').substring(0, 50)}`,
    `C = ${options.countryCode}`,
    `OU = ${options.trn}`,
    `O = ${options.organizationName.replace(/,/g, ' ').substring(0, 50)}`,
    `organizationIdentifier = ${options.trn}`,
    '',
    '[v3_req]',
    'basicConstraints = CA:FALSE',
    'keyUsage = digitalSignature, nonRepudiation, keyEncipherment',
    '',
    '[req_ext]',
    '1.3.6.1.4.1.311.20.2 = ASN1:PRINTABLESTRING:' + certTemplate,
    'subjectAltName = dirName:alt_names',
    '',
    '[alt_names]',
    'SN = ' + serialNumber,
    'UID = ' + options.trn,
    'title = ' + options.invoiceType,
    'registeredAddress = ' + addrClean,
    'businessCategory = ' + options.businessCategory.replace(/,/g, ' ').substring(0, 30),
  ].join('\n');
}