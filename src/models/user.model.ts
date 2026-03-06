import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  image?: string;
  friends: mongoose.Types.ObjectId[];
  notificationsEnabled: boolean;
  isOnline: boolean;
  lastSeenAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const userSchema: Schema<IUser> = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    image: { type: String, required: false },
    friends: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    notificationsEnabled: { type: Boolean, default: true },
    isOnline: { type: Boolean, default: false },
    lastSeenAt: { type: Date, required: false },
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpires: { type: Date, required: false },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);

