import React, { useState, useRef, useEffect } from "react";
import "./NewApp.css";

const SONG_WIDTH = 100;

function randomLetter() {
  const abc = "abcdefghijklmnopqrstuvwxyz";
  return abc[Math.floor(Math.random() * abc.length)];
}

function Song({ i, top, left, reportHeight }) {
  //const [shifted, setShifted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      reportHeight(i, ref.current.offsetHeight + 10);
    }
  }, []);

  let style = { width: SONG_WIDTH, maxWidth: SONG_WIDTH, top: top, left: left };
  //if (shifted) style.left = 300;

  return (
    <div
      className={"song"}
      style={style}
      ref={ref}
      //onClick={() => setShifted(!shifted)}
    >
      <div>{i}</div>
      <div style={{ overflowWrap: "break-word" }}>
        {Array.from(Array(10))
          .map((_) => randomLetter())
          .join("")}
      </div>
      <div>
        {Array.from(Array(20))
          .map((_) => randomLetter())
          .join("")}
      </div>
      <div>
        {Array.from(Array(10))
          .map((_) => randomLetter())
          .join("")}
      </div>
    </div>
  );
}

function SongList() {
  const NUM_SONGS = 100;
  const ref = useRef(null);
  const songHeights = useRef(Array.from(Array(NUM_SONGS).keys()));

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
        const top = songHeights.current
          .slice(0, i)
          .filter((_, filterIndex) => filterIndex % numColumns === i % numColumns)
          .reduce((acc, curr) => acc + curr, 5);
        const left = (i % numColumns) * (SONG_WIDTH + 5);
        return (
          <Song
            i={i}
            key={i}
            top={top}
            left={left}
            reportHeight={reportHeight}
          />
        );
      })}
    </div>
  );

  /*return (
    <div
      className={"song-list"}
      ref={ref}
      style={{ gridTemplateColumns: "auto ".repeat(numColumns) }}
    >
      {Array.from(Array(numColumns)).map((_, columnIndex) => (
        <div className={"song-column"} key={columnIndex}>
          {songs
            .filter((songIndex) => songIndex % numColumns === columnIndex)
            .map((songIndex) => (
              <Song key={songIndex} i={songIndex} />
            ))}
        </div>
      ))}
    </div>
  );*/
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
