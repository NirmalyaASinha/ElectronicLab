import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory OTP storage (in production, use database or Redis)
const otpStore = new Map<string, { code: string; expiresAt: number }>();

/**
 * Generate a random 6-digit OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via Resend email
 */
export async function sendOTPEmail(email: string): Promise<string> {
  try {
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP temporarily
    otpStore.set(email, { code: otp, expiresAt });

    console.log(`[OTP Service] Sending OTP ${otp} to ${email}`);

    // Send email via Resend
    const result = await resend.emails.send({
      from: 'noreply@electronic-lab.com',
      to: email,
      subject: 'Your E-Lab Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>E-Lab Verification Code</h2>
          <p>Your verification code is:</p>
          <h1 style="font-size: 48px; letter-spacing: 5px; color: #0066cc;">${otp}</h1>
          <p>This code expires in 10 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    if (result.error) {
      throw new Error(`Failed to send email: ${result.error.message}`);
    }

    console.log(`[OTP Service] OTP sent successfully to ${email}`);
    return email; // Return email instead of userId for consistency
  } catch (error) {
    console.error('[OTP Service] Error sending OTP:', error);
    throw error;
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTPCode(email: string, code: string): Promise<boolean> {
  try {
    const otpData = otpStore.get(email);

    if (!otpData) {
      console.log(`[OTP Service] No OTP found for ${email}`);
      return false;
    }

    if (Date.now() > otpData.expiresAt) {
      console.log(`[OTP Service] OTP expired for ${email}`);
      otpStore.delete(email);
      return false;
    }

    if (otpData.code !== code) {
      console.log(`[OTP Service] Invalid OTP for ${email}. Expected: ${otpData.code}, Got: ${code}`);
      return false;
    }

    console.log(`[OTP Service] OTP verified successfully for ${email}`);
    otpStore.delete(email); // Clear OTP after successful verification
    return true;
  } catch (error) {
    console.error('[OTP Service] Error verifying OTP:', error);
    return false;
  }
}

/**
 * Resend OTP (for resend button)
 */
export async function resendOTPEmail(email: string): Promise<string> {
  // Delete old OTP and send new one
  otpStore.delete(email);
  return sendOTPEmail(email);
}
