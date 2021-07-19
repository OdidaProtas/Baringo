import {Request, Response, NextFunction} from "express";
import { PaymentController } from "./controller/PaymentController";

export class Index {
    async index(request: Request, response: Response, next: NextFunction) {
        return "Artik Api";
    }

}

const paymentRoutes = [
    {
        method: "post",
        route: "/mpesa/request",
        controller: PaymentController,
        action: "requestPayment"
    }

]

const homeRoute = {
    method: "get",
    route: "/",
    controller: Index,
    action: "index"
}

export const Routes = [
    homeRoute,
    ...paymentRoutes,
];

