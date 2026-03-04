const bcrypt = require("bcrypt");
const validator = require("validator");
const User = require("../models/User");
const { signToken } = require("../utils/token");

// change this to your real SLIIT domain if you know it
const SLIIT_EMAIL_DOMAIN = "sliit.lk";

const calcValidUntil = () => {
  // Sir requirement: renew each semester (6 months)
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d;
};

const register = async (req, res) => {
  try {
    const { fullName, email, studentId, password, role } = req.body;

    if (!fullName || !email || !studentId || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    // simple SLIIT verification (MVP)
    const domain = email.split("@")[1]?.toLowerCase();
    const isVerified = domain === SLIIT_EMAIL_DOMAIN;

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { studentId }],
    });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      studentId,
      passwordHash,
      role: role || "STUDENT",
      isVerified,
      validUntil: calcValidUntil(),
      accountStatus: "ACTIVE",
      driverVerification:
        role === "DRIVER"
          ? { status: "PENDING" }
          : undefined,
    });

    const token = signToken({ userId: user._id, role: user.role });

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        studentId: user.studentId,
        role: user.role,
        isVerified: user.isVerified,
        validUntil: user.validUntil,
        accountStatus: user.accountStatus,
        driverVerification: user.driverVerification,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // account validity check (renew each 6 months)
    if (user.validUntil && new Date(user.validUntil) < new Date()) {
      user.accountStatus = "EXPIRED";
      await user.save();
      return res.status(403).json({ message: "Account expired. Renewal required." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken({ userId: user._id, role: user.role });

    return res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        studentId: user.studentId,
        role: user.role,
        isVerified: user.isVerified,
        validUntil: user.validUntil,
        accountStatus: user.accountStatus,
        driverVerification: user.driverVerification,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const me = async (req, res) => {
  return res.json({ user: req.user });
};

module.exports = { register, login, me };