import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setRoomId } from '../store/roomSlice';
import Header from './Header';

const Landing: React.FC = () => {
  const [inputRoomId, setInputRoomId] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const createRoom = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/rooms`);
      const newRoomId = response.data.roomId;
      dispatch(setRoomId(newRoomId));
      navigate(`/room/${newRoomId}`);
    } catch (error) {
      console.error("Failed to create room", error);
      alert("Failed to create room");
    }
  };

  const joinRoom = () => {
    if (inputRoomId.trim()) {
      dispatch(setRoomId(inputRoomId));
      navigate(`/room/${inputRoomId}`);
    }
  };

  return (
    <>
      <Header />
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        flexDirection: 'column' 
      }}>
        <div className="card">
          <h1 style={{ marginBottom: '2rem', fontSize: '2.5rem' }}>
            Welcome to <span style={{ color: '#61dafb' }}>Co.Lab</span>
          </h1>
          <p style={{ marginBottom: '2rem', color: '#aaa' }}>
            Real-time collaborative code editor for pair programming.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="btn-primary" onClick={createRoom}>
              Create New Room
            </button>
            
            <div style={{ margin: '1rem 0', color: '#666' }}>- OR -</div>
            
            <div style={{ display: 'flex' }}>
              <input
                type="text"
                placeholder="Enter Room ID"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
              />
              <button onClick={joinRoom}>
                Join Room
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Landing;
