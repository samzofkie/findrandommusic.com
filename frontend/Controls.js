import React, { useState, useRef, useEffect, useContext, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCirclePause, faCirclePlay, faCircleStop, faSliders, faX } from '@fortawesome/free-solid-svg-icons';
import MultiRangeSlider from "multi-range-slider-react";

import './Controls.css';
import './MultiRangeSlider.css';
import './ToggleSwitch.css';
import { PlaybackContext } from './App.js';


function ToggleButton({ onClick }) {
  return (
    <label className={"switch"}>
      <input type="checkbox" onClick={onClick} />
      <span className={"slider round"}></span>
    </label>
  );
}

function MultiRangeSliderControl({ range, bounds, setRange, onSettingsChange }) {
  function onChange(sliderValues) {
    setRange({
      'start': sliderValues.minValue,
      'end': sliderValues.maxValue
    });
    onSettingsChange();
  }

  return (
    <MultiRangeSlider ruler={false} label={false} 
      min={bounds.start} max={bounds.end}
      minValue={range.start} maxValue={range.end}
      onChange={onChange}
    />
  );
}

function FilterSettingsMenu({ controlsExpanded, toggleExpand, id, clearSongs, setSongsUrl, fetchSongs }) {
  const { autoPlayOn, toggleAutoPlay } = useContext(PlaybackContext);
  
  const dateBounds = {'start': 1900, 'end': new Date().getFullYear()};
  const dateRef = useRef(dateBounds);
  const setDateRange = obj => dateRef.current = obj;

  const popularityBounds = {'start': 0, 'end': 100};
  const popularityRef = useRef(popularityBounds);
  const setPopularityRange = obj => popularityRef.current = obj;

  const genres = useRef([]);
  const [selectedGenres, setSelectedGenres] = useState([]);

  async function fetchGenreList() {
    await fetch('/genre-list')
      .then(res => res.json())
      .then(arr => genres.current = arr);
  }

  function onSettingsChange() {
    let data = {
      'id': id,
      'date_start': dateRef.current.start,
      'date_end': dateRef.current.end,
      'popularity_start': popularityRef.current.start,
      'popularity_end': popularityRef.current.end,
      'genres': selectedGenres.join(',')
    };
    let url = new URL(document.location.href + 'songs');
    for (let setting in data) 
      url.searchParams.append(setting, data[setting]);
    clearSongs();
    setSongsUrl(url);
    //fetchSongs();
  }

  useEffect(() => {
    fetchGenreList();
  }, []);

  useEffect(() => {
    onSettingsChange();
  }, [selectedGenres]);

  return (
    <div className={'filter-menu'} style={controlsExpanded ? {border: '3px solid white'} : null} >
      <div className={'first-line'}> 
        <div className={'filter-menu-button'} style={controlsExpanded ? {fontSize: '3vw'} : null} >
          <FontAwesomeIcon 
            icon={controlsExpanded ? faX : faSliders} 
            onClick={toggleExpand}
          />
        </div>
          
        { !controlsExpanded ? null :
          <div className={'auto-play control'}>
            <span>{'Auto play'}</span>
            <ToggleButton onClick={toggleAutoPlay} />
          </div>
        }
      </div>
      { !controlsExpanded ? null : <>
        <div className={'release-year control'}>
          <span>{'Release year'}</span>
          <MultiRangeSliderControl range={dateRef.current} bounds={dateBounds}
            setRange={setDateRange} onSettingsChange={onSettingsChange}
          />
        </div>

        <div className={'popularity control'}>
          <span>{'Popularity'}</span>
          <MultiRangeSliderControl range={popularityRef.current} bounds={popularityBounds}
            setRange={setPopularityRange} onSettingsChange={onSettingsChange}
          />
        </div>

        <div className={'genre control'}>
          <span>{'Genre'}</span>
          <div className={'genre-list'}>
            {genres.current.map((genre, i) =>
              <button 
                className={'genre-button'} 
                key={i}
                onClick={() => {
                  if (selectedGenres.includes(genre))
                    setSelectedGenres(selectedGenres.filter(g => g !== genre));
                  else
                    setSelectedGenres(selectedGenres.concat(genre));
                }}
                style={selectedGenres.includes(genre) ? {backgroundColor: '#821fbf'} : null}
              >
                {genre}
              </button>
            )}
          </div>
        </div>
      </> }
    </div>
  );
}

function PauseButton() {
  const { pausePlayback } = useContext(PlaybackContext);
  return (
    <div className={'pause-button'}>
      <FontAwesomeIcon icon={faCirclePause} onClick={pausePlayback} />
    </div>
  );
}

export default function Controls({ id, clearSongs, setSongsUrl, fetchSongs }) {
  const [controlsExpanded, setControlsExpanded] = useState(false);
 
  return (
    <div className={'controls'} style={{width: controlsExpanded ? '30%' : '8%'}} >
      <FilterSettingsMenu 
        controlsExpanded={controlsExpanded}
        toggleExpand={() => setControlsExpanded(!controlsExpanded)}
        id={id}
        clearSongs={clearSongs}
        setSongsUrl={setSongsUrl}
        fetchSongs={fetchSongs}
      />
      <PauseButton />
    </div>
  );
}
