import React, { useState, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Song from './Song.js';


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

  function changePlayingSong(id) {
    setPlayingSong(id); 
  }

  return (
    <>
      {songs.map((songJson, i) => 
        <Song  
          key={songJson.id} 
          songJson={songJson} 
          isPlaying={playingSong === songJson.id}
          changePlayingSong={changePlayingSong}
        />
      )}
      <button onClick={fetchSongs}>a</button>
    </>
  );
}

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
