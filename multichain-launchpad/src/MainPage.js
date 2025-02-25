import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import './Launchpad.css'; // Ensure to import the CSS file

const MainPage = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check local storage for wallet address and network
    const storedAddress = localStorage.getItem('walletAddress');
    const storedNetwork = localStorage.getItem('network');

    if (storedAddress) {
      setWalletAddress(storedAddress);
    }
    if (storedNetwork) {
      setNetwork(storedNetwork);
    }

    // Listen for chain changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        localStorage.setItem('walletAddress', address); // Store in local storage

        // Check the current network
        const currentNetwork = await provider.getNetwork();
        if (currentNetwork.chainId !== 137) { // 137 is the chain ID for Polygon
          await switchToPolygon();
        } else {
          setNetwork(currentNetwork.name);
          localStorage.setItem('network', currentNetwork.name); // Store in local storage
        }

        console.log("Connected to MetaMask:", address, currentNetwork.name);
      } catch (error) {
        console.error("Error connecting to MetaMask:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const switchToPolygon = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x89', // Hexadecimal for 137
          chainName: 'Polygon Mainnet',
          rpcUrls: ['https://polygon-rpc.com'],
          nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
          },
          blockExplorerUrls: ['https://polygonscan.com'],
        }],
      });
      // After switching, get the network again
      const provider = new ethers.BrowserProvider(window.ethereum);
      const currentNetwork = await provider.getNetwork();
      setNetwork(currentNetwork.name);
      localStorage.setItem('network', currentNetwork.name); // Store in local storage
    } catch (error) {
      console.error("Failed to switch to Polygon:", error);
    }
  };

  const connectPhantom = async () => {
    if (window.solana) {
      try {
        const response = await window.solana.connect();
        setWalletAddress(response.publicKey.toString());
        localStorage.setItem('walletAddress', response.publicKey.toString()); // Store in local storage
        setNetwork("Solana"); // Set network for Phantom
        localStorage.setItem('network', "Solana"); // Store in local storage
        console.log("Connected to Phantom:", response.publicKey.toString());
      } catch (error) {
        console.error("Error connecting to Phantom:", error);
      }
    } else {
      alert("Please install Phantom wallet!");
    }
  };

  const handleChainChanged = async (chainId) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const currentNetwork = await provider.getNetwork();
    setNetwork(currentNetwork.name);
    localStorage.setItem('network', currentNetwork.name); // Store in local storage
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    setWalletAddress(address);
    localStorage.setItem('walletAddress', address); // Store in local storage
    console.log("Network changed:", currentNetwork.name);
  };

  const goToPolygon = () => {
    if (!walletAddress) {
      alert("Please connect to MetaMask first!");
    } else {
      navigate('/polygon', { state: { walletAddress, network } });
    }
  };

  const goToSolana = () => {
    if (!walletAddress) {
      alert("Please connect to Phantom wallet first!");
    } else {
      navigate('/solana', { state: { walletAddress, network } });
    }
  };

  const createPolygonProject = () => {
    if (!walletAddress) {
      alert("Please connect to MetaMask first!");
    } else {
      navigate('/polygon', { state: { walletAddress, network } }); // Navigate to the same page as Project Name 1
    }
  };

  const createSolanaProject = () => {
    if (!walletAddress) {
      alert("Please connect to Phantom wallet first!");
    } else {
      navigate('/solana/create', { state: { walletAddress, network } });
    }
  };

  return (
    <div className="container">
      <div className="hero">
        <h1>Welcome to the Multichain Launchpad</h1>
        <h2>Your gateway to funding innovative projects</h2>
        <p>Connect your wallet and start exploring!</p>
        <button onClick={connectMetaMask}>Connect MetaMask</button>
        <button onClick={connectPhantom}>Connect Phantom</button>
      </div>
      {walletAddress && (
        <div className="wallet-info">
          <p>Connected Wallet: {walletAddress}</p>
          <p>Network: {network}</p>
        </div>
      )}
      <div className="create-project">
        <h2>Create a New Project</h2>
        <button onClick={createPolygonProject}>Create Project on Polygon</button>
        <button onClick={createSolanaProject}>Create Project on Solana</button>
      </div>
      <div className="project-showcase">
        <h2>Featured Projects</h2>
        <div className="card">
          <h3>Project Name 1</h3>
          <p>Description of the project goes here.</p>
          <div className="progress-container">
            <div className="progress-bar" style={{ width: '70%' }}></div>
          </div>
          <button onClick={goToPolygon}>View Project</button> {/* This button now only navigates to the project */}
        </div>
        <div className="card">
          <h3>Project Name 2</h3>
          <p>Description of the project goes here.</p>
          <div className="progress-container">
            <div className="progress-bar" style={{ width: '50%' }}></div>
          </div>
          <button onClick={goToSolana}>View Project</button>
        </div>
      </div>
    </div>
  );
};

export default MainPage;