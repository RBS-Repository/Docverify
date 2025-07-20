import mongoose from 'mongoose';

// Define the User schema
const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  displayName: {
    type: String,
    required: false,
  },
  photoURL: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Create and export the User model
// Check if the model already exists to prevent OverwriteModelError during hot reloads
export default mongoose.models.User || mongoose.model('User', userSchema); 