let flashQuotaExceeded = false;
let lastFlashQuotaErrorAt: string | null = null;

const QUOTA_PATTERNS = [
  /429/,
  /resource_exhausted/i,
  /quota/i,
  /rate\s*limit/i,
];

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? '');
}

export function isFlashQuotaError(model: string, error: unknown): boolean {
  const normalizedModel = (model || '').toLowerCase();
  if (!normalizedModel.includes('flash')) {
    return false;
  }

  const message = extractErrorMessage(error);
  return QUOTA_PATTERNS.some((pattern) => pattern.test(message));
}

export function registerFlashQuotaError(model: string, error: unknown): boolean {
  if (!isFlashQuotaError(model, error)) {
    return false;
  }

  flashQuotaExceeded = true;
  lastFlashQuotaErrorAt = new Date().toISOString();
  return true;
}

export function getAiQuotaState() {
  return {
    aiFunctionsMayBeUnavailable: flashQuotaExceeded,
    reason: flashQuotaExceeded ? 'FLASH_QUOTA_EXCEEDED' : null,
    lastFlashQuotaErrorAt,
  };
}
