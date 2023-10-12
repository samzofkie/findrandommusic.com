import React , { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
// import "./styles.css";

function DisplayRack() {
  const [songUrls, setSongUrls] = useState([]);
  
  function loadSongs() {
    fetch('/art')
      .then(res => res.json())
      .then(strings => strings.map(string =>string.split('@')[0]))
      .then(setSongUrls)
  }
  
  const artworkImages = songUrls.map((url, i) => <img key={i} src={url} />);

  return (
    <div className={'display-rack'}>
      {artworkImages}
    </div>
  );
}

function App() {
  return <DisplayRack />;
}

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

/*fetch('/art')
  .then(res => res.json())
  .then(strings => strings.map(string => string.split('@')[0]))
  .then(artUrls => artUrls.map(url => <img src={url}/>))
  .then(imgs => render(imgs, root))*/
