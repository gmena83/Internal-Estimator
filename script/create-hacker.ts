import "dotenv/config";
import { storage } from "../apps/api/src/storage";
import { hashPassword } from "../apps/api/src/auth";

async function main() {
  const username = "hacker@test.com";
  const password = "password123";

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
      role: "user",
    });
    console.log(`User created successfully: ${user.id}`);
  }

  const victimName = "victim@test.com";
  console.log(`Checking if user ${victimName} exists...`);
  const existingVictim = await storage.getUserByUsername(victimName);

  if (existingVictim) {
    console.log(`User ${victimName} already exists.`);
  } else {
    console.log(`Creating user ${victimName}...`);
    const hashedPassword = await hashPassword(password);
    const user = await storage.createUser({
      username: victimName,
      password: hashedPassword,
      role: "user",
    });
    console.log(`User created successfully: ${user.id}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error creating user:", err);
  process.exit(1);
});
