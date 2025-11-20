import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { z } from 'zod';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const RegisterSchema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(['driver', 'rider']).optional(),
      roles: z.array(z.enum(['driver', 'rider'])).optional(),
      phone: z.string().optional(),
      location: z
        .object({ type: z.literal('Point'), coordinates: z.array(z.number()).length(2) })
        .optional(),
    });
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
    const { name, email, password, role, roles: rolesInput, phone, location } = parsed.data;
    if (phone) {
      const digits = phone.replace(/[^0-9]/g, '');
      if (digits.length < 7 || digits.length > 15) return res.status(400).json({ error: 'Invalid phone number' });
    }
    let user = await User.findOne({ email });
    if (user) {
      // Require correct password to modify existing account
      const ok = await user.comparePassword(password);
      if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
      // Merge role into roles array if not present, update optional fields
      const roles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
      // merge single role
      if (role && !roles.includes(role)) roles.push(role);
      // merge provided roles array
      if (Array.isArray(rolesInput)) {
        for (const r of rolesInput) if (!roles.includes(r)) roles.push(r);
      }
      if (typeof phone === 'string') user.phone = phone;
      if (location && location.type === 'Point' && Array.isArray(location.coordinates)) user.location = location;
      user.roles = roles;
      await user.save();
    } else {
      const roles = Array.isArray(rolesInput) && rolesInput.length
        ? rolesInput
        : (role ? [role] : undefined);
      user = await User.create({ name, email, password, roles, phone, location });
    }
    const primaryRole = Array.isArray(user.roles) && user.roles.length ? user.roles[0] : (user.role || undefined);
    const token = jwt.sign({ id: user._id, roles: user.roles, role: primaryRole, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: primaryRole, roles: user.roles } });
  } catch (e) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
    const parsed = LoginSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: 'Invalid credentials' });
    const { email, password } = parsed.data;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    const roles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
    const primaryRole = roles.length ? roles[0] : undefined;
    const token = jwt.sign({ id: user._id, roles, role: primaryRole, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: primaryRole, roles } });
  } catch (e) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Minimal forgot-password endpoint (placeholder)
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await User.findOne({ email });
    // Always respond ok to avoid enumeration
    if (!user) return res.json({ ok: true });

    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
    user.resetToken = token;
    user.resetTokenExpires = expires;
    await user.save();

    // Prefer real SMTP if configured; otherwise use Ethereal test account
    let transporter;
    let usedEthereal = false;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || 'false') === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
    } else {
      const testAcc = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAcc.user, pass: testAcc.pass },
      });
      usedEthereal = true;
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset?token=${token}`;
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'Carpool <no-reply@carpool.test>',
      to: email,
      subject: 'Password Reset',
      text: `Reset your password: ${resetLink}`,
      html: `<p>Reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    });

    const response = { ok: true };
    if (usedEthereal) {
      response.previewUrl = nodemailer.getTestMessageUrl(info);
    }
    res.json(response);
  } catch (e) {
    res.json({ ok: true });
  }
});

router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'Invalid request' });
    const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });
    user.password = password; // pre-save hook will hash
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Reset failed' });
  }
});

export default router;
