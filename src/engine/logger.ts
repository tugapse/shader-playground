export class EngineLogger {
  private static instance: EngineLogger;
  private logs: Array<{ level: string; message: string; timestamp: number }> =
    [];
  private maxLogs = 1000;

  private constructor() {}

  private static getInstance(): EngineLogger {
    if (!EngineLogger.instance) {
      EngineLogger.instance = new EngineLogger();
    }
    return EngineLogger.instance;
  }

  private static sanitizeStack(stack?: string): string {
    if (!stack) return "";
    return stack
      .split("\n")
      .map((line) => {
        // Removes anything inside parentheses like (fabio/Code/omega-editor/...) or URLs
        return line.replace(/\s*\([^)]+\)/g, "").trim();
      })
      .join("\n");
  }
  public static log(message: string, ...optionalParams: unknown[]): void {
    const instance = EngineLogger.getInstance();
    instance.store("log", message, optionalParams);
    console.log(message, ...optionalParams);
  }

  public static debug(message: string, ...optionalParams: unknown[]): void {
    const instance = EngineLogger.getInstance();
    instance.store("debug", message, optionalParams);
    console.debug(message, ...optionalParams);
  }

  public static error(message: string, ...optionalParams: unknown[]): void {
    const instance = EngineLogger.getInstance();
    instance.store("error", message, optionalParams);
    console.error(message, ...optionalParams);
  }

  private store(level: string, message: string, params: unknown[]): void {
    const formattedParams = params.map((arg) => {
      if (arg instanceof Error) {
        return `${arg.message}\n${EngineLogger.sanitizeStack(arg.stack)}`;
      }
      if (typeof arg === "string" && arg.includes("at ")) {
        // If a raw stack string was passed directly
        return EngineLogger.sanitizeStack(arg);
      }
      return typeof arg === "object" ? JSON.stringify(arg) : String(arg);
    });

    this.logs.push({
      level,
      message: [message, ...formattedParams].join(" "),
      timestamp: Date.now(),
    });

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  public static getLogs() {
    return EngineLogger.getInstance().logs;
  }

  public static clear() {
    EngineLogger.getInstance().logs = [];
  }
}
