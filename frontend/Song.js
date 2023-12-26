import React, { useCallback } from "react";
import { SONG_WIDTH } from "./SongList.js";
import "./Song.css";

const shit = [...Array(1000)].map(_ => Math.random() * 100 + 20);

export default function Song({ song, index, reportHeight, coord}) {
  /* Whenever the main "song" div's height changes, reportHeight. */
  const ref = useCallback((node) => {
    if (!node) return 0;
    const resizeObserver = new ResizeObserver(() => {
      reportHeight(index, node.offsetHeight);
    });
    resizeObserver.observe(node);
  }, []);

  let style = {width: SONG_WIDTH, border: "3px solid red", top: coord.y, left: coord.x};
  style.height = shit[index];

  return (
    <div className={"song"}
      style={style}
      ref={ref}
    >
      {index}
    </div>
  );
}
