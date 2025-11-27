import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      padding: '1rem 2rem',
      backgroundColor: '#1e1e1e',
      color: '#fff',
      borderBottom: '1px solid #333'
    }}>
      <div 
        onClick={() => navigate('/')} 
        style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <span style={{ color: '#61dafb' }}>&lt;/&gt;</span> Co.Lab
      </div>
    </header>
  );
};

export default Header;
