import { spawn, type ChildProcess } from "child_process";
import net from "net";

let serverParam: ChildProcess | undefined;

async function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      resolve(false);
    });
    socket.connect(port, "localhost");
  });
}

export async function setup() {
  const isServerRunning = await checkPort(5000);

  if (isServerRunning) {
    console.log("GlobalSetup: Server is already running on port 5000. Skipping start.");
    return;
  }

  console.log("GlobalSetup: Starting API server...");
  serverParam = spawn("bun", ["run", "src/index.ts"], {
    cwd: "apps/api",
    stdio: "inherit",
    env: { ...process.env, PORT: "5000", NODE_ENV: "test" },
    shell: true,
  });

  // Wait for server to be ready
  let retries = 30;
  while (retries > 0) {
    if (await checkPort(5000)) {
      console.log("GlobalSetup: Server is ready!");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    retries--;
  }

  throw new Error("GlobalSetup: Server failed to start within 30 seconds");
}

export async function teardown() {
  if (serverParam) {
    console.log("GlobalSetup: Stopping API server...");
    serverParam.kill();
  }
}
