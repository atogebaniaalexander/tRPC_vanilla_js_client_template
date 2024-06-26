/**
 * This is the client-side code that uses the inferred types from the server
 */
import { createTRPCClient, unstable_httpBatchStreamLink } from "@trpc/client";
// Initialize the tRPC client
const trpc = createTRPCClient({
    links: [
        unstable_httpBatchStreamLink({
            url: "http://localhost:3000",
        }),
    ],
});
// Call procedure functions
// 💡 Tip, try to:
// - hover any types below to see the inferred types
// - Cmd/Ctrl+click on any function to jump to the definition
// - Rename any variable and see it reflected across both frontend and backend
const users = await trpc.user.list.query();
//    ^?
console.log("Users:", users);
const createdUser = await trpc.user.create.mutate({ name: "sachinraja" });
//    ^?
console.log("Created user:", createdUser);
const user = await trpc.user.byId.query("1");
//    ^?
console.log("User 1:", user);
const iterable = await trpc.examples.iterable.query();
for await (const i of iterable) {
    console.log("Iterable:", i);
}
