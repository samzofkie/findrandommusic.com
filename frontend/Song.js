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
    <div className={'song-popularity-bar'}>
      <hr className={'background-bar'} />
      <hr className={'value-bar'} style={{width: `${popularity * 96 / 100}%`}}/>
    </div>
  );
}

// input infoJson needs to have .name and .url properties
function SongInfoLink({infoJson}) {
  return (
    <a href={infoJson.url} target={'_blank'} className={'song-info-link'}>
      {infoJson.name}
    </a>
  );
}

function IconLine({children}) {
  return (
    <div className={'song-icon-line'}>
      <div className={'icon-line-icon'}>
        {children[0]}
      </div>
      <div>
        {children[1]}
      </div>
    </div>
  );
}

function SongInfo({songJson, stopPlayback}) {
  return (
    <div className={'song-info'}>
      
      <span className={'song-title'}>
        <b><SongInfoLink infoJson={songJson.track}/></b>
      </span>
            
      <IconLine>
        <FontAwesomeIcon icon={faPalette} />
        {
          songJson.artists
            .map((artist) => 
              <SongInfoLink key={artist.name} infoJson={artist} />  
            )
            .reduce((prev, curr) => [prev, ' & ', curr])
        }
      </IconLine>

      <IconLine>
        <FontAwesomeIcon icon={faCompactDisc} />
        <SongInfoLink infoJson={songJson.album} />
      </IconLine>
      
      <IconLine>
          <FontAwesomeIcon icon={faCalendarDays} />
          {songJson.release_date.slice(0, 4)}
      </IconLine>
      
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
      <SongInfo songJson={songJson} stopPlayback={() => changePlayingSong('')}/>
      {hasPreview && <AudioPlayer url={songJson.playback_url} isPlaying={isPlaying} />}
    </div>
  );
}
