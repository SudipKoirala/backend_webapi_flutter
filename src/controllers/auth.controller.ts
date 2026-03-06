import { Request, Response } from 'express';
import { RegisterDTO } from '../dtos/register.dto';
import { LoginDTO } from '../dtos/login.dto';
import * as AuthService from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/user.model';

export const register = async (req: Request, res: Response) => {
  try {
    const payload = {
      ...req.body,
      username: req.body?.username ?? req.body?.name,
    };

    const parsedResult = RegisterDTO.safeParse(payload);

    if (!parsedResult.success) {
      // Use 'issues' instead of 'errors'
      const messages = parsedResult.error.issues.map((e) => e.message).join(', ');
      return res.status(400).json({ message: messages });
    }

    const result = await AuthService.registerUser(parsedResult.data);
    res.status(201).json({ message: 'User registered', token: result.token, user: result.user });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const parsedResult = LoginDTO.safeParse(req.body);

    if (!parsedResult.success) {
      // Use 'issues' instead of 'errors'
      const messages = parsedResult.error.issues.map((e) => e.message).join(', ');
      return res.status(400).json({ message: messages });
    }

    const result = await AuthService.loginUser(parsedResult.data);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Login failed' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;

    const result = await AuthService.updateUserProfile(id, req.body, imagePath);
    res.status(200).json({ message: 'Profile updated successfully', user: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Profile update failed' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    await AuthService.forgotPassword(email);
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to send reset email' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password are required' });
    await AuthService.resetPassword(token, newPassword);
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Password reset failed' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get user' });
  }
};
