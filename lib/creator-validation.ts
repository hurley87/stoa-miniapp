/**
 * Creator validation utilities
 * Ensures creators have required fields before database operations
 */

export interface CreatorData {
  wallet: string;
  username: string;
  pfp: string;
  fid?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates creator data before database insertion
 */
export function validateCreatorData(
  data: Partial<CreatorData>
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate wallet
  if (!data.wallet || typeof data.wallet !== 'string') {
    errors.push({ field: 'wallet', message: 'Wallet address is required' });
  } else if (!isValidEthereumAddress(data.wallet)) {
    errors.push({
      field: 'wallet',
      message: 'Invalid Ethereum wallet address format',
    });
  }

  // Validate username
  if (!data.username || typeof data.username !== 'string') {
    errors.push({ field: 'username', message: 'Username is required' });
  } else if (data.username.trim().length === 0) {
    errors.push({ field: 'username', message: 'Username cannot be empty' });
  } else if (data.username.trim().length > 50) {
    errors.push({
      field: 'username',
      message: 'Username must be 50 characters or less',
    });
  }

  // Validate pfp (profile picture URL)
  if (!data.pfp || typeof data.pfp !== 'string') {
    errors.push({ field: 'pfp', message: 'Profile picture URL is required' });
  } else if (data.pfp.trim().length === 0) {
    errors.push({
      field: 'pfp',
      message: 'Profile picture URL cannot be empty',
    });
  } else if (!isValidUrl(data.pfp)) {
    errors.push({
      field: 'pfp',
      message: 'Profile picture must be a valid URL',
    });
  }

  return errors;
}

/**
 * Validates Ethereum address format
 */
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validates URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Normalizes creator data (lowercase wallet, trim strings)
 */
export function normalizeCreatorData(data: CreatorData): CreatorData {
  return {
    ...data,
    wallet: data.wallet.toLowerCase(),
    username: data.username.trim(),
    pfp: data.pfp.trim(),
  };
}

/**
 * Validates and normalizes creator data
 * Throws an error if validation fails
 */
export function validateAndNormalizeCreator(
  data: Partial<CreatorData>
): CreatorData {
  const errors = validateCreatorData(data);

  if (errors.length > 0) {
    const errorMessages = errors
      .map((e) => `${e.field}: ${e.message}`)
      .join(', ');
    throw new Error(`Creator validation failed: ${errorMessages}`);
  }

  return normalizeCreatorData(data as CreatorData);
}

/**
 * Type guard to check if creator data is complete
 */
export function isCompleteCreatorData(
  data: Partial<CreatorData>
): data is CreatorData {
  return !!(
    data.wallet &&
    data.username &&
    data.pfp &&
    typeof data.wallet === 'string' &&
    typeof data.username === 'string' &&
    typeof data.pfp === 'string'
  );
}
