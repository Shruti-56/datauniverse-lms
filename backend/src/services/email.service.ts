import nodemailer from 'nodemailer';

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string = '';
  private isConfigured: boolean = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.log('⚠️  Email service not configured - SMTP credentials missing');
      this.isConfigured = false;
      return;
    }

    this.fromEmail = process.env.SMTP_FROM || `DataUniverse <${smtpUser}>`;

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Verify connection
    this.transporter.verify((error) => {
      if (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('❌ Email service error:', msg);
        if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
          console.error(
            '📧 DNS could not resolve SMTP host. Check: (1) This machine has internet access. (2) DNS works (try: ping smtp.gmail.com). (3) If on VPN/corporate network, try without VPN or use a different SMTP host.'
          );
        }
        this.isConfigured = false;
      } else {
        console.log('✅ Email service ready');
        this.isConfigured = true;
      }
    });
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn(
        '📧 Email NOT sent (SMTP not configured). To enable emails, set SMTP_USER and SMTP_PASS in backend/.env. Would have sent to:',
        options.to,
        '| Subject:',
        options.subject
      );
      return true;
    }

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = process.env.SMTP_PORT || '587';

    try {
      const result = await this.transporter.sendMail({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log('✅ Email sent to:', options.to, '- MessageId:', result.messageId);
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to send email:', msg);
      if (msg.includes('ENETUNREACH') || msg.includes('ECONNREFUSED')) {
        console.error(
          `📧 SMTP connection failed to ${host}:${port}. Check: (1) SMTP_HOST=${host} is correct (e.g. smtp.gmail.com). ` +
          `(2) Port ${port} is not blocked by firewall. (3) For Gmail, try port 465 with SMTP_SECURE=true if 587 fails.`
        );
      }
      return false;
    }
  }

  /**
   * Notify admin when a new student registers
   */
  async sendNewStudentNotificationToAdmin(
    adminEmail: string,
    studentEmail: string,
    studentName?: string,
    studentPhone?: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6366f1; margin: 0; font-size: 28px;">🎓 DataUniverse Admin</h1>
            </div>
            <h2 style="color: #1f2937; margin-bottom: 16px; font-size: 24px;">New Student Registration</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
              A new student has registered on the platform.
            </p>
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${studentEmail}</p>
              ${studentName ? `<p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${studentName}</p>` : ''}
              ${studentPhone ? `<p style="margin: 0;"><strong>Phone:</strong> ${studentPhone}</p>` : ''}
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              You can view and manage students in the Admin → Students section.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to: adminEmail,
      subject: `[DataUniverse] New student registered: ${studentEmail}`,
      html,
    });
  }

  /**
   * Send welcome email after registration
   */
  async sendWelcomeEmail(email: string, userName?: string): Promise<boolean> {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/login`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6366f1; margin: 0; font-size: 28px;">🎓 DataUniverse</h1>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 16px; font-size: 24px;">Welcome to DataUniverse! 🎉</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Hi${userName ? ` <strong>${userName}</strong>` : ''},<br><br>
              Thank you for joining DataUniverse! We're excited to have you on board.
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
              Here's what you can do now:
            </p>
            
            <ul style="color: #4b5563; font-size: 16px; line-height: 1.8; padding-left: 20px; margin-bottom: 24px;">
              <li>📚 Browse our course marketplace</li>
              <li>🎯 Enroll in courses that interest you</li>
              <li>📈 Track your learning progress</li>
              <li>🏆 Track your progress and complete courses</li>
            </ul>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${loginUrl}" 
                 style="display: inline-block; background-color: #6366f1; color: white; text-decoration: none; 
                        padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Start Learning
              </a>
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} DataUniverse. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to DataUniverse! 🎓',
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string, userName?: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6366f1; margin: 0; font-size: 28px;">🎓 DataUniverse</h1>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 16px; font-size: 24px;">Reset Your Password</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Hi${userName ? ` <strong>${userName}</strong>` : ''},<br><br>
              We received a request to reset your password. Click the button below to create a new password.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background-color: #6366f1; color: white; text-decoration: none; 
                        padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              Or copy this link:<br>
              <a href="${resetUrl}" style="color: #6366f1; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                ⚠️ This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email.
              </p>
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} DataUniverse. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - DataUniverse',
      html,
    });
  }

  /**
   * Send enrollment confirmation email
   */
  async sendEnrollmentEmail(email: string, courseName: string, userName?: string): Promise<boolean> {
    const courseUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/student/my-courses`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6366f1; margin: 0; font-size: 28px;">🎓 DataUniverse</h1>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 16px; font-size: 24px;">Enrollment Confirmed! ✅</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Hi${userName ? ` <strong>${userName}</strong>` : ''},<br><br>
              Great news! You've successfully enrolled in:
            </p>
            
            <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #22c55e;">
              <h3 style="color: #166534; margin: 0; font-size: 18px;">📚 ${courseName}</h3>
            </div>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              You can start learning right away!
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${courseUrl}" 
                 style="display: inline-block; background-color: #6366f1; color: white; text-decoration: none; 
                        padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Go to My Courses
              </a>
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} DataUniverse. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Enrolled: ${courseName} - DataUniverse`,
      html,
    });
  }

  /**
   * Send course completion email
   */
  async sendCourseCompletionEmail(
    email: string, 
    courseName: string, 
    userName?: string
  ): Promise<boolean> {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/student/dashboard`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6366f1; margin: 0; font-size: 28px;">🎓 DataUniverse</h1>
            </div>
            
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="font-size: 64px; margin-bottom: 16px;">🏆</div>
              <h2 style="color: #1f2937; margin-bottom: 8px; font-size: 28px;">Congratulations!</h2>
              <p style="color: #6b7280; font-size: 16px; margin: 0;">You've completed a course</p>
            </div>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Hi${userName ? ` <strong>${userName}</strong>` : ''},<br><br>
              Amazing work! You've successfully completed:
            </p>
            
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
              <h3 style="color: white; margin: 0 0 8px 0; font-size: 20px;">📚 ${courseName}</h3>
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">Course Completed</p>
            </div>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Keep up the great work! Check out more courses to continue your learning journey.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${dashboardUrl}" 
                 style="display: inline-block; background-color: #6366f1; color: white; text-decoration: none; 
                        padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Explore More Courses
              </a>
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} DataUniverse. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `🏆 Congratulations! You completed ${courseName}`,
      html,
    });
  }

  /**
   * Send payment receipt email
   */
  async sendPaymentReceiptEmail(
    email: string,
    courseName: string,
    amount: number,
    paymentId: string,
    userName?: string
  ): Promise<boolean> {
    const date = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6366f1; margin: 0; font-size: 28px;">🎓 DataUniverse</h1>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 16px; font-size: 24px;">Payment Receipt</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Hi${userName ? ` <strong>${userName}</strong>` : ''},<br><br>
              Thank you for your purchase! Here's your receipt:
            </p>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${date}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment ID</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; font-family: monospace;">${paymentId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Course</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; font-weight: 600;">${courseName}</td>
                </tr>
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td style="padding: 16px 0 8px; color: #1f2937; font-size: 16px; font-weight: 600;">Total Paid</td>
                  <td style="padding: 16px 0 8px; color: #22c55e; font-size: 20px; text-align: right; font-weight: 700;">₹${amount.toLocaleString('en-IN')}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #166534; font-size: 14px; margin: 0;">
                ✅ Payment successful! You now have full access to the course.
              </p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/student/my-courses" 
                 style="display: inline-block; background-color: #6366f1; color: white; text-decoration: none; 
                        padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Start Learning
              </a>
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} DataUniverse. All rights reserved.<br>
                This is an automated receipt. Please keep it for your records.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Payment Receipt - ${courseName} - DataUniverse`,
      html,
    });
  }

  /**
   * Send daily live lecture reminder with today's lecture links
   */
  async sendLiveLectureDailyEmail(
    email: string,
    userName: string | undefined,
    lectures: { title: string; meetingLink: string; scheduledAt: Date; instructorName?: string }[]
  ): Promise<boolean> {
    if (lectures.length === 0) return true;

    const instituteName = process.env.INSTITUTE_NAME || 'DataUniverse';
    const rows = lectures.map(
      (l) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${l.title}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${new Date(l.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${l.meetingLink ? `<a href="${l.meetingLink}" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: none;">Join Live</a>` : '—'}
          </td>
        </tr>
      `
    ).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #6366f1; margin: 0; font-size: 24px;">${instituteName}</h1>
              <p style="color: #6b7280; margin: 8px 0 0;">Live Lecture Reminder</p>
            </div>
            <p style="color: #1f2937; font-size: 16px;">Hi ${userName || 'Student'},</p>
            <p style="color: #4b5563;">Here are your live lectures scheduled for today:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280;">Lecture</th>
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280;">Time</th>
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280;">Link</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <p style="color: #6b7280; font-size: 14px;">Click "Join Live" to attend. See you in class!</p>
            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} ${instituteName}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Today's Live Lectures - ${instituteName}`,
      html,
    });
  }

  /**
   * Send email when a live lecture recording is uploaded (to batch students)
   */
  async sendLiveLectureRecordingEmail(
    email: string,
    userName: string | undefined,
    lectureTitle: string,
    viewRecordingLink: string
  ): Promise<boolean> {
    const instituteName = process.env.INSTITUTE_NAME || 'DataUniverse';
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #6366f1; margin: 0; font-size: 24px;">${instituteName}</h1>
              <p style="color: #6b7280; margin: 8px 0 0;">Live Lecture Recording</p>
            </div>
            <p style="color: #1f2937; font-size: 16px;">Hi ${userName || 'Student'},</p>
            <p style="color: #4b5563;">A recording is now available for the live lecture:</p>
            <p style="color: #1f2937; font-weight: 600; margin: 16px 0;">${lectureTitle}</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${viewRecordingLink}" style="display: inline-block; background-color: #6366f1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Watch Recording</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Click the button above to view the recording. You must be logged in.</p>
            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} ${instituteName}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to: email,
      subject: `Recording available: ${lectureTitle} - ${instituteName}`,
      html,
    });
  }

  /**
   * Send email when a student is added to a regular (live lecture) batch
   */
  async sendAddedToBatchEmail(
    email: string,
    userName: string | undefined,
    batchName: string
  ): Promise<boolean> {
    const instituteName = process.env.INSTITUTE_NAME || 'DataUniverse';
    const liveLecturesUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/student/live-lectures`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #6366f1; margin: 0; font-size: 24px;">${instituteName}</h1>
              <p style="color: #6b7280; margin: 8px 0 0;">Live Lecture Batch</p>
            </div>
            <p style="color: #1f2937; font-size: 16px;">Hi ${userName || 'Student'},</p>
            <p style="color: #4b5563;">You have been added to the live lecture batch:</p>
            <div style="background-color: #eef2ff; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #6366f1;">
              <strong style="color: #4338ca;">${batchName}</strong>
            </div>
            <p style="color: #4b5563;">You will receive an email <strong>10 minutes before</strong> each live lecture with a link to join. After the lecture, you will get an email when the recording is available.</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${liveLecturesUrl}" style="display: inline-block; background-color: #6366f1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">View Live Lectures</a>
            </div>
            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} ${instituteName}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to: email,
      subject: `Added to batch: ${batchName} - ${instituteName}`,
      html,
    });
  }

  /**
   * Send "new module starting" email to batch students when a module is created.
   * Includes start date, end date, daily time, and meeting link.
   */
  async sendNewModuleStartingEmail(
    email: string,
    userName: string | undefined,
    moduleName: string,
    startDateStr: string,
    endDateStr: string,
    lectureTime: string,
    directMeetingUrl: string
  ): Promise<boolean> {
    const instituteName = process.env.INSTITUTE_NAME || 'DataUniverse';
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #6366f1; margin: 0; font-size: 24px;">${instituteName}</h1>
              <p style="color: #6b7280; margin: 8px 0 0;">New Live Lecture Module</p>
            </div>
            <p style="color: #1f2937; font-size: 16px;">Hi ${userName || 'Student'},</p>
            <p style="color: #4b5563;">A new live lecture module <strong>${moduleName}</strong> is going to start.</p>
            <p style="color: #4b5563;">Start date: <strong>${startDateStr}</strong><br/>End date: <strong>${endDateStr}</strong><br/>Daily time: <strong>${lectureTime}</strong></p>
            <p style="color: #4b5563;">You will receive reminder emails (1 hour, 30 minutes, and 10 minutes before) each day with the join link.</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${directMeetingUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #6366f1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Join meeting (Teams / Meet)</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This link opens Microsoft Teams or Google Meet directly in a new tab.</p>
            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} ${instituteName}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to: email,
      subject: `New module: ${moduleName} starts ${startDateStr} at ${lectureTime} - ${instituteName}`,
      html,
    });
  }

  /**
   * Send reminder for a module (1 hour, 30 min, or 10 min before lecture).
   * minutesBefore: 60 | 30 | 10.
   * joinUrl = platform URL so when student clicks we mark attendance and redirect to meeting.
   */
  async sendLiveLectureModuleReminderEmail(
    email: string,
    userName: string | undefined,
    moduleName: string,
    joinUrl: string,
    lectureTime: string,
    minutesBefore: 60 | 30 | 10
  ): Promise<boolean> {
    const instituteName = process.env.INSTITUTE_NAME || 'DataUniverse';
    const label = minutesBefore === 60 ? '1 hour' : minutesBefore === 30 ? '30 minutes' : '10 minutes';
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #6366f1; margin: 0; font-size: 24px;">${instituteName}</h1>
              <p style="color: #6b7280; margin: 8px 0 0;">Live Lecture in ${label}</p>
            </div>
            <p style="color: #1f2937; font-size: 16px;">Hi ${userName || 'Student'},</p>
            <p style="color: #4b5563;">Your live lecture <strong>${moduleName}</strong> starts at <strong>${lectureTime}</strong>.</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${joinUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #6366f1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Join meeting (Teams / Meet)</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Click the link to join; attendance will be marked automatically, then you&apos;ll be taken to the meeting.</p>
            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} ${instituteName}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to: email,
      subject: `Live in ${label}: ${moduleName} (${lectureTime}) - ${instituteName}`,
      html,
    });
  }

  /**
   * Send landing page form lead to admin (SMTP_USER in .env)
   */
  async sendLandingLeadEmail(
    pageSlug: string,
    name: string,
    email: string,
    phone: string
  ): Promise<boolean> {
    const toEmail = process.env.SMTP_USER || process.env.LANDING_LEAD_EMAIL;
    if (!toEmail) {
      console.warn('📧 Landing lead email NOT sent: SMTP_USER or LANDING_LEAD_EMAIL not set');
      return false;
    }

    const instituteName = process.env.INSTITUTE_NAME || 'DataUniverse';
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px; padding: 40px; box-shadow: 0 10px 40px rgba(99, 102, 241, 0.3); color: white;">
            <h1 style="margin: 0 0 8px; font-size: 24px;">🤖 New Workshop Lead</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 14px;">Landing: ${pageSlug}</p>
          </div>
          <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); margin-top: -1px;">
            <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <p style="margin: 0 0 12px;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 0 0 12px;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p style="margin: 0;"><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
            </div>
            <p style="color: #64748b; font-size: 12px;">Lead from ${instituteName} AI Workshop landing page.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to: toEmail,
      subject: `[${instituteName}] Workshop Lead: ${name} - ${email}`,
      html,
    });
  }

  /**
   * Send marketing contact/enquiry form to admin (SMTP_USER)
   */
  async sendMarketingEnquiryEmail(
    name: string,
    email: string,
    phone: string,
    message: string,
    bookDemo: boolean,
    downloadBrochure: boolean
  ): Promise<boolean> {
    const toEmail = process.env.SMTP_USER;
    if (!toEmail) {
      console.warn('📧 Marketing enquiry email NOT sent: SMTP_USER not set');
      return false;
    }

    const instituteName = process.env.INSTITUTE_NAME || 'DataUniverse';
    const extras: string[] = [];
    if (bookDemo) extras.push('Book a free demo class');
    if (downloadBrochure) extras.push('Send brochure (PDF)');
    const extrasHtml = extras.length > 0
      ? `<p style="margin: 0 0 12px;"><strong>Requested:</strong> ${extras.join(', ')}</p>`
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px 16px 0 0; padding: 40px; box-shadow: 0 10px 40px rgba(99, 102, 241, 0.3); color: white;">
            <h1 style="margin: 0; font-size: 24px;">📬 New Contact Enquiry</h1>
            <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">From ${instituteName} marketing page</p>
          </div>
          <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); margin-top: -1px;">
            <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <p style="margin: 0 0 12px;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 0 0 12px;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p style="margin: 0 0 12px;"><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
              ${extrasHtml}
              ${message ? `<p style="margin: 12px 0 0; padding-top: 12px; border-top: 1px solid #e2e8f0;"><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>` : ''}
            </div>
            <p style="color: #64748b; font-size: 12px;">Enquiry from contact form. Respond within 24 hours.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail({
      to: toEmail,
      subject: `[${instituteName}] Contact Enquiry: ${name} - ${email}`,
      html,
    });
  }
}

export const emailService = new EmailService();
