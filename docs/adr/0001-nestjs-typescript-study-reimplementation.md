# ADR 0001: NestJS / TypeScript study reimplementation

## Context

I wanted to learn the [eShopOnContainers](https://learn.microsoft.com/dotnet/architecture/cloud-native/introduce-eshoponcontainers-reference-app) ideas—bounded contexts, BFF, database-per-service, integration events—on a stack I use daily. A line-by-line port of the official .NET sample would optimize for parity, not for my learning goals.

## Decision

I re-implement the **concepts** with **NestJS**, **TypeScript**, **React**, and **Prisma**, treating Microsoft’s sample as a reference for behaviour and naming, not as a spec to clone. I keep familiar storefront flows where that helps compare behaviour, but I accept differences in project layout and tooling.
