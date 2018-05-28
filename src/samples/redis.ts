/*
   +----------------------------------------------------------------------+
   | LiteRT Reconnect.js Library                                          |
   +----------------------------------------------------------------------+
   | Copyright (c) 2007-2018 Fenying Studio                               |
   +----------------------------------------------------------------------+
   | This source file is subject to version 2.0 of the Apache license,    |
   | that is bundled with this package in the file LICENSE, and is        |
   | available through the world-wide-web at the following url:           |
   | https://github.com/litert/reconnect.js/blob/master/LICENSE           |
   +----------------------------------------------------------------------+
   | Authors: Angus Fenying <fenying@litert.org>                          |
   +----------------------------------------------------------------------+
 */

// tslint:disable:no-console

import * as Reconnector from "..";

const connector = Reconnector.createTCPReonnector({
    host: "127.0.0.1",
    port: 6379,
    connectTimeout: 2000
});

connector.on("connected", function() {

    console.log("Connected");

    const c = connector.connection;

    c.on("data", function(data) {

        console.log(data.toString());
    });

    c.write("AUTH redis-passwd\r\n");

    c.write("PING\r\n");

    c.write("SET a b\r\n");

    c.write("MSET d 1 b 2\r\n");

    c.write("GET a\r\n");

    c.write("MGET d b\r\n");

}).on("error", function(e) {

    console.error(e);

}).on("connect_fail", function(e) {

    console.error("Failed to connect.", e);

}).on("close", function() {

    console.info("Closed.");

}).on("reconnecting", function(n) {

    console.warn(`Reconnecting (${n + 1}th times)...`);

}).setWaitStrategy(function(n): number | false {

    if (n === 5) { // abort reconnecting after 5 times.

        return false;
    }

    return 500;
});

connector.connect();
