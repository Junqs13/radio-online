FROM alpine:3.18
RUN apk add --no-cache icecast \
 && mkdir -p /var/log/icecast \
 && chown -R icecast:icecast /var/log/icecast
COPY icecast.xml /etc/icecast/icecast.template.xml
COPY entrypoint.sh /entrypoint.sh
# sed remove um eventual \r caso o arquivo tenha sido salvo com fim de linha do Windows
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh
USER icecast
EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
