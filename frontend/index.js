import React, { useState, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause } from '@fortawesome/free-solid-svg-icons';

import Song from './Song.js';

function PauseButton({ onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div 
      className={'pause-button-container'} 
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={pressed ? {backgroundColor: '#202020'} : null}
    > 
      <FontAwesomeIcon 
        className={'pause-symbol'} 
        icon={faPause} 
        style={pressed ? {color: '#303030'} : null}
      />
    </div>
  );
}

function App() {
  const [songs, setSongs] = useState([]);
  const [playingSong, setPlayingSong] = useState('');

  function fetchSongs() {
    console.log('fetchin');
    fetch('/songs')
      .then(res => res.json())
      .then(songJsonStrings =>
        songJsonStrings.map(string => JSON.parse(string))
      )
      .then(songJsons =>
        songJsons.filter(json => Object.keys(json).length > 0)
      )
      .then(setSongs)
  }
 
  return (
    <>
      {songs.map((songJson, i) => 
        <Song  
          key={songJson.id} 
          songJson={songJson} 
          isPlaying={playingSong === songJson.id}
          changePlayingSong={setPlayingSong}
        />
      )}
      <button onClick={fetchSongs}>a</button>
      <PauseButton onClick={() => setPlayingSong('')} />
    </>
  );
}

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
