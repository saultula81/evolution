import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Battery,
  Signal,
  Circle,
  Triangle,
  Square,
  Camera,
  Layers,
  Home as HomeIcon,
  Search,
  User,
  Settings,
  Grid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Smartphone = ({ children, isDarkMode, batteryLevel }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="smartphone">
      <div className="notch">
        <div className="camera-lens"></div>
      </div>
      <div className={`smartphone-screen ${isDarkMode ? 'dark' : ''}`}>
        {/* Status Bar */}
        <div className="status-bar">
          <div className="status-left">
            <span>{formatTime(time)}</span>
          </div>
          <div className="status-right">
            <Signal size={12} fill="white" />
            <Wifi size={12} />
            <div className="battery-container">
              <span style={{ fontSize: '10px' }}>{batteryLevel}%</span>
              <Battery size={12} />
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="content-container">
          {children}
        </div>

        {/* Navigation Bar */}
        <div className="navigation-bar glass">
          <Triangle className="nav-icon rotate-[-90deg]" size={16} />
          <Circle className="nav-icon" size={16} />
          <Square className="nav-icon" size={16} />
        </div>
      </div>
    </div>
  );
};

const AppIcon = ({ icon: Icon, label, color, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    className="app-icon-container"
    onClick={onClick}
  >
    <div className="app-icon" style={{ backgroundColor: color }}>
      <Icon size={24} color="white" />
    </div>
    <span className="app-label">{label}</span>
  </motion.button>
);

const App = () => {
  const [activeApp, setActiveApp] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(85);

  const apps = [
    { id: 'auctions', label: 'Subastas', icon: Layers, color: '#3b82f6', url: 'http://localhost:5173/proyectos/auction-app/index.html' },
    { id: 'camera', label: 'Cámara Dual', icon: Camera, color: '#ec4899', url: '/camera' },
    { id: 'settings', label: 'Ajustes', icon: Settings, color: '#64748b' },
    { id: 'browser', label: 'Chrome', icon: Grid, color: '#fbbf24' },
  ];

  return (
    <div className="simulator-container">
      {/* Simulation Controls */}
      <div className="side-controls glass">
        <h2>KSM Testing Hub</h2>
        <p>Advanced Android Simulation</p>

        <div className="control-group">
          <label>Hardware Simulation</label>
          <div className="toggle-row">
            <span>Dark Mode</span>
            <button
              className={`toggle ${isDarkMode ? 'on' : ''}`}
              onClick={() => setIsDarkMode(!isDarkMode)}
            />
          </div>
          <div className="slider-row">
            <span>Battery: {batteryLevel}%</span>
            <input
              type="range"
              min="0" max="100"
              value={batteryLevel}
              onChange={(e) => setBatteryLevel(e.target.value)}
            />
          </div>
        </div>

        <div className="project-info">
          <h3>Active Project</h3>
          <div className="info-card">
            {activeApp ? apps.find(a => a.id === activeApp)?.label : 'System Desktop'}
          </div>
        </div>

        <button
          className="reset-btn"
          onClick={() => setActiveApp(null)}
        >
          Reset Simulation
        </button>
      </div>

      {/* Main Device */}
      <Smartphone isDarkMode={isDarkMode} batteryLevel={batteryLevel}>
        <AnimatePresence mode="wait">
          {!activeApp ? (
            <motion.div
              key="desktop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="desktop-grid"
            >
              <div className="apps-grid">
                {apps.map(app => (
                  <AppIcon key={app.id} {...app} onClick={() => setActiveApp(app.id)} />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="app-runner"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="app-runner"
            >
              {activeApp === 'camera' ? (
                <div className="empty-app">
                  <Camera size={48} />
                  <span>Dual Camera Mode</span>
                  <p>Initializing Native Bridge...</p>
                </div>
              ) : (
                <iframe
                  src={apps.find(a => a.id === activeApp)?.url}
                  title="App View"
                  className="app-iframe"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Smartphone>
    </div>
  );
};

export default App;
