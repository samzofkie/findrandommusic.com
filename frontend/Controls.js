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

function FilterSettingsMenu({ controlsExpanded, toggleExpand }) {
  const { autoPlayOn, toggleAutoPlay } = useContext(AutoPlayContext);
  const [dateRange, setDateRange] = useState({'start': 1900, 'end': new Date().getFullYear()});
  const [popularityRange, setPopularityRange] = useState({'start': 0, 'end': 100});
  const [genres, setGenres] = useState([]);

  async function fetchGenreList() {
    await fetch('/genre-list')
      .then(res => res.json())
      .then(setGenres);
  }

  useEffect(() => {
    fetchGenreList();
  }, []);

  return (
    <div className={'filter-menu'} 
      style={ 
        controlsExpanded ? 
        {
          display: 'grid', 
          gridTemplateColumns: '25% 75%',
          border: '3px solid white'
        } 
        : null
      }
    >
      <div className={'filter-menu-button'} style={controlsExpanded ? {textAlign: 'center', fontSize: '3vw'} : null}>
        <FontAwesomeIcon 
          icon={controlsExpanded ? faX : faSliders} 
          onClick={toggleExpand}
        />
      </div>
      
      <div className={'filter-menu-options'} style={controlsExpanded ? null : {display: 'none'}} >  
        <div className={'auto-play'}>
          <span>{'Auto play'}</span>
          <ToggleButton onClick={toggleAutoPlay} />
        </div>
        
        <div>
          <span>{'Release year'}</span>
          <MultiRangeSlider ruler={false} label={false} 
            min={dateRange.start} max={dateRange.end}
            minValue={dateRange.start} maxValue={dateRange.end}
            onChange={sliderValues => setDateRange({
              'start': sliderValues.min, 
              'end': sliderValues.max
            })}
          />
        </div>
        
        <div>
          <span>{'Popularity'}</span>
          <MultiRangeSlider ruler={false} label={false} 
            min={popularityRange.start} max={popularityRange.end}
            minValue={popularityRange.start} maxValue={popularityRange.end}
            onChange={sliderValues => setPopularityRange({
              'start': sliderValues.min,
              'end': sliderValues.max
            })}
          />
        </div>

        <div className={'genres'}>
          <span>{'Genres'}</span>
          <p>
            {genres.slice(0,5).map(genre => <span>{genre}</span>)}
          </p>
        </div>
      </div>
    
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
    <div className={'controls'} style={{width: controlsExpanded ? '25%' : '8%'}} >
      <FilterSettingsMenu 
        controlsExpanded={controlsExpanded}
        toggleExpand={() => setControlsExpanded(!controlsExpanded)} 
      />
      <PauseButton pause={pause} />
    </div>
  );
}
