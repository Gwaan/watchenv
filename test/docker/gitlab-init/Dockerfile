FROM alpine:3.21

RUN apk add --no-cache curl jq docker-cli bash

RUN curl -L --output /usr/local/bin/gitlab-runner \
  "https://gitlab-runner-downloads.s3.amazonaws.com/latest/binaries/gitlab-runner-linux-amd64" && \
  chmod +x /usr/local/bin/gitlab-runner

COPY init.sh /init.sh
RUN chmod +x /init.sh

ENTRYPOINT ["/bin/bash", "/init.sh"]
