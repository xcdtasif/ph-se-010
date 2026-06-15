export type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  error?: any;
};

export type TJwtPayload = {
  id: number;
  name: string;
  role: string;
};

export type ROLE = "contributor" | "maintainer";
