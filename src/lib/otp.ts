import { db } from '@/db';
import { otps } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { Resend } from 'resend';

function getResendClient(): Resend {
  // Ensure the key is available - check all possible environments
  const apiKey = 
    process.env.RESEND_API_KEY || 
    process.env['RESEND_API_KEY'];
  
  if (!apiKey || apiKey.trim() === '') {
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('RESEND') || k.includes('resend')));
    throw new Error(`RESEND_API_KEY is not set. Value: "${apiKey}"`);
  }
  return new Resend(apiKey);
}

/**
 * Generate a random 6-digit OTP code
 */
export function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create and store OTP in database, then send via email
 */
export async function sendOTPEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const code = generateOTPCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store OTP in database
    await db.insert(otps).values({
      email,
      code,
      expiresAt,
      isUsed: false,
    });

    // Send email via Resend
    const fromEmail = process.env.FROM_EMAIL || 'noreply@electronic-lab.edu';
    const resend = getResendClient();
    
    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your ElecTronic Lab OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">ElecTronic Lab - Verification Code</h2>
          <p style="color: #4a5568; font-size: 16px;">
            Your one-time verification code is:
          </p>
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #2d3748; margin: 0;">
              ${code}
            </p>
          </div>
          <p style="color: #718096; font-size: 14px;">
            This code will expire in 10 minutes. Do not share this code with anyone.
          </p>
          <p style="color: #718096; font-size: 12px; margin-top: 20px;">
            If you did not request this code, please ignore this email.
          </p>
        </div>
      `,
    });

    if (result.error) {
      console.error('Failed to send OTP email:', result.error);
      return { success: false, error: 'Failed to send OTP email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in sendOTPEmail:', error);
    return { success: false, error: 'An error occurred while sending OTP' };
  }
}

/**
 * Verify OTP code and mark as used
 */
export async function verifyOTP(email: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Find valid OTP
    const otp = await db.query.otps.findFirst({
      where: and(
        eq(otps.email, email),
        eq(otps.code, code),
        eq(otps.isUsed, false),
        gt(otps.expiresAt, new Date())
      ),
    });

    if (!otp) {
      return { success: false, error: 'Invalid or expired OTP code' };
    }

    // Mark OTP as used
    await db.update(otps).set({ isUsed: true }).where(eq(otps.id, otp.id));

    return { success: true };
  } catch (error) {
    console.error('Error in verifyOTP:', error);
    return { success: false, error: 'An error occurred while verifying OTP' };
  }
}

/**
 * Clean up expired OTPs (should be run periodically)
 */
export async function cleanupExpiredOTPs(): Promise<number> {
  try {
    const result = await db
      .delete(otps)
      .where(and(eq(otps.isUsed, false), gt(otps.expiresAt, new Date())))
      .returning();

    return result.length;
  } catch (error) {
    console.error('Error cleaning up OTPs:', error);
    return 0;
  }
}
