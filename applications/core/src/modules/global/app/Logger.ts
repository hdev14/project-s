export default interface Logger {
  error(error: string | Error, metadata?: Record<string, any>): void;
  info(message: string, metadata?: Record<string, any>): void;
}
