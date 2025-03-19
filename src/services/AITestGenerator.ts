import { TestCase } from '../types/TestCase';
import { ethers } from 'ethers';

export class AITestGenerator {
  private static instance: AITestGenerator;
  
  private constructor() {}

  public static getInstance(): AITestGenerator {
    if (!AITestGenerator.instance) {
      AITestGenerator.instance = new AITestGenerator();
    }
    return AITestGenerator.instance;
  }

  async generateTestCases(abi: any, contractAddress: string): Promise<TestCase[]> {
    const testCases: TestCase[] = [];
    
    // Basic function tests
    for (const item of abi) {
      if (item.type === 'function') {
        // Test read operations
        if (item.stateMutability === 'view' || item.stateMutability === 'pure') {
          testCases.push(this.createViewFunctionTest(item, contractAddress));
        }
        // Test write operations
        else {
          testCases.push(this.createWriteFunctionTest(item, contractAddress));
        }

        // Generate boundary tests for numeric inputs
        if (item.inputs.some(input => input.type.startsWith('uint') || input.type.startsWith('int'))) {
          testCases.push(this.createBoundaryTest(item, contractAddress));
        }

        // Generate fuzzing tests for complex inputs
        if (item.inputs.length > 0) {
          testCases.push(this.createFuzzingTest(item, contractAddress));
        }
      }
    }

    // Add integration tests
    testCases.push(...this.generateIntegrationTests(abi, contractAddress));

    return testCases;
  }

  private createViewFunctionTest(abiItem: any, contractAddress: string): TestCase {
    return {
      id: `view-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Read Test: ${abiItem.name}`,
      description: `Verify read operation for ${abiItem.name} function`,
      steps: [
        {
          id: `step-${Date.now()}`,
          action: 'CONTRACT_CALL',
          params: {
            method: abiItem.name,
            contractAddress,
            args: this.generateSafeArgs(abiItem.inputs)
          },
          description: `Call ${abiItem.name} with safe parameters`
        }
      ],
      expectedResult: 'Function should return a valid response',
      status: 'pending'
    };
  }

  private createWriteFunctionTest(abiItem: any, contractAddress: string): TestCase {
    return {
      id: `write-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Write Test: ${abiItem.name}`,
      description: `Verify state change for ${abiItem.name} function`,
      steps: [
        {
          id: `step-${Date.now()}`,
          action: 'CONTRACT_CALL',
          params: {
            method: abiItem.name,
            contractAddress,
            args: this.generateSafeArgs(abiItem.inputs)
          },
          description: `Execute ${abiItem.name} with valid parameters`
        }
      ],
      expectedResult: 'Transaction should be successful and state should be updated',
      status: 'pending'
    };
  }

  private createBoundaryTest(abiItem: any, contractAddress: string): TestCase {
    return {
      id: `boundary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Boundary Test: ${abiItem.name}`,
      description: `Test boundary conditions for ${abiItem.name} function`,
      steps: [
        {
          id: `step-min-${Date.now()}`,
          action: 'CONTRACT_CALL',
          params: {
            method: abiItem.name,
            contractAddress,
            args: this.generateBoundaryArgs(abiItem.inputs, 'min')
          },
          description: `Test ${abiItem.name} with minimum values`
        },
        {
          id: `step-max-${Date.now()}`,
          action: 'CONTRACT_CALL',
          params: {
            method: abiItem.name,
            contractAddress,
            args: this.generateBoundaryArgs(abiItem.inputs, 'max')
          },
          description: `Test ${abiItem.name} with maximum values`
        }
      ],
      expectedResult: 'Function should handle boundary values correctly',
      status: 'pending'
    };
  }

  private createFuzzingTest(abiItem: any, contractAddress: string): TestCase {
    return {
      id: `fuzz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Fuzzing Test: ${abiItem.name}`,
      description: `Fuzz testing for ${abiItem.name} function with random inputs`,
      steps: [
        {
          id: `step-fuzz-${Date.now()}`,
          action: 'CONTRACT_CALL',
          params: {
            method: abiItem.name,
            contractAddress,
            args: this.generateFuzzedArgs(abiItem.inputs)
          },
          description: `Test ${abiItem.name} with fuzzed inputs`
        }
      ],
      expectedResult: 'Function should handle unexpected inputs gracefully',
      status: 'pending'
    };
  }

  private generateIntegrationTests(abi: any[], contractAddress: string): TestCase[] {
    const writeFunctions = abi.filter(item => 
      item.type === 'function' && 
      item.stateMutability !== 'view' && 
      item.stateMutability !== 'pure'
    );

    const readFunctions = abi.filter(item =>
      item.type === 'function' &&
      (item.stateMutability === 'view' || item.stateMutability === 'pure')
    );

    const integrationTests: TestCase[] = [];

    // Create integration test combining write and read operations
    if (writeFunctions.length > 0 && readFunctions.length > 0) {
      integrationTests.push({
        id: `integration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: 'State Change Verification',
        description: 'Verify state changes through write operations and confirm with read operations',
        steps: [
          {
            id: `step-write-${Date.now()}`,
            action: 'CONTRACT_CALL',
            params: {
              method: writeFunctions[0].name,
              contractAddress,
              args: this.generateSafeArgs(writeFunctions[0].inputs)
            },
            description: `Execute ${writeFunctions[0].name} to modify state`
          },
          {
            id: `step-read-${Date.now()}`,
            action: 'CONTRACT_CALL',
            params: {
              method: readFunctions[0].name,
              contractAddress,
              args: this.generateSafeArgs(readFunctions[0].inputs)
            },
            description: `Verify state change using ${readFunctions[0].name}`
          }
        ],
        expectedResult: 'State change should be reflected in read operation',
        status: 'pending'
      });
    }

    return integrationTests;
  }

  private generateSafeArgs(inputs: any[]): any[] {
    return inputs.map(input => {
      switch (input.type) {
        case 'uint256':
          return ethers.parseUnits('1', 'ether').toString();
        case 'uint8':
          return '1';
        case 'address':
          return '0x0000000000000000000000000000000000000001';
        case 'string':
          return 'Test String';
        case 'bool':
          return true;
        case 'bytes':
          return '0x00';
        case 'bytes32':
          return ethers.id('test');
        default:
          return '0';
      }
    });
  }

  private generateBoundaryArgs(inputs: any[], boundary: 'min' | 'max'): any[] {
    return inputs.map(input => {
      if (input.type.startsWith('uint')) {
        return boundary === 'min' ? '0' : ethers.MaxUint256.toString();
      }
      if (input.type.startsWith('int')) {
        return boundary === 'min' ? ethers.MinInt256.toString() : ethers.MaxInt256.toString();
      }
      return this.generateSafeArgs([input])[0];
    });
  }

  private generateFuzzedArgs(inputs: any[]): any[] {
    return inputs.map(input => {
      switch (input.type) {
        case 'uint256':
          return ethers.parseUnits(Math.floor(Math.random() * 1000).toString(), 'ether').toString();
        case 'uint8':
          return Math.floor(Math.random() * 256).toString();
        case 'address':
          return ethers.Wallet.createRandom().address;
        case 'string':
          return Math.random().toString(36).substring(7);
        case 'bool':
          return Math.random() > 0.5;
        case 'bytes':
          return ethers.randomBytes(32);
        case 'bytes32':
          return ethers.id(Math.random().toString());
        default:
          return '0';
      }
    });
  }
}