import React, { useState } from 'react';
import { ethers } from 'ethers';
import LaunchpadABI from './abis/LaunchpadABI';// Import your contract ABI

const ViewProject = () => {
  const [projectId, setProjectId] = useState('');
  const [projectDetails, setProjectDetails] = useState(null);
  const [error, setError] = useState('');

  // Define the contract instance
  const contractAddress = '0x541B33F20f8FbDD9eeba3bD8f576d882D028a289'; // Replace with your contract address
  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(contractAddress, LaunchpadABI, provider.getSigner());

  const fetchProjectDetails = async () => {
    if (!projectId) {
      setError('Please enter a valid Project ID.');
      return;
    }

    console.log("Fetching details for Project ID:", projectId);

    const projectIdNumber = Number(projectId);
    if (isNaN(projectIdNumber) || projectIdNumber <= 0) {
      setError('Project ID must be a valid positive number.');
      return;
    }

    try {
      // Call the projects function to get project details
      const projectDetails = await contract.projects(projectIdNumber); // Use the projects function
      setProjectDetails(projectDetails);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error(err);
      setError('Error loading project: ' + err.message);
    }
  };

  return (
    <div>
      <h2>View Project</h2>
      <input
        type="text"
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
        placeholder="Enter Project ID"
      />
      <button onClick={fetchProjectDetails}>Fetch Project Details</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {projectDetails && (
        <div>
          <h3>Project Details:</h3>
          <pre>{JSON.stringify(projectDetails, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ViewProject; 