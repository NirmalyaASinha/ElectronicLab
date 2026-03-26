import { account } from './appwrite';
import { ID } from 'appwrite';

/**
 * Step 1: Send OTP to email
 * Returns the userId needed for verification
 */
export async function sendOTP(email: string): Promise<string> {
  try {
    console.log('[Appwrite] Attempting to send OTP to:', email);
    const session = await account.createEmailToken(ID.unique(), email);
    console.log('[Appwrite] OTP sent successfully. UserId:', session.userId);
    return session.userId;
  } catch (_error) {
    const err = error as Record<string, unknown>;
    console.error('[Appwrite] Error sending OTP:', error);
    console.error('[Appwrite] Error details:', {
      message: err?.message,
      code: err?.code,
      type: err?.type,
      response: err?.response,
    });
    throw new Error((err?.message as string) || 'Failed to send OTP. Please check your email address.');
  }
}

/**
 * Step 2: Verify OTP entered by user
 * Creates an Appwrite session if OTP is valid
 */
export async function verifyOTP(userId: string, otp: string): Promise<boolean> {
  try {
    console.log('[Appwrite] Attempting to verify OTP. UserId:', userId, 'OTP Length:', otp.length, 'OTP Format:', /^\w+$/.test(otp) ? 'valid' : 'invalid');
    const session = await account.createSession(userId, otp);
    console.log('[Appwrite] OTP verified successfully. Session ID:', session.$id);
    return true;
  } catch (_error) {
    const err = error as Record<string, unknown>;
    console.error('[Appwrite] Error verifying OTP:', {
      message: err?.message,
      code: err?.code,
      status: err?.status,
      type: err?.type,
    });
    console.error('[Appwrite] Full error:', error);
    // Don't return false - throw the error so the API can see the details
    const errorMessage = (err?.message as string) || 'Invalid OTP code';
    throw new Error(errorMessage);
  }
}

/**
 * Step 3: Get current Appwrite session
 */
export async function getAppwriteSession() {
  try {
    return await account.get();
  } catch (_error) {
    return null;
  }
}

/**
 * Step 4: Logout from Appwrite
 */
export async function logoutAppwrite() {
  try {
    await account.deleteSession('current');
  } catch (_error) {
    // session may already be expired - that's ok
  }
}
