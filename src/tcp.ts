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

export interface CreateOptions extends $Net.TcpNetConnectOpts {

    /**
     * The timeout in milliseconds for connecting to remote host.
     */
    connectTimeout?: number;
}

class TCPProvider
extends EventEmitter
implements ConnectionProvider<$Net.Socket, NodeJS.ErrnoException> {

    private _conn!: $Net.Socket;

    private _opts: CreateOptions;

    public constructor(opts: CreateOptions) {

        super();

        this._opts = opts;
    }

    public connect(): void {

        this.close();

        this._conn = $Net.createConnection(this._opts);

        if (this._opts.connectTimeout && this._opts.connectTimeout > 0) {

            this._conn.setTimeout(
                this._opts.connectTimeout,
                () => {
                    const address = this._opts.host || "127.0.0.1";
                    const e: any = new Error(
                        `connect ECONNTIMEOUT ${address}:${this._opts.port}`
                    );
                    e.code = e.errno = "ECONNTIMEOUT";
                    e.address = address;
                    e.port = this._opts.port;
                    e.syscall = "connect";
                    this._conn.destroy(e);
                }
            ).once(
                "connect",
                () => this._conn.setTimeout(this._opts.timeout || 0)
            );
        }

        this._conn
        .on("close", () => this.emit("close"))
        .on(HAS_READY_EVENT ? "ready" : "connect", () => this.emit("connected"))
        .on("error", (e) => this.emit("error", e));
    }

    public close(): void {

        if (this._conn && this._conn.writable) {

            this._conn.end();
        }
    }

    public get connection(): $Net.Socket {

        return this._conn;
    }
}

export function createTCPReonnector(
    opts: CreateOptions
): Reconnector<$Net.Socket, NodeJS.ErrnoException> {

    return new DefaultReconnector<$Net.Socket, NodeJS.ErrnoException>(
        new TCPProvider(opts)
    );
}
