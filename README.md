# tRPC_vanilla_js_client_template

> Note: the tRPC version used in this template is :11.

## Installation

Start off by installing the @trpc/server and @trpc/client packages:

```bash
npm install @trpc/server@next @trpc/client@next
```

## Defining a backend router

Let's walk through the steps of building a typesafe API with tRPC. To start, this API will contain three endpoints with these TypeScript signatures:

```typescript
type User = { id: string; name: string; };

userList: () => User[];
userById: (id: string) => User;
userCreate: (data: { name: string }) => User;
```

### 1. Create a router instance
First, let's initialize the tRPC backend. It's good convention to do this in a separate file and export reusable helper functions instead of the entire tRPC object.

```typescript
//server/trpc.ts
import { initTRPC } from '@trpc/server';
 
/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.create();
 
/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;
```
Next, we'll initialize our main router instance, commonly referred to as `appRouter`, in which we'll later add procedures to. Lastly, we need to export the type of the router which we'll later use on the client side.

```typescript
//server/index.ts
import { router } from './trpc';
 
const appRouter = router({
  // ...
});
 
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
```

### 2. Add a query procedure
Use `publicProcedure.query()` to add a query procedure to the router.

The following creates a query procedure called `userList` that returns a list of users from our database:

```typescript
//server/index.ts
import { db } from './db';
import { publicProcedure, router } from './trpc';
 
const appRouter = router({
  userList: publicProcedure
    .query(async () => {
      // Retrieve users from a datasource, this is an imaginary database
      const users = await db.user.findMany();
      return users;
    }),
});
```

### 3. Using input parser to validate procedure inputs

To implement the userById procedure, we need to accept input from the client. tRPC lets you define [input parsers](https://trpc.io/docs/server/procedures#input-validation) to validate and parse the input. You can define your own input parser or use a validation library of your choice, like zod, yup, or superstruct.

You define your input parser on `publicProcedure.input()`, which can then be accessed on the resolver function as shown below:

The input parser should be a function that validates and casts the input of this procedure. It should return a strongly typed value when the input is valid or throw an error if the input is invalid.

```typescript 
//server/index.ts
const appRouter = router({
  // ...
  userById: publicProcedure
    // The input is unknown at this time. A client could have sent
    // us anything so we won't assume a certain data type.
    .input((val: unknown) => {
      // If the value is of type string, return it.
      // It will now be inferred as a string.
      if (typeof val === 'string') return val;
 
      // Uh oh, looks like that input wasn't a string.
      // We will throw an error instead of running the procedure.
      throw new Error(`Invalid input: ${typeof val}`);
    })
    .query(async (opts) => {
      const { input } = opts;
      // Retrieve the user with the given ID
      const user = await db.user.findById(input);
      return user;
    }),
});
```

Alternatively we can use `zod`:

The input parser can be any `ZodType`, e.g. `z.string()` or `z.object()`.

```typescript 

import { z } from 'zod';
 
const appRouter = router({
  // ...
  userById: publicProcedure
    .input(z.string())
    .query(async (opts) => {
      const { input } = opts;
      // Retrieve the user with the given ID
      const user = await db.user.findById(input);
      return user;
    }),
});
```

### 4. Adding a mutation procedure

Similar to GraphQL, tRPC makes a distinction between query and mutation procedures.

The way a procedure works on the server doesn't change much between a query and a mutation. The method name is different, and the way that the client will use this procedure changes - but everything else is the same!

Let's add a `userCreate` mutation by adding it as a new property on our router object:

```typescript 

const appRouter = router({
  // ...
  userCreate: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async (opts) => {
      const { input } = opts;
      // Create a new user in the database
      const user = await db.user.create(input);
      return user;
    }),
});
```
## Serving the API
Now that we have defined our router, we can serve it. tRPC has many [adapters](https://trpc.io/docs/server/adapters) so you can use any backend framework of your choice. To keep it simple, we'll use the [standalone](https://trpc.io/docs/server/adapters/standalone) adapter.

```typescript
import { createHTTPServer } from '@trpc/server/adapters/standalone';
 
const appRouter = router({
  // ...
});
 
const server = createHTTPServer({
  router: appRouter,
});
 
server.listen(3000);
```
## Using your new backend on the client
Let's now move to the client-side code and embrace the power of end-to-end typesafety. When we import the `AppRouter` type for the client to use, we have achieved full typesafety for our system without leaking any implementation details to the client.

### 1. Setup the tRPC Client

```typescript 
//client/index.ts
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server';
//     👆 **type-only** import
 
// Pass AppRouter as generic here. 👇 This lets the `trpc` object know
// what procedures are available on the server and their input/output types.
const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000',
    }),
  ],
});
```
Links in tRPC are similar to links in GraphQL, they let us control the data flow before being sent to the server. In the example above, we use the [httpBatchLink](https://trpc.io/docs/client/links/httpBatchLink), which automatically batches up multiple calls into a single HTTP request. For more in-depth usage of links, see the [links documentation](https://trpc.io/docs/client/links).

### 2. Querying & mutating
you now have access to your API procedures on the `trpc` object. Try it out!
```typescript 
// Inferred types
const user = await trpc.userById.query('1');
 
const createdUser = await trpc.userCreate.mutate({ name: 'sachinraja' });
```











