export type ReturnSuccess<T> = {
  data: T;
  statusCode: number;
  timestamp?: number;
  message: string;
};
export function returnSuccess<T>(data: T, message: string): ReturnSuccess<T> {
  return {
    message,
    statusCode: 200,
    timestamp: Date.now(),
    data,
  };
}
