import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt, faPalette, faCalendarDays, faCompactDisc, faMasksTheater, faRankingStar} from '@fortawesome/free-solid-svg-icons';

import PopularityBar from './PopularityBar.js';
import './SongInfo.css';


// input infoJson needs to have .name and .url properties
function SongInfoLink({infoJson}) {
  return (
    <a href={infoJson.url} target={'_blank'} className={'song-info-link'}>
      {infoJson.name}
    </a>
  );
}

function IconLine({children}) {
  return (
    <>
      <div className={'icon-line-icon'}>
        {children[0]}
      </div>
      <div className={'icon-line-text'}>
        {children[1]}
      </div>
    </>
  );
}

export default function SongInfo({songJson, stopPlayback}) {
  
  function calculateLinkCommaList(items) {   
    let infoLinks = items.map(item =>
      <SongInfoLink key={item.id} infoJson={item} />
    ).reduce((prev, curr) => [prev, ', ', curr]);   
    if (Array.isArray(infoLinks))
      infoLinks[infoLinks.length - 2] = ' & ';
    return infoLinks;
  }

  return (
    <div className={'song-info'}>
      
      <div className={'song-title'}>
        <b><SongInfoLink infoJson={songJson.track}/></b>
      </div>
            
      <IconLine>
        <FontAwesomeIcon icon={faPalette} />
        {calculateLinkCommaList(songJson.artists)}
      </IconLine>

      <IconLine>
        <FontAwesomeIcon icon={faCompactDisc} />
        <SongInfoLink infoJson={songJson.album} />
      </IconLine>
      
      <IconLine>
        <FontAwesomeIcon icon={faCalendarDays} />
        <div className={'song-date'}> {songJson.release_date.slice(0, 4)} </div>
      </IconLine>

      {songJson.genres.length > 0 ?
        <IconLine>
          <FontAwesomeIcon icon={faMasksTheater} />
          {calculateLinkCommaList(songJson.genres)}
        </IconLine> 
        : null
      }
     
      <IconLine>
        <FontAwesomeIcon icon={faRankingStar} />
        <PopularityBar popularity={songJson.popularity} />
      </IconLine>
    
    </div>
  );
}

