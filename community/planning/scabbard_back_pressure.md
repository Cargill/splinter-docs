# Scabbard Back Pressure

## Summary
[summary]: #summary

When scabbard is under heavy load the send queue can fill up. This resulted in
the following error that halted all future batch processing:

```
[2021-04-13 13:06:28.911] T["Orchestrator Outgoing"] ERROR [splinter::orchestrator::runnable]
 erminating orchestrator  outgoing thread due to error: an orchestration error occurred:
connection 20ae95a4-b2f0-4a99-8174-29c123420c00 send queue is full
```

Instead of falling over, when the batch queue fills up scabbard should start
rejecting new batches until it can handle the batches it has already accepted.

## Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

A simple back pressure will be added to the scabbard batch submission by
returning a 429 Too Many Requests if the service's batch queue reaches 30 or
more batches.

```
/scabbard/{circuit}/{service_id}/batches:
    post:
      summary: Submit a list of batches to the Scabbard service
      description: |
        This endpoint can be used to submit batches to a Scabbard service. The
        body of the request must be a list of valid Sabre batches. If the
        batches are submitted successfully, the response will contain a link for
        checking the status of the submitted batches.

        This endpoint requires the permission "scabbard.write".

      . . .  

    429:
      description: Too many requests have been made to process batches
```

Any APIs written against the scabbard REST API should handle the 429 response by
waiting and resubmitting the batch at a future time. Scabbard will start
accepting requests again once the queue reaches half its max size, 15 batches.

## Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

If the pending batch queue gets bigger than 30 batches, any new batches that are
submitted will be rejected with TooManyRequests until the queue size is reduced
by half.

The services coordinator is currently the only service that keeps track of the
pending batches, therefore the coordinator needs to tell the other members of
the circuit that there are too many batches. The following two message types
will be added

```proto
    message ScabbardMessage {
        enum Type {
            UNSET = 0;
            CONSENSUS_MESSAGE = 1;
            PROPOSED_BATCH = 2;
            NEW_BATCH = 3;

        +   TOO_MANY_REQUESTS = 10;
        +   ACCEPTING_REQUESTS = 11;
        }
    }
```


When the coordinator's queue reaches 30 batches, it will notify its peer
services by sending a `ScabbardMessageType::TOO_MANY_REQUESTS`. During this time
the coordinator will stop accepting any batches from its REST API but it will
still accept pending batches from the other services to account for any that may
be accepted before the TOO_MANY_REQUEST message is handled.

Non-coordinators will stop accepting batches when they receive
`ScabbardMessageType::TOO_MANY_REQUESTS`. The service will only start accepting
batches again when it receives a `ScabbardMessageType::ACCEPTING_REQUESTS` from
the coordinator.

Once back pressure is enabled, new batches will not be accepted until the queue
gets to half the size of the limit. The coordinator will then send a
`ScabbardMessageType::ACCEPTING_REQUESTS` messages to the non coordinator and
all services will begin accepting batches again.

The batch queue limit does not change as this is intended to just be a simple
implementation.
