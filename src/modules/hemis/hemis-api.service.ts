import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class HemisApiService {
  private readonly logger = new Logger(HemisApiService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly baseUrl: string;
  private readonly bearerToken: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('HEMIS_API_URL', 'https://student.uzswlu.uz');
    this.bearerToken = this.configService.get<string>('HEMIS_BEARER_TOKEN', '');

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`,
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Get all students from HEMIS API
   */
  async getStudents(limit: number = 100, offset: number = 0) {
    try {
      const response = await this.axiosInstance.get('/rest/v1/data/student-list', {
        params: { limit, offset },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching students: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single student by ID
   */
  async getStudentById(studentId: number) {
    try {
      const response = await this.axiosInstance.get(`/rest/v1/data/student-list`, {
        params: { limit: 1, offset: 0 },
      });

      // Find student by ID in the response
      if (response.data?.data?.items) {
        return response.data.data.items.find((item: any) => item.id === studentId);
      }

      return null;
    } catch (error) {
      this.logger.error(`Error fetching student by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all employees from HEMIS API
   */
  async getEmployees(type: string = 'all', search?: string, limit: number = 100, offset: number = 0) {
    try {
      const response = await this.axiosInstance.get('/rest/v1/data/employee-list', {
        params: {
          type,
          search,
          limit,
          offset,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching employees: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single employee by ID or employee_id_number
   */
  async getEmployeeById(employeeId?: number, employeeIdNumber?: string) {
    try {
      const searchParam = employeeIdNumber || employeeId?.toString();
      
      const response = await this.axiosInstance.get('/rest/v1/data/employee-list', {
        params: {
          type: 'all',
          search: searchParam,
          limit: 1,
          offset: 0,
        },
      });

      if (response.data?.data?.items && response.data.data.items.length > 0) {
        return response.data.data.items[0];
      }

      return null;
    } catch (error) {
      this.logger.error(`Error fetching employee: ${error.message}`);
      throw error;
    }
  }
}

