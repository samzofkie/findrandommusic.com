import React, { useState, useRef, useEffect } from "react";
import { nanoid } from "nanoid";
import "./App.css";
import SongList from "./SongList.js";
import Controls, {
  dateFilterBounds,
  popularityFilterBounds,
} from "./Controls.js";

function Introduction() {
  return (
    <div className={"introduction"}>
      <h1>findrandommusic.com</h1>
      <h3>the only fair way to listen to music</h3>
      <ul>
        <li> {"Click on artwork or around text to hear a preview."} </li>
        <li>
          {
            "Click on the song title to open song in Spotify, album title to open album, or artist name to open artist."
          }
        </li>
        <li>
          {
            "The bar with the colored line shows how popular the song is, according to Spotify."
          }
        </li>
      </ul>
    </div>
  );
}

function Loader() {
  return <div className={"loader"}></div>;
}

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
  const filterParams = useRef({
    id: nanoid(),
    dateStart: dateFilterBounds.start,
    dateEnd: dateFilterBounds.end,
    popularityStart: popularityFilterBounds.start,
    popularityEnd: popularityFilterBounds.end,
    genres: [],
  });

  function setFilterParams(newParams) {
    filterParams.current = newParams;
    clearSongs();
    fetchSongs();
  }

  /* fetchSongs() and it's helper buildQueryString() encode the filterParams
     object as a proper query string, make the request to the '/songs'
     endpoint on the backend, and then append the new songs to the current
     songs array. It is used in sequence with clearSongs() by different child
     components of <Controls/> to clear old songs and load new ones. */
  function buildQueryString() {
    let songsParams = new URLSearchParams(filterParams.current);

    function ifBoundsUnchangedOmit(name, bounds) {
      if (
        songsParams.get(name + "Start") === bounds.start.toString() &&
        songsParams.get(name + "End") === bounds.end.toString()
      ) {
        songsParams.delete(name + "Start");
        songsParams.delete(name + "End");
      }
    }

    ifBoundsUnchangedOmit("date", dateFilterBounds);
    ifBoundsUnchangedOmit("popularity", popularityFilterBounds);

    if (songsParams.get("genres").length < 1) songsParams.delete("genres");

    return songsParams.toString() === "" ? "" : "?" + songsParams.toString();
  }

  async function fetchSongs() {
    try {
      const url = "/songs" + buildQueryString();
      console.log("Fetching " + url);
      const response = await fetch(url);
      let songs = await response.json();
      songs = songs
        .map(JSON.parse)
        .filter((song) => song !== null)
        .filter((json) => Object.keys(json).length > 0);
      if (songs.length === 0)
        console.error("GETting " + url + " returned 0 songs!");
      setSongs((s) => s.concat(songs));
    } catch (error) {
      console.error("fetchSongs() error:");
      throw error;
    }
  }

  /* checkIfMoreSongsNeeded() hits fetchSongs() if we are nearing the end of 
     the scrollable content. */
  function percentageDownThePage() {
    const { offsetHeight, clientHeight } = document.documentElement;
    return (window.scrollY + clientHeight) / offsetHeight;
  }

  function checkIfMoreSongsNeeded() {
    if (percentageDownThePage() > 0.8) fetchSongs();
  }

  /* This has the <App/> component call fetchSongs() on load. */
  useEffect(() => {
    let initialSongsRequestMade = false;
    if (!initialSongsRequestMade) fetchSongs();
    document.onscrollend = checkIfMoreSongsNeeded;
    return () => {
      initialSongsRequestMade = true;
      document.removeEventListener("onscrollend", checkIfMoreSongsNeeded);
    };
  }, []);


  /* This stuff is for expanding / collapsing the <Controls/> component. */
  const [controlsExpanded, setControlsExpanded] = useState(false);
  
  const controlsCollapsedWidth = 5;
  const controlsExpandedWidth = 35;

  function createColumnStyle(widthPercentage) {
    return { gridTemplateColumns: 100 - widthPercentage + "% " + widthPercentage + "%" };
  }

  const columnsStyle = createColumnStyle(controlsExpanded ? controlsExpandedWidth : controlsCollapsedWidth);
    
  function toggleControls() {
    setControlsExpanded(!controlsExpanded);
  }

  return (
    <div className={"app"} style={columnsStyle}>
      <div className={"main-content"}>
        <Introduction />
        <SongList songs={songs}/>
        <Loader />
      </div>
      <Controls toggleControls={toggleControls} />
    </div>
  );
}
