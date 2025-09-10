// Helper function to get the authentication token from localStorage
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to set the authentication token in localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem('token', token);
};

// Helper function to remove the authentication token from localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem('token');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};
