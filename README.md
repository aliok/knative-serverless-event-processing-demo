# Knative Serverless Event Processing Demo

## Introduction

This project demonstrates how to do serverless event processing with Knative.

A special application, `kafka-smasher` located in the source tree, produces lots of messages to the Kafka cluster.

KafkaSource fetches them and then sends them to the Knative service called `request-logger`, which is also located in the source tree.
`request-logger` is a very simple application that only logs the requests it receives.

Since `kafka-smasher` is sending a lot of messages, Knative will scale the `request-logger` horizontally to multiple pods and kill
the pods once all messages are consumed from Kafka. 

Following the diagram of the workflow:

```
                            ┌───────────┐                                   Knative Service
                            │           │        ┌───────────────┐    ┌─────────────────────────┐
┌──────────────────┐        │           │        │               │    │                         │
│ Message Producer ├────────►   Kafka   ├────────►  KafkaSource  ├────►─┐                       │
│  (kafka-smasher) │        │           │        │               │    │ │                       │
└──────────────────┘        │           │        └───────────────┘    │ │                       │
                            └───────────┘                             │ │  ┌──────────────────┐ │
                                                                      │ ├──►       Pod        │ │
                                                                      │ │  │ (request-logger) │ │
                                                                      │ │  └──────────────────┘ │
                                                                      │ │                       │
                                                                      │ │  ┌──────────────────┐ │
                                                                      │ └──►       Pod        │ │
                                                                      │    │ (request-logger) │ │
                                                                      │    └──────────────────┘ │
                                                                      │                         │
                                                                      │                         │
                                                                      │         ...             │
                                                                      └─────────────────────────┘
```


## Prerequisites

* Docker
* `kind`: https://kind.sigs.k8s.io/
* `kubectl`: https://kubernetes.io/docs/tasks/tools/
* `stern`: https://github.com/wercker/stern
* A recent version of NodeJS (demo presented with Node v12.14.1)  

## Prepare

Start your cluster:

```bash
kind create cluster
```

Install Knative, Strimzi; create a Kafka cluster:

```bash
./hack/01-kn-serving.sh && ./hack/02-kn-eventing.sh && ./hack/03-strimzi.sh && ./hack/04-kn-kafka.sh
```

Build `request-logger` and `kafka-smasher` images:

```bash
## TODO DOCKER_HUB_USERNAME=<your username here>
DOCKER_HUB_USERNAME=aliok

docker build request-logger -t docker.io/${DOCKER_HUB_USERNAME}/request-logger
docker push docker.io/${DOCKER_HUB_USERNAME}/request-logger

docker build kafka-smasher -t docker.io/${DOCKER_HUB_USERNAME}/kafka-smasher
docker push docker.io/${DOCKER_HUB_USERNAME}/kafka-smasher
```

## Run the demo

### Setting up common resources

Create the namespace, the source and the sink:

```bash
kubectl -f config/01-namespace.yaml
kubectl -f config/02-sink.yaml
kubectl -f config/03-topic.yaml
kubectl -f config/04-source.yaml
```

Start watching the sink Knative service logs:

```bash 
stern -n my-namespace sink
```

### Sending single message

Produce some messages in another terminal:
```bash 
kubectl -n kafka exec -it my-cluster-kafka-0 -- bin/kafka-console-producer.sh --broker-list localhost:9092 --topic kafkasource-demo
```

You should see the messages you produced in the sink logs in the previous terminal, but as CloudEvents.

Now, stop producing messages since we are going to send heavy load to Kafka.

### Sending many messages

In another terminal, start watching the pods:

```bash
watch kubectl get pods -n my-namespace
```

Create the kafka-smasher job, which sends many messages to Kafka:

```bash
kubectl -f config/05-kafka-smasher.yaml
```

You should see a lot of pods coming up.

## Clean up

```bash
kubectl delete -f config/

kind delete cluster
```
