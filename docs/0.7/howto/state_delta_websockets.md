# State Delta Subscriptions via Web Sockets

<!--
  Copyright 2022 Cargill Incorporated
  Licensed under Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
-->

As transactions are committed to Scabbard, an app developer may be interested
in receiving events related to the changes in state that result. These events,
*StateDeltaEvents*, include information about the advance of the distributed
ledger, as well as state changes that can be limited to specific address spaces
in the global state.

An application can subscribe to receive these events via a web socket,
provided by the REST API component.

# Opening a Web Socket

The application developer must first open a web socket.

Connect to the websocket at the following URL:
```
/scabbard/{circuit_id}/{service_id}/ws/subscribe?last_seen_event={last_event_id}
```

 * **circuit\_id** - The circuit's id. Example: `cnUMd-6YXUV`
 * **service\_id** - The service id. Example: `gsAA`
 * **last\_event\_id** - (optional) The event id to start streaming from. If
   none is provided, the node will send all events for the circuit, starting
   from the first.

And send the following headers:
```
Authorization: Bearer Cylinder: {token}
SplinterProtocolVersion: {version}
```

 * **token** - The Cylinder auth token. See: [Cylinder JWT authentication]({%
   link community/planning/cylinder_jwt_authentication.md %})
 * **version** - (optional) The SplinterProtocolVersion supported by the
   client. If not provided, the node will respond with the latest protocol
   version. Example: `2`

# Events

Once subscribed, the web socket will receive events. Each event is a string
encoded as JSON, which looks like the following:

``` javascript
{
  "id": "f62b978a8836013b6ceaac8331a7f720ddd837de7333ae14ab0f4adad445118574735afeeea1f98a51254d8750f1769fc18d6c638963af7f66c5b5086545fba1",
  "state_changes": [
    {
      "Set": {
        "key": "00ec00ebfd680ea8abffc272049e01409cda9efec943f4ddca0263897e715913a04705",
        "value": [
          10,
          117,
          10,
          8,
	  /* ... */
	]
      },
    }
}
```

Each entry type is either `Set` or `Delete`. In the case of `Set` the value is
an array of bytes. In the case of `Delete`, only the address is provided. If
you are using a transaction family that supports deletes, you\'ll need to keep
track of values via address, as well.

# Unsubscribing

To unsubscribe, you can close the web socket.
