import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  fullName: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  status: {
    active: boolean;
    verified: boolean;
    lastLogin?: Date;
  };
  verification?: {
    token: string;
    expires: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: {
      active: { type: Boolean, default: true },
      verified: { type: Boolean, default: false },
      lastLogin: { type: Date },
    },
    verification: {
      token: String,
      expires: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the model
const UserModel = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default UserModel;
