import React, { useState, useEffect } from "react";

import "./PopularityBar.css";

export default function PopularityBar({ popularity }) {
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
