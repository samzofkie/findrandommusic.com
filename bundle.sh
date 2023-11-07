#!/usr/bin/env -S -i /usr/bin/bash

docker run --rm -v ./frontend:/app -v ./public:/app/public -w=/app node npx webpack --color 
