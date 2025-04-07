import React, {createContext, useState, useContext} from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  phoneNumber: string | null;
  login: (phone: string) => void;
  logout: () => void;
  verifyOTP: (otp: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  const login = (phone: string) => {
    setPhoneNumber(phone);
    // Here you would typically make an API call to send OTP
    console.log('Sending OTP to:', phone);
  };

  const verifyOTP = async (otp: string): Promise<boolean> => {
    // Here you would typically verify the OTP with your backend
    console.log('Verifying OTP:', otp);
    if (otp.length === 6) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setPhoneNumber(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        phoneNumber,
        login,
        logout,
        verifyOTP,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 