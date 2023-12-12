import React, { useState, useRef, useEffect, useContext, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePause,
  faCirclePlay,
  faCircleStop,
  faSliders,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import MultiRangeSlider from "multi-range-slider-react";

import "./Controls.css";
import "./MultiRangeSlider.css";
import "./ToggleSwitch.css";
import { PlaybackContext, FilterContext } from "./App.js";

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
        onChange={({ minValue, maxValue }) =>
          setFilterParams({
            ...filterParams.current,
            [startPropName]: minValue,
            [endPropName]: maxValue,
          })
        }
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

  /* We call setFilterParams with the same filtered or concat'd version of
     selectedGenres immeadiately after setting it because calling the set
     function doesn't immeadiately update it. */
  function toggleGenre(genre) {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
      setFilterParams({
        ...filterParams.current,
        genres: selectedGenres.filter((g) => g !== genre),
      });
    } else {
      setSelectedGenres(selectedGenres.concat(genre));
      setFilterParams({
        ...filterParams.current,
        genres: selectedGenres.concat(genre),
      });
    }
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
                ? { backgroundColor: "#821fbf" }
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

function FilterSettingsMenu({ controlsExpanded, toggleExpand }) {
  return (
    <div
      className={"filter-menu"}
      style={controlsExpanded ? { border: "3px solid white" } : null}
    >
      <div className={"first-line"}>
        <div
          className={"filter-menu-button"}
          style={controlsExpanded ? { fontSize: "3vw" } : null}
        >
          <FontAwesomeIcon
            icon={controlsExpanded ? faX : faSliders}
            onClick={toggleExpand}
          />
        </div>

        {!controlsExpanded ? null : <AutoPlayToggle />}
      </div>

      {!controlsExpanded ? null : (
        <>
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

export default function Controls() {
  const [controlsExpanded, setControlsExpanded] = useState(false);

  return (
    <div
      className={"controls"}
      style={{ width: controlsExpanded ? "30%" : "8%" }}
    >
      <FilterSettingsMenu
        controlsExpanded={controlsExpanded}
        toggleExpand={() => setControlsExpanded(!controlsExpanded)}
      />
      <PauseButton />
    </div>
  );
}
