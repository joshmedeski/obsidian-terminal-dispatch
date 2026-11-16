import { exec } from "child_process";

const TIMEOUT = 30_000;

const EXTRA_PATHS = [
  "/opt/homebrew/bin",
  "/opt/homebrew/sbin",
  "/usr/local/bin",
  `${process.env["HOME"]}/go/bin`,
  `${process.env["HOME"]}/.local/bin`,
  `${process.env["HOME"]}/.cargo/bin`,
];

const PATH = [...EXTRA_PATHS, process.env["PATH"] ?? "/usr/bin:/bin"].join(":");

export function run(command: string, cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      command,
      { cwd, timeout: TIMEOUT, env: { ...process.env, PATH } },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
        } else {
          resolve(stdout);
        }
      },
    );
  });
}
