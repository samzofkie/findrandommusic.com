import React, { useState, useEffect, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCirclePause, faCirclePlay, faCircleStop, faSliders, faX } from '@fortawesome/free-solid-svg-icons';
import MultiRangeSlider from "multi-range-slider-react";

import './Controls.css';
import './MultiRangeSlider.css';
import './ToggleSwitch.css';
import { AutoPlayContext } from './App.js';


function ToggleButton({ onClick }) {
  return (
    <label className={"switch"}>
      <input type="checkbox" onClick={onClick} />
      <span className={"slider round"}></span>
    </label>
  );
}

function MultiRangeSliderControl({ range, setRange }) {
  return (
    <MultiRangeSlider ruler={false} label={false} 
      min={range.start} max={range.end}
      minValue={range.start} maxValue={range.end}
      onChange={sliderValues => setRange({
        'start': sliderValues.min, 
        'end': sliderValues.max
      })}
    />
  );
}

function FilterSettingsMenu({ controlsExpanded, toggleExpand }) {
  const { autoPlayOn, toggleAutoPlay } = useContext(AutoPlayContext);
  const [dateRange, setDateRange] = useState({'start': 1900, 'end': new Date().getFullYear()});
  const [popularityRange, setPopularityRange] = useState({'start': 0, 'end': 100});
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);

  async function fetchGenreList() {
    await fetch('/genre-list')
      .then(res => res.json())
      .then(setGenres);
  }

  useEffect(() => {
    fetchGenreList();
  }, []);

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
          <MultiRangeSliderControl range={dateRange} setRange={setDateRange} />
        </div>

        <div className={'popularity control'}>
          <span>{'Popularity'}</span>
          <MultiRangeSliderControl range={popularityRange} setRange={setPopularityRange} />
        </div>

        <div className={'genre control'}>
          <span>{'Genre'}</span>
          <div>
            {genres.map((genre, i) =>
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

function PauseButton({ pause }) {
  return (
    <div className={'pause-button'}>
      <FontAwesomeIcon icon={faCirclePause} onClick={pause} />
    </div>
  );
}

export default function Controls({ pause }) {
  const [controlsExpanded, setControlsExpanded] = useState(false);
 
  return (
    <div className={'controls'} style={{width: controlsExpanded ? '30%' : '8%'}} >
      <FilterSettingsMenu 
        controlsExpanded={controlsExpanded}
        toggleExpand={() => setControlsExpanded(!controlsExpanded)} 
      />
      <PauseButton pause={pause} />
    </div>
  );
}
