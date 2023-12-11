import React, { useState, useRef, useEffect, createContext } from 'react';
import { nanoid } from 'nanoid';

import Song from './Song.js';
import Controls from './Controls.js';
import './App.css';


function Introduction() {
  return (
    <div className={'introduction'}>
      <h1>findrandommusic.com</h1>
      <h3>the only fair way to listen to music</h3>
      <ul>
        <li> {'Click on artwork or around text to hear a preview.'} </li>
        <li> {'Click on the song title to open song in Spotify, album title to open album, or artist name to open artist.'} </li>
        <li> {'The bar with the colored line shows how popular the song is, according to Spotify.'} </li>
      </ul>
    </div>
  );
}

function Loader() {
  return (
    <div className={'loader'}></div>
  );
}

export const AutoPlayContext = createContext({});

export default function App() {
  /* Each song is a JSON object that gets fed to a <Song/> */
  const [songs, setSongs] = useState([]);
  
  /* This is used by components in <Controls/> to flush the songs that no
     longer match the filter settings. */
  function clearSongs() {
    setSongs([]);
  }

  /* The filterParams ref keeps track of the current settings indicated 
     by the user via <Controls/>, and it is updated by setFilterParams, which
     is passed to <Controls/>. The settings are encoded in an object. */
  const filterParams = useRef({});
 
  function setFilterParams(newParams) {
    filterParams.current = newParams;
  }

  /* fetchSongs() and it's helper buildQueryString() encode the filterParams
     object as a proper query string, make the request to the '/songs'
     endpoint on the backend, and then append the new songs to the current
     songs array. It is used in sequence with clearSongs() by different child
     components of <Controls/> to clear old songs and load new ones. */
  function buildQueryString() { 
    const paramString = new URLSearchParams(filterParams.current).toString();
    return paramString === '' ? '' : '?' + paramString;
  }

   async function fetchSongs() {
    try {
      const url = '/songs' + buildQueryString();
      console.log('fetchin', url);
      const response = await fetch(url);
      let songs = await response.json();
      songs = songs.map(JSON.parse).filter(json => Object.keys(json).length > 0);
      setSongs(s => s.concat(songs));
    } catch (error) {
      console.log('got an err');
      throw error;
    }
  }

  /* The currentlyPlayingSong state variable is a string id of the song
     that should be playing right now. It can be set to the empty string to
     pauser the playback. */
  const [currentlyPlayingSong, setCurrentlyPlayingSong] = useState('');

  /* This is used by the <PauseButton/>. */
  function pausePlayback() {
    setCurrentlyPlayingSong('');
  }
  
  // TODO: Should this be a ref instead of state?
  //       Do we need AutoPlayContext or could we pass props?
  /* The autoPlayOn boolean state is set by a component in <Controls/>, and
     lets <Song/>s know whether or not to call playNextSong() when the playing
     of their audio preview ends. autoPlayOn, toggleAutoPlay, and playNextSong
     are put into the AutoPlayContext that goes around the <Song/>s and 
     <Controls/> components. */
  const [autoPlayOn, setAutoPlayOn] = useState(false);
  
  function toggleAutoPlay() {
    setAutoPlayOn(!autoPlayOn);
  }

  /* lookupNextPlayableSongIndex() assumes that the song JSON object in the songs
     array that matches it's id argument is playable (i.e. it's playback_url
     property !== null). */
  function lookupNextPlayableSongIndex(id) {
    const playableSongsIds = songs.filter(song => song.playback_url !== null)
      .map(song => song.id);
    const nextPlayableSongId = playableSongsIds[playableSongsIds.indexOf(id) + 1];
    return songs.map(song => song.id).indexOf(nextPlayableSongId);
  }

  function scrollToSongDiv(songDiv) {
    const topPosition = songDiv.offsetTop;
    const divHeight = songDiv.offsetHeight;
    window.scrollTo(0, topPosition - (window.innerHeight - divHeight) / 2);

  }

  function numberOfPlayableSongsAfter(i) {
    return songs.slice(i).filter(song => song.playback_url !== null).length;
  }

  function playNextSong(currentId) {
    const i = lookupNextPlayableSongIndex(currentId);   
    setCurrentlyPlayingSong(songs[i].id);
    if (numberOfPlayableSongsAfter(i) < 5)
      fetchSongs();
    scrollToSongDiv(document.getElementsByClassName('song')[i]);
  }

  /* checkIfMoreSongsNeeded() hits fetchSongs() if we are nearing the end of 
     the scrollable content. */
  function percentageDownThePage() {
    const {offsetHeight, clientHeight} = document.documentElement;
    return (window.scrollY + clientHeight) / offsetHeight;
  }

  function checkIfMoreSongsNeeded() {
    if (percentageDownThePage() > 0.8)
      fetchSongs();
  }

  useEffect(() => {
    filterParams.current .id= nanoid();
    let initialSongsRequestMade = false;
    if (!initialSongsRequestMade)
      fetchSongs();
    document.onscrollend = checkIfMoreSongsNeeded;
    return () => {
      initialSongsRequestMade = true;
      document.removeEventListener('onscrollend', checkIfMoreSongsNeeded);
    };
  }, []);

   
  return (
    <>
      <Introduction />
      
      <AutoPlayContext.Provider value={{autoPlayOn, toggleAutoPlay, playNextSong}}>      
        {songs.map(songJson  => 
          <Song  
            key={songJson.id} 
            songJson={songJson} 
            isPlaying={currentlyPlayingSong === songJson.id}
            changePlayingSong={setCurrentlyPlayingSong}
          />
        )}
        
        <Controls 
          pause={pausePlayback} 
          id={filterParams.current.id} 
          clearSongs={clearSongs} 

          setSongsUrl={setFilterParams}
          fetchSongs={fetchSongs}
        />      
      </AutoPlayContext.Provider>

      <Loader />
    </>
  );
}
