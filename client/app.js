import React from 'react';

import Navbar from './components/Navbar';
import Routes from './routes';
import Video from './components/video';

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
