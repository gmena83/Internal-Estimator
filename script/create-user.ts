import "dotenv/config";
import { storage } from "../server/storage";
import { hashPassword } from "../server/auth";

async function main() {
  const username = "gonzalo@menatech.cloud";
  const password = "Phenom21!";

  console.log(`Checking if user ${username} exists...`);
  const existingUser = await storage.getUserByUsername(username);

  if (existingUser) {
    console.log(`User ${username} already exists.`);
  } else {
    console.log(`Creating user ${username}...`);
    const hashedPassword = await hashPassword(password);
    const user = await storage.createUser({
      username,
      password: hashedPassword,
      role: "admin",
    });
    console.log(`User created successfully: ${user.id}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error creating user:", err);
  process.exit(1);
});
