import { ZatcaApiCredentials, ZATCA_SANDBOX_BASE_URL, ZATCA_PRODUCTION_BASE_URL } from './types';

function getBaseUrl(environment: string): string {
  return environment === 'production' ? ZATCA_PRODUCTION_BASE_URL : ZATCA_SANDBOX_BASE_URL;
}

function basicAuth(csid: string, secret: string): string {
  return `Basic ${Buffer.from(`${csid}:${secret}`).toString('base64')}`;
}

/**
 * Request Compliance CSID from ZATCA sandbox.
 * Used during onboarding to get an initial certificate.
 */
export async function requestComplianceCsid(
  csr: string,
  environment: string = 'sandbox'
): Promise<{ csid: string; secret: string; requestId: string; binarySecurityToken: string }> {
  const url = `${getBaseUrl(environment)}/compliance`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept-Version': 'V2',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ csr }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ZATCA compliance CSID request failed: ${response.status} ${error}`);
  }

  const data = await response.json() as {
    requestID: string;
    binarySecurityToken: string;
    secret: string;
    tokenType: string;
  };

  return {
    csid: data.binarySecurityToken,
    secret: data.secret,
    requestId: data.requestID,
    binarySecurityToken: data.binarySecurityToken,
  };
}

/**
 * Run ZATCA compliance check with a test invoice (Phase 2 onboarding).
 */
export async function checkInvoiceCompliance(
  xml: string,
  xmlHash: string,
  uuid: string,
  credentials: ZatcaApiCredentials
): Promise<{ validationResults: object; reportingStatus: string }> {
  const url = `${getBaseUrl(credentials.environment)}/compliance/invoices`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept-Version': 'V2',
      'Authorization': basicAuth(credentials.csid, credentials.csidSecret),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uuid,
      invoiceHash: xmlHash,
      invoice: Buffer.from(xml).toString('base64'),
    }),
  });

  const data = await response.json() as { validationResults: object; reportingStatus: string };
  if (!response.ok) {
    throw new Error(`ZATCA compliance check failed: ${response.status} ${JSON.stringify(data)}`);
  }
  return data;
}

/**
 * Request Production CSID after passing compliance check.
 */
export async function requestProductionCsid(
  complianceCsid: string,
  complianceCsidSecret: string,
  complianceRequestId: string,
  environment: string = 'production'
): Promise<{ csid: string; secret: string; binarySecurityToken: string }> {
  const url = `${getBaseUrl(environment)}/production/csids`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept-Version': 'V2',
      'Authorization': basicAuth(complianceCsid, complianceCsidSecret),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ compliance_request_id: complianceRequestId }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ZATCA production CSID request failed: ${response.status} ${error}`);
  }

  const data = await response.json() as {
    requestID: string;
    binarySecurityToken: string;
    secret: string;
  };

  return {
    csid: data.binarySecurityToken,
    secret: data.secret,
    binarySecurityToken: data.binarySecurityToken,
  };
}

/**
 * Clear a Standard (B2B) invoice via ZATCA Clearance API.
 * Returns the cleared XML from ZATCA.
 */
export async function clearInvoice(
  xml: string,
  xmlHash: string,
  uuid: string,
  credentials: ZatcaApiCredentials
): Promise<{ clearedInvoice: string; validationResults: object }> {
  const url = `${getBaseUrl(credentials.environment)}/invoices/clearance/single`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept-Version': 'V2',
      'Authorization': basicAuth(credentials.csid, credentials.csidSecret),
      'Clearance-Status': '1',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uuid,
      invoiceHash: xmlHash,
      invoice: Buffer.from(xml).toString('base64'),
    }),
  });

  const data = await response.json() as {
    clearedInvoice: string;
    validationResults: object;
    reportingStatus: string;
    clearanceStatus: string;
  };

  if (!response.ok) {
    throw new Error(`ZATCA clearance failed: ${response.status} ${JSON.stringify(data)}`);
  }

  return {
    clearedInvoice: data.clearedInvoice
      ? Buffer.from(data.clearedInvoice, 'base64').toString('utf8')
      : xml,
    validationResults: data.validationResults,
  };
}

/**
 * Report a Simplified (B2C) invoice via ZATCA Reporting API.
 */
export async function reportInvoice(
  xml: string,
  xmlHash: string,
  uuid: string,
  credentials: ZatcaApiCredentials
): Promise<{ validationResults: object; reportingStatus: string }> {
  const url = `${getBaseUrl(credentials.environment)}/invoices/reporting/single`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept-Version': 'V2',
      'Authorization': basicAuth(credentials.csid, credentials.csidSecret),
      'Clearance-Status': '0',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uuid,
      invoiceHash: xmlHash,
      invoice: Buffer.from(xml).toString('base64'),
    }),
  });

  const data = await response.json() as { validationResults: object; reportingStatus: string };
  if (!response.ok) {
    throw new Error(`ZATCA reporting failed: ${response.status} ${JSON.stringify(data)}`);
  }
  return data;
}
