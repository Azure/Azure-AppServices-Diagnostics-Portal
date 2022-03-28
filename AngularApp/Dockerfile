
FROM ubuntu:18.04 AS base-layer
COPY installNode14Repo.sh /tmp/installNode14Repo.sh
#RUN apt-get update && apt-get install curl -y
#RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - && 
RUN sh /tmp/installNode14Repo.sh && apt-get update && apt-get install nodejs=14.19.0-1nodesource1 -y
