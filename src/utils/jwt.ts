import jwt, { Secret, SignOptions, JwtPayload } from "jsonwebtoken";

// Ensure JWT secret exists
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

const JWT_SECRET: Secret = process.env.JWT_SECRET;

// ----------------------
// 🔐 Generate Token
// ----------------------
export const generateToken = (payload: object): string => {
  const options: SignOptions = {
    expiresIn: "1d",
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

// ----------------------
// 🔍 Verify Token
// ----------------------
export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === "object" && decoded !== null) {
      return decoded as JwtPayload;
    }

    throw new Error("Invalid token payload");
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

// ----------------------
// 🧠 Decode Token (SAFE)
// ----------------------
export const decodeToken = (token: string): JwtPayload | null => {
  const decoded = jwt.decode(token);

  if (typeof decoded === "object" && decoded !== null) {
    return decoded as JwtPayload;
  }

  return null;
};