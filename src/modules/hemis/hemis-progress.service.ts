import { Injectable } from '@nestjs/common';

export interface SyncProgress {
  status: 'running' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  totalRecords: number;
  processedRecords: number;
  errors: string[];
  currentPage?: number;
  message?: string;
}

@Injectable()
export class HemisProgressService {
  private studentsProgress: SyncProgress | null = null;
  private employeesProgress: SyncProgress | null = null;

  /**
   * Get current students sync progress
   */
  getStudentsProgress(): SyncProgress | null {
    return this.studentsProgress;
  }

  /**
   * Get current employees sync progress
   */
  getEmployeesProgress(): SyncProgress | null {
    return this.employeesProgress;
  }

  /**
   * Update students progress
   */
  updateStudentsProgress(progress: Partial<SyncProgress>) {
    if (!this.studentsProgress) {
      this.studentsProgress = {
        status: 'running',
        startTime: Date.now(),
        totalRecords: 0,
        processedRecords: 0,
        errors: [],
      };
    }

    this.studentsProgress = {
      ...this.studentsProgress,
      ...progress,
    };
  }

  /**
   * Update employees progress
   */
  updateEmployeesProgress(progress: Partial<SyncProgress>) {
    if (!this.employeesProgress) {
      this.employeesProgress = {
        status: 'running',
        startTime: Date.now(),
        totalRecords: 0,
        processedRecords: 0,
        errors: [],
      };
    }

    this.employeesProgress = {
      ...this.employeesProgress,
      ...progress,
    };
  }

  /**
   * Reset progress
   */
  resetStudents() {
    this.studentsProgress = null;
  }

  resetEmployees() {
    this.employeesProgress = null;
  }
}

