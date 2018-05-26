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

export interface ConnectionProvider<T, E> {

    connect(): void;

    close(): void;

    on(
        ev: "connected",
        cb: () => void
    ): this;

    on(
        ev: "close",
        cb: () => void
    ): this;

    on(
        ev: "error",
        cb: (e: E) => void
    ): this;

    readonly connection: T;
}
