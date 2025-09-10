import React, { useState } from 'react';
import { debugTokens, debugAuthHeader, testApiCall, testLocationUpdate } from '../utils/debug';

const DebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [apiTestResult, setApiTestResult] = useState<any>(null);
  const [locationTestResult, setLocationTestResult] = useState<any>(null);

  const handleDebugTokens = () => {
    const info = debugTokens();
    setDebugInfo(info);
  };

  const handleTestApiCall = async () => {
    const result = await testApiCall();
    setApiTestResult(result);
  };

  const handleTestLocationUpdate = async () => {
    const result = await testLocationUpdate();
    setLocationTestResult(result);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-600 max-w-sm">
      <h3 className="text-white font-bold mb-3">🔧 Debug Panel</h3>
      
      <div className="space-y-2">
        <button 
          onClick={handleDebugTokens}
          className="w-full bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          Check Tokens
        </button>
        
        <button 
          onClick={handleTestApiCall}
          className="w-full bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
        >
          Test API Call
        </button>
        
        <button 
          onClick={debugAuthHeader}
          className="w-full bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
        >
          Check Auth Header
        </button>
        
        <button 
          onClick={handleTestLocationUpdate}
          className="w-full bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
        >
          Test Location Update
        </button>
      </div>

      {debugInfo && (
        <div className="mt-3 p-2 bg-gray-900 rounded text-xs text-gray-300">
          <p className="text-green-400">Access Token: {debugInfo.hasAccessToken ? '✓' : '✗'}</p>
          <p className="text-green-400">Refresh Token: {debugInfo.hasRefreshToken ? '✓' : '✗'}</p>
        </div>
      )}

      {apiTestResult && (
        <div className="mt-3 p-2 bg-gray-900 rounded text-xs text-gray-300">
          <p className={`${apiTestResult.success ? 'text-green-400' : 'text-red-400'}`}>
            API Test: {apiTestResult.success ? 'SUCCESS' : 'FAILED'}
          </p>
          <p>Status: {apiTestResult.status}</p>
        </div>
      )}

      {locationTestResult && (
        <div className="mt-3 p-2 bg-gray-900 rounded text-xs text-gray-300">
          <p className={`${locationTestResult.success ? 'text-green-400' : 'text-red-400'}`}>
            Location Test: {locationTestResult.success ? 'SUCCESS' : 'FAILED'}
          </p>
          <p>Status: {locationTestResult.status}</p>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
