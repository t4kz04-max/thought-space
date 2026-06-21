# Thought Space

A 3D concept mapping tool for visualizing ideas, knowledge, and relationships.

## Overview

Thought Space is an interactive application that allows users to organize concepts in a 3D space.

Instead of using a traditional 2D mind map, users can place concepts as nodes and connect relationships as edges to create their own thought structures.

## Features

- Create and edit concept nodes
- Connect concepts with relationships
- Organize ideas spatially in 3D
- Customize node appearance
- Save and load graphs as JSON
- Undo / Redo history system

## How it works

### Nodes

Nodes represent concepts, ideas, or information.

Each node contains:
- Position
- Label
- Description
- Color
- Shape
- Size

### Edges

Edges represent relationships between concepts.

Users define the meaning of distance and connections manually.

Example:

- Close nodes → strong relationship
- Distant nodes → weak relationship

## Tech Stack

Frontend:
- React
- TypeScript
- Vite

3D:
- Three.js
- React Three Fiber
- React Three Drei

## Demo

(https://thought-space-5xst.vercel.app/)

## Future Ideas

- AI-assisted concept generation
- Importing knowledge from documents
- Automatic concept clustering
- Collaboration features
