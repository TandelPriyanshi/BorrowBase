import { getToken, getRefreshToken } from './api';

export const debugTokens = () => {
  const accessToken = getToken();
  const refreshToken = getRefreshToken();
  
  console.log('=== TOKEN DEBUG ===');
  console.log('Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NOT FOUND');
  console.log('Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'NOT FOUND');
  console.log('Access Token Full:', accessToken);
  console.log('Refresh Token Full:', refreshToken);
  console.log('===================');
  
  return {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    accessToken,
    refreshToken
  };
};

export const debugAuthHeader = () => {
  const token = getToken();
  const authHeader = token ? `Bearer ${token}` : null;
  console.log('Auth Header:', authHeader);
  return authHeader;
};

// Function to test a simple API call
export const testApiCall = async () => {
  try {
    const token = getToken();
    console.log('Making test API call with token:', token ? 'Present' : 'Missing');
    
    const response = await fetch('http://localhost:3000/api/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    
    console.log('API Response Status:', response.status);
    const data = await response.json();
    console.log('API Response Data:', data);
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Test Error:', error);
    return { success: false, error };
  }
};

// Function to test location update specifically
export const testLocationUpdate = async () => {
  try {
    const token = getToken();
    console.log('Making location update API call with token:', token ? 'Present' : 'Missing');
    
    const response = await fetch('http://localhost:3000/api/update-location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'Test Location'
      })
    });
    
    console.log('Location Update Response Status:', response.status);
    const data = await response.json();
    console.log('Location Update Response Data:', data);
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.error('Location Update Test Error:', error);
    return { success: false, error };
  }
};

export default { debugTokens, debugAuthHeader, testApiCall, testLocationUpdate };
