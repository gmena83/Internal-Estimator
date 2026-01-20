import "dotenv/config";
import { storage } from "../apps/api/src/storage";
import { hashPassword } from "../apps/api/src/auth";

async function main() {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;

    if (!username || !password) {
        console.error("Error: ADMIN_USERNAME and ADMIN_PASSWORD environment variables must be set.");
        console.error("Usage: ADMIN_USERNAME=user@example.com ADMIN_PASSWORD=securepass pnpm run create-user");
        process.exit(1);
    }

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
