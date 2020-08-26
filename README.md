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

> Note this POC doesn't care about the amount of the messages retrieved, however in order to scale and control the service some limit should be implied here or it can turn into a castrophic fail if the user requests all messages and never confirm

Otherwise the get will failed and return `500`

### PATCH `/{messageID}`

Finally the `PATCH` method is responsible for the confirmation of the message, remember if the message isn't confirmed after received it will be pushed back into the queue after the timeout of the message expire (the default timeout is 1000ms depending of the queue configuration).

The patch method should be straight forward, the user should inform the ID of the message, which can be found on the return of the `POST` or the return id on the messages retrieved from the `GET` method.

The `curl` should be like

```bash
curl -X PATCH http://localhost:3000/c2d94881-8722-4c8e-a621-2114f83727c6
```


If the `PATCH` succeed the status of the request should be `204` and no body will be returned on the request. Otherwise the get will failed and return `404` or `500`

## About the POC

### Memory only structures

The WQ uses basically two in memory structures for mantain the queue and the on processing (LOCKED) messages, for simulate the queue the service uses an `Array` with the methods `push` and `shift` which makes the FIFO (First In First Out) way of standard queue, the other structure is a `Map` which is for fast lookup of the messages that are on processing until the timeout, of course the register is temporary so in order for a future improvement it should work as an atomic database like `Redis` with guarantees of atomic reads and writes.

### Node.JS / Single Threaded / IO blocking

Inside this simple POC the most common IO operation is the HTTP requests, which are managed by the Express server, so we don't worry too much with race conditions that are common on queue services with multiple threads accessing the queue data on the same time, there no mutexes on this code, since the access is always sequential. However this characteristic can turn into an issue if the main loop gets too much busy or if the requests for the external resources comes into play so a race condition can be real and it will require many changes on the processing structures.

### Expiring locks on messages on process

Once the message is retrieved by the user it will run an internal timer (memory only) and when the timer expires (because the message wasn't confirmed) it will call a function for push the message again on the queue, the message will be pushed to the end of the queue, probably another way to solve this is to send the message for another queue that is specific for that kind of process, to be process separately or maybe a limit for the message to be retrieved, because send to the end of queue everytime can lead to a queue with useless messages looping. Also, because the timer runs on memory would be required some layer to persist the timer in case of a restauration to be needed.

### Fault tolerance

This POC of queue has no fault tolerance available, however if needed a basic file syncronization can be created, a really basic because it should implement some sort of snapshot or even an basic incremental changes in order to be possible to restore if some crash ocurrs. In order to scale this service healthy it should have a serious backend service to store and guarantee the fault tolerance, replication and publish confirmations.

### Scalability

In order to achieve scalability many things should be changed here, first the service will require some ACID database storage or with good atomicity instead of a memory only, for instance something like `Redis` or the `DynamoDB`, also the modularity will require a better interface for different backends (if needed to use another database as backend), second as mentioned before a better interface should be added to the POC to communicate with the backend and third it should have some way to configure a `Sharding` and `Clusterization` in order to split and routing the data amongst different clusters, insuring excellent writes/reads on milliseconds. On the front end of the server it will require an horizontal strategy of scale using services like `NGINX` into reverse proxy mode or the `AWS Load Balancer`.
