import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import User from '../model/User.js';
import jwt from 'jsonwebtoken';
import { cloudinary } from '../utils/cloudinary.js';
// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

// ===============================
// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { username, email, password, location } = req.body;
   
  // 1. Check if user exists
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('User already exists!');
  }

  // 2. Hash password
  const salt = await bcrypt.genSalt(10);
  const hashpass = await bcrypt.hash(password, salt);

  // 3. Create user
  const user = await User.create({
    username,
    email,
    password: hashpass,
    location,
  });


  // 4. Send cookie and return user info
  if (user) {
    res
      .cookie('token', generateToken(user._id), {
        httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        // domain: '.onrender.com', // optional for subdomain cases
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .status(201)
      .json({
        _id: user._id,
        username: user.username,
        email: user.email,
        location: user.location,
      });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// ===============================
// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Find user
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // 2. Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(400);
    throw new Error('Password mismatching!');
  }

  // 3. Set cookie and return user
  res
    .cookie('token', generateToken(user._id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production"?"none":"lax",
      maxAge: 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json({
      id: user._id,
      username: user.username,
      email: user.email,
      location: user.location,
      avatar: user.avatar,
    });
});

// ===============================
// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(200).json({ message: "User not logged in" });
  }
  res.status(200).json({ user });
});

// ===============================
// @desc    Update profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ✏️ Update basic fields
    user.username = req.body.username || user.username;
    user.location = req.body.location || user.location;

    // 🖼️ Update avatar if new file uploaded
    if (req.file) {

      // 🗑 Delete old cloudinary image
      if (
        user.avatarPublicId &&
        user.avatar &&
        user.avatar.includes("res.cloudinary.com")
      ) {
        try {
          await cloudinary.uploader.destroy(user.avatarPublicId);
        } catch (err) {
          console.log("Cloudinary delete error:", err.message);
        }
      }

      // ✅ Save new image
      user.avatar = req.file.path;

      // ✅ Works in both local and render
      user.avatarPublicId =
        req.file.filename ||
        req.file.public_id ||
        null;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      user: updatedUser,
    });

  } catch (e) {
    console.log("Update profile error:", e);

    res.status(500).json({
      success: false,
      message: e.message || "Server Error",
    });
  }
});

export { register, login, getMe, updateProfile };
