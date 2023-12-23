import React, { useState, useRef, useEffect, useCallback } from "react";
import "./NewApp.css";

const SONG_WIDTH = 100;

function randomLetter() {
  const abc = "abcdefghijklmnopqrstuvwxyz";
  return abc[Math.floor(Math.random() * abc.length)];
}

function Song({ i, y, left, reportHeight, _testHeight }) {
  const elementRef = useCallback(node => {
    if (!node) return;
    const resizeObserver = new ResizeObserver(() => {
      reportHeight(i, node.offsetHeight);
    });
    resizeObserver.observe(node);
  }, []);

  let style = { width: SONG_WIDTH, maxWidth: SONG_WIDTH, top: y, left: left, height: _testHeight };

  return (
    <div
      className={"song"}
      style={style}
      ref={elementRef}
    >
      <div>{i}</div>
    </div>
  );
}

function SongList() {
  const NUM_SONGS = 100;
  const ref = useRef(null);
  const songHeights = useRef(Array.from(Array(NUM_SONGS).keys()));

  const randomGenHeights = useRef(Array.from(Array(NUM_SONGS).keys()).map(_ => Math.floor(Math.random() * 50 + 50)));

  function reportHeight(index, height) {
    songHeights.current[index] = height;
  }

  const [width, setWidth] = useState(0);
  const numColumns = Math.floor(width / SONG_WIDTH);
  const songs = Array.from(Array(NUM_SONGS).keys());

  useEffect(() => {
    if (ref.current) setWidth(ref.current.offsetWidth);
  });

  return (
    <div
      className={"song-list"}
      ref={ref}
      style={{
        height: songHeights.current.reduce((acc, curr) => acc + curr, 5),
      }}
    >
      {songs.map((i) => {
        const y = songHeights.current
          .slice(0, i)
          .filter((_, filterIndex) => filterIndex % numColumns === i % numColumns)
          .reduce((acc, curr) => acc + curr + 5, 5);
        const left = numColumns === 0? 5 : (i % numColumns) * (SONG_WIDTH + 5) + 5;
        return (
          <Song 
            key={i}
            i={i}
            y={y}
            left={left}
            reportHeight={reportHeight}
            _testHeight={randomGenHeights.current[i]}
          />
        );
      })}
    </div>
  );
}

function Controls({ onClick, controlsExpanded }) {
  return (
    <div
      className={"controls"}
      onClick={onClick}
      style={controlsExpanded ? { maxWidth: "50%" } : { maxWidth: "10%" }}
    >
      {"controls"}
    </div>
  );
}

export default function App() {
  const [controlsExpanded, setControlsExpanded] = useState(false);
  const toggleControlsExpanded = () => setControlsExpanded(!controlsExpanded);
  return (
    <div
      className={"app"}
      style={
        controlsExpanded
          ? { gridTemplateColumns: "50% 50%" }
          : { gridTemplateColumns: "90% 10%" }
      }
    >
      <SongList />
      <Controls
        onClick={toggleControlsExpanded}
        controlsExpanded={controlsExpanded}
      />
    </div>
  );
}
