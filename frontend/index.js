import React , { StrictMode, useState, useRef, createContext, useContext} from "react";
import { createRoot } from "react-dom/client";
// import "./styles.css";


function Song({songString=''}) {
  if (songString) {
    const audioRef = useRef();
    const {pause, play} = useContext(PlaybackContext);
    
    const [artworkUrl, playbackUrl] = songString.split('@');
 
    const audio = (
      <audio ref={audioRef}>
        <source src={playbackUrl} type={'audio/mpeg'} />
      </audio>
    );

    const image = <img src={artworkUrl} onClick={() => {pause(); play(audioRef.current);}}/>;
    
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
      {songs.map((songString, i) => <Song songString={songString} key={i}/>)}
    </div>
  );
}

function App() {
  const [songs, setSongs] = useState([]);

  function fetchSongs() {
    fetch('/songs')
      .then(res => res.json())
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
    console.log('trying to pause:');
    console.log(currentlyPlaying);
    if (currentlyPlaying) {
      console.log('in pause if.');
      currentlyPlaying.pause()
      setCurrentlyPlaying('');
    }
  }

  function play(newAudio) {
    console.log('trying to play:');
    console.log(newAudio);
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
