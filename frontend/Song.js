import React, { useState, useRef, useEffect, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt, faPalette, faCalendarDays, faCompactDisc, faMasksTheater } from '@fortawesome/free-solid-svg-icons';
import { faSpotify } from '@fortawesome/free-brands-svg-icons';

import PopularityBar from './PopularityBar.js';
import { AutoPlayContext } from './index.js';


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
    <>
      <div className={'icon-line-icon'}>
        {children[0]}
      </div>
      <div className={'icon-line-text'}>
        {children[1]}
      </div>
    </>
  );
}

function SongInfo({songJson, stopPlayback}) {
  function calculateArtistsList(artists) {
    let infoLinks = artists.map(artist =>
      <SongInfoLink key={artist.id} infoJson={artist} />
    ).reduce((prev, curr) => [prev, ', ', curr]);
    if (Array.isArray(infoLinks))
      infoLinks[infoLinks.length - 2] = ' & ';
    return infoLinks;
  }

  return (
    <div className={'song-info'}>
      
      <div className={'song-title'}>
        <b><SongInfoLink infoJson={songJson.track}/></b>
      </div>
            
      <IconLine>
        <FontAwesomeIcon icon={faPalette} />
        {calculateArtistsList(songJson.artists)}
      </IconLine>

      <IconLine>
        <FontAwesomeIcon icon={faCompactDisc} />
        <SongInfoLink infoJson={songJson.album} />
      </IconLine>
      
      <IconLine>
        <FontAwesomeIcon icon={faCalendarDays} />
        <div className={'song-date'}> {songJson.release_date.slice(0, 4)} </div>
      </IconLine>

      {songJson.genres.length > 0 ?
        <IconLine>
          <FontAwesomeIcon icon={faMasksTheater} />
          <div className={'song-genres'}> {songJson.genres.join(', ')} </div>
        </IconLine> : null}

      <PopularityBar popularity={songJson.popularity} />
    
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
