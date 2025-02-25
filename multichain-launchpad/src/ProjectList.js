import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useLocation, useNavigate } from 'react-router-dom';
import LaunchpadABI from './abis/LaunchpadABI';
import './Launchpad.css';

const contractAddress = "0x541B33F20f8FbDD9eeba3bD8f576d882D028a289";

const ProjectList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { walletAddress = localStorage.getItem('metamaskAddress'), network = localStorage.getItem('network') } = location.state || {};

  const [projectId, setProjectId] = useState('');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProject = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, LaunchpadABI, provider);

        console.log('Fetching project with ID:', projectId);
        const projectData = await contract.getProject(projectId);
        console.log('Project data:', projectData);

        if (projectData && projectData.name) {
          setProject({
            id: projectId,
            name: projectData.name,
            description: projectData.description,
            goalAmount: ethers.formatEther(projectData.goalAmount),
            deadline: new Date(Number(projectData.deadline) * 1000).toLocaleString(),
            creator: projectData.creator,
            currentAmount: ethers.formatEther(projectData.currentAmount),
            isCompleted: projectData.isCompleted
          });
        } else {
          setError('Project not found');
        }
      }
    } catch (error) {
      console.error('Error loading project:', error);
      setError('Error loading project: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (current, goal) => {
    const progress = (Number(current) / Number(goal)) * 100;
    return Math.min(progress, 100);
  };

  return (
    <>
      <div className="header">
        <div className="header-content">
          <h1>View Project</h1>
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
        <div className="button-group">
          <button onClick={() => navigate('/')} className="secondary-button">
            Back to Main Page
          </button>
        </div>

        <div className="form-container">
          <form onSubmit={loadProject}>
            <div className="form-group">
              <label>Enter Project ID</label>
              <input
                type="number"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Enter project ID"
                required
                min="0"
              />
            </div>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Loading...' : 'View Project'}
            </button>
          </form>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-spinner">
            <p>Loading project...</p>
          </div>
        ) : project ? (
          <div className="projects-grid">
            <div className="project-card">
              <h3>{project.name}</h3>
              <div className="project-info">
                <p>{project.description}</p>
                
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${calculateProgress(project.currentAmount, project.goalAmount)}%` }}
                  />
                </div>
                
                <div className="info-row">
                  <span className="info-label">Progress</span>
                  <span className="info-value">
                    {calculateProgress(project.currentAmount, project.goalAmount).toFixed(2)}%
                  </span>
                </div>

                <div className="info-row">
                  <span className="info-label">Raised</span>
                  <span className="info-value">
                    {project.currentAmount} / {project.goalAmount} ETH
                  </span>
                </div>
                
                <div className="info-row">
                  <span className="info-label">Deadline</span>
                  <span className="info-value">{project.deadline}</span>
                </div>
                
                <div className="info-row">
                  <span className="info-label">Creator</span>
                  <span className="info-value">
                    {project.creator.slice(0, 6)}...{project.creator.slice(-4)}
                  </span>
                </div>
                
                <div className="info-row">
                  <span className="info-label">Status</span>
                  <span className={`status-badge ${project.isCompleted ? 'status-completed' : 'status-active'}`}>
                    {project.isCompleted ? 'Completed' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

export default ProjectList; 