import React from 'react';

import Navbar from './components/navbar';
import Routes from './routes';
import Video from './components/videochat';

const App = () => {
  return (
    <div>
      <Navbar />
      <Routes />
      <Video />
    </div>
  );
};

export default App;
