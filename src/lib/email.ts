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

/**
 * Sends a registration link to the user's email.
 */
export async function sendRegistrationEmail(to: string, registrationUrl: string): Promise<{ sent: boolean; mocked?: boolean }> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2E7D32; padding-bottom: 20px;">
        <h2 style="color: #1B5E20; margin: 0; font-size: 24px;">USSC Connect</h2>
        <p style="color: #666666; margin: 5px 0 0 0; font-size: 14px;">Self-Registration Verification</p>
      </div>
      
      <div style="padding: 10px 0; color: #333333; line-height: 1.6;">
        <p>Hello,</p>
        <p>Thank you for initiating your self-registration process with USSC Connect. To verify your email and complete your registration, please click the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${registrationUrl}" style="background-color: #2E7D32; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(46, 125, 50, 0.15); transition: background-color 0.2s;">
            Verify Email & Register
          </a>
        </div>
        
        <p style="font-size: 13px; color: #666666; margin-top: 20px;">
          This link is unique to you and will expire in <strong>an hour</strong>. If you did not request this, please ignore this email.
        </p>
        
        <p style="font-size: 12px; color: #999999; word-break: break-all; margin-top: 30px;">
          If the button above does not work, copy and paste this URL into your browser:<br>
          <a href="${registrationUrl}" style="color: #2E7D32;">${registrationUrl}</a>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 12px; color: #999999;">
        <p>© 2026 VERIS. All rights reserved.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"USSC Connect" <${smtpEmail}>`,
    to,
    subject: "USSC Freshman Registration Link",
    text: `Complete your Self-Registration by visiting: ${registrationUrl}`,
    html: htmlContent,
  });

  return { sent: true };
}

// Sends a result email to the user based on the verification decision.
export async function sendRegistrationResultEmail(to: string, registrationStatus: string): Promise<{ sent: boolean }> {


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




  await transporter.sendMail({
    from: `"USSC Connect" <${smtpEmail}>`,
    to,
    subject: "USSC Freshman Registration Status",
    text: `Your Self-Registration status is ${registrationStatus}.`,
    html: htmlContent,
  });

  return { sent: true };
}

/**
 * Sends a student-record update link to the provided email.
 */
export async function sendUpdateLinkEmail(
  to: string,
  updateUrl: string
): Promise<{ sent: boolean; mocked?: boolean }> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2E7D32; padding-bottom: 20px;">
        <h2 style="color: #1B5E20; margin: 0; font-size: 24px;">USSC Connect</h2>
        <p style="color: #666666; margin: 5px 0 0 0; font-size: 14px;">Update Student Record</p>
      </div>

      <div style="padding: 10px 0; color: #333333; line-height: 1.6;">
        <p>Hello,</p>
        <p>We received a request to update your student record on USSC Connect. Click the button below to proceed:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${updateUrl}" style="background-color: #2E7D32; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(46, 125, 50, 0.15);">
            Update My Record
          </a>
        </div>

        <p style="font-size: 13px; color: #666666; margin-top: 20px;">
          This link is unique to you and will expire in <strong>one hour</strong>. If you did not request this, please ignore this email.
        </p>

        <p style="font-size: 12px; color: #999999; word-break: break-all; margin-top: 30px;">
          If the button above does not work, copy and paste this URL into your browser:<br>
          <a href="${updateUrl}" style="color: #2E7D32;">${updateUrl}</a>
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 12px; color: #999999;">
        <p>© 2026 VERIS. All rights reserved.</p>
      </div>
    </div>
  `;

  if (!smtpEmail || !smtpPassword) {
    console.log("[sendUpdateLinkEmail] SMTP not configured — update URL:", updateUrl);
    return { sent: false, mocked: true };
  }

  await transporter.sendMail({
    from: `"USSC Connect" <${smtpEmail}>`,
    to,
    subject: "USSC Connect — Update Your Student Record",
    text: `Update your student record by visiting: ${updateUrl}`,
    html: htmlContent,
  });

  return { sent: true };
}