import crypto from 'crypto';

// Module-level OTP store for verification
const otpStore: {
  [email: string]: {
    code: string;
    sessionId: string;
    expiresAt: number;
  };
} = {};

/**
 * Generate a random OTP code (6 digits)
 */
export function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via Appwrite
 * Generates OTP locally and stores it for verification
 * In production, email sending would be integrated with Appwrite Messaging API
 */
export async function sendOTPViaAppwrite(email: string): Promise<{
  success: boolean;
  userId?: string;
  sessionId?: string;
  otp?: string;
  error?: string;
}> {
  try {
    // Generate OTP code
    const otpCode = generateOTPCode();
    
    // Create a session ID for tracking
    const sessionId = crypto.randomBytes(16).toString('hex');
    const userId = crypto.randomBytes(16).toString('hex');

    // Log OTP for development environment
    console.log(`[Appwrite OTP Service] Email: ${email}`);
    console.log(`[Appwrite OTP Service] Code: ${otpCode}`);
    console.log(`[Appwrite OTP Service] Session ID: ${sessionId}`);
    console.log(`[Appwrite OTP Service] Endpoint: ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}`);
    console.log(`[Appwrite OTP Service] Project ID: ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`);

    // Store OTP in memory with expiry for verification
    otpStore[email] = {
      code: otpCode,
      sessionId,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };

    return {
      success: true,
      userId,
      sessionId,
      // For development only - remove in production
      otp: process.env.NODE_ENV === 'development' ? otpCode : undefined,
    };
  } catch (error: any) {
    console.error('Error sending OTP via Appwrite:', error);
    return {
      success: false,
      error: error.message || 'Failed to send OTP',
    };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTPCode(email: string, otpCode: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const storedOtp = otpStore[email];

    if (!storedOtp) {
      return {
        success: false,
        error: 'OTP not found or already expired',
      };
    }

    // Check if OTP has expired
    if (storedOtp.expiresAt < Date.now()) {
      delete otpStore[email];
      return {
        success: false,
        error: 'OTP has expired',
      };
    }

    // Verify code
    if (storedOtp.code !== otpCode) {
      // In development, accept any 6-digit code as fallback
      if (process.env.NODE_ENV !== 'development' || !/^\d{6}$/.test(otpCode)) {
        return {
          success: false,
          error: 'Invalid OTP code',
        };
      }
    }

    // Mark OTP as used by deleting it
    delete otpStore[email];

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify OTP',
    };
  }
}

/**
 * Delete a user from Appwrite
 */
export async function deleteAppwriteUser(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // For now, this is a placeholder
    // In production, integrate with Appwrite User Management
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting Appwrite user:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete user',
    };
  }
}
