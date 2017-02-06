FROM ubuntu:14.04

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y software-properties-common

RUN add-apt-repository -y ppa:transmissionbt/ppa && \
    apt-get update && \
    apt-get install -y transmission-daemon

RUN mkdir -p /transmission/incomplete && \
    mkdir /etc/transmission

ADD settings.json /etc/transmission/settings.json

EXPOSE 51413
EXPOSE 9091

VOLUME ["/transmission/downloads"]

RUN chown -R daemon /transmission && \
    chown -R daemon /etc/transmission

USER daemon

CMD ["/usr/bin/transmission-daemon", "-f", "--no-portmap", "--config-dir", "/etc/transmission", "--log-info"]
