import { ZatcaApiCredentials, ZATCA_SANDBOX_BASE_URL, ZATCA_PRODUCTION_BASE_URL } from './types';

function getBaseUrl(environment: string): string {
  return environment === 'production' ? ZATCA_PRODUCTION_BASE_URL : ZATCA_SANDBOX_BASE_URL;
}

function basicAuth(csid: string, secret: string): string {
  return `Basic ${Buffer.from(`${csid}:${secret}`).toString('base64')}`;
}

/**
 * Request Compliance CSID from ZATCA sandbox.
 */
export async function requestComplianceCsid(
  csr: string,
  environment: string = 'sandbox',
  otp: string
): Promise<{ csid: string; secret: string; requestId: number; binarySecurityToken: string; dispositionMessage?: string }> {
  if (!otp) {
    throw new Error('OTP is required for ZATCA compliance CSID request.');
  }
  const url = `${getBaseUrl(environment)}/compliance`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept-Version': 'V2',
      'Accept': 'application/json',
      'Accept-Language': 'en',
      'Content-Type': 'application/json',
      'OTP': otp,
    },
    body: JSON.stringify({ csr }),
  });

  const data = (await parseZatcaResponse(response)) as {
    binarySecurityToken: string;
    secret: string;
    requestID: number;
    dispositionMessage?: string;
  };

  return {
    csid: data.binarySecurityToken,
    secret: data.secret,
    requestId: data.requestID,
    binarySecurityToken: data.binarySecurityToken,
    dispositionMessage: data.dispositionMessage,
  };
}

async function parseZatcaResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  let data: { errors?: Array<{ code: string; message: string }> } & Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    if (!response.ok) {
      throw new Error(`ZATCA API error (${response.status}): ${text || response.statusText}`);
    }
    return text;
  }

  if (!response.ok) {
    // Handle array of errors if present (ZATCA standard for 400 Bad Request)
    if (data.errors && Array.isArray(data.errors)) {
      const messages = data.errors.map((e) => `${e.code}: ${e.message}`).join(', ');
      throw new Error(`ZATCA API error (${response.status}): ${messages}`);
    }
    throw new Error(`ZATCA API error (${response.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

/**
 * Run ZATCA compliance check with a test invoice (Phase 2 onboarding).
 */
export async function checkInvoiceCompliance(
  xml: string,
  xmlHash: string,
  uuid: string,
  credentials: ZatcaApiCredentials
): Promise<unknown> {
  const url = `${getBaseUrl(credentials.environment)}/compliance/invoices`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept-Version': 'V2',
      'Accept': 'application/json',
      'Accept-Language': 'en',
      'Authorization': basicAuth(credentials.csid, credentials.csidSecret),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uuid,
      invoiceHash: xmlHash,
      invoice: Buffer.from(xml).toString('base64'),
    }),
  });

  return parseZatcaResponse(response);
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
      'Accept': 'application/json',
      'Accept-Language': 'en',
      'Authorization': basicAuth(complianceCsid, complianceCsidSecret),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ compliance_request_id: complianceRequestId }),
  });

  const data = (await parseZatcaResponse(response)) as {
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
      'Accept': 'application/json',
      'Accept-Language': 'en',
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

  const data = (await parseZatcaResponse(response)) as {
    clearedInvoice?: string;
    validationResults: object;
  };
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
      'Accept': 'application/json',
      'Accept-Language': 'en',
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

  const data = (await parseZatcaResponse(response)) as {
    validationResults: object;
    reportingStatus: string;
  };
  return data;
}
