import React, { useState, useRef, useEffect, useCallback } from "react";
import useWindowDimensions from "./useWindowDimensions.js";
import Song from "./Song.js";
import "./SongList.css";

export const SONG_WIDTH = 500;

export default function SongList({ songs }) {
  /* This just re-renders <SongList/> if the window dimensions change. */
  const _ = useWindowDimensions();

  /* We track the CSS width of the main "song-list" div with the width state
     and this useCallback. */

  const [width, setWidth] = useState(0);

  const ref = useCallback((node) => {
    if (!node) return 0;
    const resizeObserver = new ResizeObserver(() => {
      setWidth(node.offsetWidth);
    });
    resizeObserver.observe(node);
  }, []);

  /* We use width to calculate numColumns. */
  const numColumns = Math.max(Math.floor(width / SONG_WIDTH), 1);

  /* Each <Song/> is going to report it's height in pixels once it's rendered
     and their heights will be stored here in songHeights. We want this to be 
     in state so that children <Song/>s calling reportState will trigger a
     re-render, but we want songHeights to change to reflect the songs prop. */
  const [songHeights, setSongHeights] = useState(
    [...Array(songs.length)].map((_) => 0),
  );

  /* Add dummy 0 values corresponding to songs that haven't reported their height yet. */
  if (songHeights.length < songs.length)
    setSongHeights([
      ...songHeights,
      ...[...Array(songs.length - songHeights.length)].map((_) => 0),
    ]);
  /* This is for when the songs in songs are cleared away, we want to update
     songHeights to respect that (mainly so the <Loader/> appropriately floats
     back to the top of the .main-content div). */ else if (
    songHeights.length > songs.length
  )
    setSongHeights([...Array(songs.length)].map((_) => 0));

  /* By storing songHeights in state and queueing the state update, we can rerender <SongList/>
     when <Song/> height changes to ensure the layout is pretty. */
  function reportHeight(songIndex, height) {
    if (songHeights[songIndex] !== height)
      setSongHeights((songHeights) =>
        songHeights.map((h, i) => (i === songIndex ? height : h)),
      );
  }

  /* Here we do the work of calculating the x, y coords for each song. */
  const horizontalPadding = 4;

  let columnStarts = Array.from(Array(numColumns)).map(
    (_) => horizontalPadding,
  );

  const verticalSpace = (width - numColumns * SONG_WIDTH) / (numColumns + 1);

  const coords = songHeights.map((songHeight, songIndex) => {
    const columnNum = columnStarts.indexOf(Math.min(...columnStarts));
    const start = columnStarts[columnNum];
    columnStarts[columnNum] += songHeight + horizontalPadding;
    return {
      x: verticalSpace + (SONG_WIDTH + verticalSpace) * columnNum,
      x: verticalSpace + (SONG_WIDTH + verticalSpace) * columnNum,
      y: start,
    };
  });

  const height = Math.max(...columnStarts);

  return (
    <div className={"song-list"} ref={ref} style={{ height: height }}>
      {songs.map((song, i) => (
        <Song
          key={i}
          song={song}
          index={i}
          reportHeight={reportHeight}
          coord={coords[i] ? coords[i] : { x: 0, y: 0 }}
        />
      ))}
    </div>
  );
}
