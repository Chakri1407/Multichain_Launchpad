import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useLocation, useNavigate } from 'react-router-dom';
import LaunchpadABI from './abis/LaunchpadABI'; // Import the ABI
import './Launchpad.css'; // Import the CSS file

const contractAddress = "0x541B33F20f8FbDD9eeba3bD8f576d882D028a289"; // Replace with your actual deployed contract address

const CreateProject = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { walletAddress = localStorage.getItem('metamaskAddress'), network = localStorage.getItem('network') } = location.state || {};

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);

  const connectMetaMask = async () => {
    // Logic to connect MetaMask (if needed)
  };

  const connectPhantom = async () => {
    // Logic to connect Phantom (if needed)
  };

  const createProject = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, LaunchpadABI, signer);

        // Convert goal amount from ETH to Wei
        const goalAmountWei = ethers.parseEther(goalAmount);

        // Create project transaction
        const tx = await contract.createProject(
          projectName,
          projectDescription,
          goalAmountWei,
          Number(duration)
        );

        // Wait for transaction to be mined
        await tx.wait();

        alert('Project created successfully!');
        // Clear form
        setProjectName('');
        setProjectDescription('');
        setGoalAmount('');
        setDuration('');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const viewProjects = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, LaunchpadABI, provider);

        // Get total number of projects
        const projectCount = await contract.projectCount();
        
        // Navigate to projects page with the count
        navigate('/projects', { 
          state: { 
            walletAddress, 
            network,
            projectCount: projectCount.toString()
          } 
        });
      }
    } catch (error) {
      console.error('Error getting projects:', error);
      alert('Error getting projects: ' + error.message);
    }
  };

  return (
    <>
      <div className="header">
        <div className="header-content">
          <h1>Create New Project</h1>
          {walletAddress && (
            <div className="wallet-info">
              <span>Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
              <span>|</span>
              <span>{network}</span>
            </div>
          )}
        </div>
      </div>

      <div className="container">
        <div className="form-container">
          <div className="button-group">
            <button onClick={() => navigate('/')} className="secondary-button">
              Back to Main Page
            </button>
            <button onClick={viewProjects}>View Projects</button>
          </div>

          <form onSubmit={createProject}>
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="form-group">
              <label>Project Description</label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Describe your project"
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label>Goal Amount (ETH)</label>
              <input
                type="number"
                step="0.01"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                placeholder="Enter goal amount in ETH"
                required
              />
            </div>

            <div className="form-group">
              <label>Duration (in seconds)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Enter project duration"
                required
              />
            </div>

            <button 
              type="submit" 
              className="primary-button"
              disabled={loading}
            >
              {loading ? 'Creating Project...' : 'Create Project'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateProject; 