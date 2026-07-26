import nodemailer from "nodemailer";

const smtpEmail = process.env.SMTP_EMAIL;
const smtpPassword = process.env.SMTP_APP_PASSWORD;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: smtpEmail,
    pass: smtpPassword,
  },
});

// Sends a result email to the user based on the verification decision.
export async function sendRegistrationResultEmail(to: string, registrationStatus: string): Promise<{ sent: boolean; mocked?: boolean }> {
  const htmlContent = registrationStatus === "approved" ? `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2E7D32; padding-bottom: 20px;">
        <h2 style="color: #1B5E20; margin: 0; font-size: 24px;">USSC Connect</h2>
        <p style="color: #666666; margin: 5px 0 0 0; font-size: 14px;">Self-Registration Verification</p>
      </div>
      
      <div style="padding: 10px 0; color: #333333; line-height: 1.6;">
        <p>Hello,</p>
        <p>Thank you for initiating your self-registration process. Your ${registrationStatus} registration has been recorded.</p>
        
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 12px; color: #999999;">
        <p>© 2026 VERIS. All rights reserved.</p>
      </div>
    </div>
  `: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2E7D32; padding-bottom: 20px;">
        <h2 style="color: #1B5E20; margin: 0; font-size: 24px;">USSC Connect</h2>
        <p style="color: #666666; margin: 5px 0 0 0; font-size: 14px;">Self-Registration Verification</p>
      </div>
      
      <div style="padding: 10px 0; color: #333333; line-height: 1.6;">
        <p>Hello,</p>
        <p>Thank you for initiating your self-registration process. However, we are unable to verify your credentials. Please contact the appropriate authorities for assistance or send an email to <a href="mailto:[ussc.baybay@vsu.edu.ph]">ussc.baybay@vsu.edu.ph</a>.</p>
        
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 12px; color: #999999;">
        <p>© 2026 VERIS. All rights reserved.</p>
      </div>
    </div>
  `;

  if (!smtpEmail || !smtpPassword) {
    console.log("[sendRegistrationResultEmail] SMTP not configured — status email to:", to, "status:", registrationStatus);
    return { sent: false, mocked: true };
  }

  await transporter.sendMail({
    from: `"USSC Connect" <${smtpEmail}>`,
    to,
    subject: "USSC Freshman Registration Status",
    text: `Your Self-Registration status is ${registrationStatus}.`,
    html: htmlContent,
  });

  return { sent: true };
}