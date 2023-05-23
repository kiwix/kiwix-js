/**
 * Modified load.js for Kiwix JS. This file has been modified to prevent registering a second Service Worker.
 */

async function main() {

  const sw = navigator.serviceWorker;

  // finds  '/A/' followed by a domain name with a .
  var prefix = window.location.href.slice(0, window.location.href.search(/[/]A[/][^/]+[.]/));

  const name = prefix.slice(prefix.lastIndexOf("/") + 1).replace(/[\W]+/, "");

  prefix += "/A/";

  sw.addEventListener("message", (event) => {
    if (event.data.msg_type === "collAdded" && event.data.name === name) {
      if (window.location.hash && window.location.hash.startsWith("#redirect=")) {
        prefix += decodeURIComponent(window.location.hash.slice("#redirect=".length));
      } else {
        prefix += window.mainUrl.replace(/^[^/]+\/\//, '');
      }

      console.log("final: " + prefix);
      window.location.href = prefix;
    }
  });

  await new Promise((resolve) => {
    if (!sw.controller) {
      sw.addEventListener("controllerchange", () => {
        resolve();
      });
    } else {
      resolve();
    }
  });

  sw.controller.postMessage({
    msg_type: "addColl",
    name: name,
    file: {"sourceUrl": "proxy:../"},
    root: true,
    skipExisting: false,
    extraConfig: {"sourceType": "kiwix", notFoundPageUrl: "./404.html"},
    topTemplateUrl: "./topFrame.html"
  });
}

window.addEventListener("load", main);