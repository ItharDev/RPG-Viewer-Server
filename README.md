# RPG Viewer Server

This server is intended to be used alongside the [RPG Viewer Client](https://github.com/ItharDev/RPG-Viewer-Client)

## Table of Contents

- [RPG Viewer Server](#rpg-viewer-server)
  - [Table of Contents](#table-of-contents)
  - [Setup Guide](#setup-guide)
  - [Important Note](#important-note)
  - [Port Forwarding (If Running Locally)](#port-forwarding-if-running-locally)
  - [Managing Data in the Database](#managing-data-in-the-database)

## Setup Guide

Follow these steps to set up the RPG Viewer Server:

1. **MongoDB Setup**
  - Option 1: [Install MongoDB locally](https://docs.mongodb.com/manual/installation/) and create a new database.
  - Option 2: Use an existing MongoDB instance (local or cloud, e.g., [MongoDB Atlas](https://www.mongodb.com/atlas)).

2. **Configure Environment Variables**
  - Copy the `.env.example` file to `.env` in the project root.
  - Update the values in `.env` as needed:
    - `MONGODB_URL`: your MongoDB connection string.
    - `PORT`: the port number for the server (e.g., `3000`).

3. **Install Dependencies**
  ```bash
  npm install
  ```

4. **Start the Server**
  ```bash
  npm start
  ```

The server should now be running and connected to your MongoDB database.

## Important Note

Make sure to note the server's public IP address and the port number you configured. You will need these details when setting up the frontend application to connect to the server.

## Port Forwarding (If Running Locally)

If you are running the server on your local machine and want to access it from other devices or over the internet, you may need to set up port forwarding on your router:

1. Log in to your router's admin panel.
2. Locate the port forwarding section.
3. Forward the port you configured for the server (e.g., `3000`) to your local machine's IP address.
4. Save the changes and restart your router if necessary.

**Note:** Exposing your server to the internet can have security implications. Ensure you understand the risks and consider using a firewall or VPN for additional protection.

## Managing Data in the Database

You can manage your MongoDB data using either a graphical interface or command-line tools:

- **MongoDB Compass (GUI):**  
  [MongoDB Compass](https://www.mongodb.com/products/compass) is an official GUI for MongoDB. It allows you to visually explore your data, run queries, and manage collections and documents without writing code.

- **Mongo Shell (CLI):**  
  The [MongoDB Shell](https://www.mongodb.com/docs/mongodb-shell/) is an interactive JavaScript interface to MongoDB. You can use it to connect to your database, run queries, and perform administrative tasks from the command line.

For more information, refer to the official documentation for [MongoDB Compass](https://www.mongodb.com/products/compass) and the [MongoDB Shell](https://www.mongodb.com/docs/mongodb-shell/).