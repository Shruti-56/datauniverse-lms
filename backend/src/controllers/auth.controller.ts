import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { emailService } from '../services/email.service';
import { prisma } from '../lib/prisma';

export class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, fullName, firstName, lastName, phone } = req.body;

      const first = (firstName != null && String(firstName).trim()) ? String(firstName).trim() : '';
      const last = (lastName != null && String(lastName).trim()) ? String(lastName).trim() : '';
      const full = (fullName != null && String(fullName).trim()) ? String(fullName).trim() : [first, last].filter(Boolean).join(' ').trim();

      // Validate input: require either (firstName + lastName) or fullName
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }
      if (!full || full.length < 2) {
        res.status(400).json({ error: 'First name and last name (or full name) are required' });
        return;
      }

      // Phone required for student signup
      const phoneStr = phone != null ? String(phone).trim() : '';
      const phoneDigits = phoneStr.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        res.status(400).json({ error: 'A valid phone number (at least 10 digits) is required' });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Please enter a valid email address' });
        return;
      }

      // Validate password strength
      if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters' });
        return;
      }
      if (!/[A-Z]/.test(password)) {
        res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
        return;
      }
      if (!/[a-z]/.test(password)) {
        res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
        return;
      }
      if (!/[0-9]/.test(password)) {
        res.status(400).json({ error: 'Password must contain at least one number' });
        return;
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user with profile. Only fullName and phoneNumber are required by the base schema.
      // firstName/lastName are optional (added by migration); omit them here so registration works even before migration.
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          role: UserRole.STUDENT,
          profile: {
            create: {
              fullName: full,
              phoneNumber: phoneStr || null,
            },
          },
        },
        include: { profile: true },
      });

      const token = this.generateToken(user.id, user.email, [user.role]);

      emailService.sendWelcomeEmail(user.email, user.profile?.fullName || undefined)
        .catch(err => console.error('Failed to send welcome email:', err));

      const adminEmail = process.env.ADMIN_EMAIL || (await prisma.user.findFirst({ where: { role: UserRole.ADMIN }, select: { email: true } }))?.email;
      if (adminEmail) {
        emailService.sendNewStudentNotificationToAdmin(adminEmail, user.email, user.profile?.fullName || undefined, user.profile?.phoneNumber || undefined)
          .catch(err => console.error('Failed to send admin notification:', err));
      }

      res.status(201).json({
        message: 'Registration successful.',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.profile?.fullName,
          firstName: user.profile?.firstName,
          lastName: user.profile?.lastName,
          phoneNumber: user.profile?.phoneNumber,
          roles: [user.role],
        },
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(500).json({
        error: 'Registration failed',
        ...(process.env.NODE_ENV === 'development' && { details: message }),
      });
    }
  };

  /**
   * POST /api/auth/login
   * Login user
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { profile: true },
      });

      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Check if blocked
      if (user.profile?.isBlocked) {
        res.status(403).json({ error: 'Account is blocked' });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate token - convert single role to array for consistency
      const token = this.generateToken(user.id, user.email, [user.role]);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.profile?.fullName,
          avatarUrl: user.profile?.avatarUrl,
          roles: [user.role],
        },
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  };

  /**
   * GET /api/auth/me
   * Get current user info
   */
  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { profile: true },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        id: user.id,
        email: user.email,
        fullName: user.profile?.fullName,
        avatarUrl: user.profile?.avatarUrl,
        bio: user.profile?.bio,
        roles: [user.role],
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  };

  /**
   * POST /api/auth/logout
   * Logout user (client-side token removal)
   */
  logout = async (_req: Request, res: Response): Promise<void> => {
    // JWT is stateless, so logout is handled client-side
    // This endpoint can be used for logging/analytics
    res.json({ message: 'Logout successful' });
  };

  /**
   * PUT /api/auth/password
   * Change password
   */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Current and new password are required' });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({ error: 'New password must be at least 8 characters' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

      if (!isValid) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }

      // Update password
      const newHash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  };

  /**
   * POST /api/auth/forgot-password
   * Request password reset
   */
  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { profile: true },
      });

      // Always return success to prevent email enumeration
      if (!user) {
        res.json({ 
          message: 'If an account exists with this email, you will receive a password reset link.' 
        });
        return;
      }

      // Generate secure token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Delete any existing reset tokens for this user
      await prisma.passwordReset.deleteMany({
        where: { userId: user.id },
      });

      // Create new reset token (expires in 1 hour)
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      // Send email with reset link
      const emailSent = await emailService.sendPasswordResetEmail(
        user.email,
        resetToken, // Send unhashed token in email
        user.profile?.fullName
      );

      if (emailSent) {
        console.log(`Password reset email sent to ${user.email}`);
      }

      res.json({ 
        message: 'If an account exists with this email, you will receive a password reset link.' 
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process request' });
    }
  };

  /**
   * POST /api/auth/reset-password
   * Reset password with token
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        res.status(400).json({ error: 'Token and password are required' });
        return;
      }

      // Validate password strength
      if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters' });
        return;
      }
      if (!/[A-Z]/.test(password)) {
        res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
        return;
      }
      if (!/[a-z]/.test(password)) {
        res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
        return;
      }
      if (!/[0-9]/.test(password)) {
        res.status(400).json({ error: 'Password must contain at least one number' });
        return;
      }

      // Hash the token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find valid reset token
      const resetRecord = await prisma.passwordReset.findFirst({
        where: {
          token: hashedToken,
          used: false,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      if (!resetRecord) {
        res.status(400).json({ error: 'Invalid or expired reset token' });
        return;
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, 12);

      // Update password and mark token as used
      await prisma.$transaction([
        prisma.user.update({
          where: { id: resetRecord.userId },
          data: { passwordHash },
        }),
        prisma.passwordReset.update({
          where: { id: resetRecord.id },
          data: { used: true },
        }),
      ]);

      res.json({ message: 'Password reset successful. You can now log in with your new password.' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  };

  /**
   * GET /api/auth/verify-reset-token/:token
   * Verify if reset token is valid
   */
  verifyResetToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params;

      if (!token) {
        res.status(400).json({ valid: false, error: 'Token is required' });
        return;
      }

      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const resetRecord = await prisma.passwordReset.findFirst({
        where: {
          token: hashedToken,
          used: false,
          expiresAt: { gt: new Date() },
        },
      });

      res.json({ valid: !!resetRecord });
    } catch (error) {
      console.error('Verify reset token error:', error);
      res.status(500).json({ valid: false, error: 'Failed to verify token' });
    }
  };

  /**
   * Generate JWT token
   */
  private generateToken(userId: string, email: string, roles: UserRole[]): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET must be set in backend/.env (32+ random chars recommended)');
    }
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const payload = { userId, email, roles };
    // Use type assertion to satisfy jsonwebtoken's SignOptions type
    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  }
}
