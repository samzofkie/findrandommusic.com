import React , { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
// import "./styles.css";


function DisplayRack({songs = []}) {
  if (!songs.length) 
    return <div className={'display-rack'}>No songs yet!</div>;

  return (
    <div className={'display-rack'}>
      {songs.map((song, i) => {
        if (song)
          return <img key={i} src={song.split('@')[0]} />
      })}
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

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
