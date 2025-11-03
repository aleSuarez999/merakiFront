// src/context/NetworkContext.jsx

import { createContext, useContext, useState } from 'react';

const NetworkContext = createContext();

export const NetworkProvider = ({ children }) => {
  const [selectedNetwork, setSelectedNetwork] = useState('');

  return (
    <NetworkContext.Provider value={{ selectedNetwork, setSelectedNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);