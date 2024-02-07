FROM ghcr.io/puppeteer/puppeteer:latest

USER root
RUN usermod -aG node pptruser
USER pptruser:pptruser
CMD [ "ls" ]
