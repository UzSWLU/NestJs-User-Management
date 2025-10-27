import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface HemisApiResponse<T> {
  success: boolean;
  error: any;
  data: {
    items: T[];
    pagination: {
      totalCount: number;
      pageSize: number;
      pageCount: number;
      page: number;
    };
  };
  code: number;
}

@Injectable()
export class HemisApiService {
  private readonly logger = new Logger(HemisApiService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly apiUrl: string;
  private readonly bearerToken: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('HEMIS_API_URL') || 'https://student.uzswlu.uz';
    this.bearerToken = this.configService.get<string>('HEMIS_BEARER_TOKEN') || '';

    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      timeout: 60000, // 60 seconds
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Add bearer token if provided
    if (this.bearerToken) {
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.bearerToken}`;
    }
  }

  /**
   * Fetch students with pagination
   */
  async fetchStudents(page: number = 1, limit: number = 200): Promise<HemisApiResponse<any>> {
    try {
      const response = await this.axiosInstance.get(`/rest/v1/data/student-list`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching students (page ${page}): ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch employees with pagination
   */
  async fetchEmployees(
    type: string = 'all',
    page: number = 1,
    limit: number = 200,
  ): Promise<HemisApiResponse<any>> {
    try {
      const response = await this.axiosInstance.get(`/rest/v1/data/employee-list`, {
        params: { type, page, limit },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching employees (page ${page}): ${error.message}`);
      throw error;
    }
  }
}
