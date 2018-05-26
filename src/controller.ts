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

import * as $Events from "events";
import { ConnectionProvider } from "./provider";

enum TheStatus {
    CLOSED,
    CONNECTING,
    CONNECTED,
    CLOSING
}

export type WaitStrategy = (times: number) => number | false;

export interface Reconnector<
    ConnectionType,
    E = Error
> {
    readonly connection: ConnectionType;

    isConnected(): boolean;

    connect(): this;

    close(): this;

    setWaitStrategy(waiter: WaitStrategy): WaitStrategy;

    removeAllListeners(ev: string): this;

    on(ev: "reconnecting", handler: (times: number) => void): this;

    on(ev: "connect_fail", handler: (e: E) => void): this;

    on(ev: "connected", handler: () => void): this;

    on(ev: "close", handler: () => void): this;

    on(ev: "error", handler: (e: E) => void): this;
}

export const DEFAULT_WAIT_STRATEGY: WaitStrategy = (n: number): number => {

    return n * 1000;
};

export class DefaultReconnector<
    ConnectionType,
    E = Error
>
extends $Events.EventEmitter
implements Reconnector<
    ConnectionType,
    E
> {

    private _status: TheStatus;

    private _wait: WaitStrategy;

    /**
     * How many times has been retried since reconnection began.
     */
    private _reconnectTimes: number;

    private _provider: ConnectionProvider<
        ConnectionType,
        E
    >;

    public constructor(
        provider: ConnectionProvider<
            ConnectionType,
            E
        >
    ) {

        super();

        this._status = TheStatus.CLOSED;

        this._wait = DEFAULT_WAIT_STRATEGY;

        this._provider = provider;

        this._reconnectTimes = 0;

        this._initialize();
    }

    private _initialize(): void {

        this._provider.on("error", (e) => {

            switch (this._status) {
            case TheStatus.CLOSING:
            case TheStatus.CLOSED:
            case TheStatus.CONNECTED:
                this.emit("error", e);
                break;
            case TheStatus.CONNECTING:
                this.emit("connect_fail", e);
                break;
            }

        }).on("connected", () => {

            this._reconnectTimes = 0;

            switch (this._status) {
            case TheStatus.CONNECTED:
            case TheStatus.CONNECTING:
                this._status = TheStatus.CONNECTED;
                this.emit("connected");
                break;
            case TheStatus.CLOSING:
                this._status = TheStatus.CLOSED;
                this._provider.close();
                this.emit("close");
                break;
            }

        }).on("close", () => {

            switch (this._status) {
            case TheStatus.CONNECTING:
            case TheStatus.CONNECTED:

                const times = this._reconnectTimes++;

                const wait = this._wait(times);

                if (wait === false) {

                    this._status = TheStatus.CLOSED;
                    this.emit("close");
                    return;
                }

                this._status = TheStatus.CONNECTING;

                if (wait > 0) {

                    setTimeout(() => {

                        this._provider.connect();
                        this.emit("reconnecting", times);
                    }, wait);
                }
                else {

                    this._provider.connect();
                    this.emit("reconnecting", times);
                }

                break;

            case TheStatus.CLOSING:

                this._status = TheStatus.CLOSED;
                this.emit("close");
                break;
            }
        });
    }

    public get connection(): ConnectionType {

        return this._provider.connection;
    }

    public isConnected(): boolean {

        return this._status === TheStatus.CONNECTED;
    }

    public setWaitStrategy(waiter: WaitStrategy): WaitStrategy {

        const ret = this._wait;

        this._wait = waiter;

        return ret;
    }

    public connect(): this {

        switch (this._status) {
        case TheStatus.CONNECTED:
        case TheStatus.CONNECTING:
            break;
        case TheStatus.CLOSED:
            this._provider.connect();
            this._status = TheStatus.CONNECTING;
            break;
        case TheStatus.CLOSING:
            this._status = TheStatus.CONNECTING;
            break;
        }

        return this;
    }

    public close(): this {

        switch (this._status) {
        case TheStatus.CONNECTED:
        case TheStatus.CONNECTING:
            this._provider.close();
            this._status = TheStatus.CLOSING;
            break;
        case TheStatus.CLOSED:
        case TheStatus.CLOSING:
            break;
        }

        return this;
    }
}
