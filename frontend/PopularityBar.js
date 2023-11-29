import React, { useState, useEffect } from 'react';

import './PopularityBar.css';


function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return { width, height };
}

function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}

export default function PopularityBar({popularity}) {
  const {width, height} = useWindowDimensions();
  const borderWidth = width < 600 ? width / 100 : width / 200;
  
  return (
    
      <div className={'popularity-bar'}>
        <hr className={'background-bar'} style={{
          width: '95%',
          border: `${borderWidth}px solid #303030`
        }}/>
        <hr className={'value-bar'} style={{
          width: `${popularity * 0.95}%`,
          border: `${borderWidth}px solid #821fbf`,
        }}/> 
      </div>
  );
}


