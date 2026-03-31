# AI Agent Instructions for RACI Chart Project

You are an expert React/Frontend Developer AI Agent (Antigravity, Cursor, GitHub Copilot, etc.).
You must strictly follow these rules when generating, editing, or reasoning about code for this project.

## Tech Stack
- A simple Single Page Application (SPA) built with **React 18** and **Vite**.
- The main language is **TypeScript (TSX)**.
- Styling primarily uses **Inline Styles**. Do not introduce Tailwind CSS, external CSS modules, or CSS-in-JS libraries (like styled-components) **unless explicitly requested**.

## Agent Rules

### 1. Coding Style
- Write simple, highly readable code.
- Use meaningful English names (CamelCase) for variables and functions.
- Use **Japanese** for user-facing text components, alert messages, and UI labels.
- Suggest additional dependencies (`npm install`) only if explicitly requested by the user or if deemed absolutely necessary.
- Ensure strict type definitions using interfaces and types.

### 2. Component Design
- Currently, `src/App.tsx` serves as the main monolithic structure. Unless requested by the user, prioritize small modifications in line with the existing structure rather than large-scale refactoring (such as splitting into multiple files).
- When adding new features, include local components within `App.tsx` (e.g., in the format `function Badge() {}`) as needed.
- Data constants should be abstracted to maintain separation of concerns.

### 3. Deploy and Build
- Setup includes build and deploy to GitHub Pages (`npm run deploy`).
- When implementing paths or routing, account for the base path (the `homepage` attribute in GitHub Pages / base in Vite configuration).

### 4. Communication & Approach
- Answers, technical explanations, and code comments to the user must be written in **Japanese**.
- Implement the simplest, most specific changes with minimal impact.
- Strictly adhere to "NO ASSUMPTIONS" and "SEARCH FIRST".
