import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt, faPalette, faCalendarDays, faCompactDisc } from '@fortawesome/free-solid-svg-icons';
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

export function PopularityBar({popularity}) {
  return (
    <div className={'popularity-bar'}>
      <hr className={'background-bar'} />
      <hr className={'value-bar'} style={{width: `${popularity * 96 / 100}%`}}/>
    </div>
  );
}

// input infoJson needs to have .name and .url properties
function SongInfoLink({infoJson, stopPlayback}) {
  function followLink(event) {
    event.stopPropagation(event);
    stopPlayback();
    window.open(infoJson.url, 'popUpWindow');
  }

  return (
    <span 
      className={'song-info-link'}
      onClick={followLink}
    >
      {infoJson.name}
    </span>
  );
}

function SongInfo({songJson, stopPlayback}) {
  return (
    <div className={'song-info'}>
      <p className={'title'}><b>
        <SongInfoLink 
          infoJson={songJson.track} 
          stopPlayback={stopPlayback} 
        />
      </b></p>
      <p className={'artists'}>
        <FontAwesomeIcon icon={faPalette} />
        {' '}
        {
          songJson.artists
            .map((artist) => 
              <SongInfoLink infoJson={artist} stopPlayback={stopPlayback} />  
            )
            .reduce((prev, curr) => [prev, ' & ', curr])
        } 
      </p>
      <p className={'album'}>
        <FontAwesomeIcon icon={faCompactDisc} />
        {' '}
        <SongInfoLink infoJson={songJson.album} stopPlayback={stopPlayback} />
      </p>
      <p className={'date'}>
        <FontAwesomeIcon icon={faCalendarDays} />
        {' '}
        {new Date(songJson.release_date).getFullYear()}
      </p>
      <PopularityBar popularity={songJson.popularity} />
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
    <audio ref={ref} onEnded={() => ref.current.play()}>
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

  return (
    <div 
      className={'song'}
      style={isPlaying ? {backgroundColor: '#181818' } : null}
      onClick={handleClick}
    >
      <SongArtwork 
        url={songJson.artwork_url} 
        hasPreview={hasPreview}
        previewDisabledMessageVisible={previewDisabledMessageVisible}
      />
      <SongInfo songJson={songJson} stopPlayback={() => changePlayingSong('')}/>
      {hasPreview && <AudioPlayer url={songJson.playback_url} isPlaying={isPlaying} />}
    </div>
  );
}
