import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCirclePause, faCirclePlay, faCircleStop, faSliders, faX } from '@fortawesome/free-solid-svg-icons';
import MultiRangeSlider from "multi-range-slider-react";

import './Controls.css';
import { AutoPlayContext } from './App.js';


function FilterSettingsMenu({ controlsExpanded, toggleExpand }) {
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
      <div className={'filter-menu-button'} style={controlsExpanded ? {textAlign: 'center'} : null}>
        <FontAwesomeIcon 
          icon={controlsExpanded ? faX : faSliders} 
          onClick={toggleExpand}
        />
      </div>
      
      <div className={'filter-menu-options'} style={controlsExpanded ? null : {display: 'none'}} >  
        <div>
          <span>{'Auto Play'}</span>
        </div>
        
        <div>
          <span>{'Release year'}</span>
          <MultiRangeSlider ruler={false} label={false} 
            min={1900} max={new Date().getFullYear()}
            minValue={1900} maxValue={new Date().getFullYear()}
          />
        </div>
        
        <div>
          <span>{'Popularity'}</span>
          <MultiRangeSlider ruler={false} label={false} 
            min={0} max={100}
            minValue={0} maxValue={100}
          />
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
