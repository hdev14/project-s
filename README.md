# Project S [Build in Public]
This is an idea of SaaS to manage service and product subscriptions. The project is design to support mult-tenant users and it is being implemented with the best software's practices, such as DDD, TDD, Hexagonal Architecutre, Clean Architecture and Modular Architecture.

[System Design (WIP)](https://excalidraw.com/#json=-9EoHMp9-sZsnnsJgxSZs,kU7PZsPbZowNREkOI3vlvg)

1. [Setup](#setup)
2. [Architecture & Code Design](#architecture--code-design)
3. [Automated Tests](#automated-tests)
4. [Methodologies](#methodologies)
5. [API Docs](#api-docs)
6. [UI](#ui)
7. [Technologies](#main-technologies)

## Setup

### Envs

First of all, you have to make a copy of the .env.example in each workspace.

E.g:
```bash
cp applications/core/.env.example applications/core/.env
cp applications/backoffice/.env.example applications/backoffice/.env
cp applications/platform/.env.example applications/platform/.env
```

### Docker

The project has a docker-compose.yml that is perfect to setup every thing you thing to run the project localy. So all you need is just exec the command below:

`docker compose up --build`

>Obs.: You must follow all the setup section mention early to run this command.

### Database Migration
- setup

## Architecture & Code Design

### Clean Architecture
- write about the principles

### Hexagonal Architecture
- write about the real ports and adapters

### Domain Modeling
- write about the tactical aproach

### Modular Architecture
- write about

### Monorepo & Project Structure
- tree

## Automated Tests

### Unit tests
- setup
- examples

### Integration Tests
- setup
- examples

### End to End tests
- setup
- examples

## Methodologies

### Domain Driven Design
- write about
- ubiquitous language
- glossary

### Test Driven Development
- write about
- references

## API Docs
- open api
- instructions

## UI
<Figma>

## Technologies

[typescript](), [nodej](), [nextjs](), [react](), [express](), [inversify](), [jest](), [pg](), etc.