export interface TestCase {
  id: string;
  name: string;
  description: string;
  steps: TestStep[];
  expectedResult: string;
  actualResult?: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
}

export interface TestStep {
  id: string;
  action: string;
  params: Record<string, any>;
  description: string;
}

export interface TestResult {
  testCaseId: string;
  success: boolean;
  error?: string;
  logs: string[];
  timestamp: number;
}