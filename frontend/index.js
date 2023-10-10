import React from "react";
import { render } from "react-dom";


const root = document.getElementById('root');

fetch('/art')
  .then(res => res.json())
  .then(strings => strings.map(string => string.split('@')[0]))
  .then(artUrls => artUrls.map(url => <img src={url}/>))
  .then(imgs => render(imgs, root))
