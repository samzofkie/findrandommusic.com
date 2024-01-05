import React, { useState, useRef, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePause,
  faSliders,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import { PlaybackContext, FilterContext } from "./App.js";
import MultiRangeSlider from "multi-range-slider-react";

import "./Controls.css";
import "./MultiRangeSlider.css";
import "./ToggleSwitch.css";

let genreList = await fetch("/genre-list").then((res) => res.json());
export const dateFilterBounds = { start: 1900, end: new Date().getFullYear() };
export const popularityFilterBounds = { start: 0, end: 100 };

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
    <div className={"auto-play control"}>
      <span>{"Auto play"}</span>
      <ToggleButton isChecked={autoPlayOn} onChange={toggleAutoPlay} />
    </div>
  );
}

function FilterRange({ cssClassName, label, bounds, filterParamsPrefix }) {
  const { filterParams, setFilterParams } = useContext(FilterContext);
  const [startPropName, endPropName] = [
    filterParamsPrefix + "Start",
    filterParamsPrefix + "End",
  ];

  function onChange(e) {
    const { maxValue, minValue } = e;
    if (
      filterParams.current[startPropName] !== minValue ||
      filterParams.current[endPropName] !== maxValue
    )
      setFilterParams({
        ...filterParams.current,
        [startPropName]: minValue,
        [endPropName]: maxValue,
      });
  }

  return (
    <div className={cssClassName + " control"}>
      <span>{label}</span>
      <MultiRangeSlider
        ruler={false}
        label={false}
        min={bounds.start}
        max={bounds.end}
        minValue={filterParams.current[startPropName]}
        maxValue={filterParams.current[endPropName]}
        onChange={onChange}
      />
    </div>
  );
}

function DateRange() {
  return (
    <FilterRange
      cssClassName={"release-year"}
      label={"Release year"}
      bounds={dateFilterBounds}
      filterParamsPrefix={"date"}
    />
  );
}

function PopularityRange() {
  return (
    <FilterRange
      cssClassName={"popularity"}
      label={"Popularity"}
      bounds={popularityFilterBounds}
      filterParamsPrefix={"popularity"}
    />
  );
}

function GenreList() {
  const { filterParams, setFilterParams } = useContext(FilterContext);

  const [selectedGenres, setSelectedGenres] = useState(
    filterParams.current.genres,
  );

  function toggleGenre(genre) {
    const newGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter((g) => g !== genre)
      : selectedGenres.concat(genre);
    setSelectedGenres(newGenres);

    function arraysEqual(a, b) {
      a.sort();
      b.sort();
      return (
        a.length === b.length &&
        a.every((element, index) => element === b[index])
      );
    }

    if (!arraysEqual(newGenres, filterParams.current.genres))
      setFilterParams({ ...filterParams.current, genres: newGenres });
  }

  return (
    <div className={"genre control"}>
      <span>{"Genre"}</span>
      <div className={"genre-list"}>
        {genreList.map((genre, i) => (
          <button
            className={"genre-button"}
            key={i}
            onClick={() => toggleGenre(genre)}
            style={
              selectedGenres.includes(genre)
                ? { backgroundColor: "#5b5b87" }
                : null
            }
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterMenu({ expanded, toggleExpanded }) {
  let style = {};
  if (expanded) {
    style.borderRadius = 30;
    style.padding = 15;
    style.textAlign = "left";
    style.fontSize = 50;
    style.backgroundColor = "black";
    style.color = "white";
  }
  if (window.innerWidth < 600) {
    style.backgroundColor = "black";
    style.flexGrow = 0;
  }
  return (
    <div className={"filter-menu"} style={style}>
      {!expanded ? (
        <FontAwesomeIcon icon={faSliders} onClick={toggleExpanded} />
      ) : (
        <>
          <div
            style={{
              display: "flex",
              flexFlow: "row nowrap",
              justifyContent: "space-between",
            }}
          >
            <FontAwesomeIcon icon={faX} onClick={toggleExpanded} />
            <AutoPlayToggle />
          </div>
          <DateRange />
          <PopularityRange />
          <GenreList />
        </>
      )}
    </div>
  );
}

function PauseButton() {
  const { pausePlayback } = useContext(PlaybackContext);
  return (
    <div className={"pause-button"}>
      <FontAwesomeIcon icon={faCirclePause} onClick={pausePlayback} />
    </div>
  );
}

export default function Controls({
  controlsExpanded,
  toggleControls,
  width,
  isMobile,
}) {
  let style = { width: width + "%" };
  if (isMobile) {
    style.flexDirection = "row";
    style.width = "100%";
    style.height = "100%";
    style.top = controlsExpanded ? "0" : "90vh";
    style.right = 0;
    style.transition = "top 0.25s";
    style.color = "white";
    style.backgroundColor = "black";
    style.justifyContent = "flex-end";
    style.gap = 10;
  } else {
    style.top = "1vh";
    style.right = 10;
    style.flexDirection = "column";
  }
  return (
    <div className={"controls"} style={style}>
      <FilterMenu expanded={controlsExpanded} toggleExpanded={toggleControls} />
      <PauseButton />
    </div>
  );
}
