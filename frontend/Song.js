import React, { useState, useCallback } from "react";
import { SONG_WIDTH } from "./SongList.js";
import SongInfo from "./SongInfo.js";
import "./Song.css";

function SongArtwork({ url, hasPreview, previewDisabledMessageVisible }) {
  return (
    <div className={"artwork"}>
      <img
        src={url}
        style={{ opacity: previewDisabledMessageVisible ? "0.2" : "1" }}
      />
      {hasPreview || (
        <div
          className={"playback-disabled-text"}
          style={{ opacity: previewDisabledMessageVisible ? "1" : "0" }}
        >
          {"Playback disabled for this song :("}
        </div>
      )}
    </div>
  );
}

export default function Song({ song, index, reportHeight, coord}) {
  /* Whenever the main "song" div's height changes, reportHeight. */
  const ref = useCallback((node) => {
    if (!node) return 0;
    const resizeObserver = new ResizeObserver(() => {
      reportHeight(index, node.offsetHeight);
    });
    resizeObserver.observe(node);
  }, []);

  const [previewDisabledMessageVisible, setPreviewDisabledMessageVisible] = useState(false);

  const hasPreview = song.playback_url !== null;
  
  let style = {width: SONG_WIDTH, top: coord.y, left: coord.x};

  return (
    <div className={"song"}
      style={style}
      ref={ref}
    >
      <SongArtwork
        url={song.artwork_url}
        hasPreview={hasPreview}
        previewDisabledMessageVisible={previewDisabledMessageVisible}
      />
      <SongInfo song={song} />
    </div>
  );
}
