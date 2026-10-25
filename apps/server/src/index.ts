import { createAppServer } from "./createServer";

const port = Number(process.env.PORT ?? 2567);
const server = createAppServer();
await server.listen(port, "0.0.0.0");
console.log(`Sevens server listening on port ${port}`);
