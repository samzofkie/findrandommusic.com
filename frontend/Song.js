import React, { useState, useRef, useEffect } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { faSpotify } from '@fortawesome/free-brands-svg-icons';



function SongArtwork({url, hasPlayback, playPreview}) {
  const [playbackDisabledMessageVisible, setPlaybackDisabledMessageVisible] = useState(false);

  function informNoPlayback() {
      setPlaybackDisabledMessageVisible(true);
      setTimeout(() => setPlaybackDisabledMessageVisible(false), 1000);
  }

  return (
    <div 
      className={'artwork'} 
      onClick={hasPlayback ? playPreview : informNoPlayback}
    >
      <img 
        src={url} 
        style={{opacity: playbackDisabledMessageVisible ? '0.2' : '1'}}
      />
      {hasPlayback || 
        <div
          className={'playback-disabled-text'}
          style={{opacity: playbackDisabledMessageVisible ? '1' : '0'}}
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
  return (
    <div className={'spotify-link'}>
      <a href={url}>
        <FontAwesomeIcon icon={faSpotify} className={'spotify-icon'} />
        <FontAwesomeIcon icon={faExternalLinkAlt} className={'external-link-icon'} />
      </a>
    </div>
  );
}

function SongInfo({songJson}) {
  return (
    <div className={'song-info'}>
      <p className={'title'}><b>{songJson.song_title}</b></p>
      <p className={'artist'}>{songJson.artist}</p>
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
  const hasPlayback = songJson.playback_url !== null;
  return (
    <div className={'song'}>
      <SongArtwork 
        url={songJson.artwork_url} 
        hasPlayback={hasPlayback}
        playPreview={() => changePlayingSong(songJson.id)}
      />
      <SongInfo songJson={songJson} />
      {hasPlayback && <AudioPlayer url={songJson.playback_url} isPlaying={isPlaying} />}
    </div>
  );
}
