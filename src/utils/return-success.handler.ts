export type ReturnSuccess<T> = {
  data: T;
  statusCode: number;
  timestamp?: number;
};
export function returnSuccess<T>(data: T): ReturnSuccess<T> {
  return {
    statusCode: 200,
    timestamp: Date.now(),
    data,
  };
}
