import { ethers } from 'ethers';
import { TestCase, TestResult } from '../types/TestCase';

export class TestExecutor {
  private provider: ethers.Provider;
  private signer: ethers.Wallet;

  constructor() {
    // Initialize with default Ethereum mainnet provider and a random wallet
    this.provider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/demo');
    this.signer = ethers.Wallet.createRandom().connect(this.provider);
  }

  setProvider(network: string) {
    const networks = {
      mainnet: 'https://eth-mainnet.g.alchemy.com/v2/demo',
      goerli: 'https://eth-goerli.g.alchemy.com/v2/demo',
      sepolia: 'https://eth-sepolia.g.alchemy.com/v2/demo',
      polygon: 'https://polygon-mainnet.g.alchemy.com/v2/demo',
      mumbai: 'https://polygon-mumbai.g.alchemy.com/v2/demo'
    };
    
    this.provider = new ethers.JsonRpcProvider(networks[network] || networks.mainnet);
    // Reconnect the existing wallet to the new provider
    this.signer = this.signer.connect(this.provider);
  }

  async executeTest(testCase: TestCase): Promise<TestResult> {
    const logs: string[] = [];
    try {
      logs.push(`Starting test: ${testCase.name}`);
      
      for (const step of testCase.steps) {
        if (step.action === 'CONTRACT_CALL') {
          const contract = new ethers.Contract(
            step.params.contractAddress,
            [step.params.method],
            this.signer
          );

          logs.push(`Executing contract call: ${step.params.method}`);
          const tx = await contract[step.params.method](...step.params.args);
          await tx.wait();
          logs.push(`Transaction successful: ${tx.hash}`);
        }
      }

      return {
        testCaseId: testCase.id,
        success: true,
        logs,
        timestamp: Date.now()
      };
    } catch (error) {
      logs.push(`Error: ${error.message}`);
      return {
        testCaseId: testCase.id,
        success: false,
        error: error.message,
        logs,
        timestamp: Date.now()
      };
    }
  }

  async validateContract(address: string): Promise<boolean> {
    try {
      const code = await this.provider.getCode(address);
      return code !== '0x';
    } catch {
      return false;
    }
  }
}