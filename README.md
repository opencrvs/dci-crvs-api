# DCI CRVS API

This repository provides [DCI standards](https://github.com/spdci/standards) compliant API for CRVS systems. It communicates between OpenCRVS and any other system that can communicate using the DCI standard.

API reference can be found [here](https://spdci.github.io/standards/release/html/registry_core_api_v1_0.0.0.html).

Table of currently supported and compliant endpoints:

| Endpoint              | Description                                                           | Implementation status |
| --------------------- | --------------------------------------------------------------------- | --------------------- |
| `/health`             | Health check endpoint                                                 | 🔄 Upcoming for v0.1  |
| `/registry/search`    | Search person(s) in registry using an identifier or custom attributes | 🔄 Upcoming for v0.1  |
| `/registry/on-search` | Search results through a callback                                     | 🔄 Upcoming for v0.1  |

The package is a Node & TypeScript project and the API is built using [Hapi](https://hapi.dev/) as per OpenCRVS convention.

## Prerequisites

- Existing OpenCRVS installation
- [Node.js](https://nodejs.org/en/) (v20.5.1)
