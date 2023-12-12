import React, { useState, useRef, useEffect, useContext, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCirclePause, faCirclePlay, faCircleStop, faSliders, faX } from '@fortawesome/free-solid-svg-icons';
import MultiRangeSlider from "multi-range-slider-react";

import './Controls.css';
import './MultiRangeSlider.css';
import './ToggleSwitch.css';
import { PlaybackContext, FilterContext } from './App.js';


let genreList = await fetch('/genre-list').then(res => res.json());
export const dateFilterBounds = {'start': 1900, 'end': new Date().getFullYear()};
export const popularityFilterBounds = {'start': 0, 'end': 100};

function ToggleButton({ onChange, isChecked }) {
  return (
    <label className={"switch"}>
      <input type="checkbox" checked={isChecked} onChange={onChange} />
      <span className={"slider round"}></span>
    </label>
  );
}

function AutoPlayToggle() {
  const { autoPlayOn, toggleAutoPlay } = useContext(PlaybackContext);
  return (
    <div className={'auto-play control'}>
      <span>{'Auto play'}</span>
      <ToggleButton isChecked={autoPlayOn} onChange={toggleAutoPlay} />
    </div>
  );
}

function FilterRange({cssClassName, label, bounds, filterParamsPrefix }) {
  const { filterParams, setFilterParams } = useContext(FilterContext);
  const [startPropName, endPropName] = [filterParamsPrefix + 'Start',
                                        filterParamsPrefix + 'End'];
  return (
    <div className={cssClassName + ' control'}>
      <span>{label}</span>

      <MultiRangeSlider ruler={false} label={false} 
        min={bounds.start} 
        max={bounds.end}
        minValue={filterParams.current[startPropName]}
        maxValue={filterParams.current[endPropName]}
        onChange={({minValue, maxValue}) => setFilterParams({
          ...filterParams.current,
          [startPropName]: minValue,
          [endPropName]: maxValue
        })}
      />
    </div>
  );
}

function DateRange() {
  return (
    <FilterRange
      cssClassName={'release-year'}
      label={'Release year'}
      bounds={dateFilterBounds}
      filterParamsPrefix={'date'}
    />
  );
}

function PopularityRange() {
  return (
    <FilterRange
      cssClassName={'popularity'}
      label={'Popularity'}
      bounds={popularityFilterBounds}
      filterParamsPrefix={'popularity'}
    />
  );
}

function GenreList() {
  const [selectedGenres, setSelectedGenres] = useState([]);

  function toggleGenre(genre) {
    if (selectedGenres.includes(genre))
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    else
      setSelectedGenres(selectedGenres.concat(genre));
  }

  /*useEffect(() => {
    onSettingsChange();
  }, [selectedGenres]); */

  return (
    <div className={'genre control'}>
      <span>{'Genre'}</span>
      <div className={'genre-list'}>
        {genreList.map((genreString, i) => 
          <button className={'genre-button'} key={i}
            onClick={() => toggleGenre(genreString)}
            style={selectedGenres.includes(genreString) ? {backgroundColor: '#821fbf'} : null}
          >
            {genreString}
          </button>
        )}
      </div>
    </div>
  );
}

function FilterSettingsMenu({ controlsExpanded, toggleExpand, id, clearSongs, setSongsUrl, fetchSongs }) { 

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


  return (
    <div className={'filter-menu'} style={controlsExpanded ? {border: '3px solid white'} : null} >
      
      <div className={'first-line'}> 
        <div className={'filter-menu-button'} style={controlsExpanded ? {fontSize: '3vw'} : null} >
          <FontAwesomeIcon icon={controlsExpanded ? faX : faSliders} onClick={toggleExpand} />
        </div>
          
        { !controlsExpanded ? null : <AutoPlayToggle /> }
      </div>
      
      { !controlsExpanded ? null : 
        <> 
          <DateRange />
          <PopularityRange />
          <GenreList />
        </>
      }

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
