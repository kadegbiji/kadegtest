# Use the official Nginx image based on Alpine Linux.
# Alpine is a minimal Linux distribution — the full image is under 10 MB.
# This is a common choice for serving static web content in production.
FROM nginx:alpine

# Copy all application files into the directory Nginx serves by default.
# Nginx will automatically serve index.html when someone visits the root path.
COPY . /usr/share/nginx/html

# Document that this container listens on port 80.
# This doesn't actually publish the port — that happens when you run the container.
EXPOSE 80
