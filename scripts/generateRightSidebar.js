/*
  Copyright 2020 Cargill Incorporated

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

function generateRightSidebar() {
  var content = "";
  var main = document.getElementById("main-content");
  var i;
  for (i = 0; i < main.children.length; i++) {
    if (main.children[i].tagName.localeCompare("H2") == 0) {
      content = content +
        "<a href=#"+main.children[i].id +" class=\"right-sidebar-h2\">" +
        main.children[i].innerText + "</a>";
    }

    if (main.children[i].tagName.localeCompare("H3") == 0) {
      content = content +
        "<a href=#"+main.children[i].id +" class=\"right-sidebar-h3\">" +
        main.children[i].innerText + "</a>";
    }
  }
  return content;
}
