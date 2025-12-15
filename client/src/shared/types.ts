export type IUser = {
  _id: string;
  name: string;
  email: string;
  token?: string;
};

export type IResponseSuccess<T> = {
  data: T;
  statusCode: number;
  timestamp?: number;
};

export type IErrorResponse = {
  message: string;
  statusCode: number;
};
