const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    studentId: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },

    role: { type: String, enum: ["STUDENT", "DRIVER", "ADMIN"], default: "STUDENT" },
    isVerified: { type: Boolean, default: false },

    // Sir requirements (renew/expiry)
    validUntil: { type: Date },
    accountStatus: { type: String, enum: ["ACTIVE", "EXPIRED", "SUSPENDED"], default: "ACTIVE" },

    driverVerification: {
      licenseNo: String,
      status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);