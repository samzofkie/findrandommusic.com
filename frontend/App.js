import React, { useState, useEffect, createContext } from 'react';

import Song from './Song.js';
import Controls from './Controls.js';
import './App.css';


function Introduction() {
  return (
    <div className={'introduction'}>
      <h1>findrandommusic.com</h1>
      <h3>the only fair way to listen to music</h3>
      <ul>
        <li> {'Click on artwork or around text to hear a preview.'} </li>
        <li> {'Click on the song title to open song in Spotify, album title to open album, or artist name to open artist.'} </li>
        <li> {'The bar with the colored line shows how popular the song is, according to Spotify.'} </li>
      </ul>
    </div>
  );
}

export const AutoPlayContext = createContext({});

function Loader() {
  return (
    <div className={'loader'}></div>
  );
}

export default function App() {
  const [songs, setSongs] = useState([]);
  const [playingSong, setPlayingSong] = useState('');
  const [autoPlayOn, setAutoPlayOn] = useState(false);

  async function fetchSongs() {
    await fetch('/songs')
      .then(res => res.json())
      .then(songJsonStrings => songJsonStrings.map(string => JSON.parse(string)))
      .then(songJsons => songJsons.filter(json => Object.keys(json).length > 0))
      .then(songJsons => setSongs(s => s.concat(songJsons)));
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
    
    if (songs.slice(i).filter(song => song.playback_url !== null).length < 5)
      fetchSongs();
    
    const currentSongDiv = document.getElementsByClassName('song')[i];
    const topPosition = currentSongDiv.offsetTop;
    const divHeight = currentSongDiv.offsetHeight;
    const windowHeight = window.innerHeight;
    
    window.scrollTo(0, topPosition - (windowHeight - divHeight) / 2);
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
        
        <Controls pause={() => setPlayingSong('')} />      
      </AutoPlayContext.Provider>

      <Loader />
    </>
  );
}
