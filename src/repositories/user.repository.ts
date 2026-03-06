import User, { IUser } from '../models/user.model';

export const findAllUsers = async (page: number, limit: number): Promise<{ users: IUser[], total: number }> => {
    const skip = (page - 1) * limit;
    const users = await User.find().select('-password').skip(skip).limit(limit);
    const total = await User.countDocuments();
    return { users, total };
};

export const findUserById = async (id: string): Promise<IUser | null> => {
    return await User.findById(id).select('-password');
};

export const createUser = async (userData: Partial<IUser>): Promise<IUser> => {
    const user = new User(userData);
    return await user.save();
};

export const updateUser = async (id: string, userData: Partial<IUser>): Promise<IUser | null> => {
    return await User.findByIdAndUpdate(id, userData, { new: true }).select('-password');
};

export const deleteUser = async (id: string): Promise<IUser | null> => {
    return await User.findByIdAndDelete(id);
};
