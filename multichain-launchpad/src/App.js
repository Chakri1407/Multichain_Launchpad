import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './MainPage';
import CreateProject from './CreateProject';
import ProjectList from './ProjectList';
import ViewProject from './ViewProject';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/polygon" element={<CreateProject />} />
        <Route path="/solana" element={<CreateProject />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/view-project" element={<ViewProject />} />
      </Routes>
    </Router>
  );
};

export default App;
