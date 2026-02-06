# @cradle/pyth-oracle

Pyth Price Oracle utilities used by Cradle-generated projects.

This package provides:

- A low-level `getPythPrice` helper that talks to the Pyth Hermes HTTP API
- A React hook `usePythPrice` for fetching and displaying prices in frontends

You normally don't install this package directly. When you add the **Pyth Price Oracle**
node in Cradle and click **Generate**, the orchestrator copies the relevant files
into your generated project's frontend.

