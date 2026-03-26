import { account } from './appwrite';
import { ID } from 'appwrite';

/**
 * Step 1: Send OTP to email
 * Returns the userId needed for verification
 */
export async function sendOTP(email: string): Promise<string> {
  try {
    const session = await account.createEmailToken(ID.unique(), email);
    return session.userId;
  } catch (error: any) {
    console.error('[Appwrite] Error sending OTP:', error);
    throw new Error(error?.message || 'Failed to send OTP');
  }
}

/**
 * Step 2: Verify OTP entered by user
 * Creates an Appwrite session if OTP is valid
 */
export async function verifyOTP(userId: string, otp: string): Promise<boolean> {
  try {
    await account.createSession(userId, otp);
    return true;
  } catch (error: any) {
    console.error('[Appwrite] Error verifying OTP:', error);
    return false;
  }
}

/**
 * Step 3: Get current Appwrite session
 */
export async function getAppwriteSession() {
  try {
    return await account.get();
  } catch (error: any) {
    return null;
  }
}

/**
 * Step 4: Logout from Appwrite
 */
export async function logoutAppwrite() {
  try {
    await account.deleteSession('current');
  } catch (error: any) {
    // session may already be expired - that's ok
  }
}
