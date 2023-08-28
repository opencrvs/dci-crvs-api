# DCI CRVS API

This repository provides [DCI standards](https://github.com/spdci/standards) compliant API for CRVS systems. It communicates between OpenCRVS and any other system that can communicate using the DCI standard.

API reference can be found [here](https://spdci.github.io/standards/release/html/registry_core_api_v1_0.0.0.html).

Table of currently supported and compliant endpoints:

| Endpoint                | Description                                                                             | Implementation status |
| ----------------------- | --------------------------------------------------------------------------------------- | --------------------- |
| `/health`               | Health check endpoint                                                                   | 🔄 Upcoming for v0.1  |
| `/registry/search`      | Search person(s) in registry using an identifier or custom attributes (async, callback) | 🔄 Upcoming for v0.1  |
| `/registry/sync/search` | Search person(s) in registry using an identifier or custom attributes (sync)            | 🔄 Upcoming for v0.1  |

The package is a Node & TypeScript project and the API is built using [Hapi](https://hapi.dev/) as per OpenCRVS convention.

## Prerequisites

- Existing OpenCRVS installation
- [Node.js](https://nodejs.org/en/) (v20.5.1)

## Local development

Developing locally assumes that you have an running OpenCRVS installation. Integration system client details will be created as a system admin in OpenCRVS web UI.

1. Clone the repository
2. Run `npm install` to install dependencies
3. Set required environment variables: `OPENCRVS_CLIENT_ID` and `OPENCRVS_CLIENT_SECRET`. [See OpenCRVS documentation](https://documentation.opencrvs.org/technology/interoperability/create-a-client) for more details how to create a **record search** client.
4. Run `npm start` to start the server
