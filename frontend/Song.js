import React, { useState, useRef, useEffect, useContext } from "react";

import SongInfo from "./SongInfo.js";
import { PlaybackContext } from "./App.js";
import "./Song.css";

function SongArtwork({ url, hasPreview, previewDisabledMessageVisible }) {
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

export default function Song({ song, isPlaying }) {
  const [previewDisabledMessageVisible, setPreviewDisabledMessageVisible] =
    useState(false);
  const { playSongById } = useContext(PlaybackContext);
  const hasPreview = song.playback_url !== null;

  function handleClick() {
    if (hasPreview) playSongById(song.id);
    else {
      setPreviewDisabledMessageVisible(true);
      setTimeout(() => setPreviewDisabledMessageVisible(false), 1000);
    }
  }

  return (
    <div
      className={"song"}
      style={
        isPlaying
          ? {
              backgroundImage:
                "linear-gradient(to bottom right, #303030, #050505, #303030)",
            }
          : null
      }
      onClick={handleClick}
    >
      <SongArtwork
        url={song.artwork_url}
        hasPreview={hasPreview}
        previewDisabledMessageVisible={previewDisabledMessageVisible}
      />

      <SongInfo song={song} />

      {hasPreview && (
        <AudioPlayer
          id={song.id}
          url={song.playback_url}
          isPlaying={isPlaying}
        />
      )}
    </div>
  );
}
