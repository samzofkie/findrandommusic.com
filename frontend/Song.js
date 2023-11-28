import React, { useState, useRef, useEffect, useContext } from 'react';

import SongInfo from './SongInfo.js';
import { AutoPlayContext } from './App.js';


function SongArtwork({url, hasPreview, previewDisabledMessageVisible}) {
  return (
    <div className={'artwork'}>
      <img
        src={url}
        style={{opacity: previewDisabledMessageVisible ? '0.2' : '1'}}
      />
      {hasPreview || 
        <div
          className={'playback-disabled-text'}
          style={{opacity: previewDisabledMessageVisible ? '1' : '0'}}
        >
        { 'Playback disabled for this song :('}
        </div>
      }
    </div>
  );
}


function AudioPlayer({url, isPlaying, stopPlayback, id}) {
  const ref = useRef(null);
  const { autoPlayOn, playNextSong } = useContext(AutoPlayContext);

  //url = 'https://www.w3schools.com/html/horse.ogg';

  useEffect(() => {
    if (isPlaying) 
      ref.current.play();
    else
      ref.current.pause();
  });
  
  return (
    <audio ref={ref} onEnded={() => {
      if (autoPlayOn)
        playNextSong(id);
      else
        stopPlayback();
    }}>
      <source src={url} type={'audio/mpeg'} />
    </audio>
  );
}

export function Song({songJson, isPlaying, changePlayingSong}) {
  const [previewDisabledMessageVisible, setPreviewDisabledMessageVisible] = useState(false);
  const hasPreview = songJson.playback_url !== null;
  
  function handleClick() {
    if (hasPreview)
      changePlayingSong(songJson.id);
    else {
      setPreviewDisabledMessageVisible(true);
      setTimeout(() => setPreviewDisabledMessageVisible(false), 1000);
    }
  }

  const stopPlayback = () => changePlayingSong('');

  return (
    <div 
      className={'song'}
      style={isPlaying ? {
        backgroundImage: 'linear-gradient(to bottom right, #303030, #050505, #303030)',
        } : null}
      onClick={handleClick}
    >
      <SongArtwork 
        url={songJson.artwork_url} 
        hasPreview={hasPreview}
        previewDisabledMessageVisible={previewDisabledMessageVisible}
      />
      
      <SongInfo songJson={songJson} stopPlayback={stopPlayback}/>
      
      {hasPreview && 
        <AudioPlayer 
          url={songJson.playback_url} 
          isPlaying={isPlaying} 
          stopPlayback={stopPlayback} 
          id={songJson.id} 
        />
      }
    </div>
  );
}
