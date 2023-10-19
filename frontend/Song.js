import React, { useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { faSpotify } from '@fortawesome/free-brands-svg-icons';



function SongArtwork({url, hasPlayback}) {
  const [playbackDisabledMessageVisible, setPlaybackDisabledMessageVisible] = useState(false);

  function playPreview() {
    // TODO
  }

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
      <div
        className={'playback-disabled-text'}
        style={{opacity: playbackDisabledMessageVisible ? '1' : '0'}}
      >
        {'Playback disabled for this song :('}
      </div>
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

function SongAudio({url}) {
  if (!url)
    return null;
  return (
    <audio>
      <source src={url} type={'audio/mpeg'} />
    </audio>
  );
}

export default function Song({songJson}) {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <div className={'song'}>
      <SongArtwork 
        url={songJson.artwork_url} 
        hasPlayback={songJson.playback_url !== null} 
      />
      <SongInfo songJson={songJson} />
      <SongAudio url={songJson.playback_url} />
    </div>
  );
}
