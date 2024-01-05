import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExternalLinkAlt,
  faPalette,
  faCalendarDays,
  faCompactDisc,
  faMasksTheater,
  faRankingStar,
} from "@fortawesome/free-solid-svg-icons";

import "./SongInfo.css";

function SongInfoLink({ infoJson }) {
  return (
    <a href={infoJson.url} target={"_blank"} className={"song-info-link"}>
      {infoJson.name}
    </a>
  );
}

function IconLine({ children }) {
  return (
    <>
      <div className={"icon-line-icon"}>{children[0]}</div>
      <div className={"icon-line-text"}>{children[1]}</div>
    </>
  );
}

function PopularityBar({ popularity }) {
  return (
    <div className={"popularity-bar"}>
      <hr
        className={"background-bar"}
        style={{
          width: "95%",
        }}
      />
      <hr
        className={"value-bar"}
        style={{
          width: `${popularity * 0.95}%`,
        }}
      />
    </div>
  );
}

export default function SongInfo({ song }) {
  function calculateLinkCommaList(items) {
    let infoLinks = items
      .filter((item, i) => {
        return items.map((j) => j.name).indexOf(item.name) === i;
      })
      .map((item) => <SongInfoLink key={item.id} infoJson={item} />)
      .reduce((prev, curr) => [prev, ", ", curr]);
    if (Array.isArray(infoLinks)) infoLinks[infoLinks.length - 2] = " & ";
    return infoLinks;
  }

  let style = { fontSize: window.innerWidth < 600 ? 15 : 20 };

  return (
    <div className={"song-info"} style={style}>
      <div className={"song-title"}>
        <SongInfoLink infoJson={song.track} />
      </div>
      <IconLine>
        <FontAwesomeIcon icon={faPalette} />
        {calculateLinkCommaList(song.artists)}
      </IconLine>
      <IconLine>
        <FontAwesomeIcon icon={faCompactDisc} />
        <SongInfoLink infoJson={song.album} />
      </IconLine>
      <IconLine>
        <FontAwesomeIcon icon={faCalendarDays} />
        <div className={"song-date"}> {song.release_date.slice(0, 4)} </div>
      </IconLine>
      {song.genres.length > 0 ? (
        <IconLine>
          <FontAwesomeIcon icon={faMasksTheater} />
          {calculateLinkCommaList(
            song.genres.map((genre, i) => ({ ...genre, id: i })),
          )}
        </IconLine>
      ) : null}
      <IconLine>
        <FontAwesomeIcon icon={faRankingStar} />
        <PopularityBar popularity={song.popularity} />
      </IconLine>
    </div>
  );
}
