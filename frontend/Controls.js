import React from "react";

export const dateFilterBounds = { start: 1900, end: new Date().getFullYear() };
export const popularityFilterBounds = { start: 0, end: 100 };

export default function Controls({ toggleControls }) {
  return (
    <div className={"controls"} onClick={toggleControls} >
      {"there r my confessions"}
    </div>
  );
}
