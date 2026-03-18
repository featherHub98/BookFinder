import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

interface SendPasswordResetEmailParams {
  email: string;
  resetToken: string;
  userName?: string | null;
}

interface SendWelcomeEmailParams {
  email: string;
  userName?: string | null;
}

export const EmailService = {
  async sendPasswordResetEmail({ email, resetToken, userName }: SendPasswordResetEmailParams): Promise<boolean> {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured - email not sent');
      return false;
    }

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
    const displayName = userName || 'there';

    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Reset Your BookWorm Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4F46E5; margin: 0;">BookWorm</h1>
            </div>
            
            <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
              <h2 style="color: #1f2937; margin-top: 0;">Hi ${displayName},</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: #4F46E5; color: white; padding: 14px 28px; 
                          text-decoration: none; border-radius: 6px; font-weight: 600; 
                          display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                Or copy this link to your browser:<br>
                <a href="${resetUrl}" style="color: #4F46E5; word-break: break-all;">${resetUrl}</a>
              </p>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                This link will expire in 1 hour for security reasons.
              </p>
            </div>
            
            <div style="color: #9ca3af; font-size: 12px; text-align: center;">
              <p>If you didn't request this password reset, you can safely ignore this email.</p>
              <p style="margin-top: 20px;">
                BookWorm - Discover and share your favorite books
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('Failed to send password reset email:', error);
        return false;
      }

      console.log(`Password reset email sent to ${email}, ID: ${data?.id}`);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  },

  async sendWelcomeEmail({ email, userName }: SendWelcomeEmailParams): Promise<boolean> {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured - welcome email not sent');
      return false;
    }

    const displayName = userName || 'there';

    try {
      const { data, error } = resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Welcome to BookWorm!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4F46E5; margin: 0;">BookWorm</h1>
            </div>
            
            <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
              <h2 style="color: #1f2937; margin-top: 0;">Welcome, ${displayName}!</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thanks for joining BookWorm! You're now part of a community of book lovers.
              </p>
              
              <div style="background: #EEF2FF; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #4F46E5; margin-top: 0;">Get Started:</h3>
                <ul style="color: #4b5563; padding-left: 20px;">
                  <li>Search for your favorite books</li>
                  <li>Create recommendations and share your thoughts</li>
                  <li>Follow other readers and discover new books</li>
                  <li>Build your reading list</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${FRONTEND_URL}" 
                   style="background: #4F46E5; color: white; padding: 14px 28px; 
                          text-decoration: none; border-radius: 6px; font-weight: 600; 
                          display: inline-block;">
                  Start Exploring
                </a>
              </div>
            </div>
            
            <div style="color: #9ca3af; font-size: 12px; text-align: center;">
              <p>BookWorm - Discover and share your favorite books</p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('Failed to send welcome email:', error);
        return false;
      }

      console.log(`Welcome email sent to ${email}, ID: ${data?.id}`);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  },
};

export default EmailService;
