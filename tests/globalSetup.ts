import { exec, ChildProcess } from 'child_process';

let serverProcess: ChildProcess;

export function setup() {
  serverProcess = exec('./node_modules/.bin/turbo dev');

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('http://localhost:5000/ping');
        if (response.ok) {
          clearInterval(interval);
          resolve(true);
        }
      } catch (error) {
        // Ignore ECONNREFUSED errors
      }
    }, 500);

    setTimeout(() => {
      clearInterval(interval);
      reject(new Error('Server did not start in time'));
    }, 30000);
  });
}

export function teardown() {
  serverProcess.kill();
}
