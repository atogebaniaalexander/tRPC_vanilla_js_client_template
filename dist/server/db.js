// Imaginary database
const users = [];
export const db = {
    user: {
        findMany: async () => users,
        findById: async (id) => users.find((user) => user.id === id),
        create: async (data) => {
            const user = { id: String(users.length + 1), ...data };
            users.push(user);
            return user;
        },
    },
};
