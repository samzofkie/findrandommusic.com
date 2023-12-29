import React, { useState, useRef, useEffect, useCallback, useContext } from "react";
import { SONG_WIDTH } from "./SongList.js";
import SongInfo from "./SongInfo.js";
import "./Song.css";
import { PlaybackContext } from "./App.js";

function SongArtwork({ url, hasPreview, previewDisabledMessageVisible }) {
  /* The "artwork-column" div is only necessary to properly center the 
     preview disabled text. */
  return (
    <div className={"artwork-column"}>
    <div className={"artwork"}>
      <img
        src={url}
        style={{ opacity: previewDisabledMessageVisible ? "0.2" : "1" }}
      />
      {hasPreview || (
        <div
          className={"playback-disabled-text"}
          style={{ opacity: previewDisabledMessageVisible ? "1" : "0" }}
        >
          {"Playback disabled for this song :("}
        </div>
      )}
    </div>
    </div>
  );
}

function AudioPlayer({ id, url, isPlaying }) {
  const ref = useRef(null);
  const { pausePlayback, autoPlayOn, playNextSong } =
    useContext(PlaybackContext);
  //url = 'https://www.w3schools.com/html/horse.ogg';

  useEffect(() => {
    if (isPlaying) ref.current.play();
    else ref.current.pause();
  });

  return (
    <audio
      ref={ref}
      onEnded={() => {
        if (autoPlayOn) playNextSong(id);
        else pausePlayback();
      }}
    >
      <source src={url} type={"audio/mpeg"} />
    </audio>
  );
}

export default function Song({ song, index, reportHeight, coord}) {
  /* Whenever the main "song" div's height changes, reportHeight. */
  const ref = useCallback((node) => {
    if (!node) return 0;
    const resizeObserver = new ResizeObserver(() => {
      reportHeight(index, node.offsetHeight);
    });
    resizeObserver.observe(node);
  }, []);

  const [previewDisabledMessageVisible, setPreviewDisabledMessageVisible] = useState(false);
 
  const { currentlyPlayingSong, playSongById } = useContext(PlaybackContext); 
  
  const isPlaying = currentlyPlayingSong === song.id;
  const hasPreview = song.playback_url !== null;

  let style = {width: SONG_WIDTH, top: coord.y, left: coord.x};
  if (isPlaying)
    style.backgroundImage = "linear-gradient(to bottom right, #000000, #000dff, #000000)";

  function tryToPlay() {
    if (hasPreview) playSongById(song.id);
    else {
      setPreviewDisabledMessageVisible(true);
      setTimeout(() => setPreviewDisabledMessageVisible(false), 1000);
    }
  }

  return (
    <div className={"song"}
      style={style}
      ref={ref}
      onClick={tryToPlay}
    >
      <SongArtwork
        url={song.artwork_url}
        hasPreview={hasPreview}
        previewDisabledMessageVisible={previewDisabledMessageVisible}
      />
      <SongInfo song={song} />
      {hasPreview && <AudioPlayer id={song.id} url={song.playback_url} isPlaying={isPlaying} />}
    </div>
  );
}
