import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PatentProvider } from './../src/component/context/patentcontext';
import PatentList from './component/patentlist';
import PatentUpload from './../src/component/createPatent';
import TokenizePatent from './component/TokenizePatent';
import PatentTrading from './component/PatentTrading';
import WalletConnect from './component/walletconnect';

const App = () => {
  return (
    <PatentProvider>
      <Routes>            
        <Route index element={<Navigate to="/patents" replace />} />
        <Route path="patents" element={<PatentList />} />
        <Route path="upload-patent" element={<PatentUpload />} />
        <Route path="tokenize-patent/:patentId" element={<TokenizePatent />} />
        <Route path="trade-patent/:patentId" element={<PatentTrading />} />
        <Route path="/connect-wallet" element={<WalletConnect />} />
      </Routes>
    </PatentProvider>
  );
};

export default App;