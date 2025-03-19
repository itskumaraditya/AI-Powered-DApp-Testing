import React, { useState, useEffect } from 'react';
import { Activity, PlayCircle, AlertCircle, CheckCircle, XCircle, Code2, Zap, Network } from 'lucide-react';
import { TestCase } from './types/TestCase';
import { AITestGenerator } from './services/AITestGenerator';
import { TestExecutor } from './services/TestExecutor';

function App() {
  const [contractAddress, setContractAddress] = useState('');
  const [abi, setAbi] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('mainnet');
  const [error, setError] = useState('');
  const [isValidContract, setIsValidContract] = useState(false);

  const networks = [
    { id: 'mainnet', name: 'Ethereum Mainnet' },
    { id: 'goerli', name: 'Goerli Testnet' },
    { id: 'sepolia', name: 'Sepolia Testnet' },
    { id: 'polygon', name: 'Polygon Mainnet' },
    { id: 'mumbai', name: 'Mumbai Testnet' }
  ];

  const testExecutor = new TestExecutor();

  useEffect(() => {
    const validateContract = async () => {
      if (contractAddress && contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        testExecutor.setProvider(selectedNetwork);
        const isValid = await testExecutor.validateContract(contractAddress);
        setIsValidContract(isValid);
        setError(isValid ? '' : 'Invalid contract address or contract not deployed on selected network');
      } else {
        setIsValidContract(false);
        setError(contractAddress ? 'Invalid contract address format' : '');
      }
    };

    validateContract();
  }, [contractAddress, selectedNetwork]);

  const handleGenerateTests = async () => {
    try {
      setError('');
      setIsGenerating(true);
      const generator = AITestGenerator.getInstance();
      let parsedAbi;
      try {
        parsedAbi = JSON.parse(abi);
      } catch {
        throw new Error('Invalid ABI format. Please provide a valid JSON ABI.');
      }
      const cases = await generator.generateTestCases(parsedAbi, contractAddress);
      setTestCases(cases);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExecuteTests = async () => {
    try {
      setError('');
      setIsExecuting(true);
      testExecutor.setProvider(selectedNetwork);

      const updatedTests = [...testCases];
      for (let i = 0; i < updatedTests.length; i++) {
        const test = updatedTests[i];
        test.status = 'running';
        setTestCases([...updatedTests]);

        const result = await testExecutor.executeTest(test);
        test.status = result.success ? 'passed' : 'failed';
        test.actualResult = result.success ? 'Test passed successfully' : result.error;
        setTestCases([...updatedTests]);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      case 'running':
        return <Activity className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Code2 className="w-12 h-12 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI-Powered DApp Testing
            </h1>
            <p className="text-lg text-gray-600">
              Automatically generate and execute comprehensive test cases for your smart contracts
            </p>
          </div>

          <div className="bg-white shadow-xl rounded-xl p-8 mb-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Network
              </label>
              <div className="relative">
                <select
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                >
                  {networks.map((network) => (
                    <option key={network.id} value={network.id}>
                      {network.name}
                    </option>
                  ))}
                </select>
                <Network className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                    isValidContract ? 'border-green-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="0x..."
                />
                {isValidContract && (
                  <CheckCircle className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract ABI
              </label>
              <textarea
                value={abi}
                onChange={(e) => setAbi(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                placeholder="Paste ABI JSON here..."
              />
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={handleGenerateTests}
                disabled={isGenerating || !isValidContract || !abi}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <Zap className="w-5 h-5 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Tests'}
              </button>
              <button
                onClick={handleExecuteTests}
                disabled={isExecuting || testCases.length === 0}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                {isExecuting ? 'Executing...' : 'Run Tests'}
              </button>
            </div>
          </div>

          {testCases.length > 0 && (
            <div className="bg-white shadow-xl rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-6">Test Cases</h2>
              <div className="space-y-4">
                {testCases.map((test) => (
                  <div
                    key={test.id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-blue-200 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900">{test.name}</h3>
                      {getStatusIcon(test.status)}
                    </div>
                    <p className="text-gray-600 mb-3">
                      {test.description}
                    </p>
                    {test.actualResult && (
                      <div className={`mt-4 p-3 rounded-md ${
                        test.status === 'passed' ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        <p className={`text-sm ${
                          test.status === 'passed' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          Result: {test.actualResult}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;