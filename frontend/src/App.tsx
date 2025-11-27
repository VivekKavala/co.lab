import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import Landing from './components/Landing';
import CodeEditor from './components/CodeEditor';
import { useDispatch } from 'react-redux';
import { setRoomId } from './store/roomSlice';

const EditorWrapper: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (roomId) {
      dispatch(setRoomId(roomId));
    }
  }, [roomId, dispatch]);

  if (!roomId) return <div>Invalid Room ID</div>;

  return <CodeEditor roomId={roomId} />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/room/:roomId" element={<EditorWrapper />} />
      </Routes>
    </Router>
  );
}

export default App;
