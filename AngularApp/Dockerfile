
FROM ubuntu:18.04 AS base-layer
COPY installNode14Repo.sh /tmp/installNode14Repo.sh
RUN sh /tmp/installNode14Repo.sh && apt-get update && apt-get install nodejs=14.20.0-1nodesource1 -y
