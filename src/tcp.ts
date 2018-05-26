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

import { ConnectionProvider } from "./provider";
import * as $Net from "net";
import { EventEmitter } from "events";
import { Reconnector, DefaultReconnector } from "./controller";

const HAS_READY_EVENT = parseInt(
        process.version.split(".", 1)[0].slice(1)
    ) >= 9 &&
    parseInt(
        process.version.split(".", 2)[1]
    ) >= 11;

class TCPProvider
extends EventEmitter
implements ConnectionProvider<$Net.Socket, NodeJS.ErrnoException> {

    private _conn!: $Net.Socket;

    private _opts: $Net.NetConnectOpts;

    public constructor(opts: $Net.NetConnectOpts) {

        super();

        this._opts = opts;
    }

    public connect(): void {

        this.close();

        this._conn = $Net.createConnection(this._opts);

        this._conn
        .on("close", () => this.emit("close"))
        .on(HAS_READY_EVENT ? "ready" : "connect", () => this.emit("connected"))
        .on("error", (e) => this.emit("error", e));
    }

    public close(): void {

        if (this._conn && !this._conn.destroyed) {

            this._conn.destroy();
            delete this._conn;
        }
    }

    public get connection(): $Net.Socket {

        return this._conn;
    }
}

export function createTCPReonnector(
    opts: $Net.NetConnectOpts
): Reconnector<$Net.Socket, NodeJS.ErrnoException> {

    return new DefaultReconnector<$Net.Socket, NodeJS.ErrnoException>(
        new TCPProvider(opts)
    );
}
