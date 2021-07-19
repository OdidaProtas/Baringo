import "reflect-metadata";
import * as express from "express";
import * as cors from "cors";
import * as bodyParser from "body-parser";
import {Request, Response} from "express";
import {Routes} from "./routes";
import * as http from "http";

const options = {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
}

const app = express();
app.use(bodyParser.json());
app.use(cors());

const server = http.createServer(app);
const io = require("socket.io")(server, options)


Routes.forEach(route => {
    (app as any)[route.method](route.route,
        (req: Request, res: Response, next: Function) => {

            const result = (new (route.controller as any))[route.action](req, res, next);

            if (result instanceof Promise) {
                result.then(result => result !== null && result !== undefined ? res.send(result) : undefined);

            } else if (result !== null && result !== undefined) {
                res.json(result);
            }
        });
});


app.post("/mpesa/hook", (request: Request, response: Response) => {
    const {Body: {stkCallback: {CheckoutRequestID}}} = request.body;
    console.log(request.body);
    io.emit("mpesa-hook", request.body)
    let message = {
        "ResponseCode": "00000000",
        "ResponseDesc": "success"
    }

    response.json(message);
});

io.on("connection", (socket: any) => {
    socket.on("hello", () => {
        socket.emit("hello", "world")
    });
})

server.listen(process.env.PORT);

console.log(`Express server has started on port ${process.env.PORT}`);

