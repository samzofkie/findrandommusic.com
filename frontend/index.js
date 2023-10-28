import React, { useState, StrictMode, useEffect } from 'react';
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
    //console.log('fetchin');
    fetch('/songs')
      .then(res => res.json())
      .then(songJsonStrings =>
        songJsonStrings.map(string => JSON.parse(string))
      )
      .then(songJsons =>
        songJsons.filter(json => Object.keys(json).length > 0)
      )
      .then(songJsons => {
        setSongs(s => s.concat(songJsons));
      })
  }

  function scrollRatio() {
    const html = document.documentElement;
    const totalHeight = html.offsetHeight;
    const windowHeight = html.clientHeight;
    const ratio = (window.scrollY + windowHeight) / totalHeight;
    if (ratio > 0.8)
      fetchSongs();
  }

  useEffect(() => {
    document.onscrollend = scrollRatio;
    fetchSongs();  
  }, []);
 
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
      <PauseButton onClick={() => setPlayingSong('')} />
    </>
  );
}

const root = createRoot(document.getElementById('root'));
window.addEventListener('load', () => window.scroll(0,0));

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
