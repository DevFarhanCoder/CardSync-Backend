const jwt = require("jsonwebtoken");

const secret = "cf9d30b69b0b431a2a7a3d79b160bee21fb0a51b3223d0eb90322015b33fd255ef6dbda89bed23be126bc9206c7f52a0cfe94b5ca45e4f6a0a723c53152e5118";

const payload = { userId: "000000000000000000000001" };

const token = jwt.sign(payload, secret, { expiresIn: "7d" });
console.log("✅ Generated JWT:\n", token);
