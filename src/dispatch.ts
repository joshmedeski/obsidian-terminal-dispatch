import { exec } from "child_process";

const TIMEOUT = 30_000;

// Obsidian runs as a macOS GUI app with a minimal shell environment.
// Build a PATH that includes common binary locations so dispatched
// commands (and the binaries they depend on) can be found.
const EXTRA_PATHS = [
  "/opt/homebrew/bin",
  "/opt/homebrew/sbin",
  "/usr/local/bin",
  `${process.env["HOME"]}/go/bin`,
  `${process.env["HOME"]}/.local/bin`,
  `${process.env["HOME"]}/.cargo/bin`,
];

const PATH = [...EXTRA_PATHS, process.env["PATH"] ?? "/usr/bin:/bin"].join(":");

function run(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      command,
      { timeout: TIMEOUT, env: { ...process.env, PATH } },
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

export async function dispatchSesh(
  seshBinaryPath: string,
  seshPath: string,
  command: string,
): Promise<void> {
  const escaped = command.replace(/"/g, '\\"');
  await run(
    `${seshBinaryPath} connect ${seshPath} --switch --command "${escaped}"`,
  );
}

export async function dispatchExec(command: string): Promise<void> {
  await run(command);
}

export async function dispatchApplescript(
  command: string,
  terminalApp: string,
): Promise<void> {
  const escaped = command.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  if (terminalApp === "Terminal" || terminalApp === "Terminal.app") {
    const script = `tell application "${terminalApp}" to do script "${escaped}"`;
    await run(`osascript -e '${script}'`);
  } else {
    // Clipboard-paste fallback for apps that don't support `do script`
    const script = [
      `set the clipboard to "${escaped}\n"`,
      `tell application "${terminalApp}" to activate`,
      `delay 0.3`,
      `tell application "System Events" to keystroke "v" using command down`,
    ].join("\n");
    await run(`osascript -e '${script}'`);
  }
}

export async function focusApp(appName: string): Promise<void> {
  await run(`osascript -e 'tell application "${appName}" to activate'`);
}
