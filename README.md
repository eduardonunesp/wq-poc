# WQ (Just a simple POC of Queue Service) 

## 🖥 Description

WQ is a simple and small proof of concept of a queue service like AWS SQS service (except you will not able to do a long pooling and much more off course).

What exactly users can do on this simple services you ask, well users can post a message to the queue, and users can retrieve a number of messages available, the retrieved messages will be unavailable for other requests until a timeout, if the time expires the messages are pushed back to the queue again or if the messages are confirmed it will be removed from the queue permanently.

## 🚢 Installing

```bash
yarn install
```

## 🚀 Running

```bash
yarn start
```

The command `yarn start` will compile the `TypeScript` and run the `Node.JS` service which will expose the port `3000`, which can be changed by the env var `PORT` if needed.

## 🙋‍♂️Methods Available

### POST `/`

The method `POST` is used to push a new message to the queue, it will receive a `JSON` body with the contents of the message, the format of the `JSON` is free, only requirest to be a valid `JSON` and you are free to format on your own way, for instance a simple content for the body:

```json
{
  "user": "foo",
  "value": 12,
  "valid": true,
  "binary": "MHgxZjFmMWY=",
  "samples": [
    1,2,3
  ]
}
```

The `curl` should be like

```bash
curl -X POST \
  --header "Content-Type: application/json" \
  --data '{"value": 12}' \
  http://localhost:3000
```

If the `POST` succeed the status of the request should be `201` and it will produce and return an output with the `messageID` to be used later for confirm the message, for instance:

```json
{
  "messageID": "0c3d1aa3-32e9-47ef-a272-116a3cd3fc6f"
}
```

Otherwise the post will failed and return `500` or `400`

### GET `/`

The method `GET` will return the messages available on the queue, is important to note that once the user retrieve the messages those messages will be locked from other requests of any other user for some time, that time or timeout can be configured on the queue configuration the default timeout is `1000 milliseconds`, once the timer expire the messages will be available again for other users, unless if the messsages are confirmed then the messages will be removed from the queue once and for all.

The `curl` should be like

```bash
curl -X GET http://localhost:3000
```

If the `GET` succeed the status of the request should be `200` and it will return the messages available into array of messages

```json
{
  "messages": [
    {
      "id": "2b393a24-c46b-41eb-b0b7-f968dba987d2",
      "body": {
        "value": 12
      }
    }
  ]
}
```

The amount of messages returned are `10` by default, however the user can request much more (right now there're no limit). Let's say you want to request 100 messages, should be like the following request

```bash
curl -X GET "http://localhost:3000/?amount=100"
```

Otherwise the get will failed and return `500`

### PATCH `/{messageID}`

Finally the `PATCH` method is responsible for the confirmation of the message, remember if the message isn't confirmed after received it will be pushed back into the queue after the timeout of the message expire (the default timeout is 1000ms depending of the queue configuration).

The patch method should be straight forward, the user should inform the ID of the message, which can be found on the return of the `POST` or the return id on the messages retrieved from the `GET` method.

The `curl` should be like

```bash
curl -X PATCH http://localhost:3000/c2d94881-8722-4c8e-a621-2114f83727c6
```


If the `PATCH` succeed the status of the request should be `204` and no body will be returned on the request. Otherwise the get will failed and return `404` or `500`