/**
 *
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var VALID_PROPERTIES = ["align-content","align-items","align-self","backface-visibility","background-attachment","background-blend-mode","background-clip","background-color","background-image","background-origin","background-position","background-repeat","background-size","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-left-color","border-left-style","border-left-width","border-right-color","border-right-style","border-right-width","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","bottom","box-shadow","box-sizing","clear","clip","color","cursor","direction","display","flex-basis","flex-direction","flex-grow","flex-shrink","flex-wrap","float","font-family","font-kerning","font-size","font-style","font-variant","font-variant-ligatures","font-weight","height","justify-content","left","letter-spacing","line-height","list-style-image","list-style-position","list-style-type","margin-bottom","margin-left","margin-right","margin-top","max-height","max-width","min-height","min-width","opacity","order","orphans","outline-color","outline-offset","outline-style","outline-width","overflow-x","overflow-y","padding-bottom","padding-left","padding-right","padding-top","perspective","perspective-origin","pointer-events","position","resize","right","table-layout","text-align","text-decoration","text-indent","text-rendering","text-shadow","text-transform","top","transform","transform-origin","transform-style","unicode-bidi","vertical-align","visibility","white-space","widows","width","word-break","word-spacing","word-wrap","z-index"];
var CACHE_NAME_PREFIX = 'csstriggers';
var VERSION = '2.1.10';

// Dynamic files are expected to change every now and then
var DYNAMIC_CACHE = CACHE_NAME_PREFIX + '-dynamic';
var DYNAMIC_FILES = [
  '/index.html',
  '/scripts/css-triggers-core-2.1.10.js',
  '/404.html'
];

// Static files are expected to stay the same forever
var STATIC_CACHE = CACHE_NAME_PREFIX + '-static';
var STATIC_FILES = [
  '/third_party/MaterialIcons/ic_close_white_18px.svg',
  '/third_party/MaterialIcons/ic_search_white_24px.svg',
  '/third_party/Roboto/Roboto-400.woff',
  '/third_party/Roboto/Roboto-500.woff',
  '/third_party/Roboto/RobotoMono-400.woff',
  '/manifest.json',
  '/favicon.ico',
  '/images/icon-192x192.png',
  '/images/icon-384x384.png',
];

function cacheStaticFiles() {
  return caches.open(STATIC_CACHE)
    .then(function(cache) {
      return cache.addAll(STATIC_FILES);
    });
}

function cacheDynamicFiles() {
  return caches.open(DYNAMIC_CACHE)
      .then(function(cache) {
        // We are not using cache.addAll() here because that would stop all
        // caching on a non 2xx status code. 404.html will be delivered with a
        // 404 status code, and we want to cache it anyways.
        return DYNAMIC_FILES.map(url => {
          return fetch(url)
              .then(
                response => cache.put(url, response),
                err => {}
              );
        });
      });
}

self.oninstall = function (event) {
  event.waitUntil(
    Promise.all([cacheStaticFiles(), cacheDynamicFiles()])
  );
};

self.onfetch = function (event) {

  var req = event.request;

  // Attempt to get the request from the cache. This will work for static
  //files without additional work. For everything else, like deeplinks,
  //analytics or 404s, we have more work to do.
  return event.respondWith(
    caches
      .match(req)
      .then(function (response) {

        // If there's a cache match, we're done.
        if (response) {
          return response;
        }

        // Figure out exactly which property the user wanted to get at.
        var property = new URL(req.url).pathname.slice(1);

        // If this is a valid property, spin up the index.html file.
        if (property === '' || VALID_PROPERTIES.indexOf(property) !== -1) {
          return caches.match('/index.html');
        }

        // Except for analytics; that we will fetch.
        if (req.url.indexOf('google-analytics') !== -1) {
          return fetch(req);
        }

        // And everything else is going to get the 404.
        return caches.match('/404.html');
      })
  );
};
