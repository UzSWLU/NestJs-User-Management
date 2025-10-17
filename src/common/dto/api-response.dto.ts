import { DateUtil } from '../utils/date.util';

export class ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
  timestamp: string;
  path?: string;

  constructor(
    success: boolean,
    data?: T,
    message?: string,
    errors?: any,
    path?: string,
  ) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.errors = errors;
    this.timestamp = DateUtil.toISOString();
    this.path = path;
  }

  static success<T>(data: T, message = 'Success'): ApiResponse<T> {
    return new ApiResponse(true, data, message);
  }

  static error(message: string, errors?: any, path?: string): ApiResponse {
    return new ApiResponse(false, undefined, message, errors, path);
  }
}
