import React from "react";
import { render } from "react-dom";


const root = document.getElementById('root');

fetch('/art')
  .then(res => res.json())
  .then(urls => urls.map(url => <img src={url} width={125}/>))
  .then(imgs => render(imgs, root));
