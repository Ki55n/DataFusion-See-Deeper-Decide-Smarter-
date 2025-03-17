# Use the official Python image from the Docker Hub
FROM python:3.12-slim

# Set the working directory
WORKDIR /datafusion

# Copy the current directory contents into the container at /datafusion
COPY ./requirements_backend.txt /datafusion/requirements_backend.txt

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir --upgrade -r /datafusion/requirements_backend.txt

# Update the package list
# RUN apt-get update && apt-get upgrade -y
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y nginx libgirepository1.0-dev gir1.2-pango-1.0 libcairo2 libgdk-pixbuf2.0-0 build-essential

# Set the environment variable
ENV HOME=/datafusion 

WORKDIR $HOME

# Copy the application code
COPY . .

# Make the start.sh script executable
RUN python3 write_start_sh.py
RUN chmod +x start.sh

# Expose the necessary ports
EXPOSE 8000 8001 8080

# nginx conf file setup
COPY nginx.conf /etc/nginx/nginx.conf

# CMD service nginx start

# # Run the start.sh script
# CMD [ "bash", "./start.sh" ]
# CMD service nginx start && bash ./start.sh
# CMD service nginx start && bash ./start.sh
CMD ["/bin/bash", "-c", "service nginx start && bash ./start.sh"]