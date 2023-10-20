import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { faSpotify } from '@fortawesome/free-brands-svg-icons';


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

function PopularityBar({popularity}) {
  return (
    <div className={'popularity-bar'}>
      <hr className={'background-bar'} />
      <hr className={'value-bar'} style={{width: `${popularity * 96 / 100}%`}}/>
    </div>
  );
}

function SpotifyLink({url}) {
  function handleClick(event) {
    event.stopPropagation();
    window.open(url, 'popUpWindow');
  }
  return (
    <div 
      className={'spotify-link'} 
      onClick={handleClick} 
    >
        <FontAwesomeIcon icon={faSpotify} className={'spotify-icon'} />
        <FontAwesomeIcon icon={faExternalLinkAlt} className={'external-link-icon'} />
    </div>
  );
}

function SongInfo({songJson}) {
  return (
    <div className={'song-info'}>
      <p className={'title'}><b>{songJson.song_title}</b></p>
      <p className={'artist'}>{songJson.artists.join(' & ')}</p>
      <p className={'date'}>{new Date(songJson.release_date).getFullYear()}</p>
      <PopularityBar popularity={songJson.popularity} />
      <SpotifyLink url={songJson.link_url} />
    </div>

  );
}

function AudioPlayer({url, isPlaying}) {
  const ref = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      ref.current.play();
    } else
      ref.current.pause();
  });

  return (
    <audio ref={ref}>
      <source src={url} type={'audio/mpeg'} />
    </audio>
  );
}

export default function Song({songJson, isPlaying, changePlayingSong}) {
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

  return (
    <div 
      className={'song'}
      style={isPlaying ? {outline: '5px solid white' } : null}
      onClick={handleClick}
    >
      <SongArtwork 
        url={songJson.artwork_url} 
        hasPreview={hasPreview}
        previewDisabledMessageVisible={previewDisabledMessageVisible}
      />
      <SongInfo songJson={songJson} />
      {hasPreview && <AudioPlayer url={songJson.playback_url} isPlaying={isPlaying} />}
    </div>
  );
}
