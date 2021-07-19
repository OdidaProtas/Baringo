import {NextFunction, Request, Response} from "express";
import axios from "axios";

const mpesaAuthUrl = process.env.mpesa_url;
const darajaSandBoxUrl = process.env.stk_push_url;

const users: any = {};

export class PaymentController {

    async stkPush(request, response) {

        let auth = `Bearer ${request.token}`;
        let timestamp = getTimestamp();


        let bsShortCode = process.env.short_code;

        let passkey = process.env.passkey;

        let formattedPass = `${bsShortCode}${passkey}${timestamp}`;

        let password = Buffer.from(formattedPass).toString('base64');
        let type = "CustomerPayBillOnline";

        let partyA = formatPhoneNumber(response, request.body.phone);
        let partyB = process.env.short_code;

        let callBackUrl = "https://dreamvill.herokuapp.com/mpesa/hook";
        let accountReference = "test";
        let transactionDesc = "test";

        let amount = validateAmount(response, parseInt(request.body.amount));


        let data = {
            BusinessShortCode: bsShortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: type,
            Amount: amount,
            PartyA: partyA,
            PartyB: partyB,
            PhoneNumber: partyA,
            AccountReference: accountReference,
            TransactionDesc: transactionDesc,
            CallBackURL: callBackUrl
        }


        let config = {
            headers: {
                Authorization: auth,
            }
        }

        try {
            await axios.post(darajaSandBoxUrl, data, config).then(res => {
                console.log(res.data.CheckoutRequestID);
                return response.send({
                    success: true,
                    message: res.data
                });

            }).catch(e => {
                return response.send({
                    success: false,
                    message: e['response']['statusText']
                });
            })

        } catch (e) {
            return response.send({
                success: false,
                message: e['response']['statusText']
            });
        }


    }

    async requestPayment(request: Request, response: Response, next: NextFunction) {

        let consumerKey = process.env.consumer_key;
        let consumerSecret = process.env.consumer_secret;

        let buffer = Buffer.from(consumerKey + ":" + consumerSecret);

        let auth = `Basic ${buffer.toString("base64")}`;

        try {
            let {data} = await axios.get(mpesaAuthUrl, {
                "headers": {
                    "Authorization": auth
                }
            })

            request.token = data['access_token'];

            return this.stkPush(request, response);

        } catch (e) {

            return response.json({
                success: false,
                message: e['response']['statusText']
            })
        }
    }
}

const formatPhoneNumber = (response, phoneNumber: string) => {
    let formatted = parseInt(`254${phoneNumber.substring(1)}`);
    if (numberIsValid(formatted)) return formatted;
    return response.status(400).json({status: "invalid_phone_number", desc: "Bad Request"});
}


const numberIsValid = (formatted) => {
    let _pattern = /^(?:254|\+254|0)?(7(?:(?:[129][0-9])|(?:0[0-8])|(4[0-1]))[0-9]{6})$/;
    return _pattern.test(formatted);
}

const validateAmount = (response, amount) => {
    if (isNaN(amount) || amount < 1) {
        response.status(400).json({status: "invalid_amount", description: "Bad Request"});
    }
    return amount;
}

const getTimestamp = () => {

    let date = new Date();

    function pad2(n) {
        return (n < 10 ? '0' : '') + n;
    }

    return date.getFullYear() +
        pad2(date.getMonth() + 1) +
        pad2(date.getDate()) +
        pad2(date.getHours()) +
        pad2(date.getMinutes()) +
        pad2(date.getSeconds());
}
