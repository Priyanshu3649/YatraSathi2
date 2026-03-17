# Criteria for Determining File Essentiality

This document outlines the criteria used to determine which files are essential to the project and which can be safely removed.

## Essential Files

The following files and directories are considered essential and should not be deleted:

- **Source Code**: All files within the `src` and `frontend/src` directories.
- **Configuration Files**: All files ending in `.js`, `.json`, `.sql`, and `.env`.
- **Dependencies**: The `node_modules` and `frontend/node_modules` directories.
- **Documentation**: The `README.md` file and any other official documentation.
- **Version Control**: The `.git` directory and `.gitignore` file.

## Non-Essential Files

The following files are considered non-essential and can be safely deleted:

- **Log Files**: Files with the `.log` extension.
- **Temporary Files**: Files with the `.tmp` extension.
- **Backup Files**: Files with the `.bak` extension.
- **Non-Essential Markdown Files**: Markdown files that are not part of the official documentation, such as temporary notes or feature-specific documentation.
