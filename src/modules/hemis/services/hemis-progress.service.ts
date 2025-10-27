import { Injectable } from '@nestjs/common';

export interface SyncProgress {
  status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled';
  startTime: number;
  endTime?: number;
  totalRecords: number;
  processedRecords: number;
  errors: string[];
  currentPage?: number;
  totalPages?: number;
  message?: string;
}

@Injectable()
export class HemisProgressService {
  private studentProgress: SyncProgress = {
    status: 'idle',
    startTime: 0,
    totalRecords: 0,
    processedRecords: 0,
    errors: [],
  };

  private employeeProgress: SyncProgress = {
    status: 'idle',
    startTime: 0,
    totalRecords: 0,
    processedRecords: 0,
    errors: [],
  };

  private shouldCancelStudents = false;
  private shouldCancelEmployees = false;

  getStudentProgress(): SyncProgress {
    return this.studentProgress;
  }

  getEmployeeProgress(): SyncProgress {
    return this.employeeProgress;
  }

  updateStudentProgress(progress: Partial<SyncProgress>): void {
    this.studentProgress = { ...this.studentProgress, ...progress };
  }

  updateEmployeeProgress(progress: Partial<SyncProgress>): void {
    this.employeeProgress = { ...this.employeeProgress, ...progress };
  }

  cancelStudentSync(): void {
    this.shouldCancelStudents = true;
  }

  cancelEmployeeSync(): void {
    this.shouldCancelEmployees = true;
  }

  isStudentSyncCancelled(): boolean {
    return this.shouldCancelStudents;
  }

  isEmployeeSyncCancelled(): boolean {
    return this.shouldCancelEmployees;
  }

  resetStudentProgress(): void {
    this.studentProgress = {
      status: 'idle',
      startTime: 0,
      totalRecords: 0,
      processedRecords: 0,
      errors: [],
    };
    this.shouldCancelStudents = false;
  }

  resetEmployeeProgress(): void {
    this.employeeProgress = {
      status: 'idle',
      startTime: 0,
      totalRecords: 0,
      processedRecords: 0,
      errors: [],
    };
    this.shouldCancelEmployees = false;
  }
}
