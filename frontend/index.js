import React, { useState, StrictMode, useEffect, useContext, createContext } from 'react';
import { createRoot } from 'react-dom/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCirclePause, faCirclePlay, faCircleStop, } from '@fortawesome/free-solid-svg-icons';
import { faSpotify } from '@fortawesome/free-brands-svg-icons';

import { Song, PopularityBar } from './Song.js';


function Introduction() {
  return (
    <div className={'introduction'}>
      <h1>findrandommusic.com</h1>
      <h3>the only fair way to listen to music</h3>
      <ul>
        <li> {'Click on artwork or around text to hear a preview'} </li>
        <li> {'Click on the song title to open song in Spotify, album title to open album, or artist name to open artist.'} </li>
        <li> {'The bar with the colored line shows how popular the song is, according to Spotify'} </li>
      </ul>
    </div>
  );
}

function PauseButton({ onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div>
      <FontAwesomeIcon 
        className={'pause-symbol'} 
        icon={faCirclePause} 
        style={pressed ? {color: '#303030'} : null}
        onClick={onClick}
      />
    </div>
  );
}

export const AutoPlayContext = createContext({});

function AutoPlayButton() {
  const { autoPlayOn, setAutoPlayOn } = useContext(AutoPlayContext);
  
  return (
    <div className={'auto-play-button'}>
      <FontAwesomeIcon
        className={'auto-play-symbol'}
        icon={autoPlayOn ? faCircleStop : faCirclePlay}
        onClick={() => setAutoPlayOn(!autoPlayOn)}
        style={autoPlayOn ? {outline: '5px solid #821fbf'} : null}
      />
      <div className={'auto-play-button-label'}>{'Auto Play'}</div>
    </div>
  );
}

function ButtonBar({pauseSong}) {
  return (
    <div className={'button-bar'}> 
      <AutoPlayButton />
      <PauseButton onClick={pauseSong} />
    </div>
  );
}

function App() {
  const [songs, setSongs] = useState([]);
  const [playingSong, setPlayingSong] = useState('');
  const [autoPlayOn, setAutoPlayOn] = useState(false);

  async function fetchSongs() {
    await fetch('/songs')
      .then(res => res.json())
      .then(songJsonStrings =>
        songJsonStrings.map(string => JSON.parse(string))
      )
      .then(songJsons =>
        songJsons.filter(json => Object.keys(json).length > 0)
      )
      .then(songJsons => {
        setSongs(s => s.concat(songJsons));
      });
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

  function playNextSong(currentId) {
    const songIds = songs.map(song => song.id);
    let i = songIds.indexOf(currentId) + 1;
    while (songs[i].playback_url === null)
      i++;
    setPlayingSong(songIds[i]);
  }
 
  return (
    <>
      <Introduction />
      
      <AutoPlayContext.Provider value={{autoPlayOn, setAutoPlayOn, playNextSong}}>
        {songs.map((songJson, i) => 
          <Song  
            key={songJson.id} 
            songJson={songJson} 
            isPlaying={playingSong === songJson.id}
            changePlayingSong={setPlayingSong}
          />
        )}
        
        <ButtonBar pauseSong={() => setPlayingSong('')} />
      </AutoPlayContext.Provider>

      <div className={'loader'}></div>
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
