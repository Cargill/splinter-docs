# Copyright 2020 Cargill Incorporated
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# -------------=== redoc build ===-------------

FROM node as redoc

RUN npm install -g redoc
RUN npm install -g redoc-cli

COPY . /project

RUN redoc-cli bundle /project/docs/0.4/references/api/openapi.yml -o index.html

# -------------=== jekyll build ===-------------

FROM jekyll/jekyll:3.8 as jekyll

RUN gem install \
    bundler \
    jekyll-default-layout \
    jekyll-optional-front-matter \
    jekyll-readme-index \
    jekyll-redirect-from \
    jekyll-seo-tag \
    jekyll-titles-from-headings

COPY . /srv/jekyll

RUN rm -rf /srv/jekyll/_site \
 && jekyll build --verbose --destination /tmp

# -------------=== log commit hash ===-------------

FROM alpine as git

RUN apk update \
 && apk add \
    git

COPY .git/ /tmp/.git/
WORKDIR /tmp
RUN git rev-parse HEAD > /commit-hash

# -------------=== apache docker build ===-------------

FROM httpd:2.4

COPY --from=jekyll /tmp/ /usr/local/apache2/htdocs/
COPY --from=redoc /index.html /usr/local/apache2/htdocs/api/index.html
COPY --from=git /commit-hash /commit-hash

RUN echo "\
\n\
ServerName splinter.dev\n\
AddDefaultCharset utf-8\n\
LoadModule rewrite_module modules/mod_rewrite.so\n\
RewriteEngine on\n\
RewriteCond %{REQUEST_FILENAME} !-d\n\
RewriteCond %{REQUEST_FILENAME} !-f\n\
RewriteRule ^/(.*).md$ /\$1.html [NC,L,R]\n\
\n\
" >>/usr/local/apache2/conf/httpd.conf

EXPOSE 80/tcp
