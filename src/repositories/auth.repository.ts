import User, { IUser } from '../models/user.model';

export const createUser = async (user: Partial<IUser>) => {
  const newUser = new User(user);
  return await newUser.save();
};

export const findUserByEmail = async (email: string) => {
  return await User.findOne({ email });
};

export const findUserByResetToken = async (token: string) => {
  return await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  });
};
