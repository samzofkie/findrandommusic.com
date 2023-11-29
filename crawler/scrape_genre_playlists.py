#!/usr/bin/env -S -i /usr/bin/python3

import http.client
from html.parser import HTMLParser
from collections import OrderedDict
import sys

conn = http.client.HTTPSConnection("everynoise.com")
conn.request("GET", "/everynoise1d.cgi?scope=all")
r1 = conn.getresponse()
html = r1.read().decode('utf8')
print('got html. parsing...')

genre_data = {}
class MyParser(HTMLParser):
  def handle_starttag(self, tag, attrs):
    if tag == 'tr':
      try:
        lineno, _ = self.getpos()
        tr_str = html.split('\n')[lineno]
        playlist_link = tr_str.split('<a href="')[1].split('"')[0]
        genre_name = tr_str.split('<a')[2].split('</a>')[0].split('>')[-1]
        genre_data[genre_name] = playlist_link.split(':')[-1]
      except:
        print('some shit happened')

MyParser().feed(html)
with open('genres.json', 'w') as f:
  f.write('{\n')
  kvs = list(genre_data.items())
  for genre, link in kvs[:-1]:
    f.write(f"  \"{genre}\": \"{link}\",\n")
  last_genre, last_link  = kvs[-1]
  f.write(f"  \"{last_genre}\": \"{last_link}\"\n")
  f.write('}')
