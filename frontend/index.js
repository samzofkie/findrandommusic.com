import React , { StrictMode, useState, useRef, createContext, useContext} from "react";
import { createRoot } from "react-dom/client";


function Song({songJson = {}}) {
  const artworkUrl = songJson.artwork_url;
  const playbackUrl = songJson.playback_url;

  const {pause, play} = useContext(PlaybackContext);
  
  const audioRef = useRef();
  const audio = playbackUrl ? 
    <audio ref={audioRef}>
      <source src={playbackUrl} type={'audio/mpeg'} />
    </audio> :
    null;

  const imageRef = useRef();
  
  const handleClick = playbackUrl ?
    () => {pause(); play(audioRef.current);} :
    () => {
      //console.log('No audio playback for this song!');
      imageRef.current.style.opacity = 0.2;
      setTimeout(() => {
        imageRef.current.style.opacity = 1
      }, 1000);
    };

  const image = <img ref={imageRef} src={artworkUrl} onClick={handleClick}/>

  return (
    <div className={'song'}>
      {image}
      {audio}
      <div className={'song-info'}>
        <p>{songJson.song_title}</p>
        <p>{songJson.artist}</p>
        <a href={songJson.link_url}>{songJson.link_url}</a>
      </div>
    </div>
  );
}

function App() {
  const [songs, setSongs] = useState([]);

  function fetchSongs() {
    fetch('/songs')
      .then(res => res.json())
      .then(songJsonStrings =>
        songJsonStrings.map((string) => JSON.parse(string))
      )
      .then(songJsons => 
        songJsons.filter((songJson) => Object.keys(songJson).length > 0)
      )
      .then(setSongs)
  }

  return (
    <>
      {songs.map((songJson, i) => <Song songJson={songJson} key={i}/>)}
      <button onClick={fetchSongs}>Load songs</button>
    </>
  );
}

const PlaybackContext = createContext();

function PlaybackProvider({ children }) {
  const [currentlyPlaying, setCurrentlyPlaying] = useState('');

  function pause() {
    if (currentlyPlaying) {
      currentlyPlaying.pause()
      setCurrentlyPlaying('');
    }
  }

  function play(newAudio) {
    newAudio.play();
    setCurrentlyPlaying(newAudio);
  }

  return (
    <PlaybackContext.Provider value={{ pause, play }}>
      {children}
    </PlaybackContext.Provider>
  );
}

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <PlaybackProvider>
      <App />
    </PlaybackProvider>
  </StrictMode>
);
