import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import * as EmailService from './email.service';
import { RegisterDTOType } from '../dtos/register.dto';
import { LoginDTOType } from '../dtos/login.dto';
import * as UserRepo from '../repositories/auth.repository';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const sanitizeUser = (user: any) => {
  const safeUser = typeof user?.toObject === 'function' ? user.toObject() : { ...user };
  delete safeUser.password;
  delete safeUser.resetPasswordToken;
  delete safeUser.resetPasswordExpires;
  return safeUser;
};

export const registerUser = async (data: RegisterDTOType) => {
  // Check unique email
  const existingUser = await UserRepo.findUserByEmail(data.email);
  if (existingUser) throw new Error('Email already exists');

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await UserRepo.createUser({
    username: data.username,
    email: data.email,
    password: hashedPassword,
    role: data.role || 'user',
  });

  // Generate JWT token
  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  });

  return { user: sanitizeUser(user), token };
};

export const loginUser = async (data: LoginDTOType) => {
  const user = await UserRepo.findUserByEmail(data.email);
  if (!user) throw new Error('Invalid email or password');

  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) throw new Error('Invalid email or password');

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  });

  return { user: sanitizeUser(user), token };
};

export const updateUserProfile = async (id: string, data: any, imagePath?: string) => {
  const updateData: any = {};

  if (data.username) updateData.username = data.username;
  if (data.email) updateData.email = data.email;
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }
  if (imagePath) updateData.image = imagePath;

  // Import user repository functions
  const { findUserById, updateUser } = require('../repositories/user.repository');

  const user = await findUserById(id);
  if (!user) throw new Error('User not found');

  const updatedUser = await updateUser(id, updateData);
  return sanitizeUser(updatedUser);
};

export const forgotPassword = async (email: string) => {
  const user = await UserRepo.findUserByEmail(email);
  if (!user) throw new Error('User with this email does not exist');

  const resetToken = uuidv4();
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;
  const text = [
    'You requested a Vibement password reset.',
    '',
    `Reset link (web): ${resetUrl}`,
    `Reset token (mobile/app): ${resetToken}`,
    '',
    'This token expires in 1 hour.',
    'If you did not request this, you can ignore this email.',
  ].join('\n');

  const html = `
    <p>You requested a <strong>Vibement</strong> password reset.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p>Mobile/app token: <code>${resetToken}</code></p>
    <p>This token expires in 1 hour.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  await EmailService.sendEmail(user.email, 'Password Reset Request', text, html);
};

export const resetPassword = async (token: string, newPassword: string) => {
  const user = await UserRepo.findUserByResetToken(token);
  if (!user) throw new Error('Password reset token is invalid or has expired');

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();
};
