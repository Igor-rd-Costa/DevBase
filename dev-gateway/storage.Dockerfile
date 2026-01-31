FROM alpine:3.19

# Create projects directory for mounted storage
RUN mkdir -p /projects && chmod 777 /projects

# Volume for project files
VOLUME /projects

# Keep container running
CMD ["tail", "-f", "/dev/null"]
