import React , { StrictMode, useState, useRef, createContext, useContext} from "react";
import { createRoot } from "react-dom/client";
// import "./styles.css";


function Song({songJson = {}}) {
  if (Object.keys(songJson).length !== 0) {
    const artworkUrl = songJson.artwork_url;
    const playbackUrl = songJson.playback_url;

    const {pause, play} = useContext(PlaybackContext);
    
    const audioRef = useRef();
    const audio = playbackUrl ? 
      <audio ref={audioRef}>
        <source src={playbackUrl} type={'audio/mpeg'} />
      </audio> :
      null;

    const handleClick = playbackUrl ?
      () => {pause(); play(audioRef.current);} :
      () => console.log('No audio playback for this song!');

    const image = <img src={artworkUrl} onClick={handleClick}/>

    return (
      <div className={'song'}>
        {image}
        {audio}
      </div>
    );
  }
}

function DisplayRack({songs = []}) {
  if (!songs.length) 
    return <div className={'display-rack'}>No songs yet!</div>;

  return (
    <div className={'display-rack'}>
      {songs.map((songJson, i) => <Song songJson={songJson} key={i}/>)}
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
      .then(setSongs)
  }

  return (
    <>
      <DisplayRack songs={songs} />
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
